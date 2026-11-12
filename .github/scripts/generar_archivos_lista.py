#!/usr/bin/env python3
"""Genera datos/archivos.js: qué archivos hay en archivos/semana-NN/ (y en _vista/) y en archivos/silabo/.

La página lo lee al abrir, antes de dibujar nada, en lugar de preguntarle a la API de GitHub
(que sin sesión solo permite ~60 preguntas por hora por conexión a internet: una clase entera
en el mismo wifi la agotaría y la página quedaría sin sus archivos).
"""
import json, os, re

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
BASE = os.path.join(RAIZ, "archivos")
SALIDA = os.path.join(RAIZ, "datos", "archivos.js")

def archivos_de(carpeta):
    if not os.path.isdir(carpeta):
        return []
    return sorted(f for f in os.listdir(carpeta) if os.path.isfile(os.path.join(carpeta, f)))

semanas, vistas = {}, {}
if os.path.isdir(BASE):
    for nombre in sorted(os.listdir(BASE)):
        m = re.match(r"^semana-(\d+)$", nombre)
        ruta = os.path.join(BASE, nombre)
        if not (m and os.path.isdir(ruta)):
            continue
        sem = str(int(m.group(1)))
        lista = archivos_de(ruta)
        if lista:
            semanas[sem] = lista
        pdfs = [f for f in archivos_de(os.path.join(ruta, "_vista")) if f.lower().endswith(".pdf")]
        if pdfs:
            vistas[sem] = pdfs

silabos = [f for f in archivos_de(os.path.join(BASE, "silabo")) if f.lower().endswith(".pdf")]

datos = {
    "semanas": dict(sorted(semanas.items(), key=lambda kv: int(kv[0]))),
    "vistas": dict(sorted(vistas.items(), key=lambda kv: int(kv[0]))),
    "silabos": silabos,
}
contenido = (
    "/* Generado automáticamente al subir archivos a archivos/ (.github/workflows). No lo edites. */\n"
    "window.__FILE_LIST = " + json.dumps(datos, ensure_ascii=False, indent=1) + ";\n"
)
os.makedirs(os.path.dirname(SALIDA), exist_ok=True)
anterior = open(SALIDA, encoding="utf-8").read() if os.path.exists(SALIDA) else None
if anterior != contenido:
    with open(SALIDA, "w", encoding="utf-8") as f:
        f.write(contenido)
    print("datos/archivos.js actualizado:", sum(len(v) for v in semanas.values()), "archivos en", len(semanas), "semanas")
else:
    print("datos/archivos.js sin cambios")
