/* =============================================================================
   VISOR DE EJEMPLO: INFORME  (viewers/demo-doc-viewer.js)
   Corre dentro de la ventana de previsualización. Hoja de informe de ejemplo con zoom, imprimir y descargar.
   ============================================================================= */
(function () {
  "use strict";

  const ZOOM_STEP = 10;
  const ZOOM_MIN = 80;
  const ZOOM_MAX = 130;

  const paper = document.getElementById("paperDoc");
  const zoomLabel = document.getElementById("zoomLabel");
  let zoom = 100;

  function setZoom(value) {
    zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, value));
    paper.style.transform = "scale(" + (zoom / 100) + ")";
    zoomLabel.innerHTML = zoom + "% &#9662;";
  }

  document.getElementById("zoomInBtn").onclick = () => setZoom(zoom + ZOOM_STEP);
  document.getElementById("zoomOutBtn").onclick = () => setZoom(zoom - ZOOM_STEP);
  document.getElementById("printBtn").onclick = () => window.print();
  document.getElementById("dlPdfBtn").onclick = requestParentDownload;
})();
