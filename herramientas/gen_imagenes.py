import math, random, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops

W, H, S = 1600, 900, 2
F_REG = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
F_BOLD = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'


def C(h, a=255):
    h = h.lstrip('#')
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a)


CYAN = '#22d3ee'; VIOLET = '#a78bfa'; EMER = '#34d399'; AMBER = '#fbbf24'
PINK = '#f472b6'; BLUE = '#60a5fa'; RED = '#fb7185'; WHITE = '#e8f2ff'; MUTED = '#7f97bd'
PANEL = '#09142e'

_fonts = {}
def font(size, bold=False):
    k = (size, bold)
    if k not in _fonts:
        _fonts[k] = ImageFont.truetype(F_BOLD if bold else F_REG, int(size * S))
    return _fonts[k]


def bez(p0, p1, p2, p3, n=60):
    out = []
    for i in range(n + 1):
        t = i / n; u = 1 - t
        out.append((u**3*p0[0] + 3*u*u*t*p1[0] + 3*u*t*t*p2[0] + t**3*p3[0],
                    u**3*p0[1] + 3*u*u*t*p1[1] + 3*u*t*t*p2[1] + t**3*p3[1]))
    return out


class Scene:
    def __init__(self, accent):
        self.acc = accent
        self.ops = []
        self.glow_ops = []

    def _s(self, pts):
        return [(x * S, y * S) for x, y in pts]

    def line(self, pts, col, w=3, alpha=255, glow=0.9, dash=None):
        if dash:
            on, off = dash
            segs = []; drawing = True; remaining = on
            for a, b in zip(pts[:-1], pts[1:]):
                L = math.hypot(b[0]-a[0], b[1]-a[1])
                if L == 0:
                    continue
                pos = 0.0
                while pos < L - 1e-9:
                    step = min(remaining, L - pos)
                    if drawing:
                        segs.append([(a[0]+(b[0]-a[0])*pos/L, a[1]+(b[1]-a[1])*pos/L),
                                     (a[0]+(b[0]-a[0])*(pos+step)/L, a[1]+(b[1]-a[1])*(pos+step)/L)])
                    pos += step; remaining -= step
                    if remaining <= 1e-9:
                        drawing = not drawing
                        remaining = on if drawing else off
            for sg in segs:
                self.line(sg, col, w, alpha, glow * 0.5)
            return
        p = self._s(pts); c = C(col, alpha); ww = max(1, int(w * S))
        self.ops.append(lambda d: d.line(p, fill=c, width=ww, joint='curve'))
        if glow:
            g = tuple(int(v * glow * alpha / 255) for v in C(col)[:3]); gw = max(2, int(w * S * 2))
            self.glow_ops.append(lambda d: d.line(p, fill=g, width=gw, joint='curve'))

    def circle(self, cx, cy, r, fill=None, outline=None, w=2, alpha=255, glow=0.7, fill_alpha=None):
        box = [(cx-r)*S, (cy-r)*S, (cx+r)*S, (cy+r)*S]
        fa = alpha if fill_alpha is None else fill_alpha
        f = C(fill, fa) if fill else None
        o = C(outline, alpha) if outline else None
        ww = max(1, int(w * S))
        self.ops.append(lambda d: d.ellipse(box, fill=f, outline=o, width=ww))
        gc = outline or fill
        if glow and gc:
            g = tuple(int(v * glow) for v in C(gc)[:3])
            gf = g if (fill and not outline) else None
            self.glow_ops.append(lambda d: d.ellipse(box, fill=gf, outline=g, width=ww * 2))

    def rect(self, x, y, w, h, fill=None, outline=None, ow=2, r=0, alpha=255, glow=0.5, fill_alpha=None):
        box = [x*S, y*S, (x+w)*S, (y+h)*S]
        fa = alpha if fill_alpha is None else fill_alpha
        f = C(fill, fa) if fill else None
        o = C(outline, alpha) if outline else None
        ww = max(1, int(ow * S)); rr = int(r * S)
        self.ops.append(lambda d: d.rounded_rectangle(box, radius=rr, fill=f, outline=o, width=ww))
        gc = outline or fill
        if glow and gc:
            g = tuple(int(v * glow) for v in C(gc)[:3])
            gf = g if (fill and not outline) else None
            self.glow_ops.append(lambda d: d.rounded_rectangle(box, radius=rr, fill=gf, outline=g, width=ww * 2))

    def poly(self, pts, fill=None, outline=None, ow=2, alpha=255, glow=0.5, fill_alpha=None):
        p = self._s(pts)
        fa = alpha if fill_alpha is None else fill_alpha
        f = C(fill, fa) if fill else None
        o = C(outline, alpha) if outline else None
        ww = max(1, int(ow * S))
        self.ops.append(lambda d: d.polygon(p, fill=f, outline=o, width=ww) if o else d.polygon(p, fill=f))
        gc = outline or fill
        if glow and gc:
            g = tuple(int(v * glow) for v in C(gc)[:3])
            self.glow_ops.append(lambda d: d.polygon(p, fill=(g if (fill and not outline) else None), outline=g, width=ww * 2))

    def star(self, cx, cy, r, **kw):
        pts = []
        for i in range(10):
            a = -math.pi/2 + i * math.pi / 5
            rr = r if i % 2 == 0 else r * 0.46
            pts.append((cx + rr*math.cos(a), cy + rr*math.sin(a)))
        self.poly(pts, **kw)

    def text(self, x, y, t, size=24, col=WHITE, bold=False, alpha=255, glow=0.0, anchor='mm'):
        f = font(size, bold); c = C(col, alpha); pos = (x*S, y*S)
        self.ops.append(lambda d: d.text(pos, t, font=f, fill=c, anchor=anchor))
        if glow:
            g = tuple(int(v * glow) for v in C(col)[:3])
            self.glow_ops.append(lambda d: d.text(pos, t, font=f, fill=g, anchor=anchor))

    def arrowhead(self, a, b, col, size=15, alpha=255):
        ang = math.atan2(b[1]-a[1], b[0]-a[0])
        pts = [b, (b[0]-size*math.cos(ang-0.42), b[1]-size*math.sin(ang-0.42)),
               (b[0]-size*math.cos(ang+0.42), b[1]-size*math.sin(ang+0.42))]
        self.poly(pts, fill=col, alpha=alpha, glow=0.6)

    def arrow(self, p, q, col, w=3, head=15, alpha=255, glow=0.9, dash=None):
        ang = math.atan2(q[1]-p[1], q[0]-p[0])
        q2 = (q[0] - head*0.6*math.cos(ang), q[1] - head*0.6*math.sin(ang))
        self.line([p, q2], col, w, alpha, glow, dash)
        self.arrowhead(p, q, col, head, alpha)

    def curve_arrow(self, pts, col, w=3, head=15, alpha=255, glow=0.9):
        self.line(pts, col, w, alpha, glow)
        self.arrowhead(pts[-6], pts[-1], col, head, alpha)

    def panel(self, x, y, w, h, col=None, r=22, fa=190, oa=120):
        self.rect(x, y, w, h, fill=PANEL, fill_alpha=fa, outline=col or self.acc, alpha=oa, ow=2, r=r, glow=0.25)

    # ------------------------------------------------------------------
    def render(self, path):
        w, h = W * S, H * S
        yy = np.linspace(0, 1, h, dtype=np.float32)[:, None]
        xx = np.linspace(0, 1, w, dtype=np.float32)[None, :]
        top = np.array([4, 10, 26], np.float32); bot = np.array([10, 26, 58], np.float32)
        base = np.empty((h, w, 3), np.float32)
        base[:] = top
        base += (bot - top)[None, None, :] * yy[:, :, None]
        acc = np.array(C(self.acc)[:3], np.float32)
        r2 = ((xx - 0.5) * 1.7) ** 2 + (yy - 0.52) ** 2
        base += (np.exp(-r2 * 3.4) * 0.20)[:, :, None] * acc[None, None, :]
        # rejilla tenue
        px = np.arange(w, dtype=np.float32) / S; py = np.arange(h, dtype=np.float32) / S
        gm = (((px % 80) < 1.0)[None, :] | ((py % 80) < 1.0)[:, None]).astype(np.float32)
        base += gm[:, :, None] * acc[None, None, :] * 0.045
        img = Image.fromarray(np.clip(base, 0, 255).astype(np.uint8), 'RGB')
        del base

        glow = Image.new('RGB', (w, h), (0, 0, 0))
        gd = ImageDraw.Draw(glow)
        for op in self.glow_ops:
            op(gd)
        b1 = glow.filter(ImageFilter.GaussianBlur(5 * S))
        b2 = glow.filter(ImageFilter.GaussianBlur(20 * S))
        comb = ImageChops.add(b1, b2)
        img = ImageChops.add(img, comb)

        d = ImageDraw.Draw(img, 'RGBA')
        for op in self.ops:
            op(d)

        arr = np.asarray(img, np.float32) / 255.0
        v = 1 - 0.55 * (((xx - 0.5) ** 2) * 1.1 + ((yy - 0.5) ** 2) * 1.5)
        arr *= np.clip(v, 0.35, 1)[:, :, None]
        img = Image.fromarray(np.clip(arr * 255, 0, 255).astype(np.uint8), 'RGB')
        img = img.resize((W, H), Image.LANCZOS)
        img.save(path, 'JPEG', quality=88, optimize=True, progressive=True)
        return img


# ======================================================================
# Iconos pequeños
# ======================================================================
def icon(s, kind, x, y, col):
    if kind == 'eye':
        pts = [(x + 34*t, y - 17*(1 - t*t)) for t in np.linspace(-1, 1, 30)]
        pts += [(x + 34*t, y + 17*(1 - t*t)) for t in np.linspace(1, -1, 30)]
        s.line(pts + [pts[0]], col, w=3)
        s.circle(x, y, 10, fill=col, glow=0.8)
        s.circle(x + 3, y - 3, 3, fill=WHITE, glow=0)
    elif kind == 'chat':
        s.rect(x - 30, y - 24, 60, 42, outline=col, ow=3, r=10)
        s.poly([(x - 14, y + 17), (x - 22, y + 32), (x - 2, y + 17)], fill=col, glow=0.4)
        for k in (-14, 0, 14):
            s.circle(x + k, y - 3, 3.5, fill=col, glow=0.5)
    elif kind == 'chart':
        for i, hh in enumerate((18, 32, 46)):
            s.rect(x - 28 + i * 20, y + 24 - hh, 14, hh, fill=col, r=3)
        s.line([(x - 34, y + 27), (x + 34, y + 27)], WHITE, w=2, alpha=170, glow=0)
    elif kind == 'gear':
        pts = []
        for i in range(8):
            b = 2 * math.pi * i / 8
            for da, rr in ((-0.24, 22), (-0.13, 32), (0.13, 32), (0.24, 22)):
                pts.append((x + rr * math.cos(b + da), y + rr * math.sin(b + da)))
        s.line(pts + [pts[0]], col, w=3)
        s.circle(x, y, 9, outline=col, w=3)
    elif kind == 'net':
        n = [(x - 26, y + 18), (x + 26, y + 18), (x, y - 26)]
        s.line([n[0], n[1], n[2], n[0]], col, w=2.5, alpha=200)
        for p in n:
            s.circle(p[0], p[1], 8, fill=col, glow=0.7)
    elif kind == 'lens':
        s.circle(x - 6, y - 6, 18, outline=col, w=3.5)
        s.line([(x + 7, y + 7), (x + 27, y + 27)], col, w=6)


# ======================================================================
# Escenas
# ======================================================================
def w01():
    global s
    s = Scene(CYAN)
    cx, cy = 800, 450
    sats = [(220, 290, CYAN, 'eye', 'Visión'), (170, 450, VIOLET, 'chat', 'Lenguaje'),
            (220, 610, EMER, 'chart', 'Datos'), (1380, 290, AMBER, 'gear', 'Robótica'),
            (1430, 450, PINK, 'net', 'Redes'), (1380, 610, BLUE, 'lens', 'Búsqueda')]
    for x, y, col, ic, lab in sats:
        side = -1 if x < cx else 1
        ex = cx + side * 150
        py = cy + (y - cy) * 0.45
        xm = cx + side * (270 + abs(y - cy) * 0.35)
        s.line([(ex, py), (xm, py), (xm, y), (x - side * 62, y)], col, w=3, alpha=210)
        s.circle(xm, py, 6, fill=col, glow=1)
        s.circle(xm, y, 6, fill=col, glow=1)
    # chip
    for k in range(5):
        yy = 330 + k * 60; xx = 680 + k * 60
        s.line([(650, yy), (620, yy)], MUTED, w=3, glow=0.3)
        s.line([(950, yy), (980, yy)], MUTED, w=3, glow=0.3)
        s.line([(xx, 300), (xx, 270)], MUTED, w=3, glow=0.3)
        s.line([(xx, 600), (xx, 630)], MUTED, w=3, glow=0.3)
    s.rect(650, 300, 300, 300, fill=PANEL, fill_alpha=240, outline=CYAN, ow=4, r=28, glow=1.0)
    s.rect(680, 330, 240, 240, outline=CYAN, ow=1.5, r=18, alpha=90, glow=0)
    s.text(800, 450, 'IA', 128, WHITE, bold=True, glow=0.9)
    for x, y, col, ic, lab in sats:
        s.circle(x, y, 62, fill=PANEL, fill_alpha=240, outline=col, w=3, glow=0.9)
        icon(s, ic, x, y, col)
        s.text(x, y + 90, lab, 22, WHITE, alpha=215)
    return s


def w02():
    global s
    s = Scene(CYAN)
    s.panel(120, 250, 440, 380, CYAN)
    s.text(340, 280, 'ENTORNO', 20, CYAN, bold=True)
    gx, gy, cs = 160, 305, 60
    obst = {(1, 1), (1, 2), (3, 0), (4, 2)}
    for i in range(6):
        for j in range(5):
            if (i, j) in obst:
                s.rect(gx + i*cs, gy + j*cs, cs - 6, cs - 6, fill=BLUE, fill_alpha=90, outline=BLUE, alpha=170, ow=1.5, r=8, glow=0.2)
            else:
                s.rect(gx + i*cs, gy + j*cs, cs - 6, cs - 6, outline=BLUE, alpha=70, ow=1.5, r=8, glow=0)
    s.star(gx + 5*cs + 27, gy + 27, 21, fill=AMBER, glow=0.8)
    for (i, j) in ((2, 3), (4, 4), (0, 1)):
        s.circle(gx + i*cs + 27, gy + j*cs + 27, 9, fill=EMER, glow=0.7)
    # agente
    ax, ay = 1190, 330
    s.line([(ax + 110, ay), (ax + 110, ay - 50)], CYAN, w=4)
    s.circle(ax + 110, ay - 58, 10, fill=CYAN, glow=1)
    s.rect(ax, ay, 220, 170, fill=PANEL, fill_alpha=240, outline=CYAN, ow=4, r=36, glow=1)
    for ex in (70, 150):
        s.circle(ax + ex, ay + 68, 21, fill=CYAN, glow=1)
        s.circle(ax + ex + 5, ay + 63, 6, fill=WHITE, glow=0)
    s.line([(ax + 72, ay + 128), (ax + 148, ay + 128)], CYAN, w=4)
    s.rect(ax + 55, ay + 188, 110, 52, fill=PANEL, fill_alpha=240, outline=CYAN, ow=3, r=14)
    s.text(ax + 110, ay + 268, 'AGENTE', 20, CYAN, bold=True)
    top = bez((562, 390), (720, 190), (1030, 190), (1185, 390))
    s.curve_arrow(top, EMER, w=4, head=18)
    s.text(865, 205, 'Percepciones  (sensores)', 23, EMER, bold=True)
    bot = bez((1185, 500), (1030, 700), (720, 700), (562, 520))
    s.curve_arrow(bot, AMBER, w=4, head=18)
    s.text(865, 695, 'Acciones  (actuadores)', 23, AMBER, bold=True)
    s.text(865, 440, 'f : P* → A', 40, WHITE, bold=True, glow=0.5)
    s.text(865, 488, 'función del agente', 22, MUTED)
    return s


def w03():
    global s
    s = Scene(VIOLET)
    def pos(l, i):
        n = 2 ** l
        return (100 + (i + 0.5) * 1400 / n, 215 + l * 112)
    path = [(0, 0), (1, 1), (2, 2), (3, 5), (4, 10)]
    def explored(l, i):
        if l <= 2: return True
        if l == 3: return i <= 5
        return i in (8, 9, 10, 11)
    for l in range(4):
        for i in range(2 ** l):
            for c in (2 * i, 2 * i + 1):
                a, b = pos(l, i), pos(l + 1, c)
                if (l, i) in path and (l + 1, c) in path:
                    continue
                if explored(l, i) and explored(l + 1, c):
                    s.line([a, b], VIOLET, w=2.5, alpha=190)
                else:
                    s.line([a, b], MUTED, w=1.5, alpha=70, glow=0)
    pp = [pos(l, i) for l, i in path]
    s.line(pp, AMBER, w=7, glow=1.2)
    rad = [22, 19, 17, 15, 13]
    for l in range(5):
        for i in range(2 ** l):
            x, y = pos(l, i)
            if (l, i) == (4, 10):
                s.star(x, y, 30, fill=AMBER, outline=WHITE, ow=2, glow=1.2)
            elif (l, i) in path:
                s.circle(x, y, rad[l], fill=AMBER, outline=WHITE, w=2, glow=1)
            elif explored(l, i):
                s.circle(x, y, rad[l], fill=VIOLET, fill_alpha=200, outline=WHITE, alpha=110, w=1.5, glow=0.6)
            else:
                s.circle(x, y, rad[l] - 2, fill=PANEL, outline=MUTED, alpha=130, w=1.5, glow=0)
    s.text(765, 215, 'Inicio', 24, WHITE, bold=True, anchor='rm')
    gx, gy = pos(4, 10)
    s.text(gx, gy + 42, 'Meta', 24, AMBER, bold=True)
    return s


def w04():
    global s
    s = Scene(VIOLET)
    # tablero
    bx, by, c = 105, 270, 44
    for i in range(8):
        for j in range(8):
            fa = 210 if (i + j) % 2 == 0 else 120
            s.rect(bx + i*c, by + j*c, c, c, fill=VIOLET if (i + j) % 2 == 0 else PANEL, fill_alpha=70 if (i + j) % 2 == 0 else 200, glow=0)
    s.rect(bx, by, 8*c, 8*c, outline=VIOLET, ow=3, r=4, glow=0.9)
    def pawn(i, j, col):
        x, y = bx + i*c + c/2, by + j*c + c/2
        s.circle(x, y - 8, 8, fill=col, glow=0.8)
        s.poly([(x - 9, y + 14), (x + 9, y + 14), (x + 5, y - 1), (x - 5, y - 1)], fill=col, glow=0.6)
    def king(i, j, col):
        x, y = bx + i*c + c/2, by + j*c + c/2
        s.poly([(x - 12, y + 15), (x + 12, y + 15), (x + 8, y - 4), (x - 8, y - 4)], fill=col, glow=0.6)
        s.line([(x, y - 18), (x, y - 4)], col, w=3, glow=0.5)
        s.line([(x - 6, y - 13), (x + 6, y - 13)], col, w=3, glow=0.5)
    for (i, j) in ((1, 5), (2, 4), (5, 6), (6, 5)): pawn(i, j, WHITE)
    for (i, j) in ((3, 1), (5, 2), (6, 3)): pawn(i, j, PINK)
    king(4, 7, WHITE); king(2, 0, PINK)
    s.arrow((bx + 2*c + 22, by + 4*c + 22), (bx + 2*c + 22, by + 2*c + 22), AMBER, w=4, head=14)
    # árbol minimax
    root = (1040, 235)
    mins = [(820, 380), (1040, 380), (1260, 380)]
    leaves = [[3, 12, 8], [2, 4, 6], [14, 5, 2]]
    s.text(640, 235, 'MAX', 22, VIOLET, bold=True)
    s.text(640, 380, 'MIN', 22, VIOLET, bold=True)
    for gi, (mx, my) in enumerate(mins):
        best = gi == 0
        s.line([root, (mx, my - 28)], AMBER if best else VIOLET, w=5 if best else 2.5, alpha=255 if best else 170)
        for li, v in enumerate(leaves[gi]):
            lx = mx + (li - 1) * 66; ly = 545
            pruned = gi == 1 and li > 0
            if pruned:
                s.line([(mx, my + 22), (lx, ly - 22)], MUTED, w=2, alpha=110, dash=(7, 6), glow=0)
            else:
                good = best and li == 0
                s.line([(mx, my + 22), (lx, ly - 22)], AMBER if good else VIOLET, w=5 if good else 2.5, alpha=255 if good else 170)
            s.rect(lx - 27, ly - 22, 54, 44, fill=PANEL, fill_alpha=235, outline=(MUTED if pruned else (AMBER if best and li == 0 else VIOLET)),
                   alpha=(110 if pruned else 230), ow=2, r=9, glow=0 if pruned else 0.5)
            s.text(lx, ly, str(v), 24, MUTED if pruned else WHITE, bold=True, alpha=140 if pruned else 255)
            if pruned:
                s.line([(lx - 20, ly + 15), (lx + 20, ly - 15)], RED, w=3, alpha=220, glow=0.6)
        t = [(mx - 30, my - 22), (mx + 30, my - 22), (mx, my + 26)]
        s.poly(t, fill=PANEL, fill_alpha=240, outline=AMBER if best else VIOLET, ow=3, glow=0.9)
        s.text(mx, my - 8, str(min(leaves[gi]) if gi != 1 else 2), 20, WHITE, bold=True)
    s.poly([(root[0] - 34, root[1] + 26), (root[0] + 34, root[1] + 26), (root[0], root[1] - 28)], fill=PANEL, fill_alpha=240, outline=AMBER, ow=3, glow=1)
    s.text(root[0], root[1] + 10, '3', 24, WHITE, bold=True)
    s.text(1260, 640, 'poda α-β', 22, RED, bold=True) if False else None
    s.text(820 + 220, 640, 'poda α-β', 22, RED, bold=True)
    return s


def w05():
    global s
    s = Scene(EMER)
    s.panel(100, 215, 660, 470, EMER)
    s.panel(840, 215, 660, 470, EMER)
    s.poly([(108, 223), (752, 223), (752, 246), (108, 654)], fill=CYAN, fill_alpha=30, glow=0)
    s.poly([(108, 654), (752, 246), (752, 677), (108, 677)], fill=AMBER, fill_alpha=30, glow=0)
    rng = random.Random(5)
    def dist(x, y): return abs((x - 130) * 380 + (y - 640) * 600) / 710.3
    def pts(cx, cy, sg, n, up):
        out = []
        while len(out) < n:
            x, y = rng.gauss(cx, sg), rng.gauss(cy, sg)
            above = (y - (640 - 0.6333 * (x - 130))) < 0
            if 125 < x < 735 and 240 < y < 665 and dist(x, y) > 32 and above == up:
                out.append((x, y))
        return out
    for x, y in pts(285, 360, 70, 24, True): s.circle(x, y, 9, fill=CYAN, glow=0.8)
    for x, y in pts(575, 545, 62, 24, False): s.circle(x, y, 9, fill=AMBER, glow=0.8)
    s.line([(108, 654), (752, 246)], WHITE, w=4, glow=1.2)
    s.text(430, 250, 'Clasificación', 24, WHITE, bold=True, alpha=235)
    s.text(1170, 250, 'Regresión', 24, WHITE, bold=True, alpha=235)
    # regresión
    s.arrow((900, 640), (900, 275), MUTED, w=2.5, head=12, glow=0)
    s.arrow((900, 640), (1455, 640), MUTED, w=2.5, head=12, glow=0)
    fit = lambda x: 634 - 0.62 * (x - 910)
    xs = sorted(rng.uniform(935, 1425) for _ in range(26))
    P = [(x, fit(x) + rng.gauss(0, 36)) for x in xs]
    for k, (x, y) in enumerate(P):
        if k % 3 == 0:
            s.line([(x, y), (x, fit(x))], WHITE, w=2, alpha=140, dash=(5, 4), glow=0)
    s.line([(910, fit(910)), (1440, fit(1440))], EMER, w=5, glow=1.2)
    for x, y in P: s.circle(x, y, 8.5, fill=WHITE, outline=EMER, w=2, glow=0.7)
    return s


def w06():
    global s
    s = Scene(EMER)
    s.panel(100, 215, 600, 470, EMER)
    s.panel(900, 215, 600, 470, EMER)
    rng = random.Random(11)
    centers = [(150, 160), (440, 140), (290, 340)]
    cols = [EMER, CYAN, AMBER]
    data = []
    for k, (cx, cy) in enumerate(centers):
        for _ in range(22):
            data.append((rng.gauss(cx, 44), rng.gauss(cy, 44), k))
    data = [(max(25, min(575, x)), max(55, min(440, y)), k) for x, y, k in data]
    for x, y, k in data:
        s.circle(100 + x, 215 + y, 8.5, fill='#9fb3d1', alpha=215, glow=0.25)
    for x, y, k in data:
        s.circle(900 + x, 215 + y, 8.5, fill=cols[k], glow=0.8)
    for k, (cx, cy) in enumerate(centers):
        pts = [(900 + cx + 92 * math.cos(t), 215 + cy + 92 * math.sin(t)) for t in np.linspace(0, 2 * math.pi, 90)]
        s.line(pts, cols[k], w=2, alpha=160, dash=(8, 7), glow=0.3)
        X, Y = 900 + cx, 215 + cy
        s.line([(X - 13, Y - 13), (X + 13, Y + 13)], WHITE, w=5)
        s.line([(X - 13, Y + 13), (X + 13, Y - 13)], WHITE, w=5)
    s.text(400, 250, 'Sin etiquetas', 24, WHITE, bold=True, alpha=235)
    s.text(1200, 250, 'Grupos descubiertos', 24, WHITE, bold=True, alpha=235)
    s.arrow((722, 450), (878, 450), EMER, w=5, head=20)
    s.text(800, 408, 'K-means', 24, EMER, bold=True, glow=0.5)
    return s


def w07():
    global s
    s = Scene(EMER)
    ox, oy, cs = 330, 200, 100
    cols, rows = 7, 5
    obst = {(2, 2), (2, 3), (4, 1), (4, 2)}
    goal = (6, 0); start = (0, 4)
    dist = {goal: 0}; q = [goal]
    while q:
        c0 = q.pop(0)
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            n = (c0[0] + dx, c0[1] + dy)
            if 0 <= n[0] < cols and 0 <= n[1] < rows and n not in obst and n not in dist:
                dist[n] = dist[c0] + 1; q.append(n)
    cen = lambda c: (ox + c[0] * cs + cs / 2, oy + c[1] * cs + cs / 2)
    path = [(0, 4), (1, 4), (1, 3), (1, 2), (1, 1), (2, 1), (3, 1), (3, 0), (4, 0), (5, 0), (6, 0)]
    for i in range(cols):
        for j in range(rows):
            c0 = (i, j)
            if c0 in obst:
                s.rect(ox + i*cs + 4, oy + j*cs + 4, cs - 8, cs - 8, fill='#3c1030', fill_alpha=235, outline=PINK, alpha=150, ow=2, r=10, glow=0.3)
                x, y = cen(c0)
                s.line([(x - 15, y - 15), (x + 15, y + 15)], PINK, w=3, alpha=200, glow=0.4)
                s.line([(x - 15, y + 15), (x + 15, y - 15)], PINK, w=3, alpha=200, glow=0.4)
                continue
            val = 0.84 ** dist[c0]
            s.rect(ox + i*cs + 4, oy + j*cs + 4, cs - 8, cs - 8, fill=EMER, fill_alpha=int(18 + 140 * val), outline=BLUE, alpha=70, ow=1.5, r=10, glow=0)
    for c0 in dist:
        if c0 == goal or c0 in path: continue
        nb = min(((c0[0] + dx, c0[1] + dy) for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))), key=lambda n: dist.get(n, 99))
        x, y = cen(c0); nx, ny = cen(nb)
        ang = math.atan2(ny - y, nx - x)
        s.arrow((x - 14 * math.cos(ang), y - 14 * math.sin(ang)), (x + 16 * math.cos(ang), y + 16 * math.sin(ang)), WHITE, w=2, head=9, alpha=100, glow=0)
    s.line([cen(c0) for c0 in path], AMBER, w=6, glow=1.1)
    for c0 in path[1:-1]: s.circle(*cen(c0), 6, fill=AMBER, glow=0.9)
    s.circle(*cen(start), 23, fill=CYAN, outline=WHITE, w=3, glow=1)
    s.star(*cen(goal), 30, fill=AMBER, outline=WHITE, ow=2, glow=1.2)
    s.text(ox + 7 * cs + 24, cen(goal)[1], 'R = +1', 26, AMBER, bold=True, anchor='lm', glow=0.6)
    # ciclo agente-entorno
    s.rect(110, 290, 200, 76, fill=PANEL, fill_alpha=235, outline=CYAN, ow=3, r=16, glow=0.7)
    s.text(210, 328, 'Agente', 26, CYAN, bold=True)
    s.rect(110, 570, 200, 76, fill=PANEL, fill_alpha=235, outline=EMER, ow=3, r=16, glow=0.7)
    s.text(210, 608, 'Entorno', 26, EMER, bold=True)
    s.arrow((160, 366), (160, 568), AMBER, w=3.5, head=14)
    s.arrow((260, 568), (260, 368), WHITE, w=3.5, head=14, alpha=220)
    s.text(172, 468, 'a', 26, AMBER, bold=True, anchor='lm')
    s.text(272, 468, "s′, r", 26, WHITE, bold=True, anchor='lm')
    s.text(1250, 385, 'Q(s, a)', 56, WHITE, bold=True, glow=0.6)
    s.text(1250, 440, 'valor de cada acción', 22, MUTED)
    s.text(1260, 520, 'Q ← Q + α [ r + γ max Q′ − Q ]', 20, EMER, alpha=235)
    return s


def w09():
    global s
    s = Scene(AMBER)
    layers = [4, 6, 6, 3]; xs = [200, 500, 800, 1100]
    rng = random.Random(9)
    P = []
    for L, n in enumerate(layers):
        P.append([(xs[L], 450 + (k - (n - 1) / 2) * 80) for k in range(n)])
    for L in range(3):
        for a in P[L]:
            for b in P[L + 1]:
                wgt = rng.uniform(-1, 1)
                s.line([a, b], CYAN if wgt > 0 else PINK, w=1.6, alpha=int(25 + 120 * abs(wgt)), glow=0.25 * abs(wgt))
    cols = [CYAN, AMBER, AMBER, PINK]
    for L, pts in enumerate(P):
        for (x, y) in pts:
            act = rng.uniform(0.35, 1)
            s.circle(x, y, 25, fill=cols[L], fill_alpha=int(60 + 170 * act), outline=cols[L], w=3, glow=0.9 * act)
            s.circle(x, y, 25, outline=WHITE, w=1.5, alpha=90, glow=0)
    s.text(200, 690, 'Entrada', 22, WHITE, alpha=215)
    s.text(650, 690, 'Capas ocultas', 22, WHITE, alpha=215)
    s.text(1100, 690, 'Salida', 22, WHITE, alpha=215)
    s.panel(1240, 320, 250, 260, AMBER)
    s.arrow((1262, 540), (1470, 540), MUTED, w=2, head=10, glow=0)
    s.arrow((1360, 560), (1360, 365), MUTED, w=2, head=10, glow=0)
    curve = [(1262 + (z + 6) / 12 * 200, 540 - 1 / (1 + math.exp(-z)) * 150) for z in np.linspace(-6, 6, 60)]
    s.line(curve, AMBER, w=5, glow=1.1)
    s.text(1362, 348, 'σ(z)', 24, AMBER, bold=True, glow=0.5)
    return s


def w10():
    global s
    s = Scene(AMBER)
    x0, y0, cs = 100, 310, 34
    for i in range(8):
        for j in range(8):
            v = 1.0 if (i == j or i + j == 7) else 0.12 + 0.22 * ((i * 7 + j * 3) % 5) / 5
            s.rect(x0 + i*cs + 1, y0 + j*cs + 1, cs - 2, cs - 2, fill=WHITE, fill_alpha=int(30 + 215 * v), glow=0)
    s.rect(x0 + 2*cs, y0 + 2*cs, 3*cs, 3*cs, fill=AMBER, fill_alpha=45, outline=AMBER, ow=4, r=3, glow=1.2)
    s.text(236, 640, 'Entrada', 22, WHITE, alpha=215)
    s.arrow((392, 450), (448, 450), AMBER, w=4, head=16)
    # mapas 1
    for k in (2, 1, 0):
        mx, my = 460 + 26*k, 372 - 22*k
        s.rect(mx, my, 150, 150, fill=CYAN, fill_alpha=32, outline=CYAN, ow=2.5, r=8, glow=0.8)
        if k == 0:
            s.line([(mx + 20, my + 20), (mx + 130, my + 130)], CYAN, w=2, alpha=150, glow=0)
            s.line([(mx + 130, my + 20), (mx + 20, my + 130)], CYAN, w=2, alpha=150, glow=0)
    s.rect(486, 400, 20, 20, fill=AMBER, fill_alpha=200, outline=WHITE, ow=2, r=3, glow=1)
    s.line([(x0 + 5*cs, y0 + 2*cs), (486, 400)], AMBER, w=1.5, alpha=150, dash=(6, 5), glow=0)
    s.line([(x0 + 5*cs, y0 + 5*cs), (486, 420)], AMBER, w=1.5, alpha=150, dash=(6, 5), glow=0)
    s.text(580, 640, 'Convolución', 22, WHITE, alpha=215)
    s.arrow((706, 430), (756, 430), AMBER, w=4, head=16)
    for k in (3, 2, 1, 0):
        mx, my = 770 + 20*k, 395 - 17*k
        s.rect(mx, my, 100, 100, fill=AMBER, fill_alpha=30, outline=AMBER, ow=2.5, r=7, glow=0.8)
        if k == 0:
            s.line([(mx + 15, my + 50), (mx + 85, my + 50)], AMBER, w=2, alpha=160, glow=0)
            s.line([(mx + 50, my + 15), (mx + 50, my + 85)], AMBER, w=2, alpha=160, glow=0)
    s.text(840, 640, 'Pooling', 22, WHITE, alpha=215)
    s.arrow((958, 430), (1000, 430), AMBER, w=4, head=16)
    flat = [(1040, 280 + i * 30) for i in range(12)]
    outs = [(1250, 360), (1250, 450), (1250, 540)]
    for a in flat:
        for b in outs:
            s.line([a, b], WHITE, w=1, alpha=30, glow=0)
    for a in flat: s.circle(a[0], a[1], 9, fill=AMBER, fill_alpha=int(90 + 120 * ((a[1] * 7) % 10) / 10), glow=0.7)
    probs = [0.04, 0.92, 0.04]
    for (x, y), p in zip(outs, probs):
        s.circle(x, y, 26, fill=PINK if p > 0.5 else PANEL, fill_alpha=230, outline=PINK, w=3, glow=1 if p > 0.5 else 0.3)
        s.rect(1300, y - 8, 160, 16, fill=PANEL, fill_alpha=220, outline=MUTED, alpha=120, ow=1.5, r=8, glow=0)
        s.rect(1300, y - 8, max(10, 160 * p), 16, fill=PINK if p > 0.5 else MUTED, r=8, glow=0.6 if p > 0.5 else 0)
    s.text(1140, 640, 'Aplanar + Densa', 22, WHITE, alpha=215)
    s.text(1380, 640, 'Probabilidad', 22, WHITE, alpha=215)
    return s


def w11():
    global s
    s = Scene(AMBER)
    xs = [200, 360, 520, 680]
    sub = '₁₂₃₄'
    s.arrow((120, 330), (142, 330), MUTED, w=3, head=11, glow=0)
    for i, x in enumerate(xs):
        s.arrow((x, 285), (x, 235), CYAN, w=3, head=13)
        s.text(x, 215, 'y' + sub[i], 22, CYAN, bold=True)
        s.rect(x - 55, 285, 110, 90, fill=PANEL, fill_alpha=240, outline=AMBER, ow=3.5, r=16, glow=0.9)
        s.text(x, 330, 'h' + sub[i], 30, WHITE, bold=True)
        if i < 3:
            s.arrow((x + 57, 330), (xs[i + 1] - 59, 330), AMBER, w=3.5, head=14)
        s.arrow((x, 520), (x, 377), WHITE, w=2.5, head=12, alpha=200, glow=0)
        s.text(x, 540, 'x' + sub[i], 22, WHITE, bold=True)
    wave = [(130 + t * 6.3, 610 + 38 * math.sin(t * 0.22) + 14 * math.sin(t * 0.7)) for t in range(0, 100)]
    s.line(wave, EMER, w=3, glow=0.9)
    for x in xs:
        t = (x - 130) / 6.3
        y = 610 + 38 * math.sin(t * 0.22) + 14 * math.sin(t * 0.7)
        s.circle(x, y, 7, fill=EMER, outline=WHITE, w=2, glow=1)
        s.line([(x, y - 8), (x, 560)], EMER, w=1.5, alpha=130, dash=(4, 4), glow=0)
    s.text(440, 690, 'Serie temporal', 22, WHITE, alpha=215)
    # LSTM
    s.panel(860, 300, 610, 310, AMBER, r=26)
    s.text(1165, 270, 'Celda LSTM', 24, AMBER, bold=True, glow=0.4)
    s.arrow((842, 350), (1488, 350), PINK, w=5, head=18)
    s.text(884, 322, 'cₜ₋₁', 22, PINK, bold=True, anchor='lm')
    s.text(1448, 322, 'cₜ', 22, PINK, bold=True, anchor='rm')
    s.line([(890, 580), (1420, 580)], WHITE, w=2, alpha=190, glow=0)
    gx = [950, 1070, 1190, 1330]
    names = ['σ', 'σ', 'tanh', 'σ']
    for x, nm in zip(gx, names):
        s.line([(x, 580), (x, 557)], WHITE, w=2, alpha=190, glow=0)
        s.circle(x, 530, 31 if nm == 'tanh' else 24, fill=PANEL, fill_alpha=240, outline=AMBER, w=3, glow=0.9)
        s.text(x, 530, nm, 17 if nm == 'tanh' else 26, WHITE, bold=True)
    s.line([(950, 506), (950, 372)], AMBER, w=3)
    s.circle(950, 350, 17, fill=PANEL, fill_alpha=240, outline=PINK, w=3, glow=0.9); s.text(950, 350, '×', 26, WHITE, bold=True)
    s.circle(1130, 440, 17, fill=PANEL, fill_alpha=240, outline=AMBER, w=3, glow=0.9); s.text(1130, 440, '×', 26, WHITE, bold=True)
    s.line([(1070, 506), (1070, 440), (1113, 440)], AMBER, w=3)
    s.line([(1190, 499), (1190, 440), (1147, 440)], AMBER, w=3)
    s.line([(1130, 423), (1130, 372)], AMBER, w=3)
    s.circle(1130, 350, 17, fill=PANEL, fill_alpha=240, outline=PINK, w=3, glow=0.9); s.text(1130, 349, '+', 28, WHITE, bold=True)
    s.line([(1330, 350), (1330, 382)], PINK, w=3)
    s.circle(1330, 410, 28, fill=PANEL, fill_alpha=240, outline=AMBER, w=3, glow=0.9); s.text(1330, 410, 'tanh', 16, WHITE, bold=True)
    s.line([(1330, 438), (1330, 453)], AMBER, w=3)
    s.circle(1330, 470, 17, fill=PANEL, fill_alpha=240, outline=AMBER, w=3, glow=0.9); s.text(1330, 470, '×', 26, WHITE, bold=True)
    s.line([(1330, 499), (1330, 487)], AMBER, w=3)
    s.arrow((1347, 470), (1488, 470), CYAN, w=4, head=16)
    s.text(1478, 440, 'hₜ', 22, CYAN, bold=True, anchor='rm')
    s.text(1160, 640, 'hₜ₋₁ , xₜ', 22, WHITE, alpha=215)
    return s


def w12():
    global s
    s = Scene(PINK)
    toks = ['La', 'IA', 'generativa', 'crea', 'texto', 'e', 'imágenes', '▍']
    widths = []
    f = font(30)
    for t in toks:
        widths.append(f.getlength(t) / S + 44)
    gap = 18
    total = sum(widths) + gap * (len(toks) - 1)
    x = 800 - total / 2
    cen = []
    for t, wd in zip(toks, widths):
        cen.append(x + wd / 2); x += wd + gap
    ty = 570
    arcs = [(0, 1, .5), (1, 2, .95), (2, 3, .85), (3, 4, .75), (0, 2, .3), (1, 3, .45), (2, 4, .4), (3, 6, .35),
            (4, 5, .3), (5, 6, .6), (4, 6, .5), (2, 6, .3), (6, 7, .9), (4, 7, .6), (1, 7, .25)]
    for i, j, wg in sorted(arcs, key=lambda a: a[2]):
        h = 55 + 38 * abs(i - j)
        p0 = (cen[i], ty - 28); p3 = (cen[j], ty - 28)
        pts = bez(p0, (cen[i], ty - 28 - h), (cen[j], ty - 28 - h), p3)
        s.line(pts, PINK if wg < .7 else WHITE, w=1.5 + 6 * wg, alpha=int(50 + 190 * wg), glow=1.0 * wg)
    rng = random.Random(12)
    for k, (t, wd) in enumerate(zip(toks, widths)):
        last = k == len(toks) - 1
        s.rect(cen[k] - wd / 2, ty - 28, wd, 56, fill=PANEL, fill_alpha=240, outline=PINK, alpha=(150 if last else 235), ow=2.5, r=14, glow=0.7)
        s.text(cen[k], ty, t, 30, PINK if last else WHITE, bold=last)
        for q in range(6):
            s.rect(cen[k] - 40 + q * 14, ty + 46, 11, 24, fill=PINK, fill_alpha=int(40 + 190 * rng.random()), r=3, glow=0)
    s.text(800, 232, 'Autoatención', 24, PINK, bold=True, glow=0.5)
    s.text(800, 688, 'embeddings de cada token', 21, MUTED)
    return s


def pixel_img(s, x, y, size, n, col, seed, noise):
    rng = random.Random(seed); c = size / n
    for i in range(n):
        for j in range(n):
            d = math.hypot(i - (n - 1) / 2, j - (n - 1) / 2)
            v = max(0.0, 1 - abs(d - n * 0.28) / (n * 0.2))
            v = min(1, max(0, v + rng.uniform(-noise, noise)))
            s.rect(x + i * c + 1, y + j * c + 1, c - 2, c - 2, fill=col, fill_alpha=int(25 + 215 * v), glow=0)
    s.rect(x, y, size, size, outline=col, ow=2.5, r=4, glow=0.7)


def w13():
    global s
    s = Scene(PINK)
    rng = random.Random(13)
    for i in range(8):
        for j in range(8):
            s.rect(100 + i * 15 + 1, 390 + j * 15 + 1, 13, 13, fill=rng.choice([WHITE, MUTED, BLUE, CYAN]), fill_alpha=int(40 + 200 * rng.random()), glow=0)
    s.rect(100, 390, 120, 120, outline=MUTED, ow=2, r=4, glow=0.3)
    s.text(160, 545, 'ruido  z', 22, WHITE, alpha=215)
    s.arrow((232, 450), (288, 450), WHITE, w=3.5, head=14, alpha=220)
    s.poly([(295, 385), (520, 320), (520, 580), (295, 515)], fill=PANEL, fill_alpha=240, outline=PINK, ow=4, glow=1)
    s.text(408, 450, 'G', 90, PINK, bold=True, glow=0.8)
    s.text(408, 612, 'Generador', 22, PINK, bold=True)
    pixel_img(s, 610, 325, 120, 8, PINK, 2, 0.35)
    s.text(670, 312, 'Falso', 21, PINK, bold=True)
    pixel_img(s, 610, 475, 120, 8, CYAN, 3, 0.05)
    s.text(670, 626, 'Real', 21, CYAN, bold=True)
    s.arrow((522, 450), (606, 400), PINK, w=3.5, head=14)
    s.arrow((735, 385), (815, 430), PINK, w=3.5, head=14)
    s.arrow((735, 535), (815, 470), CYAN, w=3.5, head=14)
    s.poly([(825, 330), (1050, 395), (1050, 505), (825, 570)], fill=PANEL, fill_alpha=240, outline=CYAN, ow=4, glow=1)
    s.text(935, 450, 'D', 90, CYAN, bold=True, glow=0.8)
    s.text(935, 612, 'Discriminador', 22, CYAN, bold=True)
    s.arrow((1054, 450), (1170, 450), WHITE, w=3.5, head=14, alpha=220)
    s.text(1330, 395, 'P(real)', 24, WHITE, bold=True)
    s.rect(1180, 425, 300, 50, fill=PANEL, fill_alpha=230, outline=MUTED, alpha=140, ow=2, r=25, glow=0)
    s.rect(1180, 425, 160, 50, fill=PINK, r=25, glow=0.8)
    s.rect(1340, 425, 140, 50, fill=CYAN, fill_alpha=60, r=25, glow=0)
    s.text(1330, 520, '¿real o falso?', 22, MUTED)
    loop = bez((935, 322), (935, 190), (408, 190), (408, 312))
    s.curve_arrow(loop, AMBER, w=3.5, head=16)
    s.text(672, 222, 'retroalimentación (gradiente)', 21, AMBER, bold=True)
    return s


def w14():
    global s
    s = Scene(PINK)
    px, py = 800, 330
    s.line([(px, py), (px, 650)], WHITE, w=7, alpha=230, glow=0.5)
    s.poly([(700, 680), (900, 680), (870, 650), (730, 650)], fill=PANEL, fill_alpha=240, outline=WHITE, ow=3, glow=0.5)
    s.circle(px, 300, 17, fill=AMBER, outline=WHITE, w=2, glow=1)
    L = (500, 345); R = (1100, 315)
    s.line([L, R], AMBER, w=8, glow=1)
    def pan(c, y, col):
        s.line([(c, 0 + 0)] if False else [(c, c - c)], col, w=0) if False else None
    for (bx, by, yy, col) in ((L[0], L[1], 530, CYAN), (R[0], R[1], 500, PINK)):
        s.line([(bx, by), (bx - 62, yy)], WHITE, w=2.5, alpha=190, glow=0)
        s.line([(bx, by), (bx + 62, yy)], WHITE, w=2.5, alpha=190, glow=0)
        bowl = [(bx + 62 * math.cos(t), yy + 26 * math.sin(t)) for t in np.linspace(0, math.pi, 30)]
        s.poly([(bx - 62, yy)] + bowl[::-1][:0] + bowl + [(bx + 62, yy)], fill=col, fill_alpha=70, outline=col, ow=3, glow=0.9)
    # chip (izq.) y persona (der.)
    cx, cy = L[0], 530 - 52
    for k in range(3):
        s.line([(cx - 18 + k * 18, cy - 28), (cx - 18 + k * 18, cy - 38)], CYAN, w=3, glow=0.4)
        s.line([(cx - 18 + k * 18, cy + 28), (cx - 18 + k * 18, cy + 38)], CYAN, w=3, glow=0.4)
    s.rect(cx - 30, cy - 28, 60, 56, fill=PANEL, fill_alpha=240, outline=CYAN, ow=3, r=9, glow=0.9)
    s.text(cx, cy, 'IA', 26, CYAN, bold=True)
    hx, hy = R[0], 500 - 52
    s.circle(hx, hy - 14, 14, fill=PINK, glow=0.9)
    s.poly([(hx - 22, hy + 30), (hx + 22, hy + 30), (hx + 15, hy + 2), (hx - 15, hy + 2)], fill=PINK, glow=0.8)
    # escudo con visto
    sx, sy = 230, 450
    sh = [(sx, sy - 105), (sx + 80, sy - 78), (sx + 80, sy + 5), (sx, sy + 105), (sx - 80, sy + 5), (sx - 80, sy - 78)]
    s.poly(sh, fill=PANEL, fill_alpha=235, outline=EMER, ow=4, glow=1)
    s.line([(sx - 38, sy - 2), (sx - 10, sy + 28), (sx + 40, sy - 36)], EMER, w=9, glow=1)
    s.text(sx, sy + 150, 'Marco legal', 22, EMER, bold=True)
    # paleta (IA creativa)
    qx, qy = 1370, 450
    pal = [(qx + 100 * math.cos(t) * (1 + 0.04 * math.sin(3 * t)), qy + 78 * math.sin(t)) for t in np.linspace(0, 2 * math.pi, 80)]
    s.poly(pal, fill=PANEL, fill_alpha=235, outline=AMBER, ow=4, glow=1)
    s.circle(qx + 38, qy + 28, 17, fill='#0a1532', outline=AMBER, w=3, glow=0.4)
    for (dx, dy, col) in ((-52, -22, PINK), (-14, -44, CYAN), (30, -34, EMER), (64, -2, VIOLET), (-62, 24, RED)):
        s.circle(qx + dx, qy + dy, 13, fill=col, glow=0.9)
    s.text(qx, qy + 150, 'IA creativa', 22, AMBER, bold=True)
    s.text(800, 735, 'Ética  ·  Derechos  ·  Responsabilidad', 22, MUTED) if False else None
    s.text(800, 270, '§', 1, WHITE, alpha=0) if False else None
    return s


SCENES = {1: w01, 2: w02, 3: w03, 4: w04, 5: w05, 6: w06, 7: w07, 9: w09, 10: w10, 11: w11, 12: w12, 13: w13, 14: w14}

if __name__ == '__main__':
    out = sys.argv[1]
    which = [int(a) for a in sys.argv[2:]] or sorted(SCENES)
    for n in which:
        sc = SCENES[n]()
        sc.render(f'{out}/semana-{n:02d}.jpg')
        print('ok', n, flush=True)
