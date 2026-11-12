/* =============================================================================
   VISORES REALES (PDF y Colab) Y DESCARGAS
   Previsualización de los archivos que subes: PDF (todas las páginas), cuadernos .ipynb,
   el sílabo, y los botones de descarga. El código de los visores está en js/visores/.
   ============================================================================= */

// =========================================================================
// VISORES REALES: PDF (todas las páginas, nítido, también en celular) y cuadernos .ipynb
// =========================================================================
let previewToken = 0;   // sirve para cancelar cargas viejas si abres otra cosa rápido
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

function replaceIframeHtml(iframe, html) {
  if (currentIframeBlobUrl) {
    URL.revokeObjectURL(currentIframeBlobUrl);
    currentIframeBlobUrl = null;
  }
  setIframeBlobHtml(iframe, html);
}

function simpleMessagePage(msg, linkUrl, linkText) {
  const link = linkUrl ? "<p><a href='" + String(linkUrl).replace(/'/g, "%27") + "' target='_blank' rel='noopener'>" + escapeHtml(linkText || "Abrir") + "</a></p>" : "";
  return "<!DOCTYPE html><html lang='es'><head><meta charset='UTF-8'><style>" + VIEWER_BASE_CSS + NB_VIEWER_CSS + "</style></head><body><div class='msg'><p>" + escapeHtml(msg) + "</p>" + link + "</div></body></html>";
}

// Los visores viven en js/visores/. Se cargan dentro del cuadro de previsualización.
const VISORES_URL = {
  pdf: new URL("js/visores/visor-pdf.js", location.href).href,
  cuaderno: new URL("js/visores/visor-cuaderno.js", location.href).href
};

function buildPdfViewerHtml(url, title) {
  const abs = /^data:/i.test(url) ? url : new URL(url, location.href).href;
  const cfg = JSON.stringify({ url: abs, title: title || "" }).replace(/</g, "\\u003c");
  const openLink = /^https?:/i.test(abs) ? "<a class='btn' href='" + abs.replace(/'/g, "%27") + "' target='_blank' rel='noopener'>Abrir en pestaña nueva</a>" : "";
  return "<!DOCTYPE html><html lang='es'><head><meta charset='UTF-8'><meta name='viewport' content='width=device-width,initial-scale=1'><style>" + VIEWER_BASE_CSS + PDF_VIEWER_CSS + "</style></head><body>"
    + "<div class='bar'><span class='badge' id='pageIndicator'>- / -</span><button id='zoomOut' title='Alejar'>&minus;</button><span class='badge' id='zoomLabel'>100%</span><button id='zoomIn' title='Acercar'>+</button><span class='sp'></span>" + openLink + "<button id='dl'>&#11015; Descargar</button></div>"
    + "<div class='pages' id='pages'><div class='fb'>Cargando documento&hellip;</div></div>"
    + "<script>window.__VIEW__=" + cfg + ";<\/script><script src='" + VISORES_URL.pdf + "'><\/script></body></html>";
}

function buildNotebookViewerHtml(nb, title, colabUrl) {
  const cfg = JSON.stringify({ nb: nb, title: title || "", colabUrl: colabUrl || "" }).replace(/</g, "\\u003c");
  const open = colabUrl ? "<a class='btn' href='" + colabUrl.replace(/'/g, "%27") + "' target='_blank' rel='noopener'>Abrir en Google Colab</a>" : "";
  return "<!DOCTYPE html><html lang='es'><head><meta charset='UTF-8'><meta name='viewport' content='width=device-width,initial-scale=1'><style>" + VIEWER_BASE_CSS + NB_VIEWER_CSS + "</style></head><body>"
    + "<div class='bar'><span class='ttl'>" + escapeHtml(title || "Cuaderno") + "</span><span class='badge' id='count'></span><span class='sp'></span>" + open + "<button id='dl'>&#11015; Descargar</button></div>"
    + "<div class='nb'><div class='wrap' id='nb'><p class='empty'>Cargando cuaderno&hellip;</p></div></div>"
    + "<script>window.__VIEW__=" + cfg + ";<\/script><script src='" + VISORES_URL.cuaderno + "'><\/script></body></html>";
}

function colabGithubUrl(fileUrl) {
  try {
    const u = new URL(fileUrl, location.href);
    const i = u.pathname.indexOf("/archivos/");
    if (i < 0) return "";
    const rel = decodeURIComponent(u.pathname.slice(i + 1));
    const path = rel;
    return "https://colab.research.google.com/github/" + GITHUB_REPO + "/blob/main/" + path.split("/").map(encodeURIComponent).join("/");
  } catch (e) {
    return "";
  }
}

function openRealNotebook(w) {
  const modal = document.getElementById("floatingPreviewModal");
  const iframe = document.getElementById("dynamicPreviewIframe");
  const token = ++previewToken;
  const colabUrl = colabGithubUrl(w.colabUrl);
  replaceIframeHtml(iframe, simpleMessagePage("Cargando cuaderno…"));
  modal.classList.remove("hidden");
  fetch(w.colabUrl)
    .then((r) => { if (!r.ok) throw new Error("http " + r.status); return r.json(); })
    .then((nb) => {
      if (token !== previewToken) return;
      replaceIframeHtml(iframe, buildNotebookViewerHtml(nb, w.colabLabel, colabUrl));
    })
    .catch(() => {
      if (token !== previewToken) return;
      replaceIframeHtml(iframe, simpleMessagePage("No se pudo leer el cuaderno aquí. Usa «Descargar» o ábrelo en Google Colab.", colabUrl, "Abrir en Google Colab"));
    });
}

// Sílabo real: el PDF que subas a archivos/silabo/ (si no subes ninguno, se usa el oficial incluido)
let syllabusDetected = null;
function syllabusDisplayName() {
  return syllabusDetected ? syllabusDetected.name : (appState.syllabusFileName || SILABO_OFICIAL);
}
function syllabusPdfUrl() {
  if (syllabusDetected) return syllabusDetected.url;
  if (appState.syllabusDataUrl && appState.syllabusDataUrl.startsWith("data:application/pdf")) return appState.syllabusDataUrl;
  if (appState.syllabusUrl && /^https?:\/\/.+\.pdf(\?.*)?$/i.test(appState.syllabusUrl)) return appState.syllabusUrl;
  return new URL(RUTA_SILABO + "/" + SILABO_OFICIAL, location.href).href;
}
async function detectSyllabus(manifest, verify) {
  let name = manifest && manifest.silabo;
  let url = "";
  if (name) {
    url = new URL(RUTA_SILABO + "/" + encodeURIComponent(name), location.href).href;
    if (verify && !(await publicFileExists(url))) url = "";
  }
  if (!url) {
    const def = new URL(RUTA_SILABO + "/" + SILABO_OFICIAL, location.href).href;
    if (await publicFileExists(def)) { url = def; name = SILABO_OFICIAL; }
  }
  if (url) {
    syllabusDetected = { url: url, name: name };
    const b = document.getElementById("syllabusRowFileTitle");
    if (b) b.textContent = name;
    if (activePage === "silabo") showSilaboPage();
  }
}

function setIframeBlobHtml(iframe, htmlString) {
  const blob = new Blob([htmlString], { type: "text/html;charset=utf-8" });
  currentIframeBlobUrl = URL.createObjectURL(blob);
  iframe.src = currentIframeBlobUrl;
}

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

function downloadPptByWeek(weekNum) {
  const w = appState.weeks.find(item => item.week === weekNum) || appState.weeks[0];
  if (w.pptUrl && w.pptUrl.startsWith("data:")) {
    triggerDataDownload(w.pptUrl, w.uploadedPptName || w.pptLabel);
    return;
  }
  if (w.pptUrl && /^https?:\/\//i.test(w.pptUrl)) {
    triggerLinkDownload(w.pptUrl, w.pptLabel);
    return;
  }
  const slides = buildSlidesForWeek(w);
  const slidesHtml = slides.map((s, idx) => `
    <section style="page-break-after:always;padding:44px;border:1px solid #e2e8f0;margin-bottom:28px;background:#ffffff;font-family:sans-serif;">
      <div style="color:#64748b;font-size:12px;font-weight:bold;">UNMSM · FISI — Diapositiva ${idx + 1}/${slides.length}</div>
      <h1 style="color:#0f172a;font-size:26px;margin-top:10px;">${escapeHtml(s.title)}</h1>
      <p style="color:#334155;font-size:15px;">${escapeHtml(s.subtitle)}</p>
      ${s.code ? `<pre style="background:#0f172a;color:#f8fafc;padding:14px;overflow:auto;"><code>${escapeHtml(s.code)}</code></pre>` : `<ul>${(s.bullets || []).map(b => `<li style="margin:8px 0;color:#1e293b;font-size:15px;">${escapeHtml(b)}</li>`).join("")}</ul>`}
      <div style="margin-top:20px;font-size:12px;color:#64748b;">Autores: ${escapeHtml(appState.studentName)} | Cátedra: ${escapeHtml(appState.profName)}</div>
    </section>`).join("");
  const blob = new Blob([`<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>${escapeHtml(w.pptLabel)}</title></head><body style="max-width:900px;margin:20px auto;">${slidesHtml}</body></html>`], { type: "text/html;charset=utf-8" });
  triggerBlobDownload(blob, `PPT_Semana_${String(w.week).padStart(2, "0")}_IA_UNMSM.html`);
  showToast(`Presentación de la Semana ${w.week} descargada`);
}

function downloadWordByWeek(weekNum) {
  const w = appState.weeks.find(item => item.week === weekNum) || appState.weeks[0];
  if (w.docUrl && w.docUrl.startsWith("data:")) {
    triggerDataDownload(w.docUrl, w.uploadedDocName || w.docLabel);
    return;
  }
  if (w.docUrl && /^https?:\/\//i.test(w.docUrl)) {
    triggerLinkDownload(w.docUrl, w.docLabel);
    return;
  }
  const subtemas = w.topics.map((t, idx) => {
    const parsed = parseTopicItem(t, w.week, idx);
    return `<h3>${escapeHtml(parsed.code)} ${escapeHtml(parsed.title)}</h3><p>${escapeHtml(parsed.desc)}</p>`;
  }).join("");
  const docHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Informe Semana ${w.week}</title></head><body style="font-family:'Times New Roman',serif;font-size:12pt;line-height:1.5;"><h1 style="text-align:center;">UNIVERSIDAD NACIONAL MAYOR DE SAN MARCOS</h1><p style="text-align:center;">Facultad de Ingeniería de Sistemas e Informática</p><h2 style="text-align:center;">INFORME ACADÉMICO: ${escapeHtml(w.title)}</h2><p><strong>Autores:</strong> ${escapeHtml(appState.studentName)}<br><strong>Docente:</strong> ${escapeHtml(appState.profName)}</p><hr><p>${escapeHtml(w.summary)}</p>${subtemas}</body></html>`;
  const blob = new Blob([docHtml], { type: "application/msword;charset=utf-8" });
  triggerBlobDownload(blob, `Informe_Semana_${String(w.week).padStart(2, "0")}_IA_UNMSM.doc`);
  showToast(`Informe de la Semana ${w.week} descargado`);
}

function downloadColabByWeek(weekNum) {
  const w = appState.weeks.find(item => item.week === weekNum) || appState.weeks[0];
  if (w.colabUrl && w.colabUrl.startsWith("data:")) {
    triggerDataDownload(w.colabUrl, w.uploadedColabName || w.colabLabel);
    return;
  }
  if (w.colabUrl && /^https?:\/\//i.test(w.colabUrl) && /\.ipynb$/i.test(w.colabUrl)) {
    triggerLinkDownload(w.colabUrl, w.colabLabel);
    return;
  }
  const ipynbObj = {
    nbformat: 4,
    nbformat_minor: 0,
    metadata: {
      colab: { name: w.colabLabel },
      kernelspec: { name: "python3", display_name: "Python 3" }
    },
    cells: [
      {
        cell_type: "markdown",
        metadata: {},
        source: [`# UNMSM · FISI — Semana ${w.week}: ${w.title}\n`, `**Autores:** ${appState.studentName} | **Docente:** ${appState.profName}\n\n`, `${w.summary}`]
      },
      {
        cell_type: "code",
        metadata: {},
        execution_count: 1,
        outputs: [{ output_type: "stream", name: "stdout", text: [w.codeOutput + "\n"] }],
        source: w.codeSnippet.split("\n").map(line => line + "\n")
      }
    ]
  };
  const blob = new Blob([JSON.stringify(ipynbObj, null, 2)], { type: "application/x-ipynb+json" });
  triggerBlobDownload(blob, w.colabLabel);
  showToast(`Cuaderno ${w.colabLabel} descargado`);
}

function triggerLinkDownload(url, filename) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || "";
  a.target = "_blank";
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// =========================================================================

window.addEventListener("message", (e) => {
  // Solo se atienden mensajes del visor propio (la ventana de vista previa), nunca de otra página
  const visor = document.getElementById("dynamicPreviewIframe");
  const vieneDelVisor = visor && visor.contentWindow && e.source === visor.contentWindow;
  if (!vieneDelVisor || e.origin !== location.origin) return;
  if (e.data && e.data.action === "downloadModalFile" && typeof currentModalDownloadHandler === "function") {
    currentModalDownloadHandler();
  }
});
