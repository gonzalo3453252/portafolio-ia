/* =============================================================================
   FOTOS DE UNIDADES Y ESCUDO
   Qué foto usa cada semana y unidad, fotos personalizadas y el escudo (SVG) de las diapositivas.

   FOTOS PERSONALIZADAS (sin tocar código): sube a la carpeta img/ una imagen con
   uno de estos nombres y la página la usará sola en lugar de la foto por defecto:
       portada-facultad.jpg  portada-docente.jpg   → fotos de la portada
       unidad-1.jpg … unidad-5.jpg                  → foto de cada unidad
       semana-01.jpg … semana-15.jpg                → foto de cada semana
   Formatos aceptados: .jpg  .jpeg  .png  .webp
   Si no existe la foto con ese nombre, se usa la de siempre.
   ============================================================================= */

// Fotografías de cada unidad (están en la carpeta img/)
const FOTOS_UNIDAD = {
  u1: "img/unidad-1-robotica-agentes.jpg",
  u2: "img/unidad-2-busquedas-juegos.jpg",
  u3: "img/unidad-3-machine-learning.jpg",
  u4: "img/unidad-4-deep-learning.jpg",
  u5: "img/unidad-5-ia-generativa-etica.jpg",
  alt: "img/red-neuronal.jpg"
};

// Foto que se muestra para cada semana. Para cambiar la foto de una semana,
// cambia el valor aquí (u1…u5 o alt). Las semanas que no aparecen usan u1.
// Foto por defecto de una semana (la de siempre, sin mirar las fotos personalizadas)
function getDefaultWeekPhotoSrc(weekNum) {
  const abs = (ruta) => new URL(ruta, location.href).href;
  const p1 = abs(FOTOS_UNIDAD.u1), p2 = abs(FOTOS_UNIDAD.u2), p3 = abs(FOTOS_UNIDAD.u3);
  const p4 = abs(FOTOS_UNIDAD.u4), p5 = abs(FOTOS_UNIDAD.u5), pAlt = abs(FOTOS_UNIDAD.alt);
  const weekPool = {
    1: p1, 2: pAlt, 3: p2, 4: p1, 5: p3, 6: p2, 7: pAlt,
    9: pAlt, 10: p4, 11: p3, 12: p5, 13: p4, 14: p5
  };
  return weekPool[weekNum] || p1;
}

function getWeekPhotoSrc(weekNum, unitNum) {
  const propia = fotosPersonalizadas["semana-" + String(weekNum).padStart(2, "0")];
  return propia || getDefaultWeekPhotoSrc(weekNum);
}

// Foto de una unidad: la personalizada (unidad-N) o, si no hay, la de siempre de esa unidad.
// NO usa la foto personalizada de su primera semana: así subir semana-01.jpg solo cambia la semana 1.
function getUnitPhotoSrc(unitNum, primeraSemana) {
  return fotosPersonalizadas["unidad-" + unitNum] || getDefaultWeekPhotoSrc(primeraSemana || 1);
}

// ---------------------------------------------------------------------------
// Búsqueda de fotos personalizadas en img/ (una sola vez por foto)
// ---------------------------------------------------------------------------
const EXTENSIONES_FOTO = ["jpg", "jpeg", "png", "webp"];
const fotosPersonalizadas = {};   // nombre -> URL encontrada (o null si no existe)
const fotosEnBusqueda = {};       // nombre -> promesa en curso

// Memoria del navegador: recuerda qué fotos propias existen para dibujarlas bien desde el primer
// instante (sin que se vea un momento la foto de antes). Igual se comprueba de nuevo en segundo plano.
const FOTOS_CACHE_KEY = "ia_fotos_v1";
try {
  const guardadas = JSON.parse(localStorage.getItem(FOTOS_CACHE_KEY) || "{}");
  Object.keys(guardadas).forEach((k) => { fotosPersonalizadas[k] = guardadas[k]; });
} catch (e) {}
function guardarCacheFotos() {
  try { localStorage.setItem(FOTOS_CACHE_KEY, JSON.stringify(fotosPersonalizadas)); } catch (e) {}
}

// Lista de fotos propias que genera GitHub solo al subir imágenes (datos/fotos.js). Llega ANTES de
// dibujar la página, así cualquiera (también un visitante nuevo) ve la foto correcta al instante.
// Si ese archivo no existe, se usa el método de respaldo de abajo (memoria del navegador + comprobar).
const FOTOS_LISTA = (typeof window !== "undefined" && window.__FOTOS_LISTA && typeof window.__FOTOS_LISTA === "object") ? window.__FOTOS_LISTA : null;
if (FOTOS_LISTA) {
  Object.keys(fotosPersonalizadas).forEach((k) => { delete fotosPersonalizadas[k]; });
  Object.keys(FOTOS_LISTA).forEach((k) => { fotosPersonalizadas[k] = new URL(FOTOS_LISTA[k], location.href).href; });
}

function probarImagen(url) {
  return new Promise(resolve => {
    const im = new Image();
    im.onload = () => resolve(true);
    im.onerror = () => resolve(false);
    im.src = url;
  });
}

// Devuelve la URL de img/<nombre>.<ext> si existe, o null
// (se comprueba una sola vez por visita, aunque la memoria del navegador ya tenga una respuesta)
function buscarFotoPersonalizada(nombre) {
  if (FOTOS_LISTA) return Promise.resolve(fotosPersonalizadas[nombre] || null);   // la lista ya lo dice
  if (fotosEnBusqueda[nombre]) return fotosEnBusqueda[nombre];
  const urls = EXTENSIONES_FOTO.map(ext => new URL(RUTA_IMAGENES + "/" + nombre + "." + ext, location.href).href);
  fotosEnBusqueda[nombre] = Promise.all(urls.map(probarImagen)).then(resultados => {
    const i = resultados.indexOf(true);
    const nueva = i >= 0 ? urls[i] : null;
    const cambio = fotosPersonalizadas[nombre] !== nueva;
    fotosPersonalizadas[nombre] = nueva;
    if (cambio) guardarCacheFotos();
    return nueva;
  });
  return fotosEnBusqueda[nombre];
}

// La foto se muestra (se quita el "oculto") cuando ya es la definitiva y terminó de cargar.
// Mientras tanto el CSS la mantiene transparente, así nunca se ve primero la foto de antes.
function marcarFotoLista(img, nombre) {
  const listo = () => { if (img.dataset.foto === nombre) img.setAttribute("data-listo", nombre); };
  if (img.complete && img.naturalWidth > 0) listo();
  else { img.addEventListener("load", listo, { once: true }); img.addEventListener("error", listo, { once: true }); }
}

// Recorre las <img data-foto="nombre"> de la página y cambia su foto si hay una personalizada
function aplicarFotosPersonalizadas() {
  document.querySelectorAll("img[data-foto]").forEach(img => {
    const nombre = img.dataset.foto;
    if (img.dataset.listo === nombre) return;               // ya resuelta
    const poner = (url) => {
      if (img.dataset.foto !== nombre) return;
      if (url && img.src !== url) img.src = url;
      marcarFotoLista(img, nombre);
    };
    // Con la lista de GitHub la respuesta es inmediata y definitiva: sin esperas ni comprobaciones
    if (FOTOS_LISTA) { poner(fotosPersonalizadas[nombre] || null); return; }
    // Respaldo: si el navegador ya sabe la respuesta (visita anterior), se usa de inmediato
    if (nombre in fotosPersonalizadas) poner(fotosPersonalizadas[nombre]);
    // Primera visita (o foto nueva): se espera la comprobación, con un tope por si algo falla
    buscarFotoPersonalizada(nombre).then(poner);
    setTimeout(() => { if (img.dataset.foto === nombre && !img.hasAttribute("data-listo")) img.setAttribute("data-listo", nombre); }, 3000);
  });
}

// Vigila la página: cada vez que se dibuja una foto con data-foto, busca la suya
// Cuando la página ya terminó de cargar, baja en segundo plano las fotos de las demás semanas y
// unidades (son livianas) para que al navegar ya estén listas. Se omite con "ahorro de datos".
function precargarFotosEnSegundoPlano() {
  if (!FOTOS_LISTA) return;
  try { if (navigator.connection && navigator.connection.saveData) return; } catch (e) {}
  // Fotos de semanas y unidades propias + las de siempre de cada unidad (todas son livianas)
  const urls = [];
  const agregar = (u) => { if (u && urls.indexOf(u) < 0) urls.push(u); };
  Object.keys(fotosPersonalizadas).forEach((k) => agregar(fotosPersonalizadas[k]));
  Object.keys(FOTOS_UNIDAD).forEach((k) => agregar(new URL(FOTOS_UNIDAD[k], location.href).href));
  let i = 0, activas = 0;
  const siguiente = () => {
    while (activas < 3 && i < urls.length) {          // de a 3 a la vez: rápido pero sin saturar la conexión
      activas++;
      const im = new Image();
      im.decoding = "async";
      const fin = () => { activas--; siguiente(); };
      im.onload = fin; im.onerror = fin;
      im.src = urls[i++];
    }
  };
  // Arranca apenas la página está lista (las portadas ya pidieron lo suyo antes), sin esperar al evento "load"
  const arrancar = () => setTimeout(siguiente, 300);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", arrancar, { once: true });
  else arrancar();
}

function iniciarFotosPersonalizadas() {
  window.__fotosIniciado = true;
  precargarFotosEnSegundoPlano();
  let pendiente = false;
  const programar = () => {
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(() => { pendiente = false; aplicarFotosPersonalizadas(); });
  };
  new MutationObserver(programar).observe(document.body, {
    childList: true, subtree: true, attributes: true, attributeFilter: ["data-foto"]
  });
  aplicarFotosPersonalizadas();
}

// Escudo de la universidad (dibujo vectorial)
const UNMSM_SHIELD_SVG = `<svg viewBox="0 0 120 140" width="54" height="64" xmlns="http://www.w3.org/2000/svg" style="flex-shrink:0;">
  <defs>
    <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#eab308"/>
      <stop offset="50%" stop-color="#ca8a04"/>
      <stop offset="100%" stop-color="#854d0e"/>
    </linearGradient>
  </defs>
  <path d="M60 6 L106 24 L106 72 C106 104 84 124 60 134 C36 124 14 104 14 72 L14 24 Z" fill="url(#goldGrad)" stroke="#713f12" stroke-width="3"/>
  <path d="M60 14 L98 29 L98 70 C98 97 80 114 60 123 C40 114 22 97 22 70 L22 29 Z" fill="#fef9c3" stroke="#a16207" stroke-width="2"/>
  <path d="M60 20 L92 33 L92 68 C92 91 77 106 60 115 C43 106 28 91 28 68 L28 33 Z" fill="#1e3a8a"/>
  <line x1="60" y1="20" x2="60" y2="115" stroke="#eab308" stroke-width="2.5"/>
  <line x1="28" y1="68" x2="92" y2="68" stroke="#eab308" stroke-width="2.5"/>
  <circle cx="44" cy="46" r="8" fill="#eab308"/>
  <polygon points="76,36 80,46 90,46 82,52 85,62 76,56 67,62 70,52 62,46 72,46" fill="#eab308"/>
  <path d="M36 84 Q44 76 52 84 L52 96 L36 96 Z" fill="#eab308"/>
  <path d="M68 84 Q76 76 84 84 L84 96 L68 96 Z" fill="#eab308"/>
  <circle cx="60" cy="12" r="4" fill="#b91c1c"/>
</svg>`;
