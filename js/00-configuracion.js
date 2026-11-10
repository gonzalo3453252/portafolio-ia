/* =============================================================================
   CONFIGURACIÓN
   Datos que casi nunca cambian: repositorio de GitHub, rutas y nombres de carpetas.
   Si algún día cambias el nombre del repositorio, solo se edita este archivo.
   ============================================================================= */

// Repositorio de GitHub donde vive esta página (usuario/repositorio)
const GITHUB_REPO = "gonzalo3453252/portafolio-ia";
const GITHUB_RAMA = "main";

// Rutas dentro del repositorio (la página está en la raíz)
const RUTA_DATOS_PUBLICADOS = "datos/portafolio.json";   // contenido que editas con el panel
const RUTA_ARCHIVOS = "archivos";                          // carpeta de tus archivos reales
const RUTA_IMAGENES = "img";                               // fotos de la portada, unidades y semanas
const RUTA_SILABO = RUTA_ARCHIVOS + "/silabo";             // aquí va tu sílabo en PDF
const SILABO_OFICIAL = "Silabo_Inteligencia_Artificial_UNMSM.pdf";  // el que viene incluido

// Carpeta de una semana: archivos/semana-01, archivos/semana-02, ...
function carpetaSemana(numero) {
  return RUTA_ARCHIVOS + "/semana-" + String(numero).padStart(2, "0");
}

// Enlaces de GitHub que abre el panel del creador
const GITHUB_URL_EDITAR_DATOS = "https://github.com/" + GITHUB_REPO + "/edit/" + GITHUB_RAMA + "/" + RUTA_DATOS_PUBLICADOS;
function githubUrlSubir(carpeta) {
  return "https://github.com/" + GITHUB_REPO + "/upload/" + GITHUB_RAMA + "/" + carpeta;
}
