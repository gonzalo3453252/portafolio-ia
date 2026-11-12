/* =============================================================================
   ESTADO DE LA PÁGINA
   Variables globales, guardado en el navegador, avisos (toast) y utilidades pequeñas.
   ============================================================================= */

let appState = JSON.parse(JSON.stringify(DEFAULT_STATE));
let activePage = "presentacion";
let activeUnitNum = 1;
let activeWeekNum = 1;
let baseFontScale = 100;
let currentIframeBlobUrl = null;
let currentModalDownloadHandler = null;

const PENDING_KEY = "unmsm_fisi_ia_pendientes";

function loadSavedState() {
  try {
    const published = window.__CUSTOM_PORTFOLIO_STATE__ ? JSON.parse(JSON.stringify(window.__CUSTOM_PORTFOLIO_STATE__)) : null;
    if (published) appState = JSON.parse(JSON.stringify(published));
    const saved = localStorage.getItem("unmsm_fisi_ia_editorial_v17");
    const pending = localStorage.getItem(PENDING_KEY) === "1";
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.studentName && Array.isArray(parsed.weeks) && parsed.weeks.length > 0) {
        const same = published && JSON.stringify(parsed) === JSON.stringify(published);
        if (same) {
          localStorage.removeItem(PENDING_KEY);
        } else if (!published || pending) {
          appState = parsed;
          if (appState.groupBadge === "Semestre Académico 2026-I") {
            appState.groupBadge = "Semestre Académico 2026-II";
          }
        }
      }
    }
  } catch (e) {}
}

function refreshPendingNote() {
  const el = document.getElementById("pendingChangesNote");
  if (!el) return;
  let pending = false;
  try { pending = localStorage.getItem(PENDING_KEY) === "1"; } catch (e) {}
  el.classList.toggle("hidden", !pending);
}

// Copia del estado sin los archivos autodetectados de las carpetas de GitHub
function stateForPersist() {
  const c = JSON.parse(JSON.stringify(appState));
  (c.weeks || []).forEach((w) => {
    delete w.pptView;
    delete w.docView;
    if (w._auto) {
      FILE_CONVENTION.forEach((kind) => {
        const o = w._auto[kind.key];
        if (o) {
          w[kind.urlKey] = o.url; w[kind.label] = o.label;
          // Si lo ocultaste tú, se guarda como oculto (no se restaura el valor anterior a la autodetección)
          w[kind.flag] = (w.ocultos && w.ocultos[kind.key]) ? false : o.flag;
        }
      });
      delete w._auto;
    }
  });
  return c;
}

function saveState() {
  try {
    localStorage.setItem("unmsm_fisi_ia_editorial_v17", JSON.stringify(stateForPersist()));
    localStorage.setItem(PENDING_KEY, "1");
  } catch (e) {}
  refreshPendingNote();
}

function showToast(msg) {
  const toast = document.getElementById("toastContainer");
  const text = document.getElementById("toastMessage");
  text.textContent = msg;
  toast.classList.remove("hidden");
  if (window._toastTimer) clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => {
    toast.classList.add("hidden");
  }, 2600);
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
