/* =============================================================================
   NAVEGACIÓN  (features/navigation.js)
   Cabecera, pestañas, menús desplegables y qué página se muestra:
     Presentación (inicio), Sílabo, Todas las unidades, Una unidad, Una semana.

   Solo una "vista" (<section id="view...">) se ve a la vez; las demás llevan la clase "hidden".

   Depende de: state.js, utils.js, data/units-and-topics.js, pages.js, syllabus.js.
   Expone: renderProfileHeader, show*Page, open/close*Dropdown.
   ============================================================================= */
"use strict";

const VIEW_IDS = ["viewPresentacion", "viewSilabo", "viewTodasUnidades", "viewUnidadEspecifica", "viewSemanaIndividual"];

/** Pestaña de la cabecera que se resalta según la página. */
const HEADER_TAB_IDS = {
  presentacion: "navBtnPresentacion",
  silabo: "heroOpenSyllabusBtn",
  unidades: "unitsDropdownToggleBtn"
};

// ---------------------------------------------------------------------------
// Cabecera con los datos del perfil
// ---------------------------------------------------------------------------
/** Pone en la página (cabecera, portada, pie) y en el panel los datos de autores y docente. */
function renderProfileHeader() {
  byId("navAuthorText").textContent = `${appState.studentName} — Cátedra: ${appState.profName}`;
  byId("heroGroupBadge").textContent = appState.groupBadge;

  const namesBox = byId("heroStudentName");
  if (appState.studentName.includes("·")) {
    namesBox.innerHTML = appState.studentName.split("·").map((name) => `<p>${escapeHtml(name.trim())}</p>`).join("");
  } else {
    namesBox.textContent = appState.studentName;
  }
  byId("cardProfName").textContent = appState.profName;
  byId("footerStudentLine").textContent = `Autores: ${appState.studentName}`;
  byId("footerProfLine").textContent = appState.profName;

  byId("inputStudentName").value = appState.studentName;
  byId("inputStudentEmail").value = appState.studentEmail;
  byId("inputGroupBadge").value = appState.groupBadge;
  byId("inputProfName").value = appState.profName;
}

// ---------------------------------------------------------------------------
// Menús desplegables
// ---------------------------------------------------------------------------
function setDropdownOpen(menuId, toggleId, isOpen) {
  const menu = byId(menuId);
  const toggle = byId(toggleId);
  if (menu) menu.classList.toggle("hidden", !isOpen);
  if (toggle) toggle.setAttribute("aria-expanded", String(isOpen));
}

function openSyllabusDropdown() {
  closeUnitsDropdown();
  const rowTitle = byId("syllabusRowFileTitle");
  if (rowTitle) rowTitle.textContent = syllabusDisplayName();
  setDropdownOpen("syllabusDropdownMenu", "heroOpenSyllabusBtn", true);
}

function closeSyllabusDropdown() {
  setDropdownOpen("syllabusDropdownMenu", "heroOpenSyllabusBtn", false);
}

function openUnitsDropdown() {
  closeSyllabusDropdown();
  setDropdownOpen("unitsDropdownMenu", "unitsDropdownToggleBtn", true);
}

function closeUnitsDropdown() {
  setDropdownOpen("unitsDropdownMenu", "unitsDropdownToggleBtn", false);
}

// ---------------------------------------------------------------------------
// Cambio de página
// ---------------------------------------------------------------------------
function hideAllViews() {
  VIEW_IDS.forEach((id) => {
    const view = byId(id);
    if (view) view.classList.add("hidden");
  });
}

function setActiveHeaderTab(tabKey) {
  Object.keys(HEADER_TAB_IDS).forEach((key) => {
    const tab = byId(HEADER_TAB_IDS[key]);
    if (tab) tab.classList.toggle("nav-link-active", key === tabKey);
  });
}

/**
 * Muestra una vista y deja la cabecera lista.
 * @param {string} viewId     vista que se muestra
 * @param {string} tabKey     pestaña que se resalta (clave de HEADER_TAB_IDS)
 * @param {string} unitsLabel texto del botón "Unidades" (el de la unidad abierta, o "Unidades")
 */
function showView(viewId, tabKey, unitsLabel) {
  hideAllViews();
  byId(viewId).classList.remove("hidden");
  setActiveHeaderTab(tabKey);
  byId("unitsDropdownLabel").textContent = unitsLabel;
  closeUnitsDropdown();
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "instant" });
}

function showSilaboPage() {
  activePage = "silabo";
  showView("viewSilabo", "silabo", "Unidades");
  const rowTitle = byId("syllabusRowFileTitle");
  if (rowTitle) rowTitle.textContent = syllabusDisplayName();
  const profName = byId("syllabusViewProfName");
  if (profName) profName.textContent = appState.profName;
  scrollToTop();
}

function showPresentacionPage() {
  activePage = "presentacion";
  showView("viewPresentacion", "presentacion", "Unidades");
  scrollToTop();
}

function showAllUnitsSummaryPage() {
  activePage = "todas-unidades";
  showView("viewTodasUnidades", "unidades", "Unidades");
  renderAllUnitsSummary();
  scrollToTop();
}

function showSpecificUnitPage(unitNum) {
  activePage = "unidad-especifica";
  activeUnitNum = parseIntOr(unitNum, 1);
  const unitWeeks = appState.weeks.filter((w) => w.unit === activeUnitNum);
  activeWeekNum = unitWeeks[0]?.week || 1;

  showView("viewUnidadEspecifica", "unidades", (UNITS_INFO[activeUnitNum] || UNITS_INFO[1]).roman);
  renderSpecificUnitView();
  scrollToTop();
}

function showSingleWeekPage(weekNum) {
  activePage = "semana-individual";
  activeWeekNum = parseIntOr(weekNum, 1);
  activeUnitNum = getWeek(activeWeekNum).unit;

  showView("viewSemanaIndividual", "unidades", (UNITS_INFO[activeUnitNum] || UNITS_INFO[1]).roman);
  renderSingleWeekView();
  scrollToTop();
}
