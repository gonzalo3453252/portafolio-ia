/* =============================================================================
   EVENTOS DE LA PÁGINA  (features/page-events.js)
   Conecta los botones públicos: navegación, menús desplegables (Unidades y Sílabo) y la ventana de
   previsualización. (Los botones del panel del creador están en creator-panel.js.)

   Los menús se abren al pasar el mouse en pantallas anchas (≥ 640 px) y con clic en celular.

   Depende de: navigation.js, preview-modal.js, syllabus.js, state.js. Expone: bindPageEvents.
   ============================================================================= */
"use strict";

const DESKTOP_MIN_WIDTH = 640;
const isDesktopWidth = () => window.innerWidth >= DESKTOP_MIN_WIDTH;

/** Menú que se abre con el mouse (solo en pantalla ancha) y se cierra al hacer clic fuera. */
function bindHoverDropdown(wrapperId, open, close) {
  const wrapper = byId(wrapperId);
  wrapper.addEventListener("mouseenter", () => { if (isDesktopWidth()) open(); });
  wrapper.addEventListener("mouseleave", () => { if (isDesktopWidth()) close(); });
  document.addEventListener("click", (event) => { if (!wrapper.contains(event.target)) close(); });
}

function bindHomeNavigation() {
  ["headerLogoHomeTrigger", "navBtnPresentacion", "breadcrumbWeekHomeIconBtn"].forEach((id) => {
    byId(id).addEventListener("click", showPresentacionPage);
  });
  byId("singleWeekUnitBreadcrumb").addEventListener("click", () => showSpecificUnitPage(activeUnitNum));
  byId("backToCurrentUnitInfoBtn").addEventListener("click", () => showSpecificUnitPage(activeUnitNum));
}

function bindUnitsDropdown() {
  const menu = byId("unitsDropdownMenu");
  bindHoverDropdown("unitsDropdownWrapper", openUnitsDropdown, closeUnitsDropdown);

  byId("unitsDropdownToggleBtn").addEventListener("click", (event) => {
    event.stopPropagation();
    if (isDesktopWidth()) showAllUnitsSummaryPage();
    else if (menu.classList.contains("hidden")) openUnitsDropdown();
    else closeUnitsDropdown();
  });

  document.querySelectorAll(".unit-dropdown-item").forEach((item) => {
    item.addEventListener("click", (event) => {
      event.stopPropagation();
      showSpecificUnitPage(parseIntOr(item.getAttribute("data-select-unit"), 1));
    });
  });

  document.querySelectorAll("[data-syllabus-goto-unit]").forEach((card) => {
    card.addEventListener("click", () => showSpecificUnitPage(parseIntOr(card.getAttribute("data-syllabus-goto-unit"), 1)));
  });
}

function bindSyllabusDropdown() {
  const menu = byId("syllabusDropdownMenu");
  bindHoverDropdown("syllabusDropdownWrapper", openSyllabusDropdown, closeSyllabusDropdown);

  byId("heroOpenSyllabusBtn").addEventListener("click", (event) => {
    event.stopPropagation();
    if (menu.classList.contains("hidden")) openSyllabusDropdown();
    else closeSyllabusDropdown();
  });
  byId("homePreviewSyllabusRowBtn").addEventListener("click", (event) => {
    event.stopPropagation();
    closeSyllabusDropdown();
    openSyllabusModal();
  });
  byId("homeDownloadSyllabusRowBtn").addEventListener("click", (event) => {
    event.stopPropagation();
    closeSyllabusDropdown();
    downloadSyllabusFile();
  });
}

function bindPreviewModal() {
  byId("closeFloatingPreviewBtn").addEventListener("click", closeFloatingPreviewModal);
  byId("floatingPreviewModal").addEventListener("click", (event) => {
    if (event.target.id === "floatingPreviewModal") closeFloatingPreviewModal();   // clic en el fondo oscuro
  });
  byId("floatingModalDownloadBtn").addEventListener("click", () => {
    if (typeof currentModalDownloadHandler === "function") currentModalDownloadHandler();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeFloatingPreviewModal();
  });
}

/** Conecta los botones y menús de la página pública. */
function bindPageEvents() {
  bindHomeNavigation();
  bindUnitsDropdown();
  bindSyllabusDropdown();
  bindPreviewModal();
}
