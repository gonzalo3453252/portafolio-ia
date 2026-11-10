#!/usr/bin/env python3
"""Genera datos/fotos.js: la lista de fotos propias que hay en img/.

La página la lee al instante (antes de dibujar nada) y así sabe qué foto va en cada lugar
sin tener que ir a comprobarlo. Reconoce estos nombres (jpg, jpeg, png o webp):
    portada-facultad, portada-docente, unidad-1 ... unidad-5, semana-01 ... semana-15
Cada foto lleva ?v=<huella> para que, si la reemplazas por otra con el mismo nombre,
nadie vea la versión vieja guardada en su navegador.
"""
import hashlib, json, os, re, sys

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
IMG = os.path.join(RAIZ, "img")
SALIDA = os.path.join(RAIZ, "datos", "fotos.js")
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

lista = {}
for clave in sorted(mejor):
    archivo = mejor[clave][0]
    with open(os.path.join(IMG, archivo), "rb") as f:
        huella = hashlib.sha1(f.read()).hexdigest()[:8]
    lista[clave] = "img/" + archivo + "?v=" + huella

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
