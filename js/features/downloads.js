/* =============================================================================
   DESCARGAS DE SEMANA  (features/downloads.js)
   Botones "Descargar" de la presentación, el informe y el cuaderno de una semana.
   Si la semana tiene un archivo real (subido a GitHub o pegado en el panel) se descarga ese; si no, se
   genera un archivo de ejemplo con los datos de la semana.

   Depende de: state.js, utils.js, data/units-and-topics.js (parseTopic), demo-slides.js.
   Expone: downloadPptByWeek, downloadWordByWeek, downloadColabByWeek.
   ============================================================================= */
"use strict";

/**
 * Descarga el archivo real de la semana si existe.
 * @param {string} url           dirección guardada (data: o http/https)
 * @param {string} uploadedName  nombre del archivo subido desde el panel (para data:)
 * @param {string} label         nombre que se muestra en la página
 * @param {(url: string) => boolean} [acceptsLink] filtro extra para enlaces http (ej. solo .ipynb)
 * @returns {boolean} true si descargó algo
 */
function downloadRealFile(url, uploadedName, label, acceptsLink) {
  if (url && url.startsWith("data:")) {
    triggerDataDownload(url, uploadedName || label);
    return true;
  }
  if (url && /^https?:\/\//i.test(url) && (!acceptsLink || acceptsLink(url))) {
    triggerLinkDownload(url, label);
    return true;
  }
  return false;
}

function downloadPptByWeek(weekNum) {
  const week = getWeek(weekNum);
  if (downloadRealFile(week.pptUrl, week.uploadedPptName, week.pptLabel)) return;

  const slidesHtml = buildSlidesForWeek(week).map((slide, index, all) => `
    <section style="page-break-after:always;padding:44px;border:1px solid #e2e8f0;margin-bottom:28px;background:#ffffff;font-family:sans-serif;">
      <div style="color:#64748b;font-size:12px;font-weight:bold;">UNMSM · FISI — Diapositiva ${index + 1}/${all.length}</div>
      <h1 style="color:#0f172a;font-size:26px;margin-top:10px;">${escapeHtml(slide.title)}</h1>
      <p style="color:#334155;font-size:15px;">${escapeHtml(slide.subtitle)}</p>
      ${slide.code
        ? `<pre style="background:#0f172a;color:#f8fafc;padding:14px;overflow:auto;"><code>${escapeHtml(slide.code)}</code></pre>`
        : `<ul>${(slide.bullets || []).map((bullet) => `<li style="margin:8px 0;color:#1e293b;font-size:15px;">${escapeHtml(bullet)}</li>`).join("")}</ul>`}
      <div style="margin-top:20px;font-size:12px;color:#64748b;">Autores: ${escapeHtml(appState.studentName)} | Cátedra: ${escapeHtml(appState.profName)}</div>
    </section>`).join("");
  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>${escapeHtml(week.pptLabel)}</title></head><body style="max-width:900px;margin:20px auto;">${slidesHtml}</body></html>`;
  triggerBlobDownload(new Blob([html], { type: "text/html;charset=utf-8" }), `PPT_Semana_${padWeek(week.week)}_IA_UNMSM.html`);
  showToast(`Presentación de la Semana ${week.week} descargada`);
}

function downloadWordByWeek(weekNum) {
  const week = getWeek(weekNum);
  if (downloadRealFile(week.docUrl, week.uploadedDocName, week.docLabel)) return;

  const topicsHtml = week.topics.map((rawTopic, index) => {
    const topic = parseTopic(rawTopic, week.week, index);
    return `<h3>${escapeHtml(topic.code)} ${escapeHtml(topic.title)}</h3><p>${escapeHtml(topic.desc)}</p>`;
  }).join("");
  const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Informe Semana ${week.week}</title></head><body style="font-family:'Times New Roman',serif;font-size:12pt;line-height:1.5;"><h1 style="text-align:center;">UNIVERSIDAD NACIONAL MAYOR DE SAN MARCOS</h1><p style="text-align:center;">Facultad de Ingeniería de Sistemas e Informática</p><h2 style="text-align:center;">INFORME ACADÉMICO: ${escapeHtml(week.title)}</h2><p><strong>Autores:</strong> ${escapeHtml(appState.studentName)}<br><strong>Docente:</strong> ${escapeHtml(appState.profName)}</p><hr><p>${escapeHtml(week.summary)}</p>${topicsHtml}</body></html>`;
  triggerBlobDownload(new Blob([html], { type: "application/msword;charset=utf-8" }), `Informe_Semana_${padWeek(week.week)}_IA_UNMSM.doc`);
  showToast(`Informe de la Semana ${week.week} descargado`);
}

/** Cuaderno .ipynb de ejemplo con el título, el código y el resultado de la semana. */
function buildDemoNotebook(week) {
  return {
    nbformat: 4,
    nbformat_minor: 0,
    metadata: {
      colab: { name: week.colabLabel },
      kernelspec: { name: "python3", display_name: "Python 3" }
    },
    cells: [
      {
        cell_type: "markdown",
        metadata: {},
        source: [`# UNMSM · FISI — Semana ${week.week}: ${week.title}\n`, `**Autores:** ${appState.studentName} | **Docente:** ${appState.profName}\n\n`, `${week.summary}`]
      },
      {
        cell_type: "code",
        metadata: {},
        execution_count: 1,
        outputs: [{ output_type: "stream", name: "stdout", text: [week.codeOutput + "\n"] }],
        source: week.codeSnippet.split("\n").map((line) => line + "\n")
      }
    ]
  };
}

function downloadColabByWeek(weekNum) {
  const week = getWeek(weekNum);
  if (downloadRealFile(week.colabUrl, week.uploadedColabName, week.colabLabel, (url) => /\.ipynb$/i.test(url))) return;

  const blob = new Blob([JSON.stringify(buildDemoNotebook(week), null, 2)], { type: "application/x-ipynb+json" });
  triggerBlobDownload(blob, week.colabLabel);
  showToast(`Cuaderno ${week.colabLabel} descargado`);
}
