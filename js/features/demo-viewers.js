/* =============================================================================
   VISORES DE EJEMPLO  (features/demo-viewers.js)
   Páginas HTML de ejemplo (PPT, informe y cuaderno Colab simulados) para las semanas que todavía no tienen
   archivos subidos. Cuando subes el archivo real, se usa el visor real (real-viewers.js).

   Cada función devuelve el HTML completo del visor; su comportamiento (botones, zoom...) está en
   js/viewers/demo-*-viewer.js. El CSS está en viewer-styles.js.

   Depende de: viewer-styles.js, utils.js, state.js, data/units-and-topics.js (parseTopic), data/shield.js,
               demo-slides.js. Expone: buildDemoPptHtml, buildDemoDocHtml, buildDemoColabHtml.
   ============================================================================= */
"use strict";

/** Visor de ejemplo de PowerPoint: diapositivas generadas con los datos de la semana. */
function buildDemoPptHtml(week) {
  const bodyHtml = `
  <div class="toolbar">
    <div class="toolbar-group">
      <button type="button" class="icon-btn" id="prevBtn" title="Diapositiva anterior">&#10094;</button>
      <span class="counter-pill" id="counterTop">1 / 12</span>
      <button type="button" class="icon-btn" id="nextBtn" title="Siguiente diapositiva">&#10095;</button>
      <span style="color:#cbd5e1;">|</span>
      <button type="button" class="icon-btn" id="playBtn" title="Reproducir presentación">&#9655;</button>
      <button type="button" class="icon-btn" id="restartBtn" title="Ir a portada">&#9635;</button>
    </div>
    <div class="toolbar-group">
      <button type="button" class="icon-btn" id="dlSlideBtn" title="Descargar presentación">&#11015;</button>
      <button type="button" class="icon-btn" id="fsBtn" title="Pantalla completa">&#x26F6;</button>
    </div>
  </div>
  <div class="stage">
    <div class="slide-canvas" id="slideBox"></div>
  </div>`;
  return buildViewerPage({
    css: DEMO_PPT_CSS,
    bodyHtml: bodyHtml,
    config: { slides: buildSlidesForWeek(week), shieldSvg: UNMSM_SHIELD_SVG },
    script: "demo-ppt-viewer.js"
  });
}

/** Un tema del informe de ejemplo: título y párrafo. */
function buildDemoDocTopicHtml(rawTopic, week, index) {
  const topic = parseTopic(rawTopic, week.week, index);
  return `
        <div style="margin-top:22px;">
          <h3 style="font-size:15.5px;font-weight:700;color:#0f172a;font-family:'Georgia',serif;">${escapeHtml(topic.code)} ${escapeHtml(topic.title)}</h3>
          <p style="font-size:14px;color:#334155;line-height:1.75;margin-top:6px;text-align:justify;">
            ${escapeHtml(topic.desc)} Este apartado analiza las propiedades formales, representación computacional e implicancias prácticas estudiadas en la Semana ${week.week} de la asignatura de Inteligencia Artificial en la Facultad de Ingeniería de Sistemas e Informática (UNMSM).
          </p>
        </div>`;
}

/** Visor de ejemplo del informe: hoja con portada, datos del curso, resumen y desarrollo de los temas. */
function buildDemoDocHtml(week) {
  const topicsHtml = week.topics.map((topic, index) => buildDemoDocTopicHtml(topic, week, index)).join("");
  const bodyHtml = `
  <div class="pdf-toolbar">
    <div class="tb-left">
      <button type="button" class="tb-btn" title="Esquema del documento">&#9776;</button>
      <span class="page-badge" id="pageIndicator">1 / 8</span>
      <button type="button" class="tb-btn" id="zoomOutBtn" title="Alejar">&minus;</button>
      <button type="button" class="tb-btn" id="zoomInBtn" title="Acercar">+</button>
      <span class="zoom-badge" id="zoomLabel">100% &#9662;</span>
    </div>
    <div class="tb-right">
      <button type="button" class="tb-btn" id="printBtn" title="Imprimir">&#128424;</button>
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
        <h3>${escapeHtml(week.title)}</h3>
      </div>

      <table class="meta-table">
        <tr><td style="width:160px;font-weight:700;">Asignatura:</td><td>Inteligencia Artificial (Código 201230703 · Semestre 2026-II)</td></tr>
        <tr><td style="font-weight:700;">Unidad / Sesión:</td><td>${escapeHtml(week.unitName)} — Semana ${padWeek(week.week)}</td></tr>
        <tr><td style="font-weight:700;">Docente de Cátedra:</td><td>${escapeHtml(appState.profName)}</td></tr>
        <tr><td style="font-weight:700;">Autores:</td><td>${escapeHtml(appState.studentName)}</td></tr>
      </table>

      <h3 style="font-size:16px;font-weight:700;color:#0f172a;margin-top:24px;">1. Resumen Ejecutivo</h3>
      <p style="font-size:14px;line-height:1.75;text-align:justify;color:#334155;margin-top:8px;">
        ${escapeHtml(week.summary)}
      </p>

      <h3 style="font-size:16px;font-weight:700;color:#0f172a;margin-top:26px;">2. Desarrollo de los Temas de la Sesión</h3>
      ${topicsHtml}
    </div>
  </div>`;
  return buildViewerPage({ css: DEMO_DOC_CSS, bodyHtml: bodyHtml, config: {}, script: "demo-doc-viewer.js" });
}

/** Resalta con colores las palabras reservadas y los comentarios del código de ejemplo. */
function highlightDemoCode(code) {
  return escapeHtml(code)
    .replace(/\b(import|from|as|def|class|return|if|else|for|in|while|all)\b/g, '<span style="color:#9333ea;font-weight:600;">$1</span>')
    .replace(/(#.*$)/gm, '<span style="color:#64748b;font-style:italic;">$1</span>');
}

/** Visor de ejemplo de Colab: título, celda de código y resultado de la semana. */
function buildDemoColabHtml(week) {
  const bodyHtml = `
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
          <span>${escapeHtml(week.title)}</span>
        </div>
      </div>

      <div class="code-cell-row">
        <span class="cell-num">[1]</span>
        <pre><code>${highlightDemoCode(week.codeSnippet)}</code></pre>
      </div>

      <div class="cell-box" style="background:#f8fafc;">
        <button type="button" class="play-circle" id="runCell2Btn" title="Ejecutar código y mostrar salida">&#9654;</button>
        <span id="execStatusText" style="font-family:'JetBrains Mono',monospace;font-size:13px;color:#334155;">${escapeHtml(week.codeOutput)}</span>
      </div>
    </div>
  </div>`;
  return buildViewerPage({ css: DEMO_COLAB_CSS, bodyHtml: bodyHtml, config: {}, script: "demo-colab-viewer.js" });
}
