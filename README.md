# Portafolio académico — Inteligencia Artificial (UNMSM)

Sitio web estático del curso de **Inteligencia Artificial** (EP Ingeniería de Sistemas, FISI – UNMSM, semestre 2026-II).
Muestra las semanas de clase (semanas 1–7 y 9–14, agrupadas en 5 unidades); cada semana tiene su presentación, informe y laboratorio
(Colab), con vista previa dentro de la página y botón de descarga.

- **Publicado en:** GitHub Pages, desde la rama `main` del repositorio `gonzalo3453252/portafolio-ia`.
- **Tecnología:** HTML + JavaScript sin framework ni paso de compilación + Tailwind (compilado por GitHub) + Python solo para tareas automáticas.
- **Para quién es este documento:** el dueño del portafolio, quien reciba el proyecto en un traspaso y quien lo audite.
  La explicación técnica detallada está en [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md).

---

## 1. Cómo ver la página en tu computadora

No hay nada que instalar. Cualquiera de estas dos formas sirve:

```bash
python3 -m http.server 8000      # y abrir http://localhost:8000
```

o simplemente abrir `index.html` con doble clic (los visores de PDF funcionan mejor con el servidor).

## 2. Estructura del repositorio

```text
index.html                 Estructura de la página (textos fijos, ventanas) y orden de carga de los scripts
css/
  estilos.css              Colores, tipografías y animaciones propias (con índice al inicio)
  tailwind.css             GENERADO por GitHub (no editar)
  tailwind-entrada.css     Entrada de Tailwind (3 líneas)
js/
  app.js                   Arranque: une todo cuando la página carga
  core/                    config.js · storage.js · utils.js · state.js
  data/                    shield.js · units-and-topics.js · default-state.js
  features/                photos · pages · navigation · demo-slides · viewer-styles · demo-viewers ·
                           real-viewers · preview-modal · downloads · syllabus · github-files ·
                           creator-panel · page-events
  viewers/                 Código que corre DENTRO de los visores (PDF, Word, PPT, Colab)
  vendor/                  Librerías de terceros ya descargadas: pdf.js y marked (no editar)
datos/
  portafolio.json          Contenido publicado: semanas, temas, perfil
  fotos.js                 GENERADO: lista de fotos propias que existen en img/
  archivos.js              GENERADO: lista de archivos que existen en archivos/
img/                       Fotos por defecto + tus fotos propias (img/_web = versiones optimizadas, generadas)
archivos/
  silabo/                  Sílabo en PDF
  semana-NN/               PPT, Word, PDF y cuaderno de cada semana (_vista/ = PDF generados)
.github/
  workflows/               Tareas automáticas (ver sección 5)
  scripts/                 Scripts de Python que usan esas tareas
docs/ARQUITECTURA.md       Documentación técnica
tests/verificar-estructura.js   Verificación automática de la estructura
eslint.config.js · package.json · .editorconfig      Herramientas de calidad
```

## 3. Cómo cambiar el contenido (sin programar)

| Quiero… | Qué hago |
|---|---|
| Subir la presentación, informe o laboratorio de una semana | Subir el archivo a `archivos/semana-NN/` (con cualquier nombre). La página lo detecta sola. |
| Cambiar una foto | Subir a `img/` una imagen llamada `semana-NN.jpg`, `unidad-N.jpg`, `portada-facultad.jpg` o `portada-docente.jpg`. |
| Cambiar el texto de una semana, el perfil o los temas | Abrir la página con `#creador` al final (la dirección de tu página seguida de `#creador`), editar y pulsar **Publicar**. |
| Reemplazar el sílabo | Subir el PDF a `archivos/silabo/`. |

**Panel del creador (`#creador`).** Guarda los cambios en tu navegador para que los veas al instante. Para que los vea
todo el mundo, **Publicar** copia el contenido y abre el editor de GitHub sobre `datos/portafolio.json`; ahí se pega y se
guarda (requiere iniciar sesión en GitHub). Sin ese paso, solo tú ves los cambios.

**Nombres de archivo.** Cualquier nombre sirve: `.pptx/.ppt` → presentación, `.docx/.doc` → informe, `.ipynb` → laboratorio;
un `.pdf` se considera informe si su nombre contiene *informe, tarea, reporte o trabajo*, y presentación en otro caso.

## 4. Cómo funciona (resumen de 1 minuto)

1. `index.html` carga las listas generadas (`datos/fotos.js`, `datos/archivos.js`) y los scripts en un orden fijo.
2. `js/app.js` carga el contenido (`datos/portafolio.json`), le aplica los cambios guardados en tu navegador,
   dibuja la página y detecta los archivos reales de cada semana.
3. Las páginas se dibujan por completo desde JavaScript (`features/pages.js`) a partir de un único objeto de estado.
4. Las vistas previas se muestran en un `iframe` aislado (`features/preview-modal.js` + `js/viewers/`).

## 5. Tareas automáticas (GitHub Actions)

| Archivo | Cuándo corre | Qué hace |
|---|---|---|
| `fotos-lista.yml` | Al subir imágenes a `img/` | Optimiza las fotos (`img/_web/*.webp`) y regenera `datos/fotos.js` |
| `archivos-lista.yml` | Al subir archivos a `archivos/` | Regenera `datos/archivos.js` |
| `vistas-pdf.yml` | Al subir `.pptx/.docx` | Crea su vista PDF en `archivos/semana-NN/_vista/` |
| `tailwind.yml` | Al cambiar `index.html` o `js/` | Regenera `css/tailwind.css` |
| `calidad.yml` | En cada cambio de código | ESLint + verificación de estructura (solo avisa; no modifica nada) |

Las tareas que guardan archivos generados hacen un *commit* automático del bot de GitHub; si falla un intento lo repiten
desde la última versión de `main` y, si no lo logran tras 5 intentos, **fallan visiblemente** (pestaña *Actions*).

## 6. Herramientas de calidad (para quien programe)

```bash
npm install          # una sola vez (solo instala ESLint)
npm run lint         # errores de JavaScript
npm run verify       # estructura: scripts, orden de carga, JSON, cabeceras
npm run check        # ambos
```

**Reglas de código** (resumen; detalle en `docs/ARQUITECTURA.md`):

- Identificadores en inglés; comentarios, textos de pantalla y documentación en español.
- `"use strict"` en cada archivo, `const`/`let` (nunca `var`), `===`, sin bloques `catch` vacíos.
- Funciones pequeñas con comentario `/** … */`; cada archivo abre con una cabecera (qué hace, de qué depende, qué expone).
- No se renombran los `id` del HTML, clases CSS, atributos `data-*` ni claves de almacenamiento: son parte del contrato entre archivos.

## 7. Seguridad

- No hay claves, contraseñas ni servidores: el repositorio es público y todo lo que contiene es visible.
- El panel `#creador` **no es una puerta de seguridad**: cualquiera puede abrirlo y editar *su propia copia en su navegador*,
  pero **nadie puede cambiar lo publicado** sin iniciar sesión en tu cuenta de GitHub.
- Por eso el riesgo real es el acceso a la cuenta de GitHub: **activa la verificación en dos pasos (2FA)** y usa una contraseña única.
- Las librerías (pdf.js, marked) están copiadas en `js/vendor/` (no se descargan de terceros al abrir la página).
  Los visores corren en un `iframe` aislado, y la página solo acepta mensajes que vengan de ese visor y de su mismo origen.
- Cada visor limpia (sanitiza) el texto que muestra de los cuadernos antes de dibujarlo.

## 8. Preguntas frecuentes

**Cambié un archivo y la página no lo muestra.** Espera 1–2 minutos a que terminen las tareas (pestaña *Actions*) y recarga con
Ctrl+F5. Si la tarea aparece en rojo, ábrela: el mensaje explica qué falló.

**¿Por qué no usa módulos ES (`import`/`export`) ni un framework?** Para que el sitio funcione abriendo el archivo directamente,
se pueda editar desde la web de GitHub y no exista un paso de compilación que se rompa con el tiempo. La contrapartida
(nombres compartidos en un ámbito global) se controla con la carpeta por capas, el orden de carga fijo y ESLint. Ver ADR-001.

**¿Por qué una clave se llama `ocultos` (en español) si el código está en inglés?** Esa clave ya está guardada en
`datos/portafolio.json` y en el navegador de usuarios; renombrarla haría perder esos datos. Es la única excepción.

**Hice un cambio y algo dejó de funcionar.** En GitHub: *Commits → el cambio → Revert*. Cada cambio queda registrado y se puede deshacer.
