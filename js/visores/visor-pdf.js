/* Visor de PDF (se carga dentro de la ventana de previsualización).
   Dibuja todas las páginas con pdf.js, con zoom y número de página. */
(function () {
  var cfg = window.__VIEW__;
  var PDFJS = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
  var WORKER = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  var box = document.getElementById("pages");
  var indicator = document.getElementById("pageIndicator");
  var zoomLabel = document.getElementById("zoomLabel");
  var pdf = null, total = 0, zoom = 1, ratio = 1.414, observer = null;

  function fallback(msg) {
    box.innerHTML = '<div class="fb"><p>' + (msg || "No se pudo mostrar el PDF aquí.") + '</p><p><a href="' + cfg.url + '" target="_blank" rel="noopener">Abrir el PDF en una pestaña nueva</a></p></div>';
  }
  function loadScript(src, ok, fail) {
    var s = document.createElement("script");
    s.src = src; s.onload = ok; s.onerror = fail;
    document.head.appendChild(s);
  }
  function pageWidth() {
    return Math.max(260, Math.min(box.clientWidth - 24, 1000)) * zoom;
  }
  function layout() {
    var w = pageWidth();
    var holders = box.querySelectorAll(".pg");
    for (var i = 0; i < holders.length; i++) {
      holders[i].style.width = w + "px";
      holders[i].style.height = Math.round(w * ratio) + "px";
      holders[i].removeAttribute("data-w");
      holders[i].innerHTML = "";
    }
    zoomLabel.textContent = Math.round(zoom * 100) + "%";
    holders = box.querySelectorAll(".pg");
    for (var j = 0; j < holders.length; j++) { observer.unobserve(holders[j]); observer.observe(holders[j]); }
  }
  function renderPage(div) {
    var n = parseInt(div.getAttribute("data-n"), 10);
    var w = pageWidth();
    if (div.getAttribute("data-w") === String(Math.round(w))) return;
    div.setAttribute("data-w", String(Math.round(w)));
    pdf.getPage(n).then(function (page) {
      var v0 = page.getViewport({ scale: 1 });
      var scale = w / v0.width;
      var dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      var vp = page.getViewport({ scale: scale * dpr });
      var canvas = document.createElement("canvas");
      canvas.width = Math.floor(vp.width); canvas.height = Math.floor(vp.height);
      canvas.style.width = Math.round(w) + "px";
      canvas.style.height = Math.round(vp.height / dpr) + "px";
      div.style.height = canvas.style.height;
      div.innerHTML = "";
      div.appendChild(canvas);
      page.render({ canvasContext: canvas.getContext("2d"), viewport: vp });
    });
  }
  function updateIndicator() {
    var holders = box.querySelectorAll(".pg");
    var top = box.scrollTop + box.clientHeight / 3, cur = 1;
    for (var i = 0; i < holders.length; i++) { if (holders[i].offsetTop <= top) cur = i + 1; }
    indicator.textContent = cur + " / " + total;
  }
  function setZoom(z) {
    var rel = box.scrollHeight ? box.scrollTop / box.scrollHeight : 0;
    zoom = Math.max(0.5, Math.min(3, z));
    layout();
    box.scrollTop = rel * box.scrollHeight;
  }
  document.getElementById("zoomIn").onclick = function () { if (pdf) setZoom(zoom + 0.25); };
  document.getElementById("zoomOut").onclick = function () { if (pdf) setZoom(zoom - 0.25); };
  document.getElementById("dl").onclick = function () { parent.postMessage({ action: "downloadModalFile" }, "*"); };
  box.addEventListener("scroll", updateIndicator);

  loadScript(PDFJS, function () {
    try {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER;
      window.pdfjsLib.getDocument({ url: cfg.url }).promise.then(function (doc) {
        pdf = doc; total = doc.numPages;
        return doc.getPage(1).then(function (p1) {
          var v = p1.getViewport({ scale: 1 });
          ratio = v.height / v.width;
          box.innerHTML = "";
          observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) { if (e.isIntersecting) renderPage(e.target); });
          }, { root: box, rootMargin: "900px 0px" });
          for (var i = 1; i <= total; i++) {
            var d = document.createElement("div");
            d.className = "pg"; d.setAttribute("data-n", String(i));
            box.appendChild(d);
          }
          layout(); updateIndicator();
        });
      }).catch(function () { fallback("No se pudo cargar este PDF dentro de la página."); });
    } catch (e) { fallback(); }
  }, function () { fallback("No se pudo cargar el visor de PDF (sin conexión a internet)."); });
})();
