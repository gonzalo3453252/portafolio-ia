// Reglas de calidad del JavaScript (se ejecutan con `npm run lint`).
//
// El sitio usa <script> clásicos que comparten el ámbito global (no módulos). Por eso ESLint necesita
// saber qué nombres declara cada archivo para los demás: se leen automáticamente de js/ (core, data, features).
// Ver docs/ARQUITECTURA.md, sección "Por qué no módulos ES".
const fs = require("fs");
const path = require("path");
const globals = require("globals");

/** Todos los .js de una carpeta (sin entrar en vendor/ ni node_modules/). */
function listJsFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return ["vendor", "node_modules"].includes(entry.name) ? [] : listJsFiles(full);
    return entry.name.endsWith(".js") ? [full] : [];
  });
}

/** Nombres (funciones y constantes de nivel superior) que declara cada archivo de la página. */
function topLevelNames(files) {
  const names = {};
  const pattern = /^(?:async\s+)?function\s+([A-Za-z_$][\w$]*)|^(?:const|let|var)\s+([A-Za-z_$][\w$]*)/gm;
  for (const file of files) {
    const source = fs.readFileSync(file, "utf8");
    for (const match of source.matchAll(pattern)) names[match[1] || match[2]] = "writable";
  }
  return names;
}

const jsDir = path.join(__dirname, "js");
const pageFiles = listJsFiles(jsDir).filter((file) => !file.includes(`${path.sep}viewers${path.sep}`));
const pageGlobals = topLevelNames(pageFiles);
const viewerGlobals = topLevelNames(listJsFiles(path.join(jsDir, "viewers")));

const sharedRules = {
  "no-undef": "error",
  "no-unused-vars": ["warn", { vars: "local", args: "none" }],
  "no-dupe-keys": "error",
  "no-unreachable": "warn",
  "no-empty": "error",          // nunca un catch vacío: explica por qué se ignora el error
  "eqeqeq": "error",
  "no-var": "error",
  "prefer-const": "warn",
  "no-shadow": "warn",
  "complexity": ["warn", 15],
  "max-lines-per-function": ["warn", { max: 80, skipComments: true, skipBlankLines: true }]
};

module.exports = [
  { ignores: ["js/vendor/**", "node_modules/**", "css/**", "archivos/**", "img/**"] },
  {
    // Código de la página (comparte el ámbito global entre archivos)
    files: ["js/**/*.js"],
    ignores: ["js/viewers/**"],
    languageOptions: {
      sourceType: "script",
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...pageGlobals, __PHOTO_LIST: "readonly", __FILE_LIST: "readonly" }
    },
    rules: sharedRules
  },
  {
    // Código que corre dentro de los visores (iframes): usa solo su propio grupo de archivos
    files: ["js/viewers/**/*.js"],
    languageOptions: {
      sourceType: "script",
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...viewerGlobals, __VIEW__: "readonly", pdfjsLib: "readonly", marked: "readonly" }
    },
    rules: sharedRules
  },
  {
    // Herramientas de Node (pruebas y configuración)
    files: ["tests/**/*.js", "eslint.config.js", "tailwind.config.js"],
    languageOptions: { sourceType: "commonjs", ecmaVersion: 2022, globals: { ...globals.node } },
    rules: sharedRules
  }
];
