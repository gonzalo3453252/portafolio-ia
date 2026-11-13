/* =============================================================================
   VISOR DE PDF  (viewers/pdf-viewer.js)
   Corre dentro de la ventana de previsualización. Dibuja todas las páginas del PDF con pdf.js
   (librería local en js/vendor/), con zoom y número de página.

   Recibe en window.__VIEW__: { url, title, vendor }.
   ============================================================================= */
(function () {
  "use strict";

  const config = window.__VIEW__;
  const PDFJS_URL = config.vendor + "pdf.min.js";
  const PDFJS_WORKER_URL = config.vendor + "pdf.worker.min.js";

  const ZOOM_STEP = 0.25;
  const ZOOM_MIN = 0.5;
  const ZOOM_MAX = 3;
  const MAX_PIXEL_RATIO = 2.5;           // más resolución que esto no se nota y gasta memoria
  const PRELOAD_MARGIN = "900px 0px";    // empieza a dibujar las páginas un poco antes de que aparezcan

  const pagesBox = document.getElementById("pages");
  const pageIndicator = document.getElementById("pageIndicator");
  const zoomLabel = document.getElementById("zoomLabel");

  let pdfDocument = null;
  let totalPages = 0;
  let zoom = 1;
  let pageRatio = 1.414;                 // alto / ancho de la primera página (A4 por defecto)
  let pageObserver = null;

  /** Muestra un mensaje de error con el enlace para abrir el PDF en otra pestaña. */
  function showFallback(message) {
    pagesBox.innerHTML = '<div class="fb"><p>' + (message || "No se pudo mostrar el PDF aquí.") + '</p><p><a href="'
      + config.url + '" target="_blank" rel="noopener">Abrir el PDF en una pestaña nueva</a></p></div>';
  }

  function loadScript(src, onLoad, onError) {
    const script = document.createElement("script");
    script.src = src;
    script.onload = onLoad;
    script.onerror = onError;
    document.head.appendChild(script);
  }

  /** Ancho en pantalla de cada página (según el espacio disponible y el zoom). */
  function pageWidth() {
    return Math.max(260, Math.min(pagesBox.clientWidth - 24, 1000)) * zoom;
  }

  /** Reserva el espacio de todas las páginas (vacías) y vuelve a observarlas para dibujarlas. */
  function layoutPages() {
    const width = pageWidth();
    pagesBox.querySelectorAll(".pg").forEach((holder) => {
      holder.style.width = width + "px";
      holder.style.height = Math.round(width * pageRatio) + "px";
      holder.removeAttribute("data-w");
      holder.innerHTML = "";
    });
    zoomLabel.textContent = Math.round(zoom * 100) + "%";
    pagesBox.querySelectorAll(".pg").forEach((holder) => {
      pageObserver.unobserve(holder);
      pageObserver.observe(holder);
    });
  }

  /** Dibuja una página en su contenedor (solo si aún no está dibujada a este ancho). */
  function renderPage(holder) {
    const pageNumber = parseInt(holder.getAttribute("data-n"), 10);
    const width = pageWidth();
    if (holder.getAttribute("data-w") === String(Math.round(width))) return;
    holder.setAttribute("data-w", String(Math.round(width)));

    pdfDocument.getPage(pageNumber).then((page) => {
      const baseViewport = page.getViewport({ scale: 1 });
      const scale = width / baseViewport.width;
      const pixelRatio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
      const viewport = page.getViewport({ scale: scale * pixelRatio });

      const canvas = document.createElement("canvas");
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      canvas.style.width = Math.round(width) + "px";
      canvas.style.height = Math.round(viewport.height / pixelRatio) + "px";
      holder.style.height = canvas.style.height;
      holder.innerHTML = "";
      holder.appendChild(canvas);
      page.render({ canvasContext: canvas.getContext("2d"), viewport: viewport });
    });
  }

  /** Actualiza "página X / N" según lo que se ve. */
  function updatePageIndicator() {
    const threshold = pagesBox.scrollTop + pagesBox.clientHeight / 3;
    let current = 1;
    pagesBox.querySelectorAll(".pg").forEach((holder, index) => {
      if (holder.offsetTop <= threshold) current = index + 1;
    });
    pageIndicator.textContent = current + " / " + totalPages;
  }

  /** Cambia el zoom conservando la posición de lectura. */
  function setZoom(value) {
    const relativePosition = pagesBox.scrollHeight ? pagesBox.scrollTop / pagesBox.scrollHeight : 0;
    zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, value));
    layoutPages();
    pagesBox.scrollTop = relativePosition * pagesBox.scrollHeight;
  }

  /** Crea los contenedores de página y empieza a dibujarlas cuando se acercan a la pantalla. */
  function buildPages(firstPage) {
    const viewport = firstPage.getViewport({ scale: 1 });
    pageRatio = viewport.height / viewport.width;
    pagesBox.innerHTML = "";
    pageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) renderPage(entry.target); });
    }, { root: pagesBox, rootMargin: PRELOAD_MARGIN });
    for (let number = 1; number <= totalPages; number++) {
      const holder = document.createElement("div");
      holder.className = "pg";
      holder.setAttribute("data-n", String(number));
      pagesBox.appendChild(holder);
    }
    layoutPages();
    updatePageIndicator();
  }

  function openDocument() {
    try {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
      window.pdfjsLib.getDocument({ url: config.url }).promise
        .then((doc) => {
          pdfDocument = doc;
          totalPages = doc.numPages;
          return doc.getPage(1).then(buildPages);
        })
        .catch(() => showFallback("No se pudo cargar este PDF dentro de la página."));
    } catch {
      showFallback();
    }
  }

  document.getElementById("zoomIn").onclick = () => { if (pdfDocument) setZoom(zoom + ZOOM_STEP); };
  document.getElementById("zoomOut").onclick = () => { if (pdfDocument) setZoom(zoom - ZOOM_STEP); };
  document.getElementById("dl").onclick = requestParentDownload;
  pagesBox.addEventListener("scroll", updatePageIndicator);

  loadScript(PDFJS_URL, openDocument, () => showFallback("No se pudo cargar el visor de PDF (sin conexión a internet)."));
})();
