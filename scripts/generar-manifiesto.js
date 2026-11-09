// Genera archivos/manifest.json con los archivos reales que subas a cada semana.
// Se ejecuta solo al publicar (Netlify / GitHub Pages). No necesitas correrlo.
// Cualquier nombre sirve:  .pptx/.ppt -> presentación | .docx/.doc -> informe | .ipynb -> laboratorio
// Los .pdf: informe si el nombre dice informe/tarea/reporte/trabajo o viene de un .docx; si no, ocupan el hueco libre
// (primero presentación; si ya hay una, informe).
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..", "src", "main", "resources", "static", "archivos");
const manifest = {};

function kindOf(name) {
  const lower = name.toLowerCase();
  if (/^readme/.test(lower)) return null;
  if (/\.(pptx|ppt)$/.test(lower)) return "ppt";
  if (/\.(docx|doc)$/.test(lower)) return "doc";
  if (/\.ipynb$/.test(lower)) return "colab";
  if (/\.pdf$/.test(lower)) return "pdf"; // se decide abajo
  return null;
}

for (const dir of fs.readdirSync(root)) {
  const m = /^semana-(\d+)$/.exec(dir);
  if (!m) continue;
  const week = String(parseInt(m[1], 10));
  const files = fs.readdirSync(path.join(root, dir)).sort();
  const entry = {};
  const pdfs = [];
  for (const f of files) {
    const k = kindOf(f);
    if (!k) continue;
    if (k === "pdf") { pdfs.push(f); continue; }
    // Prioridad: nombres estándar (presentacion/informe/laboratorio), luego el primero alfabético
    const standard = /^(presentacion|informe|laboratorio)\./i.test(f);
    if (!entry[k] || standard) entry[k] = f;
  }
  // PDFs: informe si el nombre lo sugiere (informe/tarea/reporte/trabajo o viene de un .docx);
  // si no, ocupan el hueco libre: primero Presentación, si ya hay una, Informe.
  for (const f of pdfs) {
    const lower = f.toLowerCase();
    const looksDoc = /(informe|tarea|reporte|trabajo)/.test(lower) || /\.docx?\b/.test(lower);
    const standard = /^(presentacion|informe)\./i.test(f);
    if (looksDoc || /^informe\./i.test(f)) { if (!entry.doc || standard) entry.doc = f; }
    else if (/^presentacion\./i.test(f)) { if (!entry.ppt || standard) entry.ppt = f; }
    else if (!entry.ppt) entry.ppt = f;
    else if (!entry.doc) entry.doc = f;
  }
  // Vistas PDF generadas automáticamente (archivos/semana-NN/_vista/<archivo>.pdf)
  const viewDir = path.join(root, dir, "_vista");
  if (fs.existsSync(viewDir)) {
    const views = fs.readdirSync(viewDir);
    if (entry.ppt && views.includes(entry.ppt + ".pdf")) entry.pptView = entry.ppt + ".pdf";
    if (entry.doc && views.includes(entry.doc + ".pdf")) entry.docView = entry.doc + ".pdf";
  }
  if (Object.keys(entry).length) manifest[week] = entry;
}

// Sílabo: PDF dentro de archivos/silabo/ (prefiere el que diga "silabo")
const silaboDir = path.join(root, "silabo");
if (fs.existsSync(silaboDir)) {
  const pdfs = fs.readdirSync(silaboDir).filter((f) => /\.pdf$/i.test(f)).sort();
  if (pdfs.length) manifest.silabo = pdfs.find((f) => /s[ií]labo/i.test(f)) || pdfs[0];
}

fs.writeFileSync(path.join(root, "manifest.json"), JSON.stringify(manifest, null, 2));
console.log("manifest.json generado:", JSON.stringify(manifest));
