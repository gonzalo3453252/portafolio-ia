/* Visor de cuadernos de Colab (.ipynb) (se carga dentro de la ventana de previsualización).
   Muestra texto, código y resultados del cuaderno. */
(function () {
  var cfg = window.__VIEW__, nb = cfg.nb || {};
  var root = document.getElementById("nb");
  var MARKED = cfg.vendor + "marked.min.js";

  function esc(t) { return String(t == null ? "" : t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function join(v) { return Array.isArray(v) ? v.join("") : (v == null ? "" : String(v)); }
  function stripAnsi(t) { return String(t).replace(/\u001b\[[0-9;]*m/g, ""); }
  function sanitize(html) {
    var t = document.createElement("template");
    t.innerHTML = html;
    t.content.querySelectorAll("script,iframe,object,embed,link,meta,base,form,style").forEach(function (n) { n.remove(); });
    t.content.querySelectorAll("*").forEach(function (el) {
      Array.prototype.slice.call(el.attributes).forEach(function (a) {
        var n = a.name.toLowerCase();
        if (n.indexOf("on") === 0 || ((n === "href" || n === "src" || n === "xlink:href" || n === "action") && /^\s*javascript:/i.test(a.value))) el.removeAttribute(a.name);
      });
      if (el.tagName === "A") { el.setAttribute("target", "_blank"); el.setAttribute("rel", "noopener"); }
    });
    return t.innerHTML;
  }
  var RE = /(#[^\n]*)|("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*')|(\b\d+(?:\.\d+)?\b)|(\b(?:import|from|as|def|class|return|if|elif|else|for|in|while|try|except|finally|with|lambda|not|and|or|is|None|True|False|pass|break|continue|raise|yield|global|assert|del)\b)|(\b(?:print|len|range|str|int|float|list|dict|set|open|sum|min|max|zip|enumerate)\b(?=\())/g;
  function highlight(code) {
    var out = "", last = 0, m;
    RE.lastIndex = 0;
    while ((m = RE.exec(code))) {
      out += esc(code.slice(last, m.index));
      var cls = m[1] ? "c" : m[2] ? "s" : m[3] ? "n" : m[4] ? "k" : "f";
      out += '<span class="' + cls + '">' + esc(m[0]) + "</span>";
      last = RE.lastIndex;
    }
    return out + esc(code.slice(last));
  }
  function md(text) {
    if (window.marked && window.marked.parse) {
      try { return sanitize(window.marked.parse(text, { mangle: false, headerIds: false })); } catch (e) {}
    }
    return "<p>" + esc(text).replace(/\n/g, "<br>") + "</p>";
  }
  function row(prompt, inner, cls) {
    return '<div class="row"><div class="prompt">' + prompt + '</div><div class="body ' + (cls || "") + '">' + inner + "</div></div>";
  }
  function outputHtml(o) {
    if (o.output_type === "stream") return row("", "<pre class=\"out" + (o.name === "stderr" ? " err" : "") + "\">" + esc(stripAnsi(join(o.text))) + "</pre>");
    if (o.output_type === "error") {
      var tb = (o.traceback && o.traceback.length) ? o.traceback.join("\n") : (o.ename + ": " + o.evalue);
      return row("", '<pre class="out err">' + esc(stripAnsi(tb)) + "</pre>");
    }
    var d = o.data || {};
    if (d["text/html"]) return row("", '<div class="html">' + sanitize(join(d["text/html"])) + "</div>");
    if (d["image/png"]) return row("", '<img src="data:image/png;base64,' + join(d["image/png"]).replace(/\s/g, "") + '">');
    if (d["image/jpeg"]) return row("", '<img src="data:image/jpeg;base64,' + join(d["image/jpeg"]).replace(/\s/g, "") + '">');
    if (d["image/svg+xml"]) return row("", '<img src="data:image/svg+xml;charset=utf-8,' + encodeURIComponent(join(d["image/svg+xml"])) + '">');
    if (d["text/plain"]) return row("", '<pre class="out">' + esc(stripAnsi(join(d["text/plain"]))) + "</pre>");
    return "";
  }
  function render() {
    var cells = nb.cells || [];
    var html = "";
    cells.forEach(function (c) {
      if (c.cell_type === "markdown") {
        html += '<div class="cell md">' + md(join(c.source)) + "</div>";
      } else if (c.cell_type === "code") {
        var n = c.execution_count;
        html += '<div class="cell">' + row("[" + (n == null ? "&nbsp;" : n) + "]:", '<pre class="src">' + highlight(join(c.source)) + "</pre>");
        (c.outputs || []).forEach(function (o) { html += outputHtml(o); });
        html += "</div>";
      } else {
        html += '<div class="cell"><pre class="out">' + esc(join(c.source)) + "</pre></div>";
      }
    });
    root.innerHTML = html || '<p class="empty">Este cuaderno no tiene celdas.</p>';
    document.getElementById("count").textContent = cells.length + " celdas";
  }
  var dl = document.getElementById("dl");
  if (dl) dl.onclick = function () { parent.postMessage({ action: "downloadModalFile" }, "*"); };
  var s = document.createElement("script");
  s.src = MARKED; s.onload = render; s.onerror = render;
  document.head.appendChild(s);
})();
