/* =============================================================================
   ESTILOS Y ARMADO DE LAS VENTANAS DE PREVISUALIZACIÓN  (features/viewer-styles.js)
   Los visores se muestran dentro de un <iframe> con una página HTML armada al vuelo. Aquí están:
     - el CSS de cada visor (el real de PDF, el de cuadernos y los tres de ejemplo)
     - buildViewerPage(): arma la página completa (CSS + contenido + datos + script del visor)

   El código que corre DENTRO del iframe está en js/viewers/. Los datos le llegan en window.__VIEW__.

   Depende de: nada. Expone: *_CSS, VENDOR_URL, buildViewerPage, jsonForScript.
   ============================================================================= */
"use strict";

// ---------------------------------------------------------------------------
// Visores reales (archivos que subes)
// ---------------------------------------------------------------------------
const VIEWER_BASE_CSS = "*{box-sizing:border-box}html,body{margin:0;height:100%}body{font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f1f5f9;color:#0f172a;display:flex;flex-direction:column}"
  + ".bar{background:#fff;border-bottom:1px solid #e2e8f0;padding:8px 12px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:13px;flex-shrink:0}"
  + ".bar button,.bar .btn{background:#fff;border:1px solid #cbd5e1;border-radius:8px;padding:5px 10px;font-size:12.5px;font-weight:600;color:#0f172a;cursor:pointer;text-decoration:none}"
  + ".bar button:hover,.bar .btn:hover{background:#f1f5f9}.badge{font-weight:700;padding:4px 8px;background:#f1f5f9;border-radius:8px;font-size:12.5px}.sp{flex:1}.ttl{font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:45%}";
const PDF_VIEWER_CSS = ".pages{flex:1;overflow:auto;padding:14px 0 40px;-webkit-overflow-scrolling:touch}.pg{margin:0 auto 14px;background:#fff;box-shadow:0 2px 10px rgba(15,23,42,.15)}.pg canvas{display:block}.fb{padding:40px 20px;text-align:center;color:#334155}.fb a{color:#0f62fe;font-weight:700}";
const NB_VIEWER_CSS = ".nb{flex:1;overflow:auto;padding:16px 12px 40px;-webkit-overflow-scrolling:touch}.wrap{max-width:980px;margin:0 auto}.cell{margin:0 0 14px}.cell.md{padding:0 8px;line-height:1.65;font-size:14.5px;overflow-wrap:anywhere}"
  + ".cell.md h1,.cell.md h2,.cell.md h3{margin:.9em 0 .4em}.cell.md img{max-width:100%}.cell.md code{background:#eef2f7;padding:1px 5px;border-radius:4px;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:.9em}"
  + ".cell.md pre{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px;overflow:auto}.cell.md pre code{background:none;padding:0}.cell.md table{border-collapse:collapse}.cell.md td,.cell.md th{border:1px solid #e2e8f0;padding:4px 8px}"
  + ".row{display:flex;gap:8px;align-items:flex-start}.prompt{width:54px;flex-shrink:0;text-align:right;font:12px ui-monospace,Menlo,Consolas,monospace;color:#94a3b8;padding-top:10px}.body{flex:1;min-width:0}"
  + "pre.src,pre.out{margin:0;padding:10px 12px;overflow:auto;font:12.5px/1.55 ui-monospace,Menlo,Consolas,monospace}pre.src{background:#fff;border:1px solid #e2e8f0;border-radius:8px;white-space:pre}pre.out{white-space:pre-wrap;word-break:break-word}pre.out.err{color:#b91c1c;background:#fef2f2;border-radius:8px}"
  + ".row img{max-width:100%;height:auto;background:#fff}.html{overflow:auto;font-size:13px}.html table{border-collapse:collapse}.html td,.html th{border:1px solid #e2e8f0;padding:3px 8px}"
  + ".k{color:#9333ea;font-weight:600}.s{color:#15803d}.c{color:#64748b;font-style:italic}.n{color:#c2410c}.f{color:#0369a1}.empty,.msg{padding:30px;color:#64748b;text-align:center}.msg a{color:#0f62fe;font-weight:700}@media(max-width:600px){.prompt{display:none}}";

// ---------------------------------------------------------------------------
// Visores de ejemplo (semanas sin archivo real)
// ---------------------------------------------------------------------------
/** CSS del visor de ejemplo de PowerPoint. */
const DEMO_PPT_CSS = `
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f1f5f9; color: #0f172a; display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
.toolbar { background: #f1f5f9; border-bottom: 1px solid #e2e8f0; padding: 8px 20px; display: flex; align-items: center; justify-content: space-between; font-size: 13px; color: #334155; shrink: 0; }
.toolbar-group { display: flex; align-items: center; gap: 10px; }
.icon-btn { background: transparent; border: none; color: #475569; cursor: pointer; padding: 5px 8px; border-radius: 6px; font-size: 13px; font-weight: 600; display: inline-flex; align-items: center; justify-content: center; transition: background 0.15s, color 0.15s; }
.icon-btn:hover { background: #e2e8f0; color: #0f172a; }
.counter-pill { font-weight: 700; color: #0f172a; padding: 3px 10px; font-size: 13px; min-width: 58px; text-align: center; }
.stage { flex: 1; display: flex; align-items: center; justify-content: center; padding: 20px 28px; overflow: auto; }
.slide-canvas { background: #ffffff; width: 100%; max-width: 820px; aspect-ratio: 16 / 9; min-height: 410px; border-radius: 12px; box-shadow: 0 12px 32px rgba(15, 23, 42, 0.10), 0 2px 6px rgba(15, 23, 42, 0.05); position: relative; overflow: hidden; display: flex; flex-direction: column; justify-content: space-between; padding: 38px 54px; border: 1px solid #e2e8f0; }
.corner-tr { position: absolute; top: 0; right: 0; width: 210px; height: 150px; pointer-events: none; }
.corner-bl { position: absolute; bottom: 0; left: 0; width: 230px; height: 140px; pointer-events: none; }
.slide-top-header { display: flex; align-items: center; justify-content: center; gap: 16px; border-bottom: 1.5px solid #cbd5e1; padding-bottom: 16px; position: relative; z-index: 2; }
.uni-title { font-family: 'Georgia', 'Times New Roman', serif; font-size: 15px; font-weight: 700; color: #1e293b; letter-spacing: 0.04em; text-transform: uppercase; }
.cover-center { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; position: relative; z-index: 2; padding: 16px 10px; }
.cover-h1 { font-family: 'Georgia', 'Times New Roman', serif; font-size: 31px; font-weight: 700; color: #0f172a; line-height: 1.25; letter-spacing: 0.02em; max-width: 660px; }
.cover-sub { font-family: 'Georgia', 'Times New Roman', serif; font-size: 18px; font-weight: 700; color: #1e293b; margin-top: 22px; }
.content-body { flex: 1; display: flex; flex-direction: column; justify-content: center; position: relative; z-index: 2; padding: 14px 4px; }
.sec-tag { font-size: 11px; font-weight: 800; color: #b45309; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 6px; }
.slide-h2 { font-family: 'Georgia', 'Times New Roman', serif; font-size: 25px; font-weight: 700; color: #0f172a; line-height: 1.25; }
.slide-sub { font-size: 14.5px; color: #475569; margin-top: 6px; font-weight: 500; }
ul.slide-list { margin-top: 18px; list-style: none; }
ul.slide-list li { font-size: 15px; color: #1e293b; padding: 7px 0; display: flex; gap: 12px; line-height: 1.5; }
ul.slide-list li span.num { color: #1e3a8a; font-weight: 800; font-family: monospace; }
pre.slide-code { margin-top: 14px; background: #0f172a; color: #f8fafc; padding: 16px; border-radius: 8px; font-family: monospace; font-size: 12.5px; line-height: 1.5; overflow-x: auto; }
.slide-foot { position: relative; z-index: 2; display: flex; justify-content: space-between; font-size: 11.5px; color: #64748b; padding-top: 10px; border-top: 1px solid #f1f5f9; }
`;

/** CSS del visor de ejemplo del informe. */
const DEMO_DOC_CSS = `
* { box-sizing: border-box; }
body { margin: 0; background: #f1f5f9; font-family: 'Georgia', 'Times New Roman', serif; color: #0f172a; display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
.pdf-toolbar { background: #f1f5f9; border-bottom: 1px solid #e2e8f0; padding: 8px 20px; display: flex; align-items: center; justify-content: space-between; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 13px; color: #334155; shrink: 0; }
.tb-left, .tb-right { display: flex; align-items: center; gap: 10px; }
.tb-btn { background: transparent; border: none; color: #475569; cursor: pointer; padding: 4px 8px; border-radius: 6px; font-size: 13.5px; font-weight: 600; }
.tb-btn:hover { background: #e2e8f0; color: #0f172a; }
.page-badge { background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 3px 10px; font-weight: 700; font-size: 12.5px; color: #0f172a; }
.zoom-badge { background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 3px 10px; font-weight: 600; font-size: 12.5px; color: #0f172a; }
.doc-scroll { flex: 1; overflow-y: auto; padding: 24px 20px 48px; }
.paper { max-width: 720px; margin: 0 auto 28px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 4px; padding: 54px 64px; box-shadow: 0 6px 20px rgba(15, 23, 42, 0.06); transform-origin: top center; transition: transform 0.15s ease; }
.uni-header { display: flex; align-items: center; justify-content: center; gap: 22px; padding-bottom: 24px; border-bottom: 1.5px solid #64748b; }
.uni-text { text-align: center; }
.uni-text h1 { font-size: 15.5px; font-weight: 700; letter-spacing: 0.03em; text-transform: uppercase; margin: 0; color: #0f172a; }
.uni-text p { font-size: 13.5px; color: #334155; margin: 5px 0 0; }
.cover-title-box { text-align: center; padding: 46px 12px 32px; border-bottom: 1.5px solid #3b82f6; margin-bottom: 30px; }
.cover-title-box h2 { font-size: 29px; font-weight: 700; color: #0f172a; margin: 0; }
.cover-title-box h3 { font-size: 19px; font-weight: 700; color: #0f172a; margin: 14px 0 0; }
.meta-table { width: 100%; border-collapse: collapse; margin: 20px 0 28px; font-size: 13.5px; }
.meta-table td { padding: 7px 0; color: #1e293b; }
`;

/** CSS del visor de ejemplo de Colab. */
const DEMO_COLAB_CSS = `
* { box-sizing: border-box; }
body { margin: 0; background: #ffffff; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #0f172a; display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
.colab-menubar { background: #ffffff; border-bottom: 1px solid #e2e8f0; padding: 8px 18px; display: flex; align-items: center; justify-content: space-between; font-size: 12.5px; color: #334155; shrink: 0; }
.menu-links { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
.menu-links span { cursor: pointer; padding: 2px 4px; border-radius: 4px; }
.menu-links span:hover { background: #f1f5f9; color: #0f172a; }
.connect-bar { display: flex; align-items: center; gap: 12px; color: #475569; font-weight: 500; }
.connect-btn { background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 4px 10px; font-size: 12px; font-weight: 600; color: #0f172a; cursor: pointer; }
.connect-btn:hover { background: #f8fafc; }
.workspace { flex: 1; display: flex; overflow: hidden; }
.left-rail { width: 46px; border-right: 1px solid #e2e8f0; background: #ffffff; display: flex; flex-direction: column; align-items: center; padding: 16px 0; gap: 20px; color: #475569; font-size: 15px; shrink: 0; }
.rail-icon { cursor: pointer; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border-radius: 6px; }
.rail-icon:hover { background: #f1f5f9; color: #0f172a; }
.notebook-canvas { flex: 1; padding: 22px 28px 40px; overflow-y: auto; background: #ffffff; }
.cell-box { max-width: 860px; margin: 0 auto 16px; border: 1px solid #e2e8f0; border-radius: 8px; background: #ffffff; display: flex; align-items: center; gap: 14px; padding: 14px 18px; box-shadow: 0 1px 2px rgba(15,23,42,0.03); }
.play-circle { width: 26px; height: 26px; border-radius: 9999px; background: #475569; color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 10px; cursor: pointer; shrink: 0; border: none; }
.play-circle:hover { background: #0f172a; }
.section-title { font-size: 19px; font-weight: 700; color: #0f172a; display: flex; align-items: center; gap: 8px; }
.code-cell-row { max-width: 860px; margin: 0 auto 16px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc; padding: 16px 18px; display: flex; align-items: flex-start; gap: 14px; }
.cell-num { font-family: 'JetBrains Mono', monospace; font-size: 13px; color: #475569; font-weight: 600; padding-top: 2px; min-width: 28px; }
pre { margin: 0; font-family: 'JetBrains Mono', monospace; font-size: 13.5px; line-height: 1.65; color: #0f172a; overflow-x: auto; flex: 1; }
`;

// ---------------------------------------------------------------------------
// Armado de la página del visor
// ---------------------------------------------------------------------------
/** Convierte datos a JSON seguro para ir dentro de un <script> (evita cerrar la etiqueta por accidente). */
function jsonForScript(data) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/** Carpetas (con dirección absoluta) de los scripts que corren dentro del visor y de las librerías locales. */
const VIEWERS_URL = new URL("js/viewers/", location.href).href;
const VENDOR_URL = new URL("js/vendor/", location.href).href;

/**
 * Arma la página HTML completa de un visor.
 * @param {object} options
 * @param {string} options.css       estilos de la página
 * @param {string} options.bodyHtml  contenido (barra de herramientas, área principal)
 * @param {object} options.config    datos que recibe el script del visor en window.__VIEW__ (se agrega "vendor")
 * @param {string} options.script    nombre del script del visor dentro de js/viewers/ (ej. "pdf-viewer.js")
 */
function buildViewerPage({ css, bodyHtml, config, script }) {
  const data = Object.assign({ vendor: VENDOR_URL }, config);
  return "<!DOCTYPE html><html lang='es'><head><meta charset='UTF-8'><meta name='viewport' content='width=device-width,initial-scale=1'>"
    + "<style>" + css + "</style></head><body>" + bodyHtml
    + "<script>window.__VIEW__=" + jsonForScript(data) + ";<\/script>"
    + "<script src='" + VIEWERS_URL + "viewer-common.js'><\/script>"
    + "<script src='" + VIEWERS_URL + script + "'><\/script></body></html>";
}
