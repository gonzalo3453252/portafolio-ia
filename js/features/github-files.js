/* =============================================================================
   DETECCIÓN DE ARCHIVOS REALES  (features/github-files.js)
   Averigua qué archivos hay en archivos/semana-NN/ y archivos/silabo/ y los conecta con cada semana
   (presentación, informe y laboratorio). Cualquier nombre de archivo sirve.

   Dónde se lee la lista de archivos (en este orden):
     1. datos/archivos.js  (window.__FILE_LIST): lo genera GitHub al subir archivos. Llega antes de dibujar la
        página y no gasta la cuota de la API (60 consultas por hora por conexión).
     2. La API de GitHub (con memoria de 5 minutos), si el archivo anterior no existe.
     3. Sin lista: se buscan los nombres estándar (presentacion.pptx, informe.docx, laboratorio.ipynb).

   Depende de: config.js, storage.js, state.js, syllabus.js, pages.js (vía refreshContentViews).
   Expone: FILE_CONVENTION, publicFileExists, autoDetectWeekFiles.
   ============================================================================= */
"use strict";

/**
 * Los tres materiales de una semana y cómo se guardan en sus datos.
 *   key      nombre corto (también la clave de "ocultos")
 *   urlKey   campo con la dirección del archivo       viewKey  campo con la vista PDF (solo ppt y doc)
 *   flag     campo "¿se muestra?"                     label    campo con el nombre que se ve
 *   base/exts  nombre estándar de archivo y extensiones que se buscan si no hay lista
 */
const FILE_CONVENTION = [
  { key: "ppt",   urlKey: "pptUrl",   viewKey: "pptView", flag: "hasPpt",   base: "presentacion", exts: ["pptx", "pdf", "ppt"], label: "pptLabel" },
  { key: "doc",   urlKey: "docUrl",   viewKey: "docView", flag: "hasWord",  base: "informe",      exts: ["docx", "pdf", "doc"], label: "docLabel" },
  { key: "colab", urlKey: "colabUrl",                      flag: "hasColab", base: "laboratorio",  exts: ["ipynb"],              label: "colabLabel" }
];

const DEFAULT_COLAB_URL = "https://colab.research.google.com/";
const FILE_TREE_CACHE_MS = 5 * 60 * 1000;

/** ¿El archivo de esa dirección existe de verdad? (una página de error HTML cuenta como "no existe") */
async function publicFileExists(url) {
  try {
    const response = await fetch(url, { method: "HEAD", cache: "no-cache" });
    const contentType = (response.headers.get("content-type") || "").toLowerCase();
    return response.ok && !contentType.includes("text/html");
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Qué archivo es la presentación, el informe y el laboratorio
// ---------------------------------------------------------------------------
function fileKindByExtension(lowerName) {
  if (/\.(pptx|ppt)$/.test(lowerName)) return "ppt";
  if (/\.(docx|doc)$/.test(lowerName)) return "doc";
  if (/\.ipynb$/.test(lowerName)) return "colab";
  return null;
}

/** Un PDF puede ser el informe o la presentación: se decide por su nombre. */
function assignPdfFile(entry, file) {
  const lower = file.toLowerCase();
  const looksLikeReport = /(informe|tarea|reporte|trabajo)/.test(lower) || /\.docx?\b/.test(lower);
  const isStandardName = /^(presentacion|informe)\./i.test(file);
  if (looksLikeReport || /^informe\./i.test(file)) {
    if (!entry.doc || isStandardName) entry.doc = file;
  } else if (/^presentacion\./i.test(file)) {
    if (!entry.ppt || isStandardName) entry.ppt = file;
  } else if (!entry.ppt) {
    entry.ppt = file;
  } else if (!entry.doc) {
    entry.doc = file;
  }
}

/**
 * Decide qué archivo es la presentación (ppt), el informe (doc) y el laboratorio (colab).
 * Por extensión primero; los PDF después, por su nombre. Un archivo con nombre estándar gana a los demás.
 * @param {string[]} names nombres de archivo de una semana
 * @returns {{ppt?: string, doc?: string, colab?: string}}
 */
function classifyWeekFiles(names) {
  const entry = {};
  const pdfs = [];
  names.forEach((file) => {
    const lower = file.toLowerCase();
    if (/^readme/.test(lower)) return;
    if (/\.pdf$/.test(lower)) { pdfs.push(file); return; }
    const kind = fileKindByExtension(lower);
    if (!kind) return;
    const isStandardName = /^(presentacion|informe|laboratorio)\./i.test(file);
    if (!entry[kind] || isStandardName) entry[kind] = file;
  });
  pdfs.forEach((file) => assignPdfFile(entry, file));
  return entry;
}

/**
 * Convierte las listas de archivos (por semana, vistas PDF y sílabos) en el "manifiesto" que usa la página:
 *   { silabo: "nombre.pdf", "1": {ppt, doc, colab, pptView, docView}, "2": {...} }
 */
function buildManifest(byWeek, viewsByWeek, syllabi) {
  const manifest = {};
  if (syllabi.length) {
    const sorted = syllabi.slice().sort();
    // Si subes tu propio sílabo, tiene prioridad sobre el oficial incluido
    const own = sorted.filter((name) => name !== OFFICIAL_SYLLABUS);
    const candidates = own.length ? own : sorted;
    manifest.silabo = candidates.find((name) => /s[ií]labo/i.test(name)) || candidates[0];
  }
  Object.keys(byWeek).forEach((weekKey) => {
    const entry = classifyWeekFiles(byWeek[weekKey].slice().sort());
    const views = viewsByWeek[weekKey] || [];
    if (entry.ppt && views.includes(entry.ppt + ".pdf")) entry.pptView = entry.ppt + ".pdf";
    if (entry.doc && views.includes(entry.doc + ".pdf")) entry.docView = entry.doc + ".pdf";
    if (Object.keys(entry).length) manifest[weekKey] = entry;
  });
  return manifest;
}

// ---------------------------------------------------------------------------
// De dónde sale la lista de archivos
// ---------------------------------------------------------------------------
/** true cuando el manifiesto salió de datos/archivos.js (generado por GitHub): ya es fiable y no hace falta
 *  comprobar uno por uno que cada archivo exista. */
let manifestFromList = false;

function manifestFromGeneratedList() {
  const list = window.__FILE_LIST;
  if (!list || typeof list !== "object" || !list.semanas) return null;
  manifestFromList = true;
  return buildManifest(list.semanas, list.vistas || {}, list.silabos || []);
}

function manifestFromCache() {
  try {
    const cached = JSON.parse(sessionStore.get(STORAGE_KEYS.FILE_TREE));
    if (cached && Date.now() - cached.t < FILE_TREE_CACHE_MS) return cached.m;
  } catch {
    // Memoria dañada: se consulta de nuevo
  }
  return null;
}

/** Agrega un valor a la lista de una clave (la crea si hace falta). */
function pushTo(groups, key, value) {
  if (!groups[key]) groups[key] = [];
  groups[key].push(value);
}

/** Lee la lista de archivos del repositorio con la API de GitHub (devuelve null si no responde). */
async function manifestFromGithubApi() {
  try {
    const url = "https://api.github.com/repos/" + GITHUB_REPO + "/git/trees/" + GITHUB_BRANCH + "?recursive=1";
    const response = await fetch(url, { headers: { Accept: "application/vnd.github+json" } });
    if (!response.ok) return null;
    const data = await response.json();

    const byWeek = {};
    const viewsByWeek = {};
    const syllabi = [];
    (data.tree || []).filter((item) => item.type === "blob").forEach((item) => {
      const syllabus = /^archivos\/silabo\/([^/]+\.pdf)$/i.exec(item.path);
      const view = /^archivos\/semana-(\d+)\/_vista\/([^/]+\.pdf)$/.exec(item.path);
      const file = /^archivos\/semana-(\d+)\/([^/]+)$/.exec(item.path);
      if (syllabus) syllabi.push(syllabus[1]);
      else if (view) pushTo(viewsByWeek, String(parseInt(view[1], 10)), view[2]);
      else if (file) pushTo(byWeek, String(parseInt(file[1], 10)), file[2]);
    });

    const manifest = buildManifest(byWeek, viewsByWeek, syllabi);
    sessionStore.set(STORAGE_KEYS.FILE_TREE, JSON.stringify({ t: Date.now(), m: manifest }));
    return manifest;
  } catch {
    return null;
  }
}

/** Lista de archivos: primero la generada por GitHub, luego la memoria, luego la API. */
async function loadManifestFromGithub() {
  return manifestFromGeneratedList() || manifestFromCache() || await manifestFromGithubApi();
}

// ---------------------------------------------------------------------------
// Conectar los archivos encontrados con cada semana
// ---------------------------------------------------------------------------
/** Guarda lo que tenía la semana antes de la detección (para poder restaurarlo al guardar el panel). */
function rememberOriginal(week, kind, currentUrl) {
  week._auto = week._auto || {};
  if (!week._auto[kind.key]) week._auto[kind.key] = { url: currentUrl || "", label: week[kind.label], flag: week[kind.flag] };
}

/** ¿Esta semana ya tiene un enlace propio para este material? (entonces no se toca) */
function hasOwnLink(week, kind) {
  const current = week[kind.urlKey];
  return Boolean(current) && current !== DEFAULT_COLAB_URL;
}

/** Vista PDF de una presentación o informe: la lista dice si existe; si no, se prueba la ruta directa. */
async function detectPdfView(week, kind, entry, name, folder) {
  const listed = entry[kind.viewKey];
  const viewName = listed || (name + ".pdf");
  const viewUrl = new URL(folder + "_vista/" + encodeURIComponent(viewName), location.href).href;
  if ((listed && manifestFromList) || await publicFileExists(viewUrl)) week[kind.viewKey] = viewUrl;
}

/** Conecta con la semana el archivo que la lista indica para este material. Devuelve true si cambió algo. */
async function applyListedFile(week, kind, manifest, verify, folder) {
  const entry = manifest[String(week.week)];
  const name = entry && entry[kind.key];
  if (!name) return false;

  const fileUrl = new URL(folder + encodeURIComponent(name), location.href).href;
  // El hosting puede tardar 1-2 min en tener el archivo recién subido: solo se muestra si ya existe
  if (verify && !(await publicFileExists(fileUrl))) return false;

  rememberOriginal(week, kind, week[kind.urlKey]);
  week[kind.urlKey] = fileUrl;
  week[kind.flag] = true;
  week[kind.label] = name;
  if (kind.viewKey && !/\.pdf$/i.test(name)) await detectPdfView(week, kind, entry, name, folder);
  return true;
}

/** Sin lista de GitHub: busca el archivo con el nombre estándar (presentacion.pptx, informe.docx...). */
async function applyStandardNamedFile(week, kind, folder) {
  for (const ext of kind.exts) {
    const relativePath = folder + kind.base + "." + ext;
    if (!(await publicFileExists(relativePath))) continue;

    rememberOriginal(week, kind, week[kind.urlKey]);
    week[kind.urlKey] = new URL(relativePath, location.href).href;
    week[kind.flag] = true;
    const currentLabel = week[kind.label] || (kind.base + "." + ext);
    week[kind.label] = currentLabel.replace(/\.[A-Za-z0-9]+$/, "") + "." + ext;
    return true;
  }
  return false;
}

/** Detecta los tres materiales de una semana. Devuelve true si alguno cambió. */
async function detectWeekFiles(week, manifest, verify) {
  const folder = weekFolder(week.week) + "/";
  let changed = false;
  for (const kind of FILE_CONVENTION) {
    if (hasOwnLink(week, kind)) continue;
    // Lo que ocultaste a propósito en el panel no se vuelve a activar solo
    if (week.ocultos && week.ocultos[kind.key]) continue;
    const found = manifest
      ? await applyListedFile(week, kind, manifest, verify, folder)
      : await applyStandardNamedFile(week, kind, folder);
    changed = changed || found;
  }
  return changed;
}

/** Busca los archivos reales de todas las semanas y el sílabo, y vuelve a dibujar si encontró algo. */
async function autoDetectWeekFiles() {
  const manifest = await loadManifestFromGithub();
  const verify = !manifestFromList;   // con la lista de GitHub no hace falta preguntar por cada archivo
  detectSyllabus(manifest, verify);
  const results = await Promise.all(appState.weeks.map((week) => detectWeekFiles(week, manifest, verify)));
  if (results.some(Boolean)) refreshContentViews();
}
