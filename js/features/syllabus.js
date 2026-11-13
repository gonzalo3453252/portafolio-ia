/* =============================================================================
   SÍLABO  (features/syllabus.js)
   Qué archivo es el sílabo y cómo se descarga. El sílabo es el PDF que subas a archivos/silabo/; si no subes
   ninguno, se usa el oficial que viene incluido (OFFICIAL_SYLLABUS).

   Orden de preferencia: PDF detectado en la carpeta > PDF guardado en el panel (data:) > enlace PDF > oficial.

   Depende de: config.js, state.js, utils.js, github-files.js (publicFileExists), navigation.js.
   Expone: syllabusDetected, syllabusDisplayName, syllabusPdfUrl, detectSyllabus, downloadSyllabusFile.
   ============================================================================= */
"use strict";

/** Sílabo encontrado en archivos/silabo/: { url, name } o null si todavía no se buscó o no hay. */
let syllabusDetected = null;

function syllabusDisplayName() {
  return syllabusDetected ? syllabusDetected.name : (appState.syllabusFileName || OFFICIAL_SYLLABUS);
}

/** Dirección del PDF del sílabo que se debe mostrar o descargar. */
function syllabusPdfUrl() {
  if (syllabusDetected) return syllabusDetected.url;
  if (appState.syllabusDataUrl && appState.syllabusDataUrl.startsWith("data:application/pdf")) return appState.syllabusDataUrl;
  if (appState.syllabusUrl && /^https?:\/\/.+\.pdf(\?.*)?$/i.test(appState.syllabusUrl)) return appState.syllabusUrl;
  return new URL(SYLLABUS_PATH + "/" + OFFICIAL_SYLLABUS, location.href).href;
}

/**
 * Busca el sílabo: el que indica la lista de archivos (manifest.silabo) o, si no, el oficial incluido.
 * @param {object|null} manifest lista de archivos de GitHub
 * @param {boolean} verify       true = comprobar con una petición que el archivo ya existe
 */
async function detectSyllabus(manifest, verify) {
  let name = manifest && manifest.silabo;
  let url = "";
  if (name) {
    url = new URL(SYLLABUS_PATH + "/" + encodeURIComponent(name), location.href).href;
    if (verify && !(await publicFileExists(url))) url = "";
  }
  if (!url) {
    const officialUrl = new URL(SYLLABUS_PATH + "/" + OFFICIAL_SYLLABUS, location.href).href;
    if (await publicFileExists(officialUrl)) {
      url = officialUrl;
      name = OFFICIAL_SYLLABUS;
    }
  }
  if (!url) return;

  syllabusDetected = { url: url, name: name };
  const rowTitle = document.getElementById("syllabusRowFileTitle");
  if (rowTitle) rowTitle.textContent = name;
  if (activePage === "silabo") showSilaboPage();
}

/** Descarga el sílabo (el subido desde el panel o el que está en la carpeta). */
function downloadSyllabusFile() {
  if (appState.syllabusDataUrl && !syllabusDetected) {
    triggerDataDownload(appState.syllabusDataUrl, syllabusDisplayName());
    return;
  }
  triggerLinkDownload(syllabusPdfUrl(), syllabusDisplayName());
}
