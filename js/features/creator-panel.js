/* =============================================================================
   PANEL DEL CREADOR
   Todo lo que hace el panel que solo tú ves (entrando con #creador): editar perfil, semanas y unidades,
   subir archivos a GitHub y publicar los cambios.
   ============================================================================= */

function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function triggerDataDownload(dataUrl, filename) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showToast(`Archivo ${filename} descargado`);
}

const UNIT_FULL_NAMES = {
  1: "Unidad I · Fundamentos de la IA y Agentes",
  2: "Unidad II · Búsquedas en Espacios de Estados y Juegos",
  3: "Unidad III · Machine Learning",
  4: "Unidad IV · Deep Learning",
  5: "Unidad V · IA Generativa, Ética y Futuro de la IA"
};

function sortWeeksInPlace() {
  appState.weeks.sort((a, b) => (a.week || 0) - (b.week || 0));
}

function populateWeekSelectors(selectedWeekNum) {
  sortWeeksInPlace();
  const editSel = document.getElementById("selectWeekEdit");
  if (!editSel) return;
  editSel.innerHTML = "";
  appState.weeks.forEach(w => {
    const opt = document.createElement("option");
    opt.value = w.week;
    opt.textContent = `Semana ${String(w.week).padStart(2, "0")} (U${w.unit}): ${w.title}`;
    editSel.appendChild(opt);
  });
  if (selectedWeekNum && appState.weeks.some(w => w.week === selectedWeekNum)) {
    editSel.value = String(selectedWeekNum);
  }
  loadSelectedWeekIntoInputs();
  populatePhotoTargets();
}

// Lista del panel «Cambiar fotos»: portada, unidades y semanas, con el nombre que debe tener el archivo
function populatePhotoTargets() {
  const sel = document.getElementById("selectFotoDestino");
  if (!sel) return;
  const previo = sel.value;
  const opciones = [
    ["portada-facultad", "Portada · foto de la facultad"],
    ["portada-docente", "Portada · foto del docente"]
  ];
  [1, 2, 3, 4, 5].forEach(u => opciones.push(["unidad-" + u, UNITS_INFO[u].roman + " · " + UNITS_INFO[u].title]));
  appState.weeks.forEach(w => opciones.push(["semana-" + String(w.week).padStart(2, "0"), "Semana " + String(w.week).padStart(2, "0") + " · " + w.title]));
  sel.innerHTML = "";
  opciones.forEach(([valor, texto]) => {
    const opt = document.createElement("option");
    opt.value = valor;
    opt.textContent = texto;
    sel.appendChild(opt);
  });
  if (previo && opciones.some(o => o[0] === previo)) sel.value = previo;
  updateSuggestedPhotoName();
}

function updateSuggestedPhotoName() {
  const sel = document.getElementById("selectFotoDestino");
  const el = document.getElementById("fotoNombreSugerido");
  if (sel && el) el.textContent = sel.value + ".jpg";
}

function loadSelectedWeekIntoInputs() {
  const editSel = document.getElementById("selectWeekEdit");
  const weekNum = parseInt(editSel?.value, 10) || (appState.weeks[0]?.week || 1);
  const found = appState.weeks.find(w => w.week === weekNum) || appState.weeks[0];
  if (!found) return;

  document.getElementById("editWeekNumberInput").value = found.week;
  document.getElementById("editWeekUnitSelect").value = String(found.unit || 1);
  const upBtn = document.getElementById("uploadWeekFilesBtn");
  if (upBtn) upBtn.textContent = `Subir archivos de la Semana ${String(found.week).padStart(2, "0")} a GitHub`;
  document.getElementById("editWeekTitleInput").value = found.title || "";
  document.getElementById("editWeekEvalInput").value = found.evaluation || "";
  document.getElementById("editWeekSummaryInput").value = found.summary || "";
  document.getElementById("editWeekTopicsInput").value = Array.isArray(found.topics) ? found.topics.map(topicForEditing).join(String.fromCharCode(10)) : "";

  document.getElementById("toggleHasPpt").checked = found.hasPpt !== false;
  document.getElementById("toggleHasWord").checked = Boolean(found.hasWord);
  document.getElementById("toggleHasColab").checked = found.hasColab !== false;

  document.getElementById("inputWeekPptLabel").value = found.pptLabel || `Clase${String(found.week).padStart(2, "0")}_IA.pptx`;
  document.getElementById("inputWeekDocLabel").value = found.docLabel || `Informe_Semana${String(found.week).padStart(2, "0")}.pdf`;
  document.getElementById("inputWeekColabLabel").value = found.colabLabel || `Lab${String(found.week).padStart(2, "0")}_IA.ipynb`;

  document.getElementById("inputWeekPptUrl").value = found.pptUrl && !found.pptUrl.startsWith("data:") ? found.pptUrl : "";
  document.getElementById("inputWeekDocUrl").value = found.docUrl && !found.docUrl.startsWith("data:") ? found.docUrl : "";
  document.getElementById("inputWeekColabUrl").value = found.colabUrl && !found.colabUrl.startsWith("data:") ? found.colabUrl : "";

}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Descarga el sílabo (el subido por ti o el oficial incluido)
function downloadSyllabusFile() {
  if (appState.syllabusDataUrl && !syllabusDetected) {
    triggerDataDownload(appState.syllabusDataUrl, syllabusDisplayName());
    return;
  }
  triggerLinkDownload(syllabusPdfUrl(), syllabusDisplayName());
}

// Estado publicado por el creador (lo guarda el botón "Publicar en GitHub" del panel)
async function loadPublishedState() {
  try {
    const r = await fetch(PUBLISHED_DATA_PATH, { cache: "no-cache" });
    const ct = (r.headers.get("content-type") || "").toLowerCase();
    if (r.ok && ct.includes("json")) {
      const d = await r.json();
      if (d && Array.isArray(d.weeks) && d.weeks.length > 0 && d.studentName) {
        window.__CUSTOM_PORTFOLIO_STATE__ = d;
      }
    }
  } catch (e) {}
}

// Publicar: copia los datos y abre el editor de GitHub en el archivo correcto
async function publishToGithub() {
  const json = JSON.stringify(stateForPersist(), null, 2);
  let copied = false;
  try { await navigator.clipboard.writeText(json); copied = true; } catch (e) {}
  if (!copied) {
    triggerBlobDownload(new Blob([json], { type: "application/json" }), "portafolio.json");
    showToast("No pude copiar: se descargó portafolio.json. Pégalo/arrástralo en GitHub");
  } else {
    showToast("Copiado. En GitHub: Ctrl+A, Ctrl+V y Commit changes");
  }
  window.open(GITHUB_EDIT_DATA_URL, "_blank", "noopener");
}


// Conecta todos los botones del panel del creador
function initCreatorPanel() {
  // Panel del creador: NO hay botón público. Solo se abre entrando a la URL con #creador
  function openCreatorFromHash() {
    if (location.hash.toLowerCase() === "#creador") {
      populateWeekSelectors(activeWeekNum);
      refreshPendingNote();
      document.getElementById("creatorAdminModal").classList.remove("hidden");
    }
  }
  window.addEventListener("hashchange", openCreatorFromHash);
  setTimeout(openCreatorFromHash, 300);
  document.getElementById("closeCreatorModalBtn").addEventListener("click", () => {
    document.getElementById("creatorAdminModal").classList.add("hidden");
    try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {}
  });

  document.getElementById("saveProfileBtn").addEventListener("click", () => {
    appState.studentName = document.getElementById("inputStudentName").value.trim() || DEFAULT_STATE.studentName;
    appState.studentEmail = document.getElementById("inputStudentEmail").value.trim() || DEFAULT_STATE.studentEmail;
    appState.groupBadge = document.getElementById("inputGroupBadge").value.trim() || DEFAULT_STATE.groupBadge;
    appState.profName = document.getElementById("inputProfName").value.trim() || DEFAULT_STATE.profName;
    saveState();
    renderProfileHeader();
    if (activePage === "silabo") showSilaboPage();
    if (activePage === "todas-unidades") renderAllUnitsSummary();
    if (activePage === "unidad-especifica") renderSpecificUnitView();
    if (activePage === "semana-individual") renderSingleWeekView();
    showToast("Datos institucionales guardados");
  });

  document.getElementById("selectWeekEdit").addEventListener("change", loadSelectedWeekIntoInputs);

  // Agregar una Nueva Semana (tú eliges número y unidad)
  function buildNewWeek(num, unit, titleVal) {
    const pad = String(num).padStart(2, "0");
    return {
      week: num,
      unit: unit,
      unitName: UNIT_FULL_NAMES[unit] || UNIT_FULL_NAMES[1],
      title: titleVal || `Sesión Académica de la Semana ${pad}`,
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

  document.getElementById("addNewWeekBtn").addEventListener("click", () => {
    const used = appState.weeks.map(w => w.week);
    let suggested = 1;
    while (used.includes(suggested)) suggested++;
    document.getElementById("newWeekNum").value = suggested;
    document.getElementById("newWeekUnit").value = String(parseInt(document.getElementById("editWeekUnitSelect").value, 10) || 1);
    document.getElementById("newWeekTitle").value = "";
    document.getElementById("newWeekForm").classList.remove("hidden");
    document.getElementById("newWeekNum").focus();
  });

  document.getElementById("newWeekCancelBtn").addEventListener("click", () => {
    document.getElementById("newWeekForm").classList.add("hidden");
  });

  document.getElementById("newWeekCreateBtn").addEventListener("click", () => {
    const num = parseInt(document.getElementById("newWeekNum").value, 10);
    const unit = parseInt(document.getElementById("newWeekUnit").value, 10) || 1;
    const titleVal = document.getElementById("newWeekTitle").value.trim();
    if (!Number.isInteger(num) || num < 1 || num > 32) {
      showToast("El número de semana debe estar entre 1 y 32");
      return;
    }
    if (appState.weeks.some(w => w.week === num)) {
      showToast(`Ya existe la Semana ${num}. Elige otro número.`);
      return;
    }
    appState.weeks.push(buildNewWeek(num, unit, titleVal));
    sortWeeksInPlace();
    saveState();
    populateWeekSelectors(num);
    document.getElementById("newWeekForm").classList.add("hidden");
    if (activePage === "todas-unidades") renderAllUnitsSummary();
    if (activePage === "unidad-especifica") renderSpecificUnitView();
    if (activePage === "semana-individual") renderSingleWeekView();
    showToast(`Semana ${String(num).padStart(2, "0")} creada en la Unidad ${unit}. Completa sus datos y pulsa «Publicar en GitHub»`);
  });

  document.getElementById("uploadSyllabusGithubBtn").addEventListener("click", () => {
    window.open(githubUploadUrl(SYLLABUS_PATH), "_blank", "noopener");
  });

  document.getElementById("selectFotoDestino").addEventListener("change", updateSuggestedPhotoName);
  document.getElementById("uploadPhotoBtn").addEventListener("click", () => {
    window.open(githubUploadUrl(IMAGES_PATH), "_blank", "noopener");
  });
  document.getElementById("uploadWeekFilesBtn").addEventListener("click", () => {
    const weekNum = parseInt(document.getElementById("selectWeekEdit").value, 10) || 1;
    window.open(githubUploadUrl(weekFolder(weekNum)), "_blank", "noopener");
  });

  // Quitar / Eliminar la Semana Seleccionada
  document.getElementById("deleteSelectedWeekBtn").addEventListener("click", () => {
    if (appState.weeks.length <= 1) {
      showToast("El portafolio debe conservar al menos una semana activa");
      return;
    }
    const weekNum = parseInt(document.getElementById("selectWeekEdit").value, 10);
    const idx = appState.weeks.findIndex(w => w.week === weekNum);
    if (idx === -1) return;

    const removed = appState.weeks.splice(idx, 1)[0];
    saveState();
    const fallbackWeek = appState.weeks[Math.min(idx, appState.weeks.length - 1)]?.week || appState.weeks[0].week;
    if (activeWeekNum === removed.week) {
      activeWeekNum = fallbackWeek;
    }
    populateWeekSelectors(fallbackWeek);
    if (activePage === "todas-unidades") renderAllUnitsSummary();
    if (activePage === "unidad-especifica") renderSpecificUnitView();
    if (activePage === "semana-individual") renderSingleWeekView();
    showToast(`Semana ${String(removed.week).padStart(2, "0")} eliminada del portafolio`);
  });

  // Guardar cambios de contenido, unidad, número y archivos de la Semana Seleccionada
  document.getElementById("saveWeekLinksBtn").addEventListener("click", async () => {
    const origWeekNum = parseInt(document.getElementById("selectWeekEdit").value, 10) || 1;
    const target = appState.weeks.find(w => w.week === origWeekNum);
    if (!target) return;

    const newWeekNum = parseInt(document.getElementById("editWeekNumberInput").value, 10) || origWeekNum;
    if (newWeekNum !== origWeekNum && appState.weeks.some(w => w.week === newWeekNum)) {
      showToast(`Ya existe la Semana ${newWeekNum}. Elige otro número de semana.`);
      return;
    }

    const newUnitNum = parseInt(document.getElementById("editWeekUnitSelect").value, 10) || target.unit;
    target.week = newWeekNum;
    target.unit = newUnitNum;
    target.unitName = UNIT_FULL_NAMES[newUnitNum] || target.unitName;

    const titleVal = document.getElementById("editWeekTitleInput").value.trim();
    const evalVal = document.getElementById("editWeekEvalInput").value.trim();
    const summaryVal = document.getElementById("editWeekSummaryInput").value.trim();
    const topicsLines = document.getElementById("editWeekTopicsInput").value
      .split(String.fromCharCode(10))
      .map(line => line.trim())
      .filter(Boolean);

    if (titleVal) target.title = titleVal;
    if (evalVal) target.evaluation = evalVal;
    if (summaryVal) target.summary = summaryVal;
    if (topicsLines.length > 0) target.topics = topicsLines;

    // Las casillas mandan. Si desmarcas algo que se estaba mostrando, queda en "ocultos" para que
    // la detección automática de archivos (que busca en las carpetas de GitHub) no lo vuelva a activar.
    const antes = {
      ppt: target.hasPpt !== false,
      doc: Boolean(target.hasWord),
      colab: target.hasColab !== false
    };
    const ahora = {
      ppt: document.getElementById("toggleHasPpt").checked,
      doc: document.getElementById("toggleHasWord").checked,
      colab: document.getElementById("toggleHasColab").checked
    };
    target.ocultos = target.ocultos || {};
    Object.keys(ahora).forEach((k) => {
      if (ahora[k]) delete target.ocultos[k];
      else if (antes[k]) target.ocultos[k] = true;
    });
    if (!Object.keys(target.ocultos).length) delete target.ocultos;
    target.hasPpt = ahora.ppt;
    target.hasWord = ahora.doc;
    target.hasColab = ahora.colab;

    const urlAntes = { ppt: target.pptUrl || "", doc: target.docUrl || "", colab: target.colabUrl || "" };

    const pptLabelVal = document.getElementById("inputWeekPptLabel").value.trim();
    const docLabelVal = document.getElementById("inputWeekDocLabel").value.trim();
    const colabLabelVal = document.getElementById("inputWeekColabLabel").value.trim();
    if (pptLabelVal) target.pptLabel = pptLabelVal;
    if (docLabelVal) target.docLabel = docLabelVal;
    if (colabLabelVal) target.colabLabel = colabLabelVal;

    const pptInputUrl = document.getElementById("inputWeekPptUrl").value.trim();
    const docInputUrl = document.getElementById("inputWeekDocUrl").value.trim();
    const colabInputUrl = document.getElementById("inputWeekColabUrl").value.trim();

    // Pegar una URL NUEVA activa ese archivo. Si la URL es la misma que ya estaba en la casilla
    // (por ejemplo la que se autodetectó de GitHub), la casilla marcada/desmarcada decide.
    if (pptInputUrl) { target.pptUrl = pptInputUrl; if (pptInputUrl !== urlAntes.ppt) { target.hasPpt = true; if (target.ocultos) delete target.ocultos.ppt; } }
    else if (!target.pptUrl || !target.pptUrl.startsWith("data:")) { target.pptUrl = ""; }

    if (docInputUrl) { target.docUrl = docInputUrl; if (docInputUrl !== urlAntes.doc) { target.hasWord = true; if (target.ocultos) delete target.ocultos.doc; } }
    else if (!target.docUrl || !target.docUrl.startsWith("data:")) { target.docUrl = ""; }

    if (colabInputUrl) { target.colabUrl = colabInputUrl; if (colabInputUrl !== urlAntes.colab) { target.hasColab = true; if (target.ocultos) delete target.ocultos.colab; } }
    else if (!target.colabUrl || !target.colabUrl.startsWith("data:")) { target.colabUrl = ""; }
    if (target.ocultos && !Object.keys(target.ocultos).length) delete target.ocultos;

    activeWeekNum = target.week;
    activeUnitNum = target.unit;
    sortWeeksInPlace();
    saveState();
    populateWeekSelectors(target.week);
    if (activePage === "todas-unidades") renderAllUnitsSummary();
    if (activePage === "unidad-especifica") renderSpecificUnitView();
    if (activePage === "semana-individual") renderSingleWeekView();
    showToast(`Semana ${String(target.week).padStart(2, "0")} guardada correctamente`);
  });

  document.getElementById("resetDefaultsBtn").addEventListener("click", () => {
    appState = JSON.parse(JSON.stringify(window.__CUSTOM_PORTFOLIO_STATE__ || DEFAULT_STATE));
    saveState();
    try { localStorage.removeItem(PENDING_KEY); } catch (e) {}
    refreshPendingNote();
    renderProfileHeader();
    if (activePage === "silabo") showSilaboPage();
    if (activePage === "todas-unidades") renderAllUnitsSummary();
    if (activePage === "unidad-especifica") renderSpecificUnitView();
    if (activePage === "semana-individual") renderSingleWeekView();
    populateWeekSelectors();
    showToast("Se restauró la versión publicada");
  });

  document.getElementById("publishGithubBtn").addEventListener("click", publishToGithub);
}
