/* =============================================================================
   FOTOS DE UNIDADES Y SEMANAS  (features/photos.js)
   Qué foto usa cada semana y cada unidad, y cómo se muestran las fotos propias del creador.

   FOTOS PROPIAS (sin tocar código): sube a la carpeta img/ una imagen con uno de estos nombres y la
   página la usará sola en lugar de la foto por defecto:
       portada-facultad.jpg  portada-docente.jpg   → fotos de la portada
       unidad-1.jpg … unidad-5.jpg                  → foto de cada unidad
       semana-01.jpg … semana-15.jpg                → foto de cada semana
   Formatos aceptados: .jpg  .jpeg  .png  .webp. Si no existe la foto con ese nombre, se usa la de siempre.

   Cómo se sabe qué fotos propias existen:
     1. Normal: datos/fotos.js (PHOTO_LIST), que genera GitHub al subir imágenes. Llega antes de dibujar la
        página, así que la foto correcta se ve desde el primer instante.
     2. Respaldo (si ese archivo falta): se prueban los nombres posibles y se recuerda el resultado en el navegador.

   Las <img data-foto="nombre"> permanecen ocultas (CSS) hasta tener marcado data-listo: así nunca se ve
   primero la foto de antes.

   Depende de: config.js, storage.js, utils.js. Expone: UNIT_PHOTOS, getWeekPhotoSrc, getUnitPhotoSrc,
   applyCustomPhotos, initCustomPhotos.
   ============================================================================= */
"use strict";

// ---------------------------------------------------------------------------
// Fotos por defecto (están en la carpeta img/)
// ---------------------------------------------------------------------------
const UNIT_PHOTOS = {
  u1: "img/unidad-1-robotica-agentes.jpg",
  u2: "img/unidad-2-busquedas-juegos.jpg",
  u3: "img/unidad-3-machine-learning.jpg",
  u4: "img/unidad-4-deep-learning.jpg",
  u5: "img/unidad-5-ia-generativa-etica.jpg",
  alt: "img/red-neuronal.jpg"
};

/** Qué foto por defecto usa cada semana (u1…u5 o alt). Las semanas que no aparecen usan la de la unidad 1. */
const DEFAULT_WEEK_PHOTO_KEY = { 1: "u1", 2: "alt", 3: "u2", 4: "u1", 5: "u3", 6: "u2", 7: "alt", 9: "alt", 10: "u4", 11: "u3", 12: "u5", 13: "u4", 14: "u5" };

const absoluteUrl = (path) => new URL(path, location.href).href;

/** Foto por defecto de una semana (la de siempre, sin mirar las fotos propias). */
function getDefaultWeekPhotoSrc(weekNum) {
  return absoluteUrl(UNIT_PHOTOS[DEFAULT_WEEK_PHOTO_KEY[weekNum] || "u1"]);
}

/** Foto de una semana: la propia (semana-NN) o, si no hay, la de siempre. */
function getWeekPhotoSrc(weekNum) {
  return customPhotos["semana-" + padWeek(weekNum)] || getDefaultWeekPhotoSrc(weekNum);
}

/**
 * Foto de una unidad: la propia (unidad-N) o, si no hay, la de siempre de su primera semana.
 * No usa la foto propia de esa semana: así subir semana-01.jpg solo cambia la semana 1.
 */
function getUnitPhotoSrc(unitNum, firstWeek) {
  return customPhotos["unidad-" + unitNum] || getDefaultWeekPhotoSrc(firstWeek || 1);
}

// ---------------------------------------------------------------------------
// Qué fotos propias existen
// ---------------------------------------------------------------------------
const PHOTO_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];
const PHOTO_READY_TIMEOUT_MS = 3000;   // si la comprobación tarda más, la foto se muestra igual

/** nombre de foto -> dirección encontrada (o null si no existe) */
const customPhotos = {};
/** nombre de foto -> comprobación en curso (para no repetirla) */
const photoLookups = {};

/** Lista oficial de fotos propias generada por GitHub, o null si datos/fotos.js no existe. */
const PHOTO_LIST = (window.__PHOTO_LIST && typeof window.__PHOTO_LIST === "object") ? window.__PHOTO_LIST : null;

/** Memoria del navegador: recuerda qué fotos propias existen (se vuelve a comprobar en segundo plano). */
function loadPhotoCache() {
  try {
    Object.assign(customPhotos, JSON.parse(localStore.get(STORAGE_KEYS.PHOTO_CACHE) || "{}"));
  } catch {
    // Memoria dañada: se ignora y se vuelve a comprobar
  }
}

function savePhotoCache() {
  localStore.set(STORAGE_KEYS.PHOTO_CACHE, JSON.stringify(customPhotos));
}

loadPhotoCache();
if (PHOTO_LIST) {
  // La lista de GitHub manda: reemplaza lo recordado por el navegador
  Object.keys(customPhotos).forEach((name) => { delete customPhotos[name]; });
  Object.keys(PHOTO_LIST).forEach((name) => { customPhotos[name] = absoluteUrl(PHOTO_LIST[name]); });
}

/** Resuelve true si la imagen de esa dirección carga bien. */
function imageLoads(url) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(true);
    image.onerror = () => resolve(false);
    image.src = url;
  });
}

/** Devuelve la dirección de img/<nombre>.<ext> si existe, o null (se comprueba una vez por visita). */
function findCustomPhoto(name) {
  if (PHOTO_LIST) return Promise.resolve(customPhotos[name] || null);   // la lista ya lo dice
  if (photoLookups[name]) return photoLookups[name];
  const urls = PHOTO_EXTENSIONS.map((ext) => absoluteUrl(IMAGES_PATH + "/" + name + "." + ext));
  photoLookups[name] = Promise.all(urls.map(imageLoads)).then((results) => {
    const index = results.indexOf(true);
    const found = index >= 0 ? urls[index] : null;
    const changed = customPhotos[name] !== found;
    customPhotos[name] = found;
    if (changed) savePhotoCache();
    return found;
  });
  return photoLookups[name];
}

// ---------------------------------------------------------------------------
// Mostrar las fotos en la página
// ---------------------------------------------------------------------------
/** Marca la foto como lista (ya se muestra) cuando ya es la definitiva y terminó de cargar. */
function markPhotoReady(img, name) {
  const markReady = () => { if (img.dataset.foto === name) img.setAttribute("data-listo", name); };
  if (img.complete && img.naturalWidth > 0) {
    markReady();
  } else {
    img.addEventListener("load", markReady, { once: true });
    img.addEventListener("error", markReady, { once: true });
  }
}

/** Resuelve la foto de una <img data-foto="nombre">: pone la propia si existe y la muestra. */
function resolvePhoto(img) {
  const name = img.dataset.foto;
  if (img.dataset.listo === name) return;                    // ya resuelta
  const apply = (url) => {
    if (img.dataset.foto !== name) return;                   // la imagen se reutilizó para otra foto
    if (url && img.src !== url) img.src = url;
    markPhotoReady(img, name);
  };

  // Con la lista de GitHub la respuesta es inmediata y definitiva
  if (PHOTO_LIST) { apply(customPhotos[name] || null); return; }

  // Respaldo: si el navegador ya sabe la respuesta (visita anterior) se usa de inmediato; luego se comprueba
  if (name in customPhotos) apply(customPhotos[name]);
  findCustomPhoto(name).then(apply);
  setTimeout(() => {
    if (img.dataset.foto === name && !img.hasAttribute("data-listo")) img.setAttribute("data-listo", name);
  }, PHOTO_READY_TIMEOUT_MS);
}

/** Recorre las <img data-foto="nombre"> de la página y cambia su foto si hay una propia. */
function applyCustomPhotos() {
  document.querySelectorAll("img[data-foto]").forEach(resolvePhoto);
}

// ---------------------------------------------------------------------------
// Precarga en segundo plano
// ---------------------------------------------------------------------------
const PRELOAD_PARALLEL = 3;          // fotos que se bajan a la vez
const PRELOAD_START_DELAY_MS = 300;  // espera tras cargar la página

/** Baja en segundo plano las fotos de las demás semanas y unidades (son livianas) para que al navegar ya estén. */
function preloadPhotosInBackground() {
  if (!PHOTO_LIST) return;
  if (navigator.connection && navigator.connection.saveData) return;   // respeta el "ahorro de datos"

  const urls = [];
  const add = (url) => { if (url && !urls.includes(url)) urls.push(url); };
  Object.keys(customPhotos).forEach((name) => add(customPhotos[name]));
  Object.keys(UNIT_PHOTOS).forEach((key) => add(absoluteUrl(UNIT_PHOTOS[key])));

  let next = 0;
  let active = 0;
  const pump = () => {
    while (active < PRELOAD_PARALLEL && next < urls.length) {
      active++;
      const image = new Image();
      image.decoding = "async";
      const done = () => { active--; pump(); };
      image.onload = done;
      image.onerror = done;
      image.src = urls[next++];
    }
  };
  const start = () => setTimeout(pump, PRELOAD_START_DELAY_MS);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
}

/** Arranca el sistema de fotos: precarga y vigila la página para resolver cada foto que se dibuje. */
function initCustomPhotos() {
  window.__photosStarted = true;   // lo lee el aviso de index.html para no ocultar las fotos si este script no arrancó
  preloadPhotosInBackground();

  let scheduled = false;
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { scheduled = false; applyCustomPhotos(); });
  };
  new MutationObserver(schedule).observe(document.body, {
    childList: true, subtree: true, attributes: true, attributeFilter: ["data-foto"]
  });
  applyCustomPhotos();
}
