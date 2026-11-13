/* =============================================================================
   CONFIGURACIÓN  (core/config.js)
   Datos que casi nunca cambian: repositorio de GitHub, rutas y nombres de carpetas.
   Si algún día cambias el nombre del repositorio, solo se edita este archivo.

   Depende de: utils.js (padWeek, al ejecutarse weekFolder).
   Expone: GITHUB_*, *_PATH, OFFICIAL_SYLLABUS, weekFolder, githubUploadUrl.
   ============================================================================= */
"use strict";

// Repositorio de GitHub donde vive esta página (usuario/repositorio) y su rama principal
const GITHUB_REPO = "gonzalo3453252/portafolio-ia";
const GITHUB_BRANCH = "main";

// Rutas dentro del repositorio (la página está en la raíz)
const PUBLISHED_DATA_PATH = "datos/portafolio.json";    // contenido publicado (lo que se edita con el panel)
const FILES_PATH = "archivos";                          // carpeta de los archivos reales (PPT, informes, cuadernos)
const IMAGES_PATH = "img";                              // fotos de la portada, unidades y semanas
const SYLLABUS_PATH = FILES_PATH + "/silabo";           // aquí va el sílabo en PDF
const OFFICIAL_SYLLABUS = "Silabo_Inteligencia_Artificial_UNMSM.pdf";   // el que viene incluido

/** Carpeta de una semana: archivos/semana-01, archivos/semana-02, ... */
function weekFolder(weekNumber) {
  return FILES_PATH + "/semana-" + padWeek(weekNumber);
}

// Enlaces de GitHub que abre el panel del creador
const GITHUB_EDIT_DATA_URL = "https://github.com/" + GITHUB_REPO + "/edit/" + GITHUB_BRANCH + "/" + PUBLISHED_DATA_PATH;

/** Dirección de la página de GitHub para subir archivos a una carpeta del repositorio. */
function githubUploadUrl(folder) {
  return "https://github.com/" + GITHUB_REPO + "/upload/" + GITHUB_BRANCH + "/" + folder;
}
