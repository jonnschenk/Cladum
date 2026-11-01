// Especies guardadas: persistencia local (localStorage), sin cuenta ni servidor.

import { STORAGE_KEYS } from '../config.js';

const listeners = new Set();

function read() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.favorites);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function write(list) {
  try {
    localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(list));
  } catch {
    // Modo privado o almacenamiento lleno: la app sigue funcionando sin persistir.
  }
  listeners.forEach((fn) => fn(list));
}

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
