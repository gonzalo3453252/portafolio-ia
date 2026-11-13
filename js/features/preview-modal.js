/* =============================================================================
   VENTANA DE PREVISUALIZACIÓN  (features/preview-modal.js)
   La ventana flotante (#floatingPreviewModal) con un <iframe> donde se ve la presentación, el informe, el
   cuaderno o el sílabo. Aquí se decide QUÉ visor usar según lo que tenga la semana:

     Presentación:  vista PDF  >  PDF  >  enlace http (visor de Office en línea)  >  PDF guardado  >  ejemplo
     Informe:       vista PDF  >  PDF  >  enlace http (visor de Office en línea)  >  ejemplo
     Cuaderno:      archivo .ipynb real (real-viewers.js)  >  ejemplo

   Depende de: state.js, real-viewers.js, demo-viewers.js, downloads.js, syllabus.js.
   Expone: openFloatingPreviewModal, openSyllabusModal, closeFloatingPreviewModal, replaceIframeHtml,
           previewToken.
   ============================================================================= */
"use strict";

/** Número de la última previsualización abierta: sirve para ignorar cargas viejas si abres otra cosa rápido. */
let previewToken = 0;

const OFFICE_EMBED_URL = "https://view.officeapps.live.com/op/embed.aspx?src=";

// ---------------------------------------------------------------------------
// Iframe
// ---------------------------------------------------------------------------
/** Muestra una página HTML (texto) dentro del iframe, mediante una dirección blob: temporal. */
function setIframeBlobHtml(iframe, html) {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  currentIframeBlobUrl = URL.createObjectURL(blob);
  iframe.src = currentIframeBlobUrl;
}

/** Igual que setIframeBlobHtml, liberando antes la dirección blob: anterior. */
function replaceIframeHtml(iframe, html) {
  if (currentIframeBlobUrl) {
    URL.revokeObjectURL(currentIframeBlobUrl);
    currentIframeBlobUrl = null;
  }
  setIframeBlobHtml(iframe, html);
}

/** Vacía el iframe, cancela cargas pendientes y libera la memoria del visor anterior. */
function cleanupDynamicIframe() {
  previewToken++;
  const iframe = document.getElementById("dynamicPreviewIframe");
  if (iframe) {
    iframe.src = "about:blank";
    iframe.removeAttribute("srcdoc");
  }
  if (currentIframeBlobUrl) {
    URL.revokeObjectURL(currentIframeBlobUrl);
    currentIframeBlobUrl = null;
  }
}

function closeFloatingPreviewModal() {
  const modal = document.getElementById("floatingPreviewModal");
  if (modal) modal.classList.add("hidden");
  cleanupDynamicIframe();
}

// ---------------------------------------------------------------------------
// Cabecera de la ventana (tipo de visor, nombre del archivo, icono y botón Descargar)
// ---------------------------------------------------------------------------
const ICON_BOX_PDF = "w-8 h-8 rounded-lg bg-[#e04f33] text-white flex items-center justify-center font-extrabold text-xs shrink-0 shadow-2xs";
const ICON_BOX_COLAB = "w-8 h-8 rounded-lg bg-[#f59e0b] text-white flex items-center justify-center font-mono font-extrabold text-[11px] shrink-0 shadow-2xs";

/**
 * @param {object} header
 * @param {string} header.badge      texto de la etiqueta (ej. "VISOR GOOGLE COLAB (.IPYNB)")
 * @param {string} header.title      nombre del archivo
 * @param {string} header.iconClass  clases del cuadrito del icono
 * @param {string} header.iconHtml   contenido del icono
 * @param {() => void} header.onDownload  qué hace el botón Descargar
 */
function setModalHeader({ badge, title, iconClass, iconHtml, onDownload }) {
  document.getElementById("floatingModalViewerBadge").textContent = badge;
  document.getElementById("floatingModalFileTitle").textContent = title;
  const iconBox = document.getElementById("floatingModalIconBox");
  iconBox.className = iconClass;
  iconBox.innerHTML = iconHtml;
  currentModalDownloadHandler = onDownload;
}

function showPreviewModal() {
  document.getElementById("floatingPreviewModal").classList.remove("hidden");
}

// ---------------------------------------------------------------------------
// Qué visor usar para cada tipo
// ---------------------------------------------------------------------------
const isHttpUrl = (url) => Boolean(url) && /^https?:\/\//i.test(url);
const isPdfDataUrl = (url) => Boolean(url) && url.startsWith("data:application/pdf");
const endsWithPdf = (url) => Boolean(url) && url.toLowerCase().endsWith(".pdf");

function openPptPreview(week, iframe) {
  setModalHeader({
    badge: "VISOR MICROSOFT POWERPOINT (.PPTX)",
    title: week.pptLabel,
    iconClass: ICON_BOX_PDF,
    iconHtml: "P",
    onDownload: () => downloadPptByWeek(week.week)
  });
  if (week.pptView) {
    replaceIframeHtml(iframe, buildPdfViewerHtml(week.pptView, week.pptLabel));
  } else if (isHttpUrl(week.pptUrl)) {
    if (endsWithPdf(week.pptUrl)) replaceIframeHtml(iframe, buildPdfViewerHtml(week.pptUrl, week.pptLabel));
    else iframe.src = OFFICE_EMBED_URL + encodeURIComponent(week.pptUrl);
  } else if (isPdfDataUrl(week.pptUrl)) {
    replaceIframeHtml(iframe, buildPdfViewerHtml(week.pptUrl, week.pptLabel));
  } else {
    setIframeBlobHtml(iframe, buildDemoPptHtml(week));
  }
}

function openDocPreview(week, iframe) {
  setModalHeader({
    badge: "VISOR NATIVO DE DOCUMENTOS (PDF / INFORME)",
    title: week.docLabel.replace(/\.docx?$/i, ".pdf"),
    iconClass: ICON_BOX_PDF,
    iconHtml: "P",
    onDownload: () => downloadWordByWeek(week.week)
  });
  if (week.docView) {
    replaceIframeHtml(iframe, buildPdfViewerHtml(week.docView, week.docLabel));
  } else if (isPdfDataUrl(week.docUrl) || endsWithPdf(week.docUrl)) {
    replaceIframeHtml(iframe, buildPdfViewerHtml(week.docUrl, week.docLabel));
  } else if (isHttpUrl(week.docUrl)) {
    iframe.src = OFFICE_EMBED_URL + encodeURIComponent(week.docUrl);
  } else {
    setIframeBlobHtml(iframe, buildDemoDocHtml(week));
  }
}

/** @returns {boolean} true si el cuaderno es un archivo real (.ipynb) o está guardado en el panel (data:) */
function hasRealNotebook(week) {
  const url = week.colabUrl;
  return Boolean(url) && ((isHttpUrl(url) && /\.ipynb(\?|#|$)/i.test(url)) || url.startsWith("data:"));
}

/** @returns {boolean} true si se mostró el cuaderno real (que abre la ventana por su cuenta) */
function openColabPreview(week, iframe) {
  setModalHeader({
    badge: "VISOR GOOGLE COLAB (.IPYNB)",
    title: week.colabLabel,
    iconClass: ICON_BOX_COLAB,
    iconHtml: "&lt;/&gt;",
    onDownload: () => downloadColabByWeek(week.week)
  });
  if (hasRealNotebook(week)) {
    openRealNotebook(week);
    return true;
  }
  setIframeBlobHtml(iframe, buildDemoColabHtml(week));
  return false;
}

/**
 * Abre la ventana de previsualización de un material de una semana.
 * @param {number} weekNum
 * @param {"ppt"|"pdf"|"colab"} fileType
 */
function openFloatingPreviewModal(weekNum, fileType) {
  const week = getWeek(weekNum);
  if (!week) return;

  const iframe = document.getElementById("dynamicPreviewIframe");
  cleanupDynamicIframe();

  if (fileType === "ppt") {
    openPptPreview(week, iframe);
  } else if (fileType === "pdf") {
    openDocPreview(week, iframe);
  } else if (fileType === "colab") {
    if (openColabPreview(week, iframe)) return;   // el cuaderno real abre la ventana cuando termina de cargar
  }
  showPreviewModal();
}

/** Abre el sílabo (PDF) en el visor de PDF. */
function openSyllabusModal() {
  cleanupDynamicIframe();
  setModalHeader({
    badge: "VISOR DE SÍLABO (PDF)",
    title: syllabusDisplayName(),
    iconClass: ICON_BOX_PDF,
    iconHtml: "P",
    onDownload: () => downloadSyllabusFile()
  });
  replaceIframeHtml(document.getElementById("dynamicPreviewIframe"), buildPdfViewerHtml(syllabusPdfUrl(), syllabusDisplayName()));
  showPreviewModal();
}

// ---------------------------------------------------------------------------
// Mensajes del visor (botón "Descargar" dentro del iframe)
// ---------------------------------------------------------------------------
// Solo se atienden los mensajes que vienen del visor propio (la ventana de vista previa), nunca de otra página.
window.addEventListener("message", (event) => {
  const viewer = document.getElementById("dynamicPreviewIframe");
  const comesFromViewer = viewer && viewer.contentWindow && event.source === viewer.contentWindow;
  if (!comesFromViewer || event.origin !== location.origin) return;
  if (event.data && event.data.action === "downloadModalFile" && typeof currentModalDownloadHandler === "function") {
    currentModalDownloadHandler();
  }
});
