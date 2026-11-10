/* =============================================================================
   PÁGINAS DE CONTENIDO
   Dibuja las páginas: resumen de unidades, detalle de una unidad y detalle de una semana
   (con sus botones de Previsualizar y Descargar).
   ============================================================================= */

// =========================================================================
// RENDERIZADO PÁGINA 2: TODAS LAS UNIDADES
// =========================================================================
function renderAllUnitsSummary() {
  const container = document.getElementById("allUnitsOverviewContainer");
  if (!container) return;
  container.innerHTML = "";

  [1, 2, 3, 4, 5].forEach(uNum => {
    const uInfo = UNITS_INFO[uNum];
    const unitWeeks = appState.weeks.filter(w => w.unit === uNum);
    const photoSrc = getUnitPhotoSrc(uNum, unitWeeks[0]?.week);

    const row = document.createElement("article");
    row.className = "py-8 sm:py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center cursor-pointer group";
    row.innerHTML = `
      <div class="lg:col-span-5 overflow-hidden rounded-2xl">
        <img src="${photoSrc}" data-foto="unidad-${uNum}" alt="${escapeHtml(uInfo.title)}" class="w-full h-56 sm:h-64 object-cover object-center max-w-full rounded-2xl shadow-xs group-hover:scale-[1.01] transition-transform duration-300" />
      </div>
      <div class="lg:col-span-7 flex flex-col justify-between space-y-4">
        <div class="space-y-2">
          <div class="flex items-center gap-3">
            <p class="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">${escapeHtml(uInfo.roman)}</p>
            <span class="h-px w-12 bg-slate-200"></span>
          </div>
          <h3 class="text-2xl sm:text-3xl font-extrabold text-[#0f172a] group-hover:opacity-75 display-heading transition-opacity leading-tight">
            ${escapeHtml(uInfo.title)}
          </h3>
          <p class="text-sm sm:text-base font-normal text-slate-600 leading-relaxed">
            ${escapeHtml(uInfo.summary)}
          </p>
        </div>
        <div class="pt-2 flex flex-wrap items-center justify-between gap-4 text-xs sm:text-sm">
          <span class="font-medium text-slate-500">${unitWeeks.map(w => 'Semana ' + String(w.week).padStart(2, '0')).join('  ·  ')}</span>
          <span class="font-bold text-[#0f172a] group-hover:underline">Explorar ${escapeHtml(uInfo.roman)} →</span>
        </div>
      </div>
    `;
    row.addEventListener("click", () => showSpecificUnitPage(uNum));
    container.appendChild(row);
  });
}

// =========================================================================
// RENDERIZADO PÁGINA 3: INFORMACIÓN DE LA UNIDAD + TARJETAS DE SEMANAS
// =========================================================================
function renderSpecificUnitView() {
  const uInfo = UNITS_INFO[activeUnitNum] || UNITS_INFO[1];
  const unitWeeks = appState.weeks.filter(w => w.unit === activeUnitNum);

  document.getElementById("unitViewBadge").textContent = uInfo.roman.toUpperCase();
  document.getElementById("unitViewTitle").textContent = `${uInfo.roman}: ${uInfo.title}`;
  document.getElementById("unitViewSummary").textContent = uInfo.summary;
  document.getElementById("unitViewObjective").textContent = uInfo.objective;

  const photoEl = document.getElementById("unitViewHeroPhoto");
  photoEl.removeAttribute("data-listo");   // esta foto se reutiliza entre unidades: se oculta hasta tener la correcta
  photoEl.src = getUnitPhotoSrc(activeUnitNum, unitWeeks[0]?.week);
  photoEl.dataset.foto = "unidad-" + activeUnitNum;
  photoEl.alt = uInfo.title;
  document.getElementById("unitViewPhotoCaption").textContent = uInfo.caption;

  const listEl = document.getElementById("unitWeeksCollapsedList");
  listEl.innerHTML = "";
  unitWeeks.forEach(w => {
    const wPhoto = getWeekPhotoSrc(w.week, w.unit);

    const item = document.createElement("article");
    item.className = "topic-card cursor-pointer group flex flex-col justify-between space-y-5";
    item.innerHTML = `
      <div class="space-y-4">
        <div class="overflow-hidden rounded-xl">
          <img src="${wPhoto}" data-foto="semana-${String(w.week).padStart(2, "0")}" alt="${escapeHtml(w.title)}" class="w-full h-48 object-cover object-center max-w-full rounded-xl group-hover:scale-[1.02] transition-transform duration-300" />
        </div>
        <div class="space-y-2">
          <div class="flex items-center justify-between text-xs">
            <span class="font-bold uppercase tracking-wider text-slate-500">Semana ${String(w.week).padStart(2, "0")}</span>
            <span class="font-medium text-slate-400">${escapeHtml(w.evaluation)}</span>
          </div>
          <h4 class="text-xl sm:text-2xl font-extrabold text-[#0f172a] group-hover:opacity-75 display-heading transition-opacity leading-snug">
            ${escapeHtml(w.title)}
          </h4>
          <p class="text-sm text-slate-600 leading-relaxed">
            ${escapeHtml(w.summary)}
          </p>
        </div>
      </div>
      <div class="pt-3 border-t border-slate-200/80 flex items-center justify-between">
        <span class="text-xs font-medium text-slate-500">${w.topics.length} temas · Materiales incluidos</span>
        <span class="text-xs sm:text-sm font-bold text-[#0f172a] group-hover:underline">Abrir Semana ${String(w.week).padStart(2, "0")} →</span>
      </div>
    `;
    item.addEventListener("click", () => showSingleWeekPage(w.week));
    listEl.appendChild(item);
  });
}

// =========================================================================
// RENDERIZADO PÁGINA 4: PÁGINA EXCLUSIVA DE LA SEMANA SELECCIONADA
// =========================================================================
function renderSingleWeekView() {
  const w = appState.weeks.find(item => item.week === activeWeekNum) || appState.weeks[0];
  if (!w) return;

  const uBreadcrumb = document.getElementById("singleWeekUnitBreadcrumb");
  const wBreadcrumb = document.getElementById("singleWeekNumberBreadcrumb");
  if (uBreadcrumb) uBreadcrumb.textContent = w.unitName.replace("·", "›");
  if (wBreadcrumb) wBreadcrumb.textContent = `Semana ${String(w.week).padStart(2, "0")}`;

  const tabsContainer = document.getElementById("unitWeekSelectorTabs");
  if (tabsContainer) {
    tabsContainer.innerHTML = "";
  }

  const container = document.getElementById("selectedWeekContainer");
  const photoSrc = getWeekPhotoSrc(w.week, w.unit);

  const colsClass = w.topics.length === 3
    ? "grid-cols-1 md:grid-cols-3"
    : (w.topics.length >= 5 ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-5" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4");

  const topicsGridHtml = w.topics.map((rawTopic, idx) => {
    const parsed = parseTopicItem(rawTopic, w.week, idx);
    return `
    <div class="topic-card">
      <span class="text-xs sm:text-sm font-bold text-slate-400 mb-2 block">${escapeHtml(parsed.numBadge)}</span>
      <h5 class="text-base sm:text-[17px] font-extrabold text-[#0f172a] leading-snug mb-2.5">
        ${escapeHtml(parsed.title)}
      </h5>
      <p class="text-xs sm:text-[13.5px] font-normal text-slate-600 leading-relaxed">
        ${escapeHtml(parsed.desc)}
      </p>
    </div>`;
  }).join("");

  const eyeSvg = `<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/><circle cx="12" cy="12" r="3"/></svg>`;
  const dlSvg = `<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>`;

  const resourceRows = [];

  if (w.hasPpt !== false) {
    resourceRows.push(`
      <div class="material-row">
        <div class="flex items-center gap-3.5 min-w-0">
          <div class="w-10 h-10 rounded-lg bg-[#e04f33] text-white flex items-center justify-center font-extrabold text-sm shrink-0 shadow-2xs">
            P
          </div>
          <span class="text-slate-400 font-bold text-sm shrink-0">›</span>
          <div class="min-w-0">
            <p class="text-sm sm:text-base font-extrabold text-[#0f172a] truncate" title="${escapeHtml(w.pptLabel)}">${escapeHtml(w.pptLabel)}</p>
            <p class="text-xs text-slate-500 mt-0.5">Presentación · PowerPoint</p>
          </div>
        </div>
        <div class="flex items-center gap-3 shrink-0">
          <button type="button" data-preview-week="${w.week}" data-preview-type="ppt" class="open-floating-preview-btn btn-pill-preview cursor-pointer">
            ${eyeSvg}
            <span>Previsualizar</span>
          </button>
          <button type="button" data-dl-ppt="${w.week}" class="inline-dl-ppt btn-pill-download cursor-pointer">
            ${dlSvg}
            <span>Descargar</span>
          </button>
        </div>
      </div>
    `);
  }

  if (w.hasWord) {
    resourceRows.push(`
      <div class="material-row">
        <div class="flex items-center gap-3.5 min-w-0">
          <div class="w-10 h-10 rounded-lg bg-[#2563eb] text-white flex items-center justify-center font-extrabold text-sm shrink-0 shadow-2xs">
            W
          </div>
          <span class="text-slate-400 font-bold text-sm shrink-0">›</span>
          <div class="min-w-0">
            <p class="text-sm sm:text-base font-extrabold text-[#0f172a] truncate" title="${escapeHtml(w.docLabel)}">${escapeHtml(w.docLabel)}</p>
            <p class="text-xs text-slate-500 mt-0.5">Informe académico · PDF / DOCX</p>
          </div>
        </div>
        <div class="flex items-center gap-3 shrink-0">
          <button type="button" data-preview-week="${w.week}" data-preview-type="pdf" class="open-floating-preview-btn btn-pill-preview cursor-pointer">
            ${eyeSvg}
            <span>Previsualizar</span>
          </button>
          <button type="button" data-dl-word="${w.week}" class="inline-dl-word btn-pill-download cursor-pointer">
            ${dlSvg}
            <span>Descargar</span>
          </button>
        </div>
      </div>
    `);
  }

  if (w.hasColab !== false) {
    resourceRows.push(`
    <div class="material-row">
      <div class="flex items-center gap-3.5 min-w-0">
        <div class="w-10 h-10 rounded-lg bg-[#f59e0b] text-white flex items-center justify-center font-mono font-extrabold text-xs shrink-0 shadow-2xs">
          &lt;/&gt;
        </div>
        <span class="text-slate-400 font-bold text-sm shrink-0">›</span>
        <div class="min-w-0">
          <p class="text-sm sm:text-base font-extrabold text-[#0f172a] truncate" title="${escapeHtml(w.colabLabel)}">${escapeHtml(w.colabLabel)}</p>
          <p class="text-xs text-slate-500 mt-0.5">Notebook · Google Colab</p>
        </div>
      </div>
      <div class="flex items-center gap-3 shrink-0">
        <button type="button" data-preview-week="${w.week}" data-preview-type="colab" class="open-floating-preview-btn btn-pill-preview cursor-pointer">
          ${eyeSvg}
          <span>Previsualizar</span>
        </button>
        <button type="button" data-dl-colab="${w.week}" class="inline-dl-colab btn-pill-download cursor-pointer">
          ${dlSvg}
          <span>Descargar</span>
        </button>
      </div>
    </div>
  `);
  }

  container.innerHTML = `
    <article class="view-fade space-y-12">

      <!-- 1. Bloque Superior (2 Columnas: Izquierda Título/Resumen + Derecha Imagen Redondeada) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        <div class="lg:col-span-6 space-y-4">
          <div class="flex items-center gap-3">
            <span class="text-xs sm:text-sm font-bold uppercase tracking-[0.16em] text-slate-500">
              Semana ${String(w.week).padStart(2, "0")}
            </span>
            <span class="h-px w-20 bg-slate-200"></span>
          </div>

          <h3 class="text-3xl sm:text-5xl font-extrabold text-[#0f172a] display-heading leading-[1.12]">
            ${escapeHtml(w.title)}
          </h3>

          <p class="text-base sm:text-[17px] font-normal text-slate-600 leading-relaxed pt-1">
            ${escapeHtml(w.summary)}
          </p>
        </div>

        <div class="lg:col-span-6">
          <img src="${photoSrc}" data-foto="semana-${String(w.week).padStart(2, "0")}" alt="${escapeHtml(w.title)}" class="w-full h-64 sm:h-[310px] object-cover object-center max-w-full rounded-2xl shadow-sm" />
        </div>
      </div>

      <!-- 2. Sección Intermedia a Ancho Completo: Temas desarrollados en la sesión -->
      <div class="space-y-5">
        <div class="flex items-center gap-3">
          <span class="w-1.5 h-6 rounded-full bg-[#0f172a]"></span>
          <h4 class="text-xl sm:text-2xl font-extrabold text-[#0f172a] display-heading">
            Temas desarrollados en la sesión
          </h4>
        </div>

        <div class="grid ${colsClass} gap-4 sm:gap-5 items-stretch">
          ${topicsGridHtml}
        </div>
      </div>

      <!-- 3. Sección Inferior a Ancho Completo: Materiales de aprendizaje -->
      <div class="pt-4 border-t border-slate-200 space-y-4">
        <div class="flex items-center gap-3">
          <span class="w-1.5 h-6 rounded-full bg-[#0f172a]"></span>
          <h4 class="text-xl sm:text-2xl font-extrabold text-[#0f172a] display-heading">
            Materiales de aprendizaje
          </h4>
        </div>

        <div class="border-t border-slate-200">
          ${resourceRows.join("")}
        </div>
      </div>

    </article>
  `;

  bindWeekResourceEvents();
}

function bindWeekResourceEvents() {
  document.querySelectorAll(".open-floating-preview-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const wNum = parseInt(btn.getAttribute("data-preview-week"), 10);
      const type = btn.getAttribute("data-preview-type") || "ppt";
      openFloatingPreviewModal(wNum, type);
    });
  });

  document.querySelectorAll(".inline-dl-ppt").forEach(btn => {
    btn.addEventListener("click", () => downloadPptByWeek(parseInt(btn.getAttribute("data-dl-ppt"), 10)));
  });
  document.querySelectorAll(".inline-dl-word").forEach(btn => {
    btn.addEventListener("click", () => downloadWordByWeek(parseInt(btn.getAttribute("data-dl-word"), 10)));
  });
  document.querySelectorAll(".inline-dl-colab").forEach(btn => {
    btn.addEventListener("click", () => downloadColabByWeek(parseInt(btn.getAttribute("data-dl-colab"), 10)));
  });
}
