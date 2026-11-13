/* =============================================================================
   PÁGINAS DE CONTENIDO  (features/pages.js)
   Dibuja las tres páginas que cambian según los datos:
     1. Todas las unidades  (renderAllUnitsSummary)
     2. Una unidad con sus semanas  (renderSpecificUnitView)
     3. Una semana con sus temas y materiales  (renderSingleWeekView)

   Cada función arma el HTML con pequeñas funciones build...Html() y lo inserta en el contenedor.
   Todo texto que viene de los datos pasa por escapeHtml().

   Depende de: state.js, utils.js, photos.js, data/units-and-topics.js, navigation.js, demo-viewers.js,
               real-viewers.js. Expone: renderAllUnitsSummary, renderSpecificUnitView, renderSingleWeekView.
   ============================================================================= */
"use strict";

const UNIT_NUMBERS = [1, 2, 3, 4, 5];

// ---------------------------------------------------------------------------
// 1. TODAS LAS UNIDADES
// ---------------------------------------------------------------------------
function buildUnitRowHtml(unitNum, unitInfo, unitWeeks) {
  const photoSrc = getUnitPhotoSrc(unitNum, unitWeeks[0]?.week);
  const weeksText = unitWeeks.map((w) => "Semana " + padWeek(w.week)).join("  ·  ");
  return `
      <div class="lg:col-span-5 overflow-hidden rounded-2xl">
        <img src="${photoSrc}" data-foto="unidad-${unitNum}" alt="${escapeHtml(unitInfo.title)}" class="w-full h-56 sm:h-64 object-cover object-center max-w-full rounded-2xl shadow-xs group-hover:scale-[1.01] transition-transform duration-300" />
      </div>
      <div class="lg:col-span-7 flex flex-col justify-between space-y-4">
        <div class="space-y-2">
          <div class="flex items-center gap-3">
            <p class="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">${escapeHtml(unitInfo.roman)}</p>
            <span class="h-px w-12 bg-slate-200"></span>
          </div>
          <h3 class="text-2xl sm:text-3xl font-extrabold text-[#0f172a] group-hover:opacity-75 display-heading transition-opacity leading-tight">
            ${escapeHtml(unitInfo.title)}
          </h3>
          <p class="text-sm sm:text-base font-normal text-slate-600 leading-relaxed">
            ${escapeHtml(unitInfo.summary)}
          </p>
        </div>
        <div class="pt-2 flex flex-wrap items-center justify-between gap-4 text-xs sm:text-sm">
          <span class="font-medium text-slate-500">${weeksText}</span>
          <span class="font-bold text-[#0f172a] group-hover:underline">Explorar ${escapeHtml(unitInfo.roman)} →</span>
        </div>
      </div>
    `;
}

/** Dibuja la lista con las 5 unidades (foto, título, resumen y semanas de cada una). */
function renderAllUnitsSummary() {
  const container = document.getElementById("allUnitsOverviewContainer");
  if (!container) return;
  container.innerHTML = "";

  UNIT_NUMBERS.forEach((unitNum) => {
    const unitWeeks = appState.weeks.filter((w) => w.unit === unitNum);
    const row = document.createElement("article");
    row.className = "py-8 sm:py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center cursor-pointer group";
    row.innerHTML = buildUnitRowHtml(unitNum, UNITS_INFO[unitNum], unitWeeks);
    row.addEventListener("click", () => showSpecificUnitPage(unitNum));
    container.appendChild(row);
  });
}

// ---------------------------------------------------------------------------
// 2. UNA UNIDAD: ficha + tarjetas de sus semanas
// ---------------------------------------------------------------------------
function buildWeekCardHtml(week) {
  return `
      <div class="space-y-4">
        <div class="overflow-hidden rounded-xl">
          <img src="${getWeekPhotoSrc(week.week)}" data-foto="semana-${padWeek(week.week)}" alt="${escapeHtml(week.title)}" class="w-full h-48 object-cover object-center max-w-full rounded-xl group-hover:scale-[1.02] transition-transform duration-300" />
        </div>
        <div class="space-y-2">
          <div class="flex items-center justify-between text-xs">
            <span class="font-bold uppercase tracking-wider text-slate-500">Semana ${padWeek(week.week)}</span>
            <span class="font-medium text-slate-400">${escapeHtml(week.evaluation)}</span>
          </div>
          <h4 class="text-xl sm:text-2xl font-extrabold text-[#0f172a] group-hover:opacity-75 display-heading transition-opacity leading-snug">
            ${escapeHtml(week.title)}
          </h4>
          <p class="text-sm text-slate-600 leading-relaxed">
            ${escapeHtml(week.summary)}
          </p>
        </div>
      </div>
      <div class="pt-3 border-t border-slate-200/80 flex items-center justify-between">
        <span class="text-xs font-medium text-slate-500">${week.topics.length} temas · Materiales incluidos</span>
        <span class="text-xs sm:text-sm font-bold text-[#0f172a] group-hover:underline">Abrir Semana ${padWeek(week.week)} →</span>
      </div>
    `;
}

/** Dibuja la ficha de la unidad abierta y las tarjetas de sus semanas. */
function renderSpecificUnitView() {
  const unitInfo = UNITS_INFO[activeUnitNum] || UNITS_INFO[1];
  const unitWeeks = appState.weeks.filter((w) => w.unit === activeUnitNum);

  document.getElementById("unitViewBadge").textContent = unitInfo.roman.toUpperCase();
  document.getElementById("unitViewTitle").textContent = `${unitInfo.roman}: ${unitInfo.title}`;
  document.getElementById("unitViewSummary").textContent = unitInfo.summary;
  document.getElementById("unitViewObjective").textContent = unitInfo.objective;

  // Esta foto se reutiliza entre unidades: se oculta (sin data-listo) hasta tener la correcta
  const heroPhoto = document.getElementById("unitViewHeroPhoto");
  heroPhoto.removeAttribute("data-listo");
  heroPhoto.src = getUnitPhotoSrc(activeUnitNum, unitWeeks[0]?.week);
  heroPhoto.dataset.foto = "unidad-" + activeUnitNum;
  heroPhoto.alt = unitInfo.title;
  document.getElementById("unitViewPhotoCaption").textContent = unitInfo.caption;

  const list = document.getElementById("unitWeeksCollapsedList");
  list.innerHTML = "";
  unitWeeks.forEach((week) => {
    const card = document.createElement("article");
    card.className = "topic-card cursor-pointer group flex flex-col justify-between space-y-5";
    card.innerHTML = buildWeekCardHtml(week);
    card.addEventListener("click", () => showSingleWeekPage(week.week));
    list.appendChild(card);
  });
}

// ---------------------------------------------------------------------------
// 3. UNA SEMANA: resumen, temas y materiales
// ---------------------------------------------------------------------------
const ICON_EYE = `<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/><circle cx="12" cy="12" r="3"/></svg>`;
const ICON_DOWNLOAD = `<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>`;

/**
 * Los tres materiales que puede tener una semana. Para agregar un material nuevo basta agregar una fila aquí.
 *   type          nombre que usa el visor (openFloatingPreviewModal)
 *   isEnabled     ¿se muestra para esta semana? (casillas del panel creador)
 *   downloadClass / downloadAttr   clase y atributo del botón Descargar (los lee bindWeekResourceEvents)
 */
const WEEK_RESOURCES = [
  {
    type: "ppt",
    isEnabled: (week) => week.hasPpt !== false,
    getLabel: (week) => week.pptLabel,
    description: "Presentación · PowerPoint",
    iconClass: "bg-[#e04f33] text-white flex items-center justify-center font-extrabold text-sm",
    iconContent: "P",
    downloadClass: "inline-dl-ppt",
    downloadAttr: "data-dl-ppt",
    download: (weekNum) => downloadPptByWeek(weekNum)
  },
  {
    type: "pdf",
    isEnabled: (week) => Boolean(week.hasWord),
    getLabel: (week) => week.docLabel,
    description: "Informe académico · PDF / DOCX",
    iconClass: "bg-[#2563eb] text-white flex items-center justify-center font-extrabold text-sm",
    iconContent: "W",
    downloadClass: "inline-dl-word",
    downloadAttr: "data-dl-word",
    download: (weekNum) => downloadWordByWeek(weekNum)
  },
  {
    type: "colab",
    isEnabled: (week) => week.hasColab !== false,
    getLabel: (week) => week.colabLabel,
    description: "Notebook · Google Colab",
    iconClass: "bg-[#f59e0b] text-white flex items-center justify-center font-mono font-extrabold text-xs",
    iconContent: "&lt;/&gt;",
    downloadClass: "inline-dl-colab",
    downloadAttr: "data-dl-colab",
    download: (weekNum) => downloadColabByWeek(weekNum)
  }
];

/** Fila de un material (icono, nombre, y botones Previsualizar y Descargar). */
function buildResourceRowHtml(resource, week) {
  const label = escapeHtml(resource.getLabel(week));
  return `
      <div class="material-row">
        <div class="flex items-center gap-3.5 min-w-0">
          <div class="w-10 h-10 rounded-lg ${resource.iconClass} shrink-0 shadow-2xs">
            ${resource.iconContent}
          </div>
          <span class="text-slate-400 font-bold text-sm shrink-0">›</span>
          <div class="min-w-0">
            <p class="text-sm sm:text-base font-extrabold text-[#0f172a] truncate" title="${label}">${label}</p>
            <p class="text-xs text-slate-500 mt-0.5">${resource.description}</p>
          </div>
        </div>
        <div class="flex items-center gap-3 shrink-0">
          <button type="button" data-preview-week="${week.week}" data-preview-type="${resource.type}" class="open-floating-preview-btn btn-pill-preview cursor-pointer">
            ${ICON_EYE}
            <span>Previsualizar</span>
          </button>
          <button type="button" ${resource.downloadAttr}="${week.week}" class="${resource.downloadClass} btn-pill-download cursor-pointer">
            ${ICON_DOWNLOAD}
            <span>Descargar</span>
          </button>
        </div>
      </div>
    `;
}

/** Tarjeta de un tema de la semana. */
function buildTopicCardHtml(rawTopic, week, index) {
  const topic = parseTopic(rawTopic, week.week, index);
  return `
    <div class="topic-card">
      <span class="text-xs sm:text-sm font-bold text-slate-400 mb-2 block">${escapeHtml(topic.numBadge)}</span>
      <h5 class="text-base sm:text-[17px] font-extrabold text-[#0f172a] leading-snug mb-2.5">
        ${escapeHtml(topic.title)}
      </h5>
      <p class="text-xs sm:text-[13.5px] font-normal text-slate-600 leading-relaxed">
        ${escapeHtml(topic.desc)}
      </p>
    </div>`;
}

/** Columnas de la cuadrícula de temas según cuántos hay. */
function topicsGridClass(topicCount) {
  if (topicCount === 3) return "grid-cols-1 md:grid-cols-3";
  if (topicCount >= 5) return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-5";
  return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";
}

/** Título de sección con la barrita oscura a la izquierda. */
function buildSectionTitleHtml(text) {
  return `
        <div class="flex items-center gap-3">
          <span class="w-1.5 h-6 rounded-full bg-[#0f172a]"></span>
          <h4 class="text-xl sm:text-2xl font-extrabold text-[#0f172a] display-heading">
            ${text}
          </h4>
        </div>`;
}

function buildWeekHeroHtml(week) {
  return `
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        <div class="lg:col-span-6 space-y-4">
          <div class="flex items-center gap-3">
            <span class="text-xs sm:text-sm font-bold uppercase tracking-[0.16em] text-slate-500">
              Semana ${padWeek(week.week)}
            </span>
            <span class="h-px w-20 bg-slate-200"></span>
          </div>

          <h3 class="text-3xl sm:text-5xl font-extrabold text-[#0f172a] display-heading leading-[1.12]">
            ${escapeHtml(week.title)}
          </h3>

          <p class="text-base sm:text-[17px] font-normal text-slate-600 leading-relaxed pt-1">
            ${escapeHtml(week.summary)}
          </p>
        </div>

        <div class="lg:col-span-6">
          <img src="${getWeekPhotoSrc(week.week)}" data-foto="semana-${padWeek(week.week)}" alt="${escapeHtml(week.title)}" class="w-full h-64 sm:h-[310px] object-cover object-center max-w-full rounded-2xl shadow-sm" />
        </div>
      </div>`;
}

function buildWeekTopicsHtml(week) {
  const cards = week.topics.map((topic, index) => buildTopicCardHtml(topic, week, index)).join("");
  return `
      <div class="space-y-5">
        ${buildSectionTitleHtml("Temas desarrollados en la sesión")}

        <div class="grid ${topicsGridClass(week.topics.length)} gap-4 sm:gap-5 items-stretch">
          ${cards}
        </div>
      </div>`;
}

function buildWeekMaterialsHtml(week) {
  const rows = WEEK_RESOURCES
    .filter((resource) => resource.isEnabled(week))
    .map((resource) => buildResourceRowHtml(resource, week))
    .join("");
  return `
      <div class="pt-4 border-t border-slate-200 space-y-4">
        ${buildSectionTitleHtml("Materiales de aprendizaje")}

        <div class="border-t border-slate-200">
          ${rows}
        </div>
      </div>`;
}

/** Dibuja la página de la semana abierta. */
function renderSingleWeekView() {
  const week = getWeek(activeWeekNum);
  if (!week) return;

  const unitBreadcrumb = document.getElementById("singleWeekUnitBreadcrumb");
  const weekBreadcrumb = document.getElementById("singleWeekNumberBreadcrumb");
  if (unitBreadcrumb) unitBreadcrumb.textContent = week.unitName.replace("·", "›");
  if (weekBreadcrumb) weekBreadcrumb.textContent = `Semana ${padWeek(week.week)}`;

  document.getElementById("selectedWeekContainer").innerHTML = `
    <article class="view-fade space-y-12">
      ${buildWeekHeroHtml(week)}
      ${buildWeekTopicsHtml(week)}
      ${buildWeekMaterialsHtml(week)}
    </article>
  `;
  bindWeekResourceEvents();
}

/** Conecta los botones Previsualizar y Descargar de la semana recién dibujada. */
function bindWeekResourceEvents() {
  document.querySelectorAll(".open-floating-preview-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const weekNum = parseInt(button.getAttribute("data-preview-week"), 10);
      openFloatingPreviewModal(weekNum, button.getAttribute("data-preview-type") || "ppt");
    });
  });
  WEEK_RESOURCES.forEach((resource) => {
    document.querySelectorAll("." + resource.downloadClass).forEach((button) => {
      button.addEventListener("click", () => resource.download(parseInt(button.getAttribute(resource.downloadAttr), 10)));
    });
  });
}
