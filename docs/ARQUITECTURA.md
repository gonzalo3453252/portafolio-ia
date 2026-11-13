# Arquitectura técnica

Documento para **traspaso y auditoría**. Complementa el [`README.md`](../README.md) (uso y mantenimiento).
Si algo de aquí contradice al código, el código manda: corrige este documento.

## 1. Visión general

Sitio **estático** (sin servidor propio ni base de datos) servido por GitHub Pages. Todo se calcula en el navegador.

```text
                 ┌────────────────────────────── GitHub (repositorio, rama main) ──────────────────────────────┐
                 │ datos/portafolio.json   archivos/**   img/**   index.html   js/**                           │
                 │        ▲                    │            │                                                  │
                 │        │ (edición manual)   └─ Actions ──┴─► datos/archivos.js, datos/fotos.js,            │
                 │        │                                       archivos/**/_vista/*.pdf, css/tailwind.css  │
                 └────────┼───────────────────────────────────────────────────────────────────────────────────┘
                          │ Pages
                          ▼
   Navegador ── index.html ── datos/fotos.js, datos/archivos.js ── js/core → js/data → js/features → js/app.js
                                                      │
                                                      └─► iframe de vista previa ── js/viewers/*.js (+ js/vendor)
```

Estado en el navegador: `localStorage` (cambios del creador, caché de fotos y de la lista de archivos) y `sessionStorage`
(caché corta). Nunca se envía nada a ningún servidor.

## 2. Capas y orden de carga

Los archivos son `<script>` clásicos que comparten el ámbito global; **el orden en `index.html` es parte del diseño**.
`npm run verify` comprueba que todos estén cargados y que las dependencias principales vayan antes.

| Orden | Archivo | Responsabilidad | Depende de |
|---|---|---|---|
| 1 | `datos/fotos.js` (en `<head>`) | `window.__PHOTO_LIST`: fotos propias que existen | — |
| 2 | `datos/archivos.js` | `window.__FILE_LIST`: archivos por semana | — |
| 3 | `core/config.js` | Repositorio, rutas, URLs de GitHub | utils (en ejecución) |
| 4 | `core/storage.js` | `STORAGE_KEYS`, `localStore`, `sessionStore` (nunca lanzan error) | — |
| 5 | `core/utils.js` | `escapeHtml`, `byId`, `padWeek`, `showToast`, descargas | — |
| 6 | `data/shield.js` | SVG del escudo de la UNMSM | — |
| 7 | `data/units-and-topics.js` | Descripciones de temas, `UNITS_INFO`, `parseTopic` | — |
| 8 | `data/default-state.js` | `DEFAULT_STATE`: contenido de respaldo | — |
| 9 | `core/state.js` | Estado de la aplicación, carga/guardado, refresco de vistas | storage, utils, data |
| 10 | `features/photos.js` | Qué foto va en cada sitio y su carga | config, storage, utils |
| 11 | `features/pages.js` | Dibuja las páginas (resumen, unidad, semana) | state, data, photos |
| 12 | `features/navigation.js` | Mostrar/ocultar vistas, menús, pestañas | state, pages |
| 13 | `features/demo-slides.js` | Diapositivas de ejemplo (si no hay PPT real) | state, data |
| 14 | `features/viewer-styles.js` | CSS de los visores y `buildViewerPage` | — |
| 15 | `features/demo-viewers.js` | HTML de los visores de ejemplo | 13, 14 |
| 16 | `features/real-viewers.js` | HTML de los visores de PDF y cuaderno reales | 14 |
| 17 | `features/preview-modal.js` | Ventana flotante de vista previa | 15, 16 |
| 18 | `features/downloads.js` | Descarga de archivos reales o de ejemplo | state, utils |
| 19 | `features/syllabus.js` | Detección y descarga del sílabo | config |
| 20 | `features/github-files.js` | Qué archivos existen y a qué semana pertenecen | todo lo anterior |
| 21 | `features/creator-panel.js` | Panel `#creador` (editar y publicar) | state, utils |
| 22 | `features/page-events.js` | Eventos de la página (menús, clics) | navigation, preview-modal |
| 23 | `app.js` | Secuencia de arranque | todos |

Cada archivo abre con una cabecera que declara **qué hace, de qué depende y qué expone**.

## 3. Flujo de datos

```text
datos/portafolio.json ─► publishedState ─┐
DEFAULT_STATE (respaldo) ────────────────┼─► appState ──► pages.js ──► DOM
localStorage (cambios del creador) ──────┘        ▲
datos/archivos.js / API de GitHub ─► github-files.js ┘ (completa pptUrl, docUrl, colabUrl de cada semana)
```

Secuencia de arranque (`app.js`):

1. `applyCustomPhotos()` — fija las fotos de portada sin esperar a la red.
2. `loadPublishedState()` — lee `datos/portafolio.json`.
3. `loadSavedState()` — aplica los cambios guardados en este navegador (solo si son válidos: `isUsableState`).
4. `renderProfileHeader()`, `populateWeekSelectors()`, `showPresentacionPage()` — primer dibujo.
5. `initCustomPhotos()` — vigila las `<img data-foto>` y precarga el resto de fotos.
6. `autoDetectWeekFiles()` — conecta los archivos reales; al terminar refresca las vistas.
7. `bindPageEvents()`, `initCreatorPanel()` — eventos y panel.

### Estado (`core/state.js`)

`appState` es el único objeto con los datos mostrados: perfil + `weeks[]`. Cada semana tiene los campos descritos en
`data/default-state.js` (título, temas, `hasPpt/hasWord/hasColab`, `pptUrl/docUrl/colabUrl`, vistas PDF, etc.).
Las funciones que lo modifican siempre terminan llamando a `saveState()` y `refreshContentViews()` /
`refreshActiveView()`; **no se toca el DOM a mano para reflejar un cambio de datos**.

### Almacenamiento (`core/storage.js`)

| Clave | Contenido | Dónde |
|---|---|---|
| `unmsm_fisi_ia_editorial_v17` | Cambios del creador | localStorage |
| `unmsm_fisi_ia_pendientes` | Aviso de "cambios sin publicar" | localStorage |
| `ia_fotos_v1` | Memoria de fotos propias (solo si no hay `datos/fotos.js`) | localStorage |
| `ia_tree_v2` | Lista de archivos de la API de GitHub (5 min) | sessionStorage |

Las claves **no se renombran** (se perderían los cambios guardados); si cambia la forma de los datos, se sube el sufijo `_vNN`.
Todas las lecturas/escrituras pasan por `localStore`/`sessionStore`, que no lanzan error si el navegador bloquea el almacenamiento.

## 4. Vistas previas (iframe)

```text
preview-modal.js ── buildViewerPage({css, bodyHtml, config, script}) ──► HTML ──► Blob URL ──► <iframe sandbox>
                                                                     ▲
 iframe:  window.__VIEW__ (config)  +  viewers/viewer-common.js  +  viewers/<visor>.js
 iframe ──postMessage {action:"downloadModalFile"}──► página (comprueba event.source y event.origin)
```

- El visor recibe solo datos (`window.__VIEW__`, serializado con `jsonForScript`, que escapa `</script>`).
- El HTML que viene de los cuadernos se convierte con `marked` y se sanitiza antes de insertarlo.
- `previewToken` descarta respuestas tardías si el usuario abre otra vista previa mientras la anterior carga.
- Al cerrar, se revoca el Blob URL (`cleanupDynamicIframe`).

## 5. Fotos

Las `<img data-foto="nombre">` están ocultas por CSS hasta recibir `data-listo` (evita ver un instante la foto anterior).
La fuente de verdad es `datos/fotos.js`; si no existe, se prueban los nombres posibles y se recuerda el resultado.
Un aviso inline en `index.html` retira la ocultación a los 4 s si `photos.js` no llegó a arrancar.

## 6. Archivos generados (no editar)

| Archivo | Lo genera | Con |
|---|---|---|
| `datos/fotos.js`, `img/_web/*.webp` | `fotos-lista.yml` | `.github/scripts/generar_fotos_lista.py` |
| `datos/archivos.js` | `archivos-lista.yml` | `.github/scripts/generar_archivos_lista.py` |
| `archivos/**/_vista/*.pdf` | `vistas-pdf.yml` | LibreOffice |
| `css/tailwind.css` | `tailwind.yml` | Tailwind 3.4.17 (versión fija) |

Patrón común de los flujos que guardan resultados: `fetch` → `reset --hard origin/main` → generar → *commit* → `push`,
hasta 5 reintentos; si no se logra guardar, el paso **falla** (no se oculta el error).

**Tailwind y clases dinámicas.** Tailwind busca las clases como texto en `index.html` y `js/**`. Una clase armada por partes
(`"bg-" + color`) no se detecta: escríbela completa o añádela a `safelist` en `tailwind.config.js`. Ojo: hasta una palabra suelta
en un comentario que coincida con una clase (`visible`, `invisible`, `hidden`…) genera esa regla; es inofensivo pero conviene evitarlo.

## 6.1 Seguridad (qué se decidió y por qué)

- Sin secretos en el repositorio; el repositorio es público por diseño.
- `Content-Security-Policy` por `<meta>` limita `base-uri`, `object-src` y `form-action`. No incluye `script-src` porque los visores
  usan scripts en línea dentro de un iframe de Blob; es una limitación conocida de las páginas estáticas.
- Librerías de terceros copiadas a `js/vendor/` (versión fija, con su licencia): no hay CDN de scripts en ejecución.
- Todo texto de usuario que va a HTML pasa por `escapeHtml`; el contenido Markdown de cuadernos se sanitiza.
- Lo publicado solo cambia con un *commit* en GitHub: la protección real es la cuenta (2FA).

## 7. Convenciones de código

| Tema | Regla |
|---|---|
| Idioma | Identificadores en inglés; comentarios, textos de pantalla y documentación en español |
| Archivos | Cabecera `/* … */` (propósito, depende de, expone) + `"use strict"` |
| Variables | `const` por defecto, `let` si se reasigna, nunca `var`; `===` |
| Funciones | Pequeñas, una responsabilidad, con `/** … */`; complejidad ≤ 15 y ≤ 80 líneas (aviso de ESLint) |
| Errores | Prohibido `catch` vacío: se maneja, o se comenta por qué se ignora; usar `catch { … }` si no se usa el error |
| DOM | Los `id`, clases CSS, `data-*` y claves de almacenamiento **no se renombran** (son el contrato entre HTML, CSS y JS) |
| Constantes | Números/textos "mágicos" a constantes con nombre y unidad (`TOAST_DURATION_MS`) |
| HTML generado | Funciones `build…Html` que devuelven texto; los eventos se enlazan aparte (`bind…`) |
| Nombres | `build…` devuelve datos/HTML · `render…` escribe en el DOM · `show…` cambia de vista · `bind…` conecta eventos · `load…/save…` leen/escriben almacenamiento |

## 8. Decisiones de arquitectura (ADR)

**ADR-001 — Scripts clásicos en vez de módulos ES ni framework.**
*Contexto:* sitio personal editado por una sola persona, a veces desde la web de GitHub, que debe abrirse también con doble clic (`file://`).
*Decisión:* `<script>` clásicos, un único ámbito global, carpeta por capas y orden de carga fijo, comprobado por ESLint y `tests/verificar-estructura.js`.
*Consecuencias:* (+) cero compilación y cero dependencias en ejecución; (−) los nombres globales no pueden repetirse y el orden importa.
*Cuándo reconsiderarla:* si el proyecto lo mantiene un equipo o crece mucho (migrar a módulos ES + empaquetador).

**ADR-002 — Tailwind compilado por GitHub, no por CDN.** El CDN descargaba y compilaba Tailwind en cada visita (lento, y un
tercero ejecutando código en la página). Ahora se sirve un CSS estático de ~24 KB.

**ADR-003 — Listas generadas (`fotos.js`, `archivos.js`) en vez de consultar la API de GitHub.** La API limita a 60 consultas/hora
por conexión y retrasa el primer dibujo. La API queda solo como respaldo.

**ADR-004 — Visores en `iframe` de Blob con sandbox.** Aísla el código de los visores y permite descargar/imprimir. El mensaje al
padre se valida por origen y ventana de origen.

**ADR-005 — Excepción de idioma: la clave `ocultos`.** Está persistida en `datos/portafolio.json` y en navegadores ya en uso; no se renombra.

## 9. Cómo añadir cosas

- **Una nueva semana:** panel `#creador` → *Nueva semana* → Publicar. No requiere tocar código.
- **Un nuevo tipo de material** (p. ej. "video"): añadir una entrada a `FILE_CONVENTION` (`github-files.js`), `MATERIAL_FIELDS`
  (`creator-panel.js`) y `WEEK_RESOURCES` (`pages.js`); si necesita visor, un `build…Html` en `real-viewers.js` y su script en `js/viewers/`.
- **Un nuevo archivo JS de página:** crearlo con su cabecera y `"use strict"`, añadirlo a `index.html` en su lugar de la lista
  y a la tabla de la sección 2. `npm run verify` avisa si se olvida.
- **Una nueva tarea automática:** copiar el patrón de `fotos-lista.yml` (reintentos y fallo visible).

## 10. Verificación

```bash
npm run check      # ESLint + estructura (también corre en GitHub en cada cambio: calidad.yml)
```

Durante el refactor de código (noviembre 2026) se comparó el comportamiento con la versión anterior mediante una prueba automatizada
con navegador (67 comportamientos y 16 capturas de pantalla en escritorio y móvil, incluidos visores, panel del creador y
descargas): **0 diferencias**. Esa prueba no se incluye en el repositorio para no obligar a instalar un navegador; si se necesita
repetirla, se recomienda Playwright con las mismas rutas de interfaz (`id`s).
