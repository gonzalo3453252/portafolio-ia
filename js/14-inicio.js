/* =============================================================================
   INICIO
   Lo primero que se ejecuta cuando la página carga.
   ============================================================================= */

window.addEventListener("DOMContentLoaded", async () => {
  await loadPublishedState();      // 1) contenido publicado (datos/portafolio.json)
  loadSavedState();                // 2) cambios guardados en tu navegador (si eres tú)
  renderProfileHeader();
  populateWeekSelectors();
  showPresentacionPage();
  autoDetectWeekFiles();           // 3) busca tus archivos reales en GitHub

  iniciarEventosPagina();
  iniciarPanelCreador();
});
