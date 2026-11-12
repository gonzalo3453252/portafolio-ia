/* =============================================================================
   INICIO
   Lo primero que se ejecuta cuando la página carga.
   ============================================================================= */

window.addEventListener("DOMContentLoaded", async () => {
  applyCustomPhotos();    // fotos de la portada: ya se sabe cuál va, sin esperar a la red
  await loadPublishedState();      // 1) contenido publicado (datos/portafolio.json)
  loadSavedState();                // 2) cambios guardados en tu navegador (si eres tú)
  renderProfileHeader();
  populateWeekSelectors();
  showPresentacionPage();
  initCustomPhotos();    // usa tus fotos de img/ (semana-01.jpg, unidad-1.jpg, portada-…)
  autoDetectWeekFiles();           // 3) busca tus archivos reales en GitHub

  bindPageEvents();
  initCreatorPanel();
});
