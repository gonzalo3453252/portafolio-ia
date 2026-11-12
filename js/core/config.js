/* =============================================================================
   CONFIGURACIÓN
   Datos que casi nunca cambian: repositorio de GitHub, rutas y nombres de carpetas.
   Si algún día cambias el nombre del repositorio, solo se edita este archivo.
   ============================================================================= */

// Repositorio de GitHub donde vive esta página (usuario/repositorio)
const GITHUB_REPO = "gonzalo3453252/portafolio-ia";
const GITHUB_BRANCH = "main";

// Rutas dentro del repositorio (la página está en la raíz)
const PUBLISHED_DATA_PATH = "datos/portafolio.json";   // contenido que editas con el panel
const FILES_PATH = "archivos";                          // carpeta de tus archivos reales
const IMAGES_PATH = "img";                               // fotos de la portada, unidades y semanas
const SYLLABUS_PATH = FILES_PATH + "/silabo";             // aquí va tu sílabo en PDF
const OFFICIAL_SYLLABUS = "Silabo_Inteligencia_Artificial_UNMSM.pdf";  // el que viene incluido

// Carpeta de una semana: archivos/semana-01, archivos/semana-02, ...
function weekFolder(numero) {
  return FILES_PATH + "/semana-" + String(numero).padStart(2, "0");
}

// Enlaces de GitHub que abre el panel del creador
const GITHUB_EDIT_DATA_URL = "https://github.com/" + GITHUB_REPO + "/edit/" + GITHUB_BRANCH + "/" + PUBLISHED_DATA_PATH;
function githubUploadUrl(carpeta) {
  return "https://github.com/" + GITHUB_REPO + "/upload/" + GITHUB_BRANCH + "/" + carpeta;
}
