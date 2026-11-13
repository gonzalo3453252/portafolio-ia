/* =============================================================================
   VISOR DE EJEMPLO: PRESENTACIÓN  (viewers/demo-ppt-viewer.js)
   Corre dentro de la ventana de previsualización. Muestra las diapositivas de ejemplo (portada, temas, código)
   con botones anterior / siguiente / reproducir / pantalla completa.

   Recibe en window.__VIEW__: { slides, shieldSvg }.
   ============================================================================= */
(function () {
  "use strict";

  const { slides, shieldSvg } = window.__VIEW__;
  const AUTOPLAY_INTERVAL_MS = 2800;
  const ICON_PLAY = "&#9655;";
  const ICON_PAUSE = "&#10074;&#10074;";

  const slideBox = document.getElementById("slideBox");
  const counter = document.getElementById("counterTop");
  const playButton = document.getElementById("playBtn");

  let index = 0;
  let autoplayTimer = null;

  // Adornos de las esquinas (dibujos vectoriales)
  const CORNER_TOP_RIGHT = `<svg class="corner-tr" viewBox="0 0 210 150" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M70 0 L210 0 L210 135 C165 110 135 55 70 0 Z" fill="#f3e8d2"/>
  <path d="M105 0 L210 0 L210 105 C172 80 148 38 105 0 Z" fill="#0f2547"/>
  <path d="M92 0 C138 42 168 82 210 112" stroke="#d4af37" stroke-width="2.5"/>
</svg>`;

  const CORNER_BOTTOM_LEFT = `<svg class="corner-bl" viewBox="0 0 230 140" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M0 20 C55 55 115 95 195 140 L0 140 Z" fill="#f3e8d2"/>
  <path d="M0 52 C48 80 98 110 155 140 L0 140 Z" fill="#0f2547"/>
  <path d="M0 40 C55 72 110 106 172 140" stroke="#d4af37" stroke-width="2.5"/>
</svg>`;

  const escapeCode = (code) => code.replace(/&/g, "&amp;").replace(/</g, "&lt;");

  function topHeaderHtml() {
    return `<div class="slide-top-header">${shieldSvg}<div class="uni-title">UNIVERSIDAD NACIONAL MAYOR DE SAN MARCOS</div></div>`;
  }

  function coverHtml(slide) {
    return `<div class="cover-center">
        <h1 class="cover-h1">${slide.title}</h1>
        <p class="cover-sub">${slide.subtitle}</p>
      </div>
      <div style="height:12px;"></div>`;
  }

  function contentHtml(slide) {
    const body = slide.code
      ? `<pre class="slide-code"><code>${escapeCode(slide.code)}</code></pre>`
      : `<ul class="slide-list">${(slide.bullets || []).map((bullet, i) => `<li><span class="num">0${i + 1}.</span><span>${bullet}</span></li>`).join("")}</ul>`;
    return `<div class="content-body">
        <div class="sec-tag">${slide.section || "SESIÓN TEÓRICA"}</div>
        <h2 class="slide-h2">${slide.title}</h2>
        <p class="slide-sub">${slide.subtitle}</p>
        ${body}
      </div>
      <div class="slide-foot">
        <span>FISI UNMSM · Inteligencia Artificial (2026-II)</span>
        <span>Diapositiva ${index + 1} de ${slides.length}</span>
      </div>`;
  }

  function render() {
    const slide = slides[index];
    counter.textContent = (index + 1) + " / " + slides.length;
    slideBox.innerHTML = CORNER_TOP_RIGHT + CORNER_BOTTOM_LEFT + topHeaderHtml() + (slide.isCover ? coverHtml(slide) : contentHtml(slide));
  }

  function goTo(newIndex) {
    index = (newIndex + slides.length) % slides.length;
    render();
  }

  function toggleAutoplay() {
    if (autoplayTimer) {
      clearInterval(autoplayTimer);
      autoplayTimer = null;
      playButton.innerHTML = ICON_PLAY;
    } else {
      autoplayTimer = setInterval(() => goTo(index + 1), AUTOPLAY_INTERVAL_MS);
      playButton.innerHTML = ICON_PAUSE;
    }
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => { /* el navegador no lo permite */ });
    else document.exitFullscreen().catch(() => { /* ya no estaba en pantalla completa */ });
  }

  document.getElementById("prevBtn").onclick = () => goTo(index - 1);
  document.getElementById("nextBtn").onclick = () => goTo(index + 1);
  document.getElementById("restartBtn").onclick = () => goTo(0);
  playButton.onclick = toggleAutoplay;
  document.getElementById("dlSlideBtn").onclick = requestParentDownload;
  document.getElementById("fsBtn").onclick = toggleFullscreen;
  render();
})();
