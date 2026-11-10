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
// Cada unidad y cada semana tiene su propia ilustración (img/unidad-N.jpg e img/semana-NN.jpg),
// dibujada con el tema de esa clase. Se generan con herramientas/gen_imagenes.py y gen_unidades.py.
const FOTOS_UNIDAD = {
  u1: "img/unidad-1.jpg",
  u2: "img/unidad-2.jpg",
  u3: "img/unidad-3.jpg",
  u4: "img/unidad-4.jpg",
  u5: "img/unidad-5.jpg",
  alt: "img/red-neuronal.jpg"
};

// Semanas que ya tienen su ilustración propia en img/semana-NN.jpg
const SEMANAS_CON_IMAGEN = [1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 14];

// Foto que se muestra para cada semana: su ilustración propia; si la semana es nueva y todavía
// no tiene, la de su unidad. Para usar otra, sube img/semana-NN.jpg (la página la detecta sola).
function getWeekPhotoSrc(weekNum, unitNum) {
  const abs = (ruta) => new URL(ruta, location.href).href;
  const nn = String(weekNum).padStart(2, "0");
  let porDefecto;
  if (SEMANAS_CON_IMAGEN.indexOf(weekNum) >= 0) porDefecto = abs("img/semana-" + nn + ".jpg");
  else porDefecto = abs(FOTOS_UNIDAD["u" + unitNum] || FOTOS_UNIDAD.u1);
  const propia = fotosPersonalizadas["semana-" + nn];
  return propia || porDefecto;
}

// Foto de una unidad: la personalizada (unidad-N) o, si no hay, la ilustración de la unidad
function getUnitPhotoSrc(unitNum, primeraSemana) {
  const ruta = FOTOS_UNIDAD["u" + unitNum] || FOTOS_UNIDAD.u1;
  return fotosPersonalizadas["unidad-" + unitNum] || new URL(ruta, location.href).href;
}

// ---------------------------------------------------------------------------
// Búsqueda de fotos personalizadas en img/ (una sola vez por foto)
// ---------------------------------------------------------------------------
const EXTENSIONES_FOTO = ["jpg", "jpeg", "png", "webp"];
const fotosPersonalizadas = {};   // nombre -> URL encontrada (o null si no existe)
const fotosEnBusqueda = {};       // nombre -> promesa en curso

function probarImagen(url) {
  return new Promise(resolve => {
    const im = new Image();
    im.onload = () => resolve(true);
    im.onerror = () => resolve(false);
    im.src = url;
  });
}

// Devuelve la URL de img/<nombre>.<ext> si existe, o null
function buscarFotoPersonalizada(nombre) {
  if (nombre in fotosPersonalizadas && fotosPersonalizadas[nombre] !== undefined) {
    return Promise.resolve(fotosPersonalizadas[nombre]);
  }
  if (fotosEnBusqueda[nombre]) return fotosEnBusqueda[nombre];
  const urls = EXTENSIONES_FOTO.map(ext => new URL(RUTA_IMAGENES + "/" + nombre + "." + ext, location.href).href);
  fotosEnBusqueda[nombre] = Promise.all(urls.map(probarImagen)).then(resultados => {
    const i = resultados.indexOf(true);
    fotosPersonalizadas[nombre] = i >= 0 ? urls[i] : null;
    return fotosPersonalizadas[nombre];
  });
  return fotosEnBusqueda[nombre];
}

// Recorre las <img data-foto="nombre"> de la página y cambia su foto si hay una personalizada
function aplicarFotosPersonalizadas() {
  document.querySelectorAll("img[data-foto]").forEach(img => {
    const nombre = img.dataset.foto;
    buscarFotoPersonalizada(nombre).then(url => {
      if (url && img.dataset.foto === nombre && img.src !== url) img.src = url;
    });
  });
}

// Vigila la página: cada vez que se dibuja una foto con data-foto, busca la suya
function iniciarFotosPersonalizadas() {
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
