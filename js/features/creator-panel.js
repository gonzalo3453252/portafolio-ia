/* =============================================================================
   PANEL DEL CREADOR  (features/creator-panel.js)
   El panel que solo ve el dueño (se abre con #creador al final de la dirección): editar perfil, semanas y
   unidades, subir archivos a GitHub y publicar los cambios.

   Cómo funciona la edición (no hay servidor):
     1. Los cambios se guardan en ESTE navegador (saveState) y se ven solo aquí.
     2. «Publicar en GitHub» copia el contenido como JSON y abre el editor de GitHub en datos/portafolio.json.
        Quien tiene sesión en GitHub pega y confirma: ese commit es lo que ve todo el mundo.
   Por eso el panel no puede cambiar la página de nadie: publicar exige iniciar sesión en GitHub.

   Depende de: config.js, state.js, utils.js, data/units-and-topics.js, github-files.js (FILE_CONVENTION),
               navigation.js, pages.js. Expone: initCreatorPanel, populateWeekSelectors.
   ============================================================================= */
"use strict";

const MAX_WEEK_NUMBER = 32;

/**
 * Los tres materiales en el formulario de una semana: casilla «mostrar», nombre y enlace.
 *   kind   = clave de FILE_CONVENTION ("ppt" | "doc" | "colab")
 *   isShown = cómo se sabe si la semana lo muestra ahora
 */
const MATERIAL_FIELDS = [
  { kind: "ppt",   toggleId: "toggleHasPpt",   labelId: "inputWeekPptLabel",   urlId: "inputWeekPptUrl",
    isShown: (week) => week.hasPpt !== false,   defaultLabel: (pad) => `Clase${pad}_IA.pptx` },
  { kind: "doc",   toggleId: "toggleHasWord",  labelId: "inputWeekDocLabel",   urlId: "inputWeekDocUrl",
    isShown: (week) => Boolean(week.hasWord),   defaultLabel: (pad) => `Informe_Semana${pad}.pdf` },
  { kind: "colab", toggleId: "toggleHasColab", labelId: "inputWeekColabLabel", urlId: "inputWeekColabUrl",
    isShown: (week) => week.hasColab !== false, defaultLabel: (pad) => `Lab${pad}_IA.ipynb` }
];

const fileKind = (key) => FILE_CONVENTION.find((kind) => kind.key === key);

// ---------------------------------------------------------------------------
// Listas desplegables (semanas y destinos de foto)
// ---------------------------------------------------------------------------
function sortWeeksInPlace() {
  appState.weeks.sort((a, b) => (a.week || 0) - (b.week || 0));
}

function fillSelect(select, options) {
  select.innerHTML = "";
  options.forEach(([value, text]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = text;
    select.appendChild(option);
  });
}

/** Llena la lista de semanas del panel y carga en el formulario la semana elegida. */
function populateWeekSelectors(selectedWeekNum) {
  sortWeeksInPlace();
  const select = byId("selectWeekEdit");
  if (!select) return;
  fillSelect(select, appState.weeks.map((w) => [w.week, `Semana ${padWeek(w.week)} (U${w.unit}): ${w.title}`]));
  if (selectedWeekNum && appState.weeks.some((w) => w.week === selectedWeekNum)) select.value = String(selectedWeekNum);
  loadSelectedWeekIntoInputs();
  populatePhotoTargets();
}

/** Lista del panel «Cambiar fotos»: portada, unidades y semanas, con el nombre que debe tener el archivo. */
function populatePhotoTargets() {
  const select = byId("selectFotoDestino");
  if (!select) return;
  const previous = select.value;
  const options = [
    ["portada-facultad", "Portada · foto de la facultad"],
    ["portada-docente", "Portada · foto del docente"]
  ];
  UNIT_NUMBERS.forEach((unit) => options.push(["unidad-" + unit, UNITS_INFO[unit].roman + " · " + UNITS_INFO[unit].title]));
  appState.weeks.forEach((w) => options.push(["semana-" + padWeek(w.week), "Semana " + padWeek(w.week) + " · " + w.title]));
  fillSelect(select, options);
  if (previous && options.some((option) => option[0] === previous)) select.value = previous;
  updateSuggestedPhotoName();
}

function updateSuggestedPhotoName() {
  const select = byId("selectFotoDestino");
  const label = byId("fotoNombreSugerido");
  if (select && label) label.textContent = select.value + ".jpg";
}

// ---------------------------------------------------------------------------
// Formulario de una semana
// ---------------------------------------------------------------------------
const isStoredInPanel = (url) => Boolean(url) && url.startsWith("data:");

/** Pasa los datos de una semana a los campos del formulario. */
function loadSelectedWeekIntoInputs() {
  const weekNum = parseIntOr(byId("selectWeekEdit")?.value, appState.weeks[0]?.week || 1);
  const week = getWeek(weekNum);
  if (!week) return;
  const pad = padWeek(week.week);

  byId("editWeekNumberInput").value = week.week;
  byId("editWeekUnitSelect").value = String(week.unit || 1);
  const uploadButton = byId("uploadWeekFilesBtn");
  if (uploadButton) uploadButton.textContent = `Subir archivos de la Semana ${pad} a GitHub`;
  byId("editWeekTitleInput").value = week.title || "";
  byId("editWeekEvalInput").value = week.evaluation || "";
  byId("editWeekSummaryInput").value = week.summary || "";
  byId("editWeekTopicsInput").value = Array.isArray(week.topics) ? week.topics.map(topicForEditing).join("\n") : "";

  MATERIAL_FIELDS.forEach((field) => {
    const kind = fileKind(field.kind);
    byId(field.toggleId).checked = field.isShown(week);
    byId(field.labelId).value = week[kind.label] || field.defaultLabel(pad);
    // Un archivo guardado dentro del panel (data:) no se muestra como enlace
    byId(field.urlId).value = (week[kind.urlKey] && !isStoredInPanel(week[kind.urlKey])) ? week[kind.urlKey] : "";
  });
}

/** Datos escritos en el formulario de la semana. */
function readWeekForm() {
  const form = {
    number: parseInt(byId("editWeekNumberInput").value, 10),
    unit: parseInt(byId("editWeekUnitSelect").value, 10),
    title: byId("editWeekTitleInput").value.trim(),
    evaluation: byId("editWeekEvalInput").value.trim(),
    summary: byId("editWeekSummaryInput").value.trim(),
    topics: byId("editWeekTopicsInput").value.split("\n").map((line) => line.trim()).filter(Boolean),
    materials: {}
  };
  MATERIAL_FIELDS.forEach((field) => {
    form.materials[field.kind] = {
      shown: byId(field.toggleId).checked,
      label: byId(field.labelId).value.trim(),
      url: byId(field.urlId).value.trim()
    };
  });
  return form;
}

/**
 * Aplica las casillas «mostrar». Si desmarcas algo que se estaba mostrando, queda en "ocultos" para que la
 * detección automática de archivos (que busca en las carpetas de GitHub) no lo vuelva a activar.
 */
function applyVisibility(week, form) {
  const wasShown = {};
  MATERIAL_FIELDS.forEach((field) => { wasShown[field.kind] = field.isShown(week); });

  week.ocultos = week.ocultos || {};
  MATERIAL_FIELDS.forEach((field) => {
    if (form.materials[field.kind].shown) delete week.ocultos[field.kind];
    else if (wasShown[field.kind]) week.ocultos[field.kind] = true;
  });
  if (!Object.keys(week.ocultos).length) delete week.ocultos;

  MATERIAL_FIELDS.forEach((field) => { week[fileKind(field.kind).flag] = form.materials[field.kind].shown; });
}

/**
 * Aplica nombres y enlaces. Pegar una URL NUEVA activa ese material; si la URL es la misma que ya estaba en
 * el campo (por ejemplo la que se autodetectó de GitHub), la casilla marcada o desmarcada decide.
 */
function applyMaterialLinks(week, form) {
  const urlBefore = {};
  MATERIAL_FIELDS.forEach((field) => { urlBefore[field.kind] = week[fileKind(field.kind).urlKey] || ""; });

  MATERIAL_FIELDS.forEach((field) => {
    const kind = fileKind(field.kind);
    const { label, url } = form.materials[field.kind];
    if (label) week[kind.label] = label;

    if (url) {
      week[kind.urlKey] = url;
      if (url !== urlBefore[field.kind]) {
        week[kind.flag] = true;
        if (week.ocultos) delete week.ocultos[field.kind];
      }
    } else if (!isStoredInPanel(week[kind.urlKey])) {
      week[kind.urlKey] = "";
    }
  });
  if (week.ocultos && !Object.keys(week.ocultos).length) delete week.ocultos;
}

/** Guarda los cambios de la semana elegida (contenido, unidad, número, materiales). */
function saveSelectedWeek() {
  const originalNumber = parseIntOr(byId("selectWeekEdit").value, 1);
  const week = appState.weeks.find((w) => w.week === originalNumber);
  if (!week) return;

  const form = readWeekForm();
  const newNumber = form.number || originalNumber;
  if (newNumber !== originalNumber && appState.weeks.some((w) => w.week === newNumber)) {
    showToast(`Ya existe la Semana ${newNumber}. Elige otro número de semana.`);
    return;
  }

  const newUnit = form.unit || week.unit;
  week.week = newNumber;
  week.unit = newUnit;
  week.unitName = UNIT_FULL_NAMES[newUnit] || week.unitName;
  if (form.title) week.title = form.title;
  if (form.evaluation) week.evaluation = form.evaluation;
  if (form.summary) week.summary = form.summary;
  if (form.topics.length > 0) week.topics = form.topics;
  applyVisibility(week, form);
  applyMaterialLinks(week, form);

  activeWeekNum = week.week;
  activeUnitNum = week.unit;
  sortWeeksInPlace();
  saveState();
  populateWeekSelectors(week.week);
  refreshContentViews();
  showToast(`Semana ${padWeek(week.week)} guardada correctamente`);
}

// ---------------------------------------------------------------------------
// Semanas nuevas y eliminadas
// ---------------------------------------------------------------------------
/** Semana nueva con texto de ejemplo para completar. */
function buildNewWeek(num, unit, title) {
  const pad = padWeek(num);
  return {
    week: num,
    unit: unit,
    unitName: UNIT_FULL_NAMES[unit] || UNIT_FULL_NAMES[1],
    title: title || `Sesión Académica de la Semana ${pad}`,
    subtitleSlide: `Desarrollo teórico y práctico — Semana ${pad}`,
    photoCaption: `Sesión ${pad} — Inteligencia Artificial FISI UNMSM`,
    topics: [
      `${num}.1 Fundamentos conceptuales y modelo teórico de la sesión`,
      `${num}.2 Algoritmos y formulación computacional`,
      `${num}.3 Casos de estudio aplicados en Ingeniería de Sistemas`,
      `${num}.4 Experimentación práctica en Python y Google Colab`
    ],
    evaluation: "Clase Teórica y Práctica de Laboratorio",
    summary: `Estudio de los fundamentos teóricos, modelado algorítmico e implementación práctica correspondientes a la Semana ${pad} de la asignatura de Inteligencia Artificial.`,
    hasPpt: true,
    hasWord: true,
    hasColab: true,
    pptLabel: `Clase${pad}_Sesion_IA.pptx`,
    pptUrl: "",
    docLabel: `Tarea${pad}_Informe_Academico.pdf`,
    docUrl: "",
    colabLabel: `Lab${pad}_Implementacion_IA.ipynb`,
    colabUrl: "",
    codeSnippet: `# Semana ${pad} — Laboratorio de Inteligencia Artificial (UNMSM)
import numpy as np
print("Laboratorio de la Semana ${pad} listo para ejecución")`,
    codeOutput: `Laboratorio de la Semana ${pad} listo para ejecución`
  };
}

/** Primer número de semana libre. */
function firstFreeWeekNumber() {
  const used = appState.weeks.map((w) => w.week);
  let candidate = 1;
  while (used.includes(candidate)) candidate++;
  return candidate;
}

function openNewWeekForm() {
  byId("newWeekNum").value = firstFreeWeekNumber();
  byId("newWeekUnit").value = String(parseIntOr(byId("editWeekUnitSelect").value, 1));
  byId("newWeekTitle").value = "";
  byId("newWeekForm").classList.remove("hidden");
  byId("newWeekNum").focus();
}

function createNewWeek() {
  const num = parseInt(byId("newWeekNum").value, 10);
  const unit = parseIntOr(byId("newWeekUnit").value, 1);
  const title = byId("newWeekTitle").value.trim();
  if (!Number.isInteger(num) || num < 1 || num > MAX_WEEK_NUMBER) {
    showToast(`El número de semana debe estar entre 1 y ${MAX_WEEK_NUMBER}`);
    return;
  }
  if (appState.weeks.some((w) => w.week === num)) {
    showToast(`Ya existe la Semana ${num}. Elige otro número.`);
    return;
  }
  appState.weeks.push(buildNewWeek(num, unit, title));
  sortWeeksInPlace();
  saveState();
  populateWeekSelectors(num);
  byId("newWeekForm").classList.add("hidden");
  refreshContentViews();
  showToast(`Semana ${padWeek(num)} creada en la Unidad ${unit}. Completa sus datos y pulsa «Publicar en GitHub»`);
}

function deleteSelectedWeek() {
  if (appState.weeks.length <= 1) {
    showToast("El portafolio debe conservar al menos una semana activa");
    return;
  }
  const weekNum = parseInt(byId("selectWeekEdit").value, 10);
  const index = appState.weeks.findIndex((w) => w.week === weekNum);
  if (index === -1) return;

  const removed = appState.weeks.splice(index, 1)[0];
  saveState();
  const fallbackWeek = appState.weeks[Math.min(index, appState.weeks.length - 1)]?.week || appState.weeks[0].week;
  if (activeWeekNum === removed.week) activeWeekNum = fallbackWeek;
  populateWeekSelectors(fallbackWeek);
  refreshContentViews();
  showToast(`Semana ${padWeek(removed.week)} eliminada del portafolio`);
}

// ---------------------------------------------------------------------------
// Perfil, restaurar y publicar
// ---------------------------------------------------------------------------
function saveProfile() {
  appState.studentName = byId("inputStudentName").value.trim() || DEFAULT_STATE.studentName;
  appState.studentEmail = byId("inputStudentEmail").value.trim() || DEFAULT_STATE.studentEmail;
  appState.groupBadge = byId("inputGroupBadge").value.trim() || DEFAULT_STATE.groupBadge;
  appState.profName = byId("inputProfName").value.trim() || DEFAULT_STATE.profName;
  saveState();
  renderProfileHeader();
  refreshActiveView();
  showToast("Datos institucionales guardados");
}

/** Descarta los cambios sin publicar de este navegador y vuelve a la versión publicada. */
function restorePublishedVersion() {
  appState = cloneJson(publishedState || DEFAULT_STATE);
  saveState();
  localStore.remove(STORAGE_KEYS.PENDING);
  refreshPendingNote();
  renderProfileHeader();
  refreshActiveView();
  populateWeekSelectors();
  showToast("Se restauró la versión publicada");
}

/** Publicar: copia los datos y abre el editor de GitHub en el archivo correcto. */
async function publishToGithub() {
  const json = JSON.stringify(stateForPersist(), null, 2);
  let copied = false;
  try {
    await navigator.clipboard.writeText(json);
    copied = true;
  } catch {
    // El navegador no deja copiar: se descarga el archivo en su lugar
  }
  if (copied) {
    showToast("Copiado. En GitHub: Ctrl+A, Ctrl+V y Commit changes");
  } else {
    triggerBlobDownload(new Blob([json], { type: "application/json" }), "portafolio.json");
    showToast("No pude copiar: se descargó portafolio.json. Pégalo/arrástralo en GitHub");
  }
  window.open(GITHUB_EDIT_DATA_URL, "_blank", "noopener");
}

function openGithubUpload(folder) {
  window.open(githubUploadUrl(folder), "_blank", "noopener");
}

// ---------------------------------------------------------------------------
// Conexión de los botones del panel
// ---------------------------------------------------------------------------
/** El panel NO tiene botón público: solo se abre entrando a la dirección con #creador. */
function bindCreatorModal() {
  const openIfRequested = () => {
    if (location.hash.toLowerCase() !== "#creador") return;
    populateWeekSelectors(activeWeekNum);
    refreshPendingNote();
    byId("creatorAdminModal").classList.remove("hidden");
  };
  window.addEventListener("hashchange", openIfRequested);
  setTimeout(openIfRequested, 300);

  byId("closeCreatorModalBtn").addEventListener("click", () => {
    byId("creatorAdminModal").classList.add("hidden");
    try {
      history.replaceState(null, "", location.pathname + location.search);
    } catch {
      // Algunos navegadores no permiten cambiar la dirección: el panel queda cerrado igual
    }
  });
}

function bindWeekEditor() {
  byId("selectWeekEdit").addEventListener("change", loadSelectedWeekIntoInputs);
  byId("saveWeekLinksBtn").addEventListener("click", saveSelectedWeek);
  byId("deleteSelectedWeekBtn").addEventListener("click", deleteSelectedWeek);
  byId("addNewWeekBtn").addEventListener("click", openNewWeekForm);
  byId("newWeekCancelBtn").addEventListener("click", () => byId("newWeekForm").classList.add("hidden"));
  byId("newWeekCreateBtn").addEventListener("click", createNewWeek);
}

function bindUploadButtons() {
  byId("uploadSyllabusGithubBtn").addEventListener("click", () => openGithubUpload(SYLLABUS_PATH));
  byId("selectFotoDestino").addEventListener("change", updateSuggestedPhotoName);
  byId("uploadPhotoBtn").addEventListener("click", () => openGithubUpload(IMAGES_PATH));
  byId("uploadWeekFilesBtn").addEventListener("click", () => {
    openGithubUpload(weekFolder(parseIntOr(byId("selectWeekEdit").value, 1)));
  });
}

/** Conecta todos los botones del panel del creador. */
function initCreatorPanel() {
  bindCreatorModal();
  byId("saveProfileBtn").addEventListener("click", saveProfile);
  bindWeekEditor();
  bindUploadButtons();
  byId("resetDefaultsBtn").addEventListener("click", restorePublishedVersion);
  byId("publishGithubBtn").addEventListener("click", publishToGithub);
}
