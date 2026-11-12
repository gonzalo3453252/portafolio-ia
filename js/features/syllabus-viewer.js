/* =============================================================================
   VISOR DEL SÍLABO
   Abre el sílabo (PDF) dentro de la página.
   ============================================================================= */

// Abre el sílabo en el visor de PDF (todas las páginas, con zoom)
function openSyllabusModal() {
  const modal = document.getElementById("floatingPreviewModal");
  const iframe = document.getElementById("dynamicPreviewIframe");
  const badgeEl = document.getElementById("floatingModalViewerBadge");
  const titleEl = document.getElementById("floatingModalFileTitle");
  const iconBox = document.getElementById("floatingModalIconBox");

  cleanupDynamicIframe();

  badgeEl.textContent = "VISOR DE SÍLABO (PDF)";
  titleEl.textContent = syllabusDisplayName();
  iconBox.className = "w-8 h-8 rounded-lg bg-[#e04f33] text-white flex items-center justify-center font-extrabold text-xs shrink-0 shadow-2xs";
  iconBox.textContent = "P";
  currentModalDownloadHandler = () => downloadSyllabusFile();

  replaceIframeHtml(iframe, buildPdfViewerHtml(syllabusPdfUrl(), syllabusDisplayName()));
  modal.classList.remove("hidden");
}
