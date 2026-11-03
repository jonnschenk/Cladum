// Especies guardadas: colección local, sin cuenta ni servidor.
// La persistencia en localStorage vive en app/store.js (listener).

import { createSlice } from '@reduxjs/toolkit';
import { STORAGE_KEYS } from '../../config.js';
import { readJson } from '../../utils/storage.js';

export function loadFavorites() {
  const list = readJson(STORAGE_KEYS.favorites, []);
  return Array.isArray(list) ? list : [];
}

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState: () => ({
    items: loadFavorites(),
    // true si el navegador no dejó guardar (modo privado o espacio lleno)
    persistFailed: false,
  }),
  reducers: {
    /** Guarda o quita una especie. */
    toggleFavorite: {
      reducer(state, action) {
        const taxon = action.payload;
        const index = state.items.findIndex((f) => f.key === taxon.key);
        if (index >= 0) state.items.splice(index, 1);
        else state.items.unshift(taxon);
      },
      // La fecha se calcula aquí: los reducers deben ser puros
      prepare: (taxon) => ({
        payload: { ...taxon, key: Number(taxon.key), savedAt: new Date().toISOString() },
      }),
    },
    /** Deshacer: devuelve una especie quitada a su posición original. */
    restoreFavorite(state, action) {
      const { entry, position = 0 } = action.payload;
      state.items = state.items.filter((f) => f.key !== entry.key);
      state.items.splice(position, 0, entry);
    },
    setPersistFailed(state, action) {
      state.persistFailed = action.payload;
    },
  },
});

export const { toggleFavorite, restoreFavorite, setPersistFailed } = favoritesSlice.actions;
export default favoritesSlice.reducer;

export const selectFavorites = (state) => state.favorites.items;
export const selectFavoritesCount = (state) => state.favorites.items.length;
export const selectIsFavorite = (key) => (state) => state.favorites.items.some((f) => f.key === Number(key));
export const selectPersistFailed = (state) => state.favorites.persistFailed;
