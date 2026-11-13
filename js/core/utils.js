/* =============================================================================
   UTILIDADES COMPARTIDAS  (core/utils.js)
   Funciones pequeñas que usan varias partes de la página: texto seguro para HTML, copias de datos,
   aviso (toast) y descargas.

   Depende de: nada al cargar (usa el DOM al ejecutarse).
   Expone: escapeHtml, cloneJson, byId, parseIntOr, padWeek, showToast, triggerBlobDownload, triggerDataDownload, triggerLinkDownload.
   ============================================================================= */
"use strict";

/** Convierte texto en texto seguro para insertarlo dentro de HTML (evita inyección de código). */
function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Copia profunda de datos JSON (objetos, listas, textos, números). */
function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

/** Atajo de document.getElementById. */
function byId(id) {
  return document.getElementById(id);
}

/** Convierte a número entero; si no es un número válido (o es 0) devuelve el valor de respaldo. */
function parseIntOr(value, fallback) {
  return parseInt(value, 10) || fallback;
}

/** Número de semana con dos cifras: 1 → "01". */
function padWeek(weekNumber) {
  return String(weekNumber).padStart(2, "0");
}

// ---------------------------------------------------------------------------
// Aviso temporal (toast)
// ---------------------------------------------------------------------------
const TOAST_DURATION_MS = 2600;
let toastTimer = null;

/** Muestra un aviso breve abajo a la derecha. */
function showToast(message) {
  const toast = document.getElementById("toastContainer");
  document.getElementById("toastMessage").textContent = message;
  toast.classList.remove("hidden");
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add("hidden"), TOAST_DURATION_MS);
}

// ---------------------------------------------------------------------------
// Descargas
// ---------------------------------------------------------------------------
/** Dispara la descarga de un enlace temporal (<a download>) y lo elimina. */
function clickDownloadAnchor(anchor) {
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}

/** Descarga un Blob creado en la página. */
function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  clickDownloadAnchor(anchor);
  URL.revokeObjectURL(url);
}

/** Descarga un archivo guardado como data: URL y avisa con un toast. */
function triggerDataDownload(dataUrl, filename) {
  const anchor = document.createElement("a");
  anchor.href = dataUrl;
  anchor.download = filename;
  clickDownloadAnchor(anchor);
  showToast(`Archivo ${filename} descargado`);
}

/** Descarga un archivo que está en el sitio (o en otra dirección web), abriéndolo en pestaña nueva. */
function triggerLinkDownload(url, filename) {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename || "";
  anchor.target = "_blank";
  anchor.rel = "noopener";
  clickDownloadAnchor(anchor);
}
