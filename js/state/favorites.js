// Especies guardadas: persistencia local (localStorage), sin cuenta ni servidor.

import { STORAGE_KEYS } from '../config.js';

const listeners = new Set();

// Copia en memoria: si el navegador no deja guardar (modo privado, espacio lleno),
// la colección sigue funcionando mientras la pestaña esté abierta.
let memory = null;
let persistFailed = false;

function read() {
  if (memory) return [...memory];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.favorites);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function write(list) {
  memory = [...list];
  try {
    localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(list));
    persistFailed = false;
  } catch {
    // Modo privado o almacenamiento lleno: la app sigue funcionando sin persistir.
    persistFailed = true;
  }
  listeners.forEach((fn) => fn(list));
}

/**
 * ¿Se puede guardar en este navegador? Prueba una escritura real.
 * Devuelve false en modo privado estricto, con el almacenamiento bloqueado o lleno.
 */
export function storageAvailable() {
  if (persistFailed) return false;
  try {
    const probe = `${STORAGE_KEYS.favorites}:probe`;
    localStorage.setItem(probe, '1');
    localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

/** Texto común para el aviso de almacenamiento no disponible. */
export const STORAGE_WARNING = 'Tu navegador no permite guardar datos (modo privado o espacio lleno). Lo que guardes se perderá al cerrar la pestaña.';

export function getFavorites() {
  return read();
}

export function isFavorite(key) {
  return read().some((f) => f.key === Number(key));
}

/**
 * Guarda o quita una especie. Devuelve true si quedó guardada.
 * @param {{key:number, name:string, authorship?:string, vernacular?:string, family?:string, rank?:string}} taxon
 */
export function toggleFavorite(taxon) {
  const list = read();
  const index = list.findIndex((f) => f.key === Number(taxon.key));
  if (index >= 0) {
    list.splice(index, 1);
    write(list);
    return false;
  }
  list.unshift({ ...taxon, key: Number(taxon.key), savedAt: new Date().toISOString() });
  write(list);
  return true;
}

export function restoreFavorite(entry, position = 0) {
  const list = read().filter((f) => f.key !== entry.key);
  list.splice(position, 0, entry);
  write(list);
}

export function onFavoritesChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
