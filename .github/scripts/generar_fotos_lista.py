#!/usr/bin/env python3
"""Genera datos/fotos.js: la lista de fotos propias que hay en img/.

La página la lee al instante (antes de dibujar nada) y así sabe qué foto va en cada lugar
sin tener que ir a comprobarlo. Reconoce estos nombres (jpg, jpeg, png o webp):
    portada-facultad, portada-docente, unidad-1 ... unidad-5, semana-01 ... semana-15
Las fotos pesadas (más de 150 KB, p. ej. un PNG de 2 MB) se convierten a una versión WebP
liviana de 1280 px en img/_web/ (unos 70 KB) y la página usa esa: carga al instante.
Tu archivo original NO se toca ni se borra. El nombre de la versión liviana lleva la huella
del original, así que si reemplazas una foto por otra con el mismo nombre se rehace sola y
nadie ve la vieja guardada en su navegador.
"""
import hashlib, json, os, re, sys

try:
    from PIL import Image
except ImportError:      # sin Pillow no se puede optimizar
    Image = None

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
IMG = os.path.join(RAIZ, "img")
WEB = os.path.join(IMG, "_web")
SALIDA = os.path.join(RAIZ, "datos", "fotos.js")
UMBRAL = 150 * 1024       # desde este peso se crea la versión liviana
ANCHO = 1280              # px de ancho máximo (sobra para tarjetas y pantallas retina)
CALIDAD = 82
PATRON = re.compile(r"^(portada-facultad|portada-docente|unidad-\d+|semana-\d+)\.(jpg|jpeg|png|webp)$", re.I)
ORDEN = {"jpg": 0, "jpeg": 1, "png": 2, "webp": 3}   # igual que antes: si hay varias, gana la primera

mejor = {}
for nombre_archivo in sorted(os.listdir(IMG)):
    m = PATRON.match(nombre_archivo)
    if not m:
        continue
    clave = m.group(1).lower()
    ext = m.group(2).lower()
    if clave not in mejor or ORDEN[ext] < ORDEN[mejor[clave][1]]:
        mejor[clave] = (nombre_archivo, ext)

if Image is None and any(os.path.getsize(os.path.join(IMG, a)) > UMBRAL for a, _ in mejor.values()):
    sys.exit("Falta Pillow (pip install pillow / apt install python3-pil) para crear las versiones livianas.")

def crear_liviana(origen, destino):
    im = Image.open(origen)
    im.load()
    im = im.convert("RGBA" if (im.mode in ("RGBA", "LA") or "transparency" in im.info) else "RGB")
    if im.width > ANCHO:
        im = im.resize((ANCHO, round(im.height * ANCHO / im.width)), Image.LANCZOS)
    os.makedirs(WEB, exist_ok=True)
    im.save(destino, "WEBP", quality=CALIDAD, method=6)

lista = {}
usadas = set()
for clave in sorted(mejor):
    archivo = mejor[clave][0]
    ruta = os.path.join(IMG, archivo)
    with open(ruta, "rb") as f:
        datos = f.read()
    huella = hashlib.sha1(datos).hexdigest()[:8]
    lista[clave] = "img/" + archivo + "?v=" + huella            # por defecto: el original
    if len(datos) > UMBRAL:
        nombre_web = clave + "." + huella + ".webp"
        destino = os.path.join(WEB, nombre_web)
        try:
            if not os.path.exists(destino):
                crear_liviana(ruta, destino)
            if os.path.getsize(destino) < len(datos):
                lista[clave] = "img/_web/" + nombre_web
                usadas.add(nombre_web)
                print("  " + clave + ": " + str(len(datos) // 1024) + " KB -> " + str(os.path.getsize(destino) // 1024) + " KB")
            else:
                os.remove(destino)
        except Exception as e:
            print("  No se pudo optimizar " + archivo + ": " + str(e))

# borrar versiones livianas que ya no se usan (foto reemplazada o eliminada)
if os.path.isdir(WEB):
    for nombre in os.listdir(WEB):
        if nombre not in usadas:
            os.remove(os.path.join(WEB, nombre))
            print("  borrada versión antigua: " + nombre)

contenido = (
    "/* Generado automáticamente al subir fotos a img/ (.github/workflows/fotos-lista.yml). No lo edites. */\n"
    "window.__FOTOS_LISTA = " + json.dumps(lista, ensure_ascii=False, indent=2, sort_keys=True) + ";\n"
)
os.makedirs(os.path.dirname(SALIDA), exist_ok=True)
anterior = open(SALIDA, encoding="utf-8").read() if os.path.exists(SALIDA) else None
if anterior != contenido:
    with open(SALIDA, "w", encoding="utf-8") as f:
        f.write(contenido)
    print("datos/fotos.js actualizado:", len(lista), "fotos")
else:
    print("datos/fotos.js sin cambios")
