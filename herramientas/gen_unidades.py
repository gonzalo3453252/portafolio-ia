import math, random, sys
import numpy as np
sys.path.insert(0, __import__('os').path.dirname(__import__('os').path.abspath(__file__)))
from gen_imagenes import *


def u1():
    s = Scene(CYAN)
    cx, cy = 800, 450
    for r, a in ((330, 60), (255, 90), (180, 130)):
        pts = [(cx + r*math.cos(t), cy + r*0.62*math.sin(t)) for t in np.linspace(0, 2*math.pi, 120)]
        s.line(pts, CYAN, w=2, alpha=a, glow=0.3)
    for k in range(3):
        for r in (70 + 38*k,):
            pts = [(cx + 260 + r*math.cos(t), cy - 40 + r*math.sin(t)) for t in np.linspace(-0.9, 0.9, 30)]
            s.line(pts, EMER, w=3, alpha=220 - 50*k, glow=0.7)
    for k in range(3):
        r = 70 + 38*k
        pts = [(cx - 260 - r*math.cos(t), cy - 40 + r*math.sin(t)) for t in np.linspace(-0.9, 0.9, 30)]
        s.line(pts, AMBER, w=3, alpha=220 - 50*k, glow=0.7)
    s.line([(cx, cy - 150), (cx, cy - 215)], CYAN, w=6)
    s.circle(cx, cy - 228, 16, fill=CYAN, glow=1.2)
    s.rect(cx - 170, cy - 150, 340, 270, fill=PANEL, fill_alpha=240, outline=CYAN, ow=6, r=60, glow=1.2)
    for ex in (-80, 80):
        s.circle(cx + ex, cy - 40, 38, fill=CYAN, glow=1.2)
        s.circle(cx + ex + 9, cy - 49, 11, fill=WHITE, glow=0)
    s.line([(cx - 70, cy + 55), (cx + 70, cy + 55)], CYAN, w=7)
    s.rect(cx - 95, cy + 140, 190, 70, fill=PANEL, fill_alpha=240, outline=CYAN, ow=4, r=20)
    s.rect(cx - 230, cy - 40, 40, 80, fill=PANEL, fill_alpha=240, outline=CYAN, ow=4, r=14)
    s.rect(cx + 190, cy - 40, 40, 80, fill=PANEL, fill_alpha=240, outline=CYAN, ow=4, r=14)
    s.text(cx, 760, 'Fundamentos de la IA  ·  Agentes', 30, WHITE, bold=True, alpha=235)
    return s


def u2():
    s = Scene(VIOLET)
    rng = random.Random(2)
    n_c, n_r, cs, ox, oy = 15, 8, 72, 260, 130
    # laberinto: paredes aleatorias
    walls = set()
    for i in range(n_c):
        for j in range(n_r):
            if rng.random() < 0.26 and (i, j) not in ((0, 7), (14, 0)):
                walls.add((i, j))
    # camino garantizado (BFS) para dibujarlo
    from collections import deque
    start, goal = (0, 7), (14, 0)
    prev = {start: None}; q = deque([start])
    while q:
        c = q.popleft()
        if c == goal: break
        for dx, dy in ((1, 0), (0, -1), (-1, 0), (0, 1)):
            nx = (c[0] + dx, c[1] + dy)
            if 0 <= nx[0] < n_c and 0 <= nx[1] < n_r and nx not in walls and nx not in prev:
                prev[nx] = c; q.append(nx)
    if goal not in prev:
        walls = set(); prev = {start: None}; q = deque([start])
        while q:
            c = q.popleft()
            for dx, dy in ((1, 0), (0, -1)):
                nx = (c[0] + dx, c[1] + dy)
                if 0 <= nx[0] < n_c and 0 <= nx[1] < n_r and nx not in prev:
                    prev[nx] = c; q.append(nx)
    path = []; c = goal
    while c: path.append(c); c = prev[c]
    path = path[::-1]
    seen = set(path)
    for (i, j) in list(prev):
        if rng.random() < 0.55: seen.add((i, j))
    for i in range(n_c):
        for j in range(n_r):
            x, y = ox + i*cs, oy + j*cs
            if (i, j) in walls:
                s.rect(x + 4, y + 4, cs - 8, cs - 8, fill=VIOLET, fill_alpha=110, outline=VIOLET, alpha=190, ow=2, r=10, glow=0.4)
            elif (i, j) in seen and (i, j) not in path:
                s.rect(x + 14, y + 14, cs - 28, cs - 28, fill=BLUE, fill_alpha=55, outline=BLUE, alpha=120, ow=1.5, r=8, glow=0.2)
            else:
                s.rect(x + 4, y + 4, cs - 8, cs - 8, outline=VIOLET, alpha=50, ow=1.2, r=10, glow=0)
    cen = lambda c: (ox + c[0]*cs + cs/2, oy + c[1]*cs + cs/2)
    s.line([cen(c) for c in path], AMBER, w=8, glow=1.2)
    s.circle(*cen(start), 26, fill=CYAN, outline=WHITE, w=3, glow=1.1)
    s.star(*cen(goal), 36, fill=AMBER, outline=WHITE, ow=2, glow=1.3)
    s.text(800, 800, 'Búsquedas y Juegos de Estrategia', 30, WHITE, bold=True, alpha=235)
    return s


def u3():
    s = Scene(EMER)
    # curva de pérdida descendente + puntos con ajuste
    s.panel(110, 170, 700, 520, EMER)
    s.arrow((160, 640), (160, 215), MUTED, w=2.5, head=12, glow=0)
    s.arrow((160, 640), (770, 640), MUTED, w=2.5, head=12, glow=0)
    curve = [(170 + t*5.8, 620 - 380*math.exp(-t/22)) for t in range(0, 101)]
    s.line(curve, EMER, w=6, glow=1.2)
    for k in range(0, 101, 20):
        x, y = curve[k]
        s.circle(x, y, 9, fill=AMBER, outline=WHITE, w=2, glow=1)
    s.text(460, 200, 'La pérdida baja al entrenar', 24, WHITE, bold=True)
    s.text(470, 668, 'épocas', 20, MUTED)
    # puntos + frontera
    s.panel(890, 170, 600, 520, EMER)
    rng = random.Random(3)
    for _ in range(26):
        s.circle(min(max(rng.gauss(1060, 50), 940), 1200), min(max(rng.gauss(345, 50), 270), 480), 9, fill=CYAN, glow=0.8)
        s.circle(min(max(rng.gauss(1330, 50), 1200), 1450), min(max(rng.gauss(540, 50), 420), 650), 9, fill=AMBER, glow=0.8)
    bound = bez((930, 650), (1130, 580), (1240, 360), (1450, 240))
    s.line(bound, WHITE, w=4, glow=1.1)
    # árbol de decisión mini
    tx, ty = 1190, 420
    for (a, b) in (((tx, ty - 90), (tx - 70, ty - 20)), ((tx, ty - 90), (tx + 70, ty - 20))):
        s.line([a, b], EMER, w=3, alpha=0)
    s.text(800, 800, 'Machine Learning', 30, WHITE, bold=True, alpha=235)
    s.text(1190, 200, 'Frontera de decisión', 24, WHITE, bold=True)
    return s


def u4():
    s = Scene(AMBER)
    layers = [3, 5, 7, 7, 5, 3]; xs = [230 + 228*i for i in range(6)]
    rng = random.Random(4)
    P = [[(xs[L], 450 + (k - (n - 1)/2) * 70) for k in range(n)] for L, n in enumerate(layers)]
    for L in range(5):
        for a in P[L]:
            for b in P[L + 1]:
                wgt = rng.uniform(-1, 1)
                s.line([a, b], CYAN if wgt > 0 else PINK, w=1.3, alpha=int(18 + 100*abs(wgt)), glow=0.2*abs(wgt))
    cols = [CYAN, AMBER, AMBER, AMBER, AMBER, PINK]
    for L, pts in enumerate(P):
        for (x, y) in pts:
            act = rng.uniform(0.3, 1)
            s.circle(x, y, 21, fill=cols[L], fill_alpha=int(50 + 180*act), outline=cols[L], w=3, glow=0.9*act)
    s.text(800, 790, 'Deep Learning  ·  Redes profundas', 30, WHITE, bold=True, alpha=235)
    return s


def u5():
    s = Scene(PINK)
    cx, cy = 800, 440
    rng = random.Random(5)
    for r in (120, 190, 260, 330):
        pts = [(cx + r*math.cos(t), cy + r*0.72*math.sin(t)) for t in np.linspace(0, 2*math.pi, 140)]
        s.line(pts, PINK, w=1.5, alpha=50, glow=0.2, dash=(10, 9))
    for k in range(36):
        t = rng.uniform(0, 2*math.pi); r = rng.uniform(140, 340)
        x, y = cx + r*math.cos(t), cy + r*0.72*math.sin(t)
        s.circle(x, y, rng.uniform(4, 9), fill=rng.choice([PINK, VIOLET, CYAN, AMBER]), glow=0.9, fill_alpha=190)
    # chispa central
    big = []
    for i in range(8):
        a = -math.pi/2 + i*math.pi/4
        rr = 150 if i % 2 == 0 else 38
        big.append((cx + rr*math.cos(a), cy + rr*math.sin(a)))
    s.poly(big, fill=PINK, fill_alpha=230, outline=WHITE, ow=3, glow=1.4)
    s.star(cx + 215, cy - 135, 34, fill=AMBER, glow=1.1)
    s.star(cx - 235, cy + 120, 26, fill=CYAN, glow=1.1)
    # fichas de tokens
    for (x, y, t, col) in ((330, 260, 'LLM', VIOLET), (1270, 640, 'GAN', PINK), (1290, 250, 'Ética', EMER), (300, 640, 'Prompt', CYAN)):
        s.rect(x - 70, y - 28, 140, 56, fill=PANEL, fill_alpha=240, outline=col, ow=3, r=16, glow=0.8)
        s.text(x, y, t, 26, WHITE, bold=True)
    s.text(800, 800, 'IA Generativa, Ética y Futuro', 30, WHITE, bold=True, alpha=235)
    return s


if __name__ == '__main__':
    out = sys.argv[1]
    for n, f in enumerate((u1, u2, u3, u4, u5), 1):
        f().render(f'{out}/unidad-{n}.jpg'); print('ok', n, flush=True)
