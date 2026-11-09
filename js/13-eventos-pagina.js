/* =============================================================================
   EVENTOS DE LA PÁGINA
   Conecta los botones públicos: tamaño de letra, menús, navegación, ventanas y el desplegable del sílabo.
   ============================================================================= */

// Conecta los botones y menús de la página pública
function iniciarEventosPagina() {
  document.getElementById("fontIncreaseBtn").addEventListener("click", () => {
    baseFontScale = Math.min(115, baseFontScale + 5);
    document.documentElement.style.fontSize = `${baseFontScale}%`;
  });
  document.getElementById("fontDecreaseBtn").addEventListener("click", () => {
    baseFontScale = Math.max(90, baseFontScale - 5);
    document.documentElement.style.fontSize = `${baseFontScale}%`;
  });
  document.getElementById("fontResetBtn").addEventListener("click", () => {
    baseFontScale = 100;
    document.documentElement.style.fontSize = "100%";
  });

  document.getElementById("headerLogoHomeTrigger").addEventListener("click", showPresentacionPage);
  document.getElementById("navBtnPresentacion").addEventListener("click", showPresentacionPage);
  document.getElementById("breadcrumbWeekHomeIconBtn").addEventListener("click", showPresentacionPage);
  document.getElementById("singleWeekUnitBreadcrumb").addEventListener("click", () => {
    showSpecificUnitPage(activeUnitNum);
  });

  const dropdownWrapper = document.getElementById("unitsDropdownWrapper");
  const dropdownToggle = document.getElementById("unitsDropdownToggleBtn");
  const dropdownMenu = document.getElementById("unitsDropdownMenu");

  dropdownWrapper.addEventListener("mouseenter", () => {
    if (window.innerWidth >= 640) openUnitsDropdown();
  });

  dropdownWrapper.addEventListener("mouseleave", () => {
    if (window.innerWidth >= 640) closeUnitsDropdown();
  });

  dropdownToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    if (window.innerWidth < 640) {
      if (dropdownMenu.classList.contains("hidden")) {
        openUnitsDropdown();
      } else {
        closeUnitsDropdown();
      }
    } else {
      showAllUnitsSummaryPage();
    }
  });

  document.addEventListener("click", (e) => {
    if (!dropdownWrapper.contains(e.target)) {
      closeUnitsDropdown();
    }
  });

  document.querySelectorAll(".unit-dropdown-item").forEach(item => {
    item.addEventListener("click", (e) => {
      e.stopPropagation();
      const uNum = parseInt(item.getAttribute("data-select-unit"), 10) || 1;
      showSpecificUnitPage(uNum);
    });
  });

  document.getElementById("backToCurrentUnitInfoBtn").addEventListener("click", () => {
    showSpecificUnitPage(activeUnitNum);
  });

  document.getElementById("closeFloatingPreviewBtn").addEventListener("click", closeFloatingPreviewModal);
  document.getElementById("floatingPreviewModal").addEventListener("click", (e) => {
    if (e.target.id === "floatingPreviewModal") {
      closeFloatingPreviewModal();
    }
  });
  document.getElementById("floatingModalDownloadBtn").addEventListener("click", () => {
    if (typeof currentModalDownloadHandler === "function") {
      currentModalDownloadHandler();
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeFloatingPreviewModal();
    }
  });

  // Desplegable rápido del Sílabo (hover en PC y clic en móvil/PC) solo con Previsualizar y Descargar
  const syllabusWrapper = document.getElementById("syllabusDropdownWrapper");
  const syllabusToggle = document.getElementById("heroOpenSyllabusBtn");
  const syllabusMenu = document.getElementById("syllabusDropdownMenu");

  syllabusWrapper.addEventListener("mouseenter", () => {
    if (window.innerWidth >= 640) openSyllabusDropdown();
  });

  syllabusWrapper.addEventListener("mouseleave", () => {
    if (window.innerWidth >= 640) closeSyllabusDropdown();
  });

  syllabusToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    if (syllabusMenu.classList.contains("hidden")) {
      openSyllabusDropdown();
    } else {
      closeSyllabusDropdown();
    }
  });

  document.addEventListener("click", (e) => {
    if (syllabusWrapper && !syllabusWrapper.contains(e.target)) {
      closeSyllabusDropdown();
    }
  });

  document.getElementById("heroSyllabusQuickBtn").addEventListener("click", openSyllabusModal);
  document.getElementById("homePreviewSyllabusRowBtn").addEventListener("click", (e) => {
    e.stopPropagation();
    closeSyllabusDropdown();
    openSyllabusModal();
  });
  document.getElementById("homeDownloadSyllabusRowBtn").addEventListener("click", (e) => {
    e.stopPropagation();
    closeSyllabusDropdown();
    downloadSyllabusFile();
  });

  document.querySelectorAll("[data-syllabus-goto-unit]").forEach(card => {
    card.addEventListener("click", () => {
      const uNum = parseInt(card.getAttribute("data-syllabus-goto-unit"), 10) || 1;
      showSpecificUnitPage(uNum);
    });
  });
}
