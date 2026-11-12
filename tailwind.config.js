// Tailwind: revisa estos archivos y genera css/tailwind.css con solo las clases que usas.
// (Lo hace solo la tarea automática de GitHub cada vez que cambias index.html o js/; no tienes que hacer nada.)
module.exports = {
  content: ["./index.html", "./js/**/*.js", "!./js/vendor/**"],
  // Si algún día armas una clase "pegando pedacitos" en el código (ej. "bg-" + color), agrégala aquí para que no se pierda:
  safelist: [],
  theme: { extend: {} },
  plugins: []
};
