/* =============================================================================
   VISORES DE EJEMPLO (semanas sin archivo real)
   Ventana de previsualización con PPT / Informe / Colab simulados para las semanas
   que todavía no tienen archivos subidos. Cuando subes el archivo real, se usa el visor real.
   ============================================================================= */

// =========================================================================
// VISORES DE PREVISUALIZACIÓN POR SEMANA (PPT, PDF/Informe y Colab)
// =========================================================================
function openFloatingPreviewModal(weekNum, fileType) {
  const w = appState.weeks.find(item => item.week === weekNum) || appState.weeks[0];
  if (!w) return;

  const modal = document.getElementById("floatingPreviewModal");
  const iframe = document.getElementById("dynamicPreviewIframe");
  const badgeEl = document.getElementById("floatingModalViewerBadge");
  const titleEl = document.getElementById("floatingModalFileTitle");
  const iconBox = document.getElementById("floatingModalIconBox");

  cleanupDynamicIframe();

  if (fileType === "ppt") {
    badgeEl.textContent = "VISOR MICROSOFT POWERPOINT (.PPTX)";
    titleEl.textContent = w.pptLabel;
    iconBox.className = "w-8 h-8 rounded-lg bg-[#e04f33] text-white flex items-center justify-center font-extrabold text-xs shrink-0 shadow-2xs";
    iconBox.textContent = "P";
    currentModalDownloadHandler = () => downloadPptByWeek(w.week);

    if (w.pptView) {
      replaceIframeHtml(iframe, buildPdfViewerHtml(w.pptView, w.pptLabel));
    } else if (w.pptUrl && /^https?:\/\//i.test(w.pptUrl)) {
      if (w.pptUrl.toLowerCase().endsWith(".pdf")) {
        replaceIframeHtml(iframe, buildPdfViewerHtml(w.pptUrl, w.pptLabel));
      } else {
        iframe.src = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(w.pptUrl)}`;
      }
    } else if (w.pptUrl && w.pptUrl.startsWith("data:application/pdf")) {
      replaceIframeHtml(iframe, buildPdfViewerHtml(w.pptUrl, w.pptLabel));
    } else {
      const slidesJson = JSON.stringify(buildSlidesForWeek(w));
      const shieldSvgJson = JSON.stringify(UNMSM_SHIELD_SVG);
      const pptIframeHtml = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <style>
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
  </style>
</head>
<body>
  <div class="toolbar">
<div class="toolbar-group">
  <button type="button" class="icon-btn" id="prevBtn" title="Diapositiva anterior">&#10094;</button>
  <span class="counter-pill" id="counterTop">1 / 12</span>
  <button type="button" class="icon-btn" id="nextBtn" title="Siguiente diapositiva">&#10095;</button>
  <span style="color:#cbd5e1;">|</span>
  <button type="button" class="icon-btn" id="playBtn" title="Reproducir presentación">&#9655;</button>
  <button type="button" class="icon-btn" id="restartBtn" onclick="idx=0;render();" title="Ir a portada">&#9635;</button>
</div>
<div class="toolbar-group">
  <button type="button" class="icon-btn" id="dlSlideBtn" title="Descargar presentación">&#11015;</button>
  <button type="button" class="icon-btn" id="fsBtn" title="Pantalla completa">&#x26F6;</button>
</div>
  </div>

  <div class="stage">
<div class="slide-canvas" id="slideBox"></div>
  </div>

  <script>
const slides = ${slidesJson};
const shieldSvg = ${shieldSvgJson};
let idx = 0;
let timer = null;

const cornerTR = \`<svg class="corner-tr" viewBox="0 0 210 150" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M70 0 L210 0 L210 135 C165 110 135 55 70 0 Z" fill="#f3e8d2"/>
  <path d="M105 0 L210 0 L210 105 C172 80 148 38 105 0 Z" fill="#0f2547"/>
  <path d="M92 0 C138 42 168 82 210 112" stroke="#d4af37" stroke-width="2.5"/>
</svg>\`;

const cornerBL = \`<svg class="corner-bl" viewBox="0 0 230 140" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M0 20 C55 55 115 95 195 140 L0 140 Z" fill="#f3e8d2"/>
  <path d="M0 52 C48 80 98 110 155 140 L0 140 Z" fill="#0f2547"/>
  <path d="M0 40 C55 72 110 106 172 140" stroke="#d4af37" stroke-width="2.5"/>
</svg>\`;

function render() {
  const s = slides[idx];
  document.getElementById("counterTop").textContent = (idx + 1) + " / " + slides.length;
  const topHeader = \`<div class="slide-top-header">\${shieldSvg}<div class="uni-title">UNIVERSIDAD NACIONAL MAYOR DE SAN MARCOS</div></div>\`;

  if (s.isCover) {
    document.getElementById("slideBox").innerHTML = cornerTR + cornerBL + topHeader +
      \`<div class="cover-center">
        <h1 class="cover-h1">\${s.title}</h1>
        <p class="cover-sub">\${s.subtitle}</p>
      </div>
      <div style="height:12px;"></div>\`;
  } else {
    const bodyHtml = s.code
      ? \`<pre class="slide-code"><code>\${s.code.replace(/&/g,"&amp;").replace(/</g,"&lt;")}</code></pre>\`
      : \`<ul class="slide-list">\${(s.bullets || []).map((b, i) => \`<li><span class="num">0\${i + 1}.</span><span>\${b}</span></li>\`).join("")}</ul>\`;
    document.getElementById("slideBox").innerHTML = cornerTR + cornerBL + topHeader +
      \`<div class="content-body">
        <div class="sec-tag">\${s.section || "SESIÓN TEÓRICA"}</div>
        <h2 class="slide-h2">\${s.title}</h2>
        <p class="slide-sub">\${s.subtitle}</p>
        \${bodyHtml}
      </div>
      <div class="slide-foot">
        <span>FISI UNMSM · Inteligencia Artificial (2026-II)</span>
        <span>Diapositiva \${idx + 1} de \${slides.length}</span>
      </div>\`;
  }
}

document.getElementById("prevBtn").onclick = () => { idx = (idx - 1 + slides.length) % slides.length; render(); };
document.getElementById("nextBtn").onclick = () => { idx = (idx + 1) % slides.length; render(); };
document.getElementById("playBtn").onclick = () => {
  if (timer) { clearInterval(timer); timer = null; document.getElementById("playBtn").innerHTML = "&#9655;"; }
  else { timer = setInterval(() => { idx = (idx + 1) % slides.length; render(); }, 2800); document.getElementById("playBtn").innerHTML = "&#10074;&#10074;"; }
};
document.getElementById("dlSlideBtn").onclick = () => { window.parent.postMessage({ action: "downloadModalFile" }, "*"); };
document.getElementById("fsBtn").onclick = () => {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
  else document.exitFullscreen().catch(() => {});
};
render();
  <\/script>
</body>
</html>`;
      setIframeBlobHtml(iframe, pptIframeHtml);
    }
  } else if (fileType === "pdf") {
    badgeEl.textContent = "VISOR NATIVO DE DOCUMENTOS (PDF / INFORME)";
    titleEl.textContent = w.docLabel.replace(/\.docx?$/i, ".pdf");
    iconBox.className = "w-8 h-8 rounded-lg bg-[#e04f33] text-white flex items-center justify-center font-extrabold text-xs shrink-0 shadow-2xs";
    iconBox.textContent = "P";
    currentModalDownloadHandler = () => downloadWordByWeek(w.week);

    if (w.docView) {
      replaceIframeHtml(iframe, buildPdfViewerHtml(w.docView, w.docLabel));
    } else if (w.docUrl && (w.docUrl.startsWith("data:application/pdf") || w.docUrl.toLowerCase().endsWith(".pdf"))) {
      replaceIframeHtml(iframe, buildPdfViewerHtml(w.docUrl, w.docLabel));
    } else if (w.docUrl && /^https?:\/\//i.test(w.docUrl)) {
      iframe.src = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(w.docUrl)}`;
    } else {
      const subtemasHtml = w.topics.map((t, idx) => {
        const parsed = parseTopic(t, w.week, idx);
        return `
        <div style="margin-top:22px;">
          <h3 style="font-size:15.5px;font-weight:700;color:#0f172a;font-family:'Georgia',serif;">${escapeHtml(parsed.code)} ${escapeHtml(parsed.title)}</h3>
          <p style="font-size:14px;color:#334155;line-height:1.75;margin-top:6px;text-align:justify;">
            ${escapeHtml(parsed.desc)} Este apartado analiza las propiedades formales, representación computacional e implicancias prácticas estudiadas en la Semana ${w.week} de la asignatura de Inteligencia Artificial en la Facultad de Ingeniería de Sistemas e Informática (UNMSM).
          </p>
        </div>`;
      }).join("");

      const pdfIframeHtml = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <style>
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
  </style>
</head>
<body>
  <div class="pdf-toolbar">
<div class="tb-left">
  <button type="button" class="tb-btn" title="Esquema del documento">&#9776;</button>
  <span class="page-badge" id="pageIndicator">1 / 8</span>
  <button type="button" class="tb-btn" id="zoomOutBtn" title="Alejar">&minus;</button>
  <button type="button" class="tb-btn" id="zoomInBtn" title="Acercar">+</button>
  <span class="zoom-badge" id="zoomLabel">100% &#9662;</span>
</div>
<div class="tb-right">
  <button type="button" class="tb-btn" onclick="window.print()" title="Imprimir">&#128424;</button>
  <button type="button" class="tb-btn" id="dlPdfBtn" title="Descargar informe">&#11015;</button>
</div>
  </div>

  <div class="doc-scroll" id="scrollArea">
<div class="paper" id="paperDoc">
  <div class="uni-header">
    ${UNMSM_SHIELD_SVG}
    <div class="uni-text">
      <h1>UNIVERSIDAD NACIONAL MAYOR DE SAN MARCOS</h1>
      <p>Facultad de Ingeniería de Sistemas e Informática</p>
    </div>
  </div>

  <div class="cover-title-box">
    <h2>Informe Académico</h2>
    <h3>${escapeHtml(w.title)}</h3>
  </div>

  <table class="meta-table">
    <tr><td style="width:160px;font-weight:700;">Asignatura:</td><td>Inteligencia Artificial (Código 201230703 · Semestre 2026-II)</td></tr>
    <tr><td style="font-weight:700;">Unidad / Sesión:</td><td>${escapeHtml(w.unitName)} — Semana ${String(w.week).padStart(2, "0")}</td></tr>
    <tr><td style="font-weight:700;">Docente de Cátedra:</td><td>${escapeHtml(appState.profName)}</td></tr>
    <tr><td style="font-weight:700;">Autores:</td><td>${escapeHtml(appState.studentName)}</td></tr>
  </table>

  <h3 style="font-size:16px;font-weight:700;color:#0f172a;margin-top:24px;">1. Resumen Ejecutivo</h3>
  <p style="font-size:14px;line-height:1.75;text-align:justify;color:#334155;margin-top:8px;">
    ${escapeHtml(w.summary)}
  </p>

  <h3 style="font-size:16px;font-weight:700;color:#0f172a;margin-top:26px;">2. Desarrollo de los Temas de la Sesión</h3>
  ${subtemasHtml}
</div>
  </div>

  <script>
let zoom = 100;
const paper = document.getElementById("paperDoc");
const zoomLabel = document.getElementById("zoomLabel");
document.getElementById("zoomInBtn").onclick = () => {
  zoom = Math.min(130, zoom + 10);
  paper.style.transform = "scale(" + (zoom / 100) + ")";
  zoomLabel.innerHTML = zoom + "% &#9662;";
};
document.getElementById("zoomOutBtn").onclick = () => {
  zoom = Math.max(80, zoom - 10);
  paper.style.transform = "scale(" + (zoom / 100) + ")";
  zoomLabel.innerHTML = zoom + "% &#9662;";
};
document.getElementById("dlPdfBtn").onclick = () => {
  window.parent.postMessage({ action: "downloadModalFile" }, "*");
};
  <\/script>
</body>
</html>`;
      setIframeBlobHtml(iframe, pdfIframeHtml);
    }
  } else if (fileType === "colab") {
    badgeEl.textContent = "VISOR GOOGLE COLAB (.IPYNB)";
    titleEl.textContent = w.colabLabel;
    iconBox.className = "w-8 h-8 rounded-lg bg-[#f59e0b] text-white flex items-center justify-center font-mono font-extrabold text-[11px] shrink-0 shadow-2xs";
    iconBox.innerHTML = "&lt;/&gt;";
    currentModalDownloadHandler = () => downloadColabByWeek(w.week);

    if (w.colabUrl && ((/^https?:\/\//i.test(w.colabUrl) && /\.ipynb(\?|#|$)/i.test(w.colabUrl)) || w.colabUrl.startsWith("data:"))) {
      openRealNotebook(w);
      return;
    }

    const formattedCode = escapeHtml(w.codeSnippet)
      .replace(/\b(import|from|as|def|class|return|if|else|for|in|while|all)\b/g, '<span style="color:#9333ea;font-weight:600;">$1</span>')
      .replace(/(#.*$)/gm, '<span style="color:#64748b;font-style:italic;">$1</span>');

    const colabIframeHtml = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <style>
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
  </style>
</head>
<body>
  <div class="colab-menubar">
<div class="menu-links">
  <span>Archivo</span>
  <span>Editar</span>
  <span>Ver</span>
  <span>Insertar</span>
  <span>Entorno de ejecución</span>
  <span>Herramientas</span>
  <span>Ayuda</span>
</div>
<div class="connect-bar">
  <button type="button" class="connect-btn" id="connBtn">Conectar &#9662;</button>
  <button type="button" class="connect-btn" id="dlColabTopBtn" title="Descargar .ipynb">&#11015;</button>
</div>
  </div>

  <div class="workspace">
<div class="left-rail">
  <div class="rail-icon" title="Índice">&#9776;</div>
  <div class="rail-icon" title="Buscar">&#128269;</div>
  <div class="rail-icon" title="Archivos">&#128193;</div>
  <div class="rail-icon" style="font-family:monospace;font-weight:700;font-size:13px;" title="Variables">{x}</div>
  <div class="rail-icon" title="Secretos">&#128273;</div>
</div>

<div class="notebook-canvas">
  <div class="cell-box">
    <button type="button" class="play-circle" id="runCell1Btn" title="Ejecutar sección">&#9654;</button>
    <div class="section-title">
      <span style="font-size:13px;color:#475569;">&#9656;</span>
      <span>${escapeHtml(w.title)}</span>
    </div>
  </div>

  <div class="code-cell-row">
    <span class="cell-num">[1]</span>
    <pre><code>${formattedCode}</code></pre>
  </div>

  <div class="cell-box" style="background:#f8fafc;">
    <button type="button" class="play-circle" id="runCell2Btn" title="Ejecutar código y mostrar salida">&#9654;</button>
    <span id="execStatusText" style="font-family:'JetBrains Mono',monospace;font-size:13px;color:#334155;">${escapeHtml(w.codeOutput)}</span>
  </div>
</div>
  </div>

  <script>
document.getElementById("connBtn").onclick = function() {
  this.innerHTML = "Conectado (Python 3) &#10003;";
  this.style.borderColor = "#16a34a";
  this.style.color = "#15803d";
};
document.getElementById("dlColabTopBtn").onclick = () => {
  window.parent.postMessage({ action: "downloadModalFile" }, "*");
};
document.getElementById("runCell2Btn").onclick = () => {
  const st = document.getElementById("execStatusText");
  st.style.fontWeight = "700";
  st.style.color = "#0f172a";
};
  <\/script>
</body>
</html>`;
    setIframeBlobHtml(iframe, colabIframeHtml);
  }

  modal.classList.remove("hidden");
}
