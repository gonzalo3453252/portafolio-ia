/* =============================================================================
   FUNCIONES COMUNES DE LOS VISORES  (viewers/viewer-common.js)
   Se carga DENTRO de la ventana de previsualización (iframe), antes del script de cada visor.
   ============================================================================= */
"use strict";

/** Pide a la página principal que descargue el archivo que se está viendo (botón "Descargar" del visor). */
function requestParentDownload() {
  // El visor se aloja en el mismo origen que la página: solo ella recibe el mensaje.
  const targetOrigin = (location.origin && location.origin !== "null") ? location.origin : "*";
  window.parent.postMessage({ action: "downloadModalFile" }, targetOrigin);
}
