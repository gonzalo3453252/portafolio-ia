/* =============================================================================
   NAVEGACIÓN
   Cabecera y pestañas, menús desplegables, y qué página se muestra:
   Presentación, Sílabo, Todas las unidades, Unidad y Semana.
   ============================================================================= */

function renderProfileHeader() {
  document.getElementById("navAuthorText").textContent = `${appState.studentName} — Cátedra: ${appState.profName}`;
  document.getElementById("heroGroupBadge").textContent = appState.groupBadge;
  const heroNamesEl = document.getElementById("heroStudentName");
  if (appState.studentName.includes("·")) {
    heroNamesEl.innerHTML = appState.studentName.split("·").map(n => `<p>${escapeHtml(n.trim())}</p>`).join("");
  } else {
    heroNamesEl.textContent = appState.studentName;
  }
  document.getElementById("cardProfName").textContent = appState.profName;
  document.getElementById("footerStudentLine").textContent = `Autores: ${appState.studentName}`;
  document.getElementById("footerProfLine").textContent = appState.profName;

  document.getElementById("inputStudentName").value = appState.studentName;
  document.getElementById("inputStudentEmail").value = appState.studentEmail;
  document.getElementById("inputGroupBadge").value = appState.groupBadge;
  document.getElementById("inputProfName").value = appState.profName;
}

function hideAllViews() {
  [
    "viewPresentacion",
    "viewSilabo",
    "viewTodasUnidades",
    "viewUnidadEspecifica",
    "viewSemanaIndividual"
  ].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add("hidden");
  });
}

function setActiveHeaderTab(tabKey) {
  const mapping = {
    presentacion: document.getElementById("navBtnPresentacion"),
    silabo: document.getElementById("heroOpenSyllabusBtn"),
    unidades: document.getElementById("unitsDropdownToggleBtn")
  };
  Object.keys(mapping).forEach(k => {
    if (mapping[k]) {
      if (k === tabKey) mapping[k].classList.add("nav-link-active");
      else mapping[k].classList.remove("nav-link-active");
    }
  });
}

function showSilaboPage() {
  activePage = "silabo";
  hideAllViews();
  document.getElementById("viewSilabo").classList.remove("hidden");
  setActiveHeaderTab("silabo");
  document.getElementById("unitsDropdownLabel").textContent = "Unidades";
  const rowTitle = document.getElementById("syllabusRowFileTitle");
  if (rowTitle) {
    rowTitle.textContent = syllabusDisplayName();
  }
  const profEl = document.getElementById("syllabusViewProfName");
  if (profEl) {
    profEl.textContent = appState.profName;
  }
  closeUnitsDropdown();
  window.scrollTo({ top: 0, behavior: "instant" });
}

function openSyllabusDropdown() {
  closeUnitsDropdown();
  const menu = document.getElementById("syllabusDropdownMenu");
  const toggle = document.getElementById("heroOpenSyllabusBtn");
  const rowTitle = document.getElementById("syllabusRowFileTitle");
  if (rowTitle) {
    rowTitle.textContent = syllabusDisplayName();
  }
  if (menu) menu.classList.remove("hidden");
  if (toggle) toggle.setAttribute("aria-expanded", "true");
}

function closeSyllabusDropdown() {
  const menu = document.getElementById("syllabusDropdownMenu");
  const toggle = document.getElementById("heroOpenSyllabusBtn");
  if (menu) menu.classList.add("hidden");
  if (toggle) toggle.setAttribute("aria-expanded", "false");
}

function openUnitsDropdown() {
  closeSyllabusDropdown();
  const menu = document.getElementById("unitsDropdownMenu");
  const toggle = document.getElementById("unitsDropdownToggleBtn");
  if (menu) menu.classList.remove("hidden");
  if (toggle) toggle.setAttribute("aria-expanded", "true");
}

function closeUnitsDropdown() {
  const menu = document.getElementById("unitsDropdownMenu");
  const toggle = document.getElementById("unitsDropdownToggleBtn");
  if (menu) menu.classList.add("hidden");
  if (toggle) toggle.setAttribute("aria-expanded", "false");
}

function showPresentacionPage() {
  activePage = "presentacion";
  hideAllViews();
  document.getElementById("viewPresentacion").classList.remove("hidden");
  setActiveHeaderTab("presentacion");
  document.getElementById("unitsDropdownLabel").textContent = "Unidades";
  closeUnitsDropdown();
  window.scrollTo({ top: 0, behavior: "instant" });
}

function showAllUnitsSummaryPage() {
  activePage = "todas-unidades";
  hideAllViews();
  document.getElementById("viewTodasUnidades").classList.remove("hidden");
  setActiveHeaderTab("unidades");
  document.getElementById("unitsDropdownLabel").textContent = "Unidades";
  closeUnitsDropdown();
  renderAllUnitsSummary();
  window.scrollTo({ top: 0, behavior: "instant" });
}

function showSpecificUnitPage(unitNum) {
  activePage = "unidad-especifica";
  activeUnitNum = parseInt(unitNum, 10) || 1;
  const unitWeeks = appState.weeks.filter(w => w.unit === activeUnitNum);
  activeWeekNum = unitWeeks[0]?.week || 1;

  hideAllViews();
  document.getElementById("viewUnidadEspecifica").classList.remove("hidden");
  setActiveHeaderTab("unidades");

  const uInfo = UNITS_INFO[activeUnitNum] || UNITS_INFO[1];
  document.getElementById("unitsDropdownLabel").textContent = uInfo.roman;
  closeUnitsDropdown();

  renderSpecificUnitView();
  window.scrollTo({ top: 0, behavior: "instant" });
}

function showSingleWeekPage(weekNum) {
  activePage = "semana-individual";
  activeWeekNum = parseInt(weekNum, 10) || 1;
  const found = appState.weeks.find(w => w.week === activeWeekNum) || appState.weeks[0];
  activeUnitNum = found.unit;

  hideAllViews();
  document.getElementById("viewSemanaIndividual").classList.remove("hidden");
  setActiveHeaderTab("unidades");

  const uInfo = UNITS_INFO[activeUnitNum] || UNITS_INFO[1];
  document.getElementById("unitsDropdownLabel").textContent = uInfo.roman;
  closeUnitsDropdown();

  renderSingleWeekView();
  window.scrollTo({ top: 0, behavior: "instant" });
}
