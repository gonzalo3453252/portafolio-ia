// Genera archivos/manifest.json con los archivos reales que subas a cada semana.
// Se ejecuta solo al publicar (Netlify / GitHub Pages). No necesitas correrlo.
// Cualquier nombre sirve:  .pptx/.ppt -> presentación | .docx/.doc -> informe | .ipynb -> laboratorio
// Los .pdf: si el nombre contiene informe/tarea/reporte/trabajo -> informe; si no -> presentación.
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
  if (/\.pdf$/.test(lower)) return /(informe|tarea|reporte|trabajo)/.test(lower) ? "doc" : "ppt";
  return null;
}

for (const dir of fs.readdirSync(root)) {
  const m = /^semana-(\d+)$/.exec(dir);
  if (!m) continue;
  const week = String(parseInt(m[1], 10));
  const files = fs.readdirSync(path.join(root, dir)).sort();
  const entry = {};
  for (const f of files) {
    const k = kindOf(f);
    if (!k) continue;
    // Prioridad: nombres estándar (presentacion/informe/laboratorio), luego el primero alfabético
    const standard = /^(presentacion|informe|laboratorio)\./i.test(f);
    if (!entry[k] || standard) entry[k] = f;
  }
  if (Object.keys(entry).length) manifest[week] = entry;
}

fs.writeFileSync(path.join(root, "manifest.json"), JSON.stringify(manifest, null, 2));
console.log("manifest.json generado:", JSON.stringify(manifest));
