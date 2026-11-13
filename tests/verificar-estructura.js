/* =============================================================================
   VERIFICACIÓN DE ESTRUCTURA  (tests/verificar-estructura.js)
   Comprobaciones rápidas, sin dependencias, que evitan los errores más comunes al editar:
     1. Todo <script src> y <link href> local de index.html apunta a un archivo que existe.
     2. Todo archivo de js/ (salvo vendor/ y viewers/) está cargado por index.html, y en el orden correcto.
     3. Los archivos de js/viewers/ que arma el código existen y cada visor carga viewer-common.js.
     4. datos/portafolio.json es JSON válido y sus semanas tienen los campos esperados.
     5. Los JS generados (datos/fotos.js, datos/archivos.js) tienen el formato que espera la página.
     6. Cada archivo propio empieza con su comentario de cabecera y "use strict".
   Uso:  node tests/verificar-estructura.js        (sale con código 1 si algo falla)
   ============================================================================= */
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), "utf8");
const exists = (relativePath) => fs.existsSync(path.join(ROOT, relativePath));

const problems = [];
const check = (condition, message) => { if (!condition) problems.push(message); };

/** Todos los .js propios (sin vendor/) de una carpeta, como rutas relativas a la raíz. */
function listOwnJs(dir) {
  return fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap((entry) => {
    const relative = dir + "/" + entry.name;
    if (entry.isDirectory()) return entry.name === "vendor" ? [] : listOwnJs(relative);
    return entry.name.endsWith(".js") ? [relative] : [];
  });
}

const html = read("index.html");

// 1. Recursos locales de index.html
const localRefs = [...html.matchAll(/<(?:script|link)\b[^>]*?(?:src|href)="([^"#?]+)"/g)]
  .map((match) => match[1])
  .filter((ref) => !/^(https?:|data:|\/\/)/.test(ref));
localRefs.forEach((ref) => check(exists(ref), `index.html enlaza a "${ref}", que no existe`));

// 2. Cada JS de la página está cargado, y las dependencias van antes
const scriptsInOrder = [...html.matchAll(/<script\s+src="([^"]+\.js)"/g)].map((match) => match[1]);
const pageFiles = listOwnJs("js").filter((file) => !file.startsWith("js/viewers/"));
pageFiles.forEach((file) => check(scriptsInOrder.includes(file), `${file} no está cargado en index.html`));

const mustComeBefore = [
  ["js/core/utils.js", "js/core/state.js"],
  ["js/core/storage.js", "js/core/state.js"],
  ["js/core/state.js", "js/features/photos.js"],
  ["js/features/viewer-styles.js", "js/features/demo-viewers.js"],
  ["js/features/preview-modal.js", "js/app.js"]
];
mustComeBefore.forEach(([first, second]) => {
  check(scriptsInOrder.indexOf(first) < scriptsInOrder.indexOf(second), `${first} debe cargarse antes que ${second}`);
});
check(scriptsInOrder[scriptsInOrder.length - 1] === "js/app.js", "js/app.js debe ser el último script cargado");

// 3. Visores: los archivos que arma viewer-styles.js existen
const viewerStyles = read("js/features/viewer-styles.js");
const viewerScripts = ["demo-viewers.js", "real-viewers.js"]
  .flatMap((file) => [...read("js/features/" + file).matchAll(/script:\s*"([^"]+)"/g)].map((match) => match[1]));
viewerScripts.forEach((name) => check(exists("js/viewers/" + name), `js/viewers/${name} no existe`));
check(/viewer-common\.js/.test(viewerStyles), "buildViewerPage debe cargar viewer-common.js");

// 4. Contenido publicado
const portfolio = JSON.parse(read("datos/portafolio.json"));
const weekFields = ["week", "unit", "unitName", "title", "topics", "evaluation", "summary"];
check(Array.isArray(portfolio.weeks) && portfolio.weeks.length > 0, "datos/portafolio.json no tiene semanas");
(portfolio.weeks || []).forEach((week) => weekFields.forEach((field) => {
  check(field in week, `Semana ${week.week}: falta el campo "${field}" en datos/portafolio.json`);
}));
const weekNumbers = (portfolio.weeks || []).map((week) => week.week);
check(new Set(weekNumbers).size === weekNumbers.length, "datos/portafolio.json tiene semanas repetidas");

// 5. Listas generadas
check(/^\/\*[\s\S]*?\*\/\s*window\.__PHOTO_LIST = \{[\s\S]*\};\s*$|^window\.__PHOTO_LIST = \{[\s\S]*\};\s*$/m.test(read("datos/fotos.js")), "datos/fotos.js no tiene el formato esperado");
check(/window\.__FILE_LIST = \{[\s\S]*\};\s*$/m.test(read("datos/archivos.js")), "datos/archivos.js no tiene el formato esperado");

// 6. Cabeceras
pageFiles.concat(listOwnJs("js/viewers")).forEach((file) => {
  const source = read(file);
  check(source.startsWith("/*"), `${file} no empieza con su comentario de cabecera`);
  check(/^\s*"use strict";/m.test(source), `${file} no declara "use strict"`);
});

if (problems.length > 0) {
  console.error("Se encontraron " + problems.length + " problema(s):\n - " + problems.join("\n - "));
  process.exit(1);
}
console.log(`Estructura correcta: ${scriptsInOrder.length} scripts, ${portfolio.weeks.length} semanas, ${localRefs.length} recursos locales.`);
