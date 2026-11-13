/* =============================================================================
   VISORES REALES  (features/real-viewers.js)
   Páginas de previsualización de los archivos que subes: PDF (todas las páginas, con zoom) y cuadernos
   .ipynb. El código que corre dentro del visor está en js/viewers/ (pdf-viewer.js, notebook-viewer.js).

   Depende de: viewer-styles.js, utils.js, config.js, preview-modal.js (replaceIframeHtml, previewToken).
   Expone: buildPdfViewerHtml, buildNotebookViewerHtml, openRealNotebook, colabGithubUrl, simpleMessagePage.
   ============================================================================= */
"use strict";

const HTTP_URL_PATTERN = /^https?:/i;

/** Página sencilla con un mensaje (y un enlace opcional): "Cargando…", errores... */
function simpleMessagePage(message, linkUrl, linkText) {
  const link = linkUrl
    ? "<p><a href='" + String(linkUrl).replace(/'/g, "%27") + "' target='_blank' rel='noopener'>" + escapeHtml(linkText || "Abrir") + "</a></p>"
    : "";
  return "<!DOCTYPE html><html lang='es'><head><meta charset='UTF-8'><style>" + VIEWER_BASE_CSS + NB_VIEWER_CSS
    + "</style></head><body><div class='msg'><p>" + escapeHtml(message) + "</p>" + link + "</div></body></html>";
}

/** Visor de PDF para una dirección (archivo del sitio, enlace externo o data: URL). */
function buildPdfViewerHtml(url, title) {
  const absolute = /^data:/i.test(url) ? url : new URL(url, location.href).href;
  const openLink = HTTP_URL_PATTERN.test(absolute)
    ? "<a class='btn' href='" + absolute.replace(/'/g, "%27") + "' target='_blank' rel='noopener'>Abrir en pestaña nueva</a>"
    : "";
  const bodyHtml = "<div class='bar'><span class='badge' id='pageIndicator'>- / -</span><button id='zoomOut' title='Alejar'>&minus;</button>"
    + "<span class='badge' id='zoomLabel'>100%</span><button id='zoomIn' title='Acercar'>+</button><span class='sp'></span>"
    + openLink + "<button id='dl'>&#11015; Descargar</button></div>"
    + "<div class='pages' id='pages'><div class='fb'>Cargando documento&hellip;</div></div>";
  return buildViewerPage({
    css: VIEWER_BASE_CSS + PDF_VIEWER_CSS,
    bodyHtml: bodyHtml,
    config: { url: absolute, title: title || "" },
    script: "pdf-viewer.js"
  });
}

/** Visor de un cuaderno .ipynb ya descargado (nb = su contenido JSON). */
function buildNotebookViewerHtml(notebook, title, colabUrl) {
  const openLink = colabUrl
    ? "<a class='btn' href='" + colabUrl.replace(/'/g, "%27") + "' target='_blank' rel='noopener'>Abrir en Google Colab</a>"
    : "";
  const bodyHtml = "<div class='bar'><span class='ttl'>" + escapeHtml(title || "Cuaderno") + "</span><span class='badge' id='count'></span><span class='sp'></span>"
    + openLink + "<button id='dl'>&#11015; Descargar</button></div>"
    + "<div class='nb'><div class='wrap' id='nb'><p class='empty'>Cargando cuaderno&hellip;</p></div></div>";
  return buildViewerPage({
    css: VIEWER_BASE_CSS + NB_VIEWER_CSS,
    bodyHtml: bodyHtml,
    config: { nb: notebook, title: title || "", colabUrl: colabUrl || "" },
    script: "notebook-viewer.js"
  });
}

/** Dirección para abrir un cuaderno del repositorio directamente en Google Colab ("" si no está en archivos/). */
function colabGithubUrl(fileUrl) {
  try {
    const url = new URL(fileUrl, location.href);
    const index = url.pathname.indexOf("/" + FILES_PATH + "/");
    if (index < 0) return "";
    const repoPath = decodeURIComponent(url.pathname.slice(index + 1));
    return "https://colab.research.google.com/github/" + GITHUB_REPO + "/blob/" + GITHUB_BRANCH + "/"
      + repoPath.split("/").map(encodeURIComponent).join("/");
  } catch {
    return "";
  }
}

/** Abre un cuaderno real: lo descarga, y mientras tanto muestra "Cargando…". Si falla, ofrece alternativas. */
function openRealNotebook(week) {
  const iframe = document.getElementById("dynamicPreviewIframe");
  const token = ++previewToken;                       // permite ignorar esta carga si se abre otra cosa antes
  const colabUrl = colabGithubUrl(week.colabUrl);
  replaceIframeHtml(iframe, simpleMessagePage("Cargando cuaderno…"));
  document.getElementById("floatingPreviewModal").classList.remove("hidden");

  fetch(week.colabUrl)
    .then((response) => {
      if (!response.ok) throw new Error("http " + response.status);
      return response.json();
    })
    .then((notebook) => {
      if (token === previewToken) replaceIframeHtml(iframe, buildNotebookViewerHtml(notebook, week.colabLabel, colabUrl));
    })
    .catch(() => {
      if (token !== previewToken) return;
      replaceIframeHtml(iframe, simpleMessagePage(
        "No se pudo leer el cuaderno aquí. Usa «Descargar» o ábrelo en Google Colab.", colabUrl, "Abrir en Google Colab"));
    });
}
