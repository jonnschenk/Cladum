// Estado de la app que se comparte entre vistas (no el de cada pantalla).

import { STORAGE_KEYS } from '../config.js';

const state = {
  route: null,
  lastSpecies: readLastSpecies(),
};

const listeners = new Set();

function readLastSpecies() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEYS.lastSpecies);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getState() {
  return state;
}

export function setState(patch) {
  Object.assign(state, patch);
  if ('lastSpecies' in patch) {
    try {
      sessionStorage.setItem(STORAGE_KEYS.lastSpecies, JSON.stringify(patch.lastSpecies));
    } catch {
      /* sin persistencia, no pasa nada */
    }
  }
  listeners.forEach((fn) => fn(state));
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
