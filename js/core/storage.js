/* =============================================================================
   ALMACENAMIENTO DEL NAVEGADOR  (core/storage.js)
   Único lugar donde se toca localStorage / sessionStorage.
   El navegador puede bloquearlos (modo privado, datos desactivados): en ese caso las lecturas devuelven
   null y las escrituras no hacen nada, y la página sigue funcionando sin guardar nada.

   Depende de: nada.
   Expone: STORAGE_KEYS, localStore, sessionStore.
   ============================================================================= */
"use strict";

/** Claves usadas en el navegador. Si cambia el formato de un dato guardado, se cambia su versión (_v17, _v1...). */
const STORAGE_KEYS = Object.freeze({
  STATE: "unmsm_fisi_ia_editorial_v17",     // cambios del panel creador aún sin publicar
  PENDING: "unmsm_fisi_ia_pendientes",      // "1" = hay cambios sin publicar en este navegador
  PHOTO_CACHE: "ia_fotos_v1",               // fotos propias conocidas (respaldo si falta datos/fotos.js)
  FILE_TREE: "ia_tree_v2"                   // lista de archivos de GitHub (sessionStorage, 5 min)
});

/**
 * Envuelve un almacenamiento del navegador para que nunca lance errores.
 * @param {() => Storage} getArea función que devuelve localStorage o sessionStorage
 */
function createSafeStorage(getArea) {
  return {
    /** @returns {string|null} el valor guardado, o null si no existe o el almacenamiento está bloqueado */
    get(key) {
      try { return getArea().getItem(key); } catch { return null; }
    },
    /** @returns {boolean} true si se pudo guardar */
    set(key, value) {
      try { getArea().setItem(key, value); return true; } catch { return false; }
    },
    remove(key) {
      try { getArea().removeItem(key); } catch { /* almacenamiento bloqueado: no hay nada que borrar */ }
    }
  };
}

const localStore = createSafeStorage(() => window.localStorage);
const sessionStore = createSafeStorage(() => window.sessionStorage);
