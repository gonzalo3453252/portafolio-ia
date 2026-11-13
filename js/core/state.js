/* =============================================================================
   ESTADO DE LA PÁGINA  (core/state.js)
   Datos que cambian mientras se usa la página (semana abierta, contenido publicado y cambios guardados
   en este navegador).

   Dos fuentes de contenido, en este orden de prioridad:
     1. publishedState: lo publicado en datos/portafolio.json (lo ve todo el mundo).
     2. Cambios del panel creador guardados en este navegador y aún sin publicar (solo los ve quien los hizo).

   Depende de: config.js, storage.js, utils.js, data/default-state.js (DEFAULT_STATE).
   Expone: appState, activePage, activeUnitNum, activeWeekNum, publishedState, getWeek, loadPublishedState, loadSavedState, saveState,
           stateForPersist, refreshPendingNote, refreshContentViews, refreshActiveView.
   ============================================================================= */
"use strict";

/** Contenido que se está mostrando (perfil, semanas, textos, archivos). Empieza con los datos de ejemplo. */
let appState = cloneJson(DEFAULT_STATE);

/** Contenido publicado, leído de datos/portafolio.json (null si no se pudo leer). */
let publishedState = null;

/* Estas variables se reasignan desde otros archivos (todos comparten el mismo ámbito global). */
/* eslint-disable prefer-const */
/** Página abierta: "presentacion" | "silabo" | "todas-unidades" | "unidad-especifica" | "semana-individual". */
let activePage = "presentacion";
let activeUnitNum = 1;
let activeWeekNum = 1;

/** Ventana de previsualización (iframe) abierta ahora mismo. */
let currentIframeBlobUrl = null;
let currentModalDownloadHandler = null;
/* eslint-enable prefer-const */

/** La semana con ese número (o la primera, si no existe). */
function getWeek(weekNum) {
  return appState.weeks.find((week) => week.week === weekNum) || appState.weeks[0];
}

/** ¿Es válido un estado guardado? (tiene autor y al menos una semana) */
function isUsableState(state) {
  return Boolean(state && state.studentName && Array.isArray(state.weeks) && state.weeks.length > 0);
}

/** Lee el contenido publicado (datos/portafolio.json). Si falta o está dañado, se queda con los datos de ejemplo. */
async function loadPublishedState() {
  try {
    const response = await fetch(PUBLISHED_DATA_PATH, { cache: "no-cache" });
    const contentType = (response.headers.get("content-type") || "").toLowerCase();
    if (!response.ok || !contentType.includes("json")) return;
    const data = await response.json();
    if (isUsableState(data)) publishedState = data;
  } catch {
    // Sin red o JSON dañado: se queda con los datos de ejemplo
  }
}

/**
 * Decide qué contenido mostrar al abrir la página: lo publicado, o los cambios sin publicar de este navegador.
 * Si lo guardado ya es igual a lo publicado, se borra la marca de "cambios pendientes".
 */
function loadSavedState() {
  try {
    if (publishedState) appState = cloneJson(publishedState);
    const saved = localStore.get(STORAGE_KEYS.STATE);
    if (!saved) return;

    const parsed = JSON.parse(saved);
    if (!isUsableState(parsed)) return;

    const hasPending = localStore.get(STORAGE_KEYS.PENDING) === "1";
    const sameAsPublished = publishedState && JSON.stringify(parsed) === JSON.stringify(publishedState);
    if (sameAsPublished) {
      localStore.remove(STORAGE_KEYS.PENDING);
    } else if (!publishedState || hasPending) {
      appState = parsed;
      // Migración: versiones antiguas guardaban el semestre anterior
      if (appState.groupBadge === "Semestre Académico 2026-I") appState.groupBadge = "Semestre Académico 2026-II";
    }
  } catch {
    // Datos guardados dañados: se ignoran y se queda con el contenido publicado
  }
}

/** Muestra u oculta el aviso "tienes cambios sin publicar" del panel creador. */
function refreshPendingNote() {
  const note = document.getElementById("pendingChangesNote");
  if (!note) return;
  note.classList.toggle("hidden", localStore.get(STORAGE_KEYS.PENDING) !== "1");
}

/**
 * Copia del estado lista para guardar o publicar: sin lo que la página detecta sola en las carpetas de
 * GitHub (archivos y vistas PDF), para que no quede grabado como si lo hubieras escrito tú.
 */
function stateForPersist() {
  const copy = cloneJson(appState);
  (copy.weeks || []).forEach((week) => {
    delete week.pptView;
    delete week.docView;
    if (!week._auto) return;
    FILE_CONVENTION.forEach((kind) => {
      const original = week._auto[kind.key];
      if (!original) return;
      week[kind.urlKey] = original.url;
      week[kind.label] = original.label;
      // Si lo ocultaste tú, se guarda como oculto (no se restaura el valor anterior a la autodetección)
      week[kind.flag] = (week.ocultos && week.ocultos[kind.key]) ? false : original.flag;
    });
    delete week._auto;
  });
  return copy;
}

/** Guarda los cambios del panel creador en este navegador y marca que hay cambios sin publicar. */
function saveState() {
  localStore.set(STORAGE_KEYS.STATE, JSON.stringify(stateForPersist()));
  localStore.set(STORAGE_KEYS.PENDING, "1");
  refreshPendingNote();
}

/** Vuelve a dibujar las páginas de contenido (unidades y semana) si alguna está abierta. */
function refreshContentViews() {
  if (activePage === "todas-unidades") renderAllUnitsSummary();
  else if (activePage === "unidad-especifica") renderSpecificUnitView();
  else if (activePage === "semana-individual") renderSingleWeekView();
}

/** Vuelve a dibujar la página que está abierta (contenido o sílabo) después de cambiar datos. */
function refreshActiveView() {
  if (activePage === "silabo") showSilaboPage();
  else refreshContentViews();
}
