/* =============================================================================
   VISOR DE CUADERNOS DE COLAB (.ipynb)  (viewers/notebook-viewer.js)
   Corre dentro de la ventana de previsualización. Muestra el texto, el código y los resultados del cuaderno.
   El texto en Markdown se convierte con marked (librería local en js/vendor/) y se limpia (sanitize)
   antes de mostrarlo.

   Recibe en window.__VIEW__: { nb, title, colabUrl, vendor }.
   ============================================================================= */
(function () {
  "use strict";

  const config = window.__VIEW__;
  const notebook = config.nb || {};
  const root = document.getElementById("nb");
  const MARKED_URL = config.vendor + "marked.min.js";

  // ---- Texto seguro ------------------------------------------------------
  const isEmpty = (value) => value === null || value === undefined;
  const escapeText = (text) => String(isEmpty(text) ? "" : text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const joinLines = (value) => (Array.isArray(value) ? value.join("") : (isEmpty(value) ? "" : String(value)));
  const stripAnsi = (text) => String(text).replace(/\u001b\[[0-9;]*m/g, "");

  /** Quita de un HTML ajeno todo lo que pueda ejecutar código (scripts, iframes, eventos on..., javascript:). */
  function sanitize(html) {
    const template = document.createElement("template");
    template.innerHTML = html;
    template.content.querySelectorAll("script,iframe,object,embed,link,meta,base,form,style").forEach((node) => node.remove());
    template.content.querySelectorAll("*").forEach((element) => {
      Array.from(element.attributes).forEach((attribute) => {
        const name = attribute.name.toLowerCase();
        const isEventHandler = name.startsWith("on");
        const isScriptUrl = ["href", "src", "xlink:href", "action"].includes(name) && /^\s*javascript:/i.test(attribute.value);
        if (isEventHandler || isScriptUrl) element.removeAttribute(attribute.name);
      });
      if (element.tagName === "A") {
        element.setAttribute("target", "_blank");
        element.setAttribute("rel", "noopener");
      }
    });
    return template.innerHTML;
  }

  // ---- Resaltado de código Python ----------------------------------------
  // Grupos: 1 comentario, 2 texto entre comillas, 3 número, 4 palabra reservada, 5 función conocida
  const PYTHON_TOKENS = /(#[^\n]*)|("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*')|(\b\d+(?:\.\d+)?\b)|(\b(?:import|from|as|def|class|return|if|elif|else|for|in|while|try|except|finally|with|lambda|not|and|or|is|None|True|False|pass|break|continue|raise|yield|global|assert|del)\b)|(\b(?:print|len|range|str|int|float|list|dict|set|open|sum|min|max|zip|enumerate)\b(?=\())/g;
  const TOKEN_CLASSES = ["c", "s", "n", "k", "f"];

  function highlightPython(code) {
    let output = "";
    let lastIndex = 0;
    PYTHON_TOKENS.lastIndex = 0;
    let match;
    while ((match = PYTHON_TOKENS.exec(code))) {
      output += escapeText(code.slice(lastIndex, match.index));
      const group = match.findIndex((value, index) => index > 0 && value !== undefined) - 1;
      output += '<span class="' + TOKEN_CLASSES[group] + '">' + escapeText(match[0]) + "</span>";
      lastIndex = PYTHON_TOKENS.lastIndex;
    }
    return output + escapeText(code.slice(lastIndex));
  }

  // ---- Celdas ------------------------------------------------------------
  function markdownToHtml(text) {
    if (window.marked && window.marked.parse) {
      try {
        return sanitize(window.marked.parse(text, { mangle: false, headerIds: false }));
      } catch {
        // Markdown con errores: se muestra como texto simple
      }
    }
    return "<p>" + escapeText(text).replace(/\n/g, "<br>") + "</p>";
  }

  function rowHtml(prompt, inner, extraClass) {
    return '<div class="row"><div class="prompt">' + prompt + '</div><div class="body ' + (extraClass || "") + '">' + inner + "</div></div>";
  }

  /** Resultado de una celda de código (texto, error, tabla HTML o imagen). */
  function outputHtml(output) {
    if (output.output_type === "stream") {
      return rowHtml("", '<pre class="out' + (output.name === "stderr" ? " err" : "") + '">' + escapeText(stripAnsi(joinLines(output.text))) + "</pre>");
    }
    if (output.output_type === "error") {
      const traceback = (output.traceback && output.traceback.length) ? output.traceback.join("\n") : (output.ename + ": " + output.evalue);
      return rowHtml("", '<pre class="out err">' + escapeText(stripAnsi(traceback)) + "</pre>");
    }
    const data = output.data || {};
    if (data["text/html"]) return rowHtml("", '<div class="html">' + sanitize(joinLines(data["text/html"])) + "</div>");
    if (data["image/png"]) return rowHtml("", '<img src="data:image/png;base64,' + joinLines(data["image/png"]).replace(/\s/g, "") + '">');
    if (data["image/jpeg"]) return rowHtml("", '<img src="data:image/jpeg;base64,' + joinLines(data["image/jpeg"]).replace(/\s/g, "") + '">');
    if (data["image/svg+xml"]) return rowHtml("", '<img src="data:image/svg+xml;charset=utf-8,' + encodeURIComponent(joinLines(data["image/svg+xml"])) + '">');
    if (data["text/plain"]) return rowHtml("", '<pre class="out">' + escapeText(stripAnsi(joinLines(data["text/plain"]))) + "</pre>");
    return "";
  }

  function cellHtml(cell) {
    if (cell.cell_type === "markdown") {
      return '<div class="cell md">' + markdownToHtml(joinLines(cell.source)) + "</div>";
    }
    if (cell.cell_type === "code") {
      const number = cell.execution_count;
      const prompt = "[" + (isEmpty(number) ? "&nbsp;" : number) + "]:";
      const outputs = (cell.outputs || []).map(outputHtml).join("");
      return '<div class="cell">' + rowHtml(prompt, '<pre class="src">' + highlightPython(joinLines(cell.source)) + "</pre>") + outputs + "</div>";
    }
    return '<div class="cell"><pre class="out">' + escapeText(joinLines(cell.source)) + "</pre></div>";
  }

  function renderNotebook() {
    const cells = notebook.cells || [];
    root.innerHTML = cells.map(cellHtml).join("") || '<p class="empty">Este cuaderno no tiene celdas.</p>';
    document.getElementById("count").textContent = cells.length + " celdas";
  }

  const downloadButton = document.getElementById("dl");
  if (downloadButton) downloadButton.onclick = requestParentDownload;

  // Se carga marked y, pase lo que pase (cargue o falle), se dibuja el cuaderno
  const markedScript = document.createElement("script");
  markedScript.src = MARKED_URL;
  markedScript.onload = renderNotebook;
  markedScript.onerror = renderNotebook;
  document.head.appendChild(markedScript);
})();
