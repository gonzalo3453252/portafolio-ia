/* =============================================================================
   VISOR DE EJEMPLO: COLAB  (viewers/demo-colab-viewer.js)
   Corre dentro de la ventana de previsualización. Imita la pantalla de Google Colab: botón Conectar,
   ejecutar celdas y descargar.
   ============================================================================= */
(function () {
  "use strict";

  const connectButton = document.getElementById("connBtn");
  connectButton.onclick = () => {
    connectButton.innerHTML = "Conectado (Python 3) &#10003;";
    connectButton.style.borderColor = "#16a34a";
    connectButton.style.color = "#15803d";
  };

  document.getElementById("dlColabTopBtn").onclick = requestParentDownload;

  document.getElementById("runCell2Btn").onclick = () => {
    const status = document.getElementById("execStatusText");
    status.style.fontWeight = "700";
    status.style.color = "#0f172a";
  };
})();
