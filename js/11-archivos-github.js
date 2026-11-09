/* =============================================================================
   DETECCIÓN DE ARCHIVOS REALES
   Lee de GitHub qué archivos hay en archivos/semana-NN/ y archivos/silabo/ y los conecta
   con cada semana (presentación, informe y laboratorio).
   ============================================================================= */

// =========================================================================
// ARCHIVOS REALES POR CARPETA: archivos/semana-NN/
// Pon en cada carpeta tus archivos con CUALQUIER nombre (.pptx, .docx, .pdf, .ipynb).
// La página los detecta sola y reemplaza la versión de ejemplo.
// Solo quien tiene acceso al repositorio puede agregar archivos ahí.
// =========================================================================
const FILE_CONVENTION = [
  { key: "ppt",   urlKey: "pptUrl",   viewKey: "pptView", flag: "hasPpt",   base: "presentacion", exts: ["pptx", "pdf", "ppt"], label: "pptLabel" },
  { key: "doc",   urlKey: "docUrl",   viewKey: "docView", flag: "hasWord",  base: "informe",      exts: ["docx", "pdf", "doc"], label: "docLabel" },
  { key: "colab", urlKey: "colabUrl", flag: "hasColab", base: "laboratorio",  exts: ["ipynb"],              label: "colabLabel" }
];

async function publicFileExists(url) {
  try {
    const r = await fetch(url, { method: "HEAD", cache: "no-cache" });
    const ct = (r.headers.get("content-type") || "").toLowerCase();
    return r.ok && !ct.includes("text/html");
  } catch (e) {
    return false;
  }
}

// Decide qué archivo es la presentación, el informe y el laboratorio (por extensión y nombre)
function classifyWeekFiles(names) {
  const entry = {};
  const pdfs = [];
  for (const f of names) {
    const lower = f.toLowerCase();
    if (/^readme/.test(lower)) continue;
    let k = null;
    if (/\.(pptx|ppt)$/.test(lower)) k = "ppt";
    else if (/\.(docx|doc)$/.test(lower)) k = "doc";
    else if (/\.ipynb$/.test(lower)) k = "colab";
    else if (/\.pdf$/.test(lower)) { pdfs.push(f); continue; }
    if (!k) continue;
    const standard = /^(presentacion|informe|laboratorio)\./i.test(f);
    if (!entry[k] || standard) entry[k] = f;
  }
  for (const f of pdfs) {
    const lower = f.toLowerCase();
    const looksDoc = /(informe|tarea|reporte|trabajo)/.test(lower) || /\.docx?\b/.test(lower);
    const standard = /^(presentacion|informe)\./i.test(f);
    if (looksDoc || /^informe\./i.test(f)) { if (!entry.doc || standard) entry.doc = f; }
    else if (/^presentacion\./i.test(f)) { if (!entry.ppt || standard) entry.ppt = f; }
    else if (!entry.ppt) entry.ppt = f;
    else if (!entry.doc) entry.doc = f;
  }
  return entry;
}

// Lista de archivos leída directo del repositorio de GitHub (no depende del hosting ni de ningún build)
async function loadManifestFromGithub() {
  try {
    const cached = sessionStorage.getItem("ia_tree_v2");
    if (cached) {
      const c = JSON.parse(cached);
      if (Date.now() - c.t < 5 * 60 * 1000) return c.m;
    }
  } catch (e) {}
  try {
    const r = await fetch("https://api.github.com/repos/" + GITHUB_REPO + "/git/trees/" + GITHUB_RAMA + "?recursive=1", { headers: { Accept: "application/vnd.github+json" } });
    if (!r.ok) return null;
    const d = await r.json();
    const byWeek = {};
    const viewsByWeek = {};
    for (const it of (d.tree || [])) {
      if (it.type !== "blob") continue;
      const mv = /^archivos\/semana-(\d+)\/_vista\/([^\/]+\.pdf)$/.exec(it.path);
      if (mv) {
        const vwk = String(parseInt(mv[1], 10));
        if (!viewsByWeek[vwk]) viewsByWeek[vwk] = [];
        viewsByWeek[vwk].push(mv[2]);
        continue;
      }
      const m = /^archivos\/semana-(\d+)\/([^\/]+)$/.exec(it.path);
      if (!m) continue;
      const wk = String(parseInt(m[1], 10));
      if (!byWeek[wk]) byWeek[wk] = [];
      byWeek[wk].push(m[2]);
    }
    const manifest = {};
    const silabos = [];
    for (const it of (d.tree || [])) {
      if (it.type !== "blob") continue;
      const ms = /^archivos\/silabo\/([^\/]+\.pdf)$/i.exec(it.path);
      if (ms) silabos.push(ms[1]);
    }
    if (silabos.length) {
      silabos.sort();
      // Si subes tu propio sílabo, tiene prioridad sobre el oficial incluido
      const propios = silabos.filter((n) => n !== SILABO_OFICIAL);
      const lista = propios.length ? propios : silabos;
      manifest.silabo = lista.find((n) => /s[ií]labo/i.test(n)) || lista[0];
    }
    Object.keys(byWeek).forEach((wk) => {
      const e = classifyWeekFiles(byWeek[wk].sort());
      const vs = viewsByWeek[wk] || [];
      if (e.ppt && vs.indexOf(e.ppt + ".pdf") >= 0) e.pptView = e.ppt + ".pdf";
      if (e.doc && vs.indexOf(e.doc + ".pdf") >= 0) e.docView = e.doc + ".pdf";
      if (Object.keys(e).length) manifest[wk] = e;
    });
    try { sessionStorage.setItem("ia_tree_v2", JSON.stringify({ t: Date.now(), m: manifest })); } catch (e) {}
    return manifest;
  } catch (e) {
    return null;
  }
}

async function autoDetectWeekFiles() {
  let changed = false;
  // 1) La lista de archivos se lee de GitHub (cualquier nombre sirve)
  // 2) Si GitHub no responde, se buscan los nombres estándar (presentacion.pptx, informe.docx, laboratorio.ipynb)
  const manifest = await loadManifestFromGithub();
  const verify = true;
  detectSyllabus(manifest, verify);
  await Promise.all(appState.weeks.map(async (w) => {
    const folder = carpetaSemana(w.week) + "/";
    for (const kind of FILE_CONVENTION) {
      const cur = w[kind.urlKey];
      const isDefault = !cur || cur === "https://colab.research.google.com/";
      if (!isDefault) continue;

      if (manifest) {
        const name = manifest[String(w.week)] && manifest[String(w.week)][kind.key];
        if (name) {
          const fileUrl = new URL(folder + encodeURIComponent(name), location.href).href;
          // El hosting puede tardar 1-2 min en tener el archivo recién subido: solo se muestra si ya existe
          if (verify && !(await publicFileExists(fileUrl))) continue;
          w._auto = w._auto || {};
          if (!w._auto[kind.key]) w._auto[kind.key] = { url: cur || "", label: w[kind.label], flag: w[kind.flag] };
          w[kind.urlKey] = fileUrl;
          w[kind.flag] = true;
          w[kind.label] = name;
          const viewName = kind.viewKey && manifest[String(w.week)][kind.viewKey];
          if (viewName) {
            const viewUrl = new URL(folder + "_vista/" + encodeURIComponent(viewName), location.href).href;
            if (!verify || await publicFileExists(viewUrl)) w[kind.viewKey] = viewUrl;
          }
          changed = true;
        }
        continue;
      }

      // Sin lista de GitHub: se buscan los nombres estándar
      for (const ext of kind.exts) {
        const rel = folder + kind.base + "." + ext;
        if (await publicFileExists(rel)) {
          w._auto = w._auto || {};
          if (!w._auto[kind.key]) w._auto[kind.key] = { url: cur || "", label: w[kind.label], flag: w[kind.flag] };
          w[kind.urlKey] = new URL(rel, location.href).href;
          w[kind.flag] = true;
          const current = w[kind.label] || (kind.base + "." + ext);
          w[kind.label] = current.replace(/\.[A-Za-z0-9]+$/, "") + "." + ext;
          changed = true;
          break;
        }
      }
    }
  }));
  if (changed) {
    if (activePage === "todas-unidades") renderAllUnitsSummary();
    if (activePage === "unidad-especifica") renderSpecificUnitView();
    if (activePage === "semana-individual") renderSingleWeekView();
  }
}
