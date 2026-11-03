// Store de Redux: une los slices y guarda lo que debe sobrevivir a la recarga

import { configureStore, createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import uiReducer, { toggleTheme, setOnline, showToast } from '../features/ui/uiSlice.js';
import favoritesReducer, {
  toggleFavorite, restoreFavorite, setPersistFailed,
} from '../features/favorites/favoritesSlice.js';
import searchReducer from '../features/search/searchSlice.js';
import speciesReducer, { fetchSpecies, setLastSpecies } from '../features/species/speciesSlice.js';
import occurrencesReducer from '../features/occurrences/occurrencesSlice.js';
import homeReducer from '../features/home/homeSlice.js';
import { STORAGE_KEYS } from '../config.js';
import { writeJson, writeText } from '../utils/storage.js';

function listeners() {
  const listener = createListenerMiddleware();

  // Guardadas → localStorage. Si el navegador no deja, se marca para avisar.
  listener.startListening({
    matcher: isAnyOf(toggleFavorite, restoreFavorite),
    effect: (_, api) => {
      const { items, persistFailed } = api.getState().favorites;
      const failed = !writeJson(STORAGE_KEYS.favorites, items);
      if (failed !== persistFailed) api.dispatch(setPersistFailed(failed));
    },
  });

  listener.startListening({
    actionCreator: toggleTheme,
    effect: (_, api) => writeText(STORAGE_KEYS.theme, api.getState().ui.theme),
  });

  // Última ficha → sessionStorage (se olvida al cerrar la pestaña)
  listener.startListening({
    matcher: isAnyOf(setLastSpecies, fetchSpecies.fulfilled),
    effect: (_, api) => writeJson(STORAGE_KEYS.lastSpecies, api.getState().species.lastSpecies, { session: true }),
  });

  listener.startListening({
    actionCreator: setOnline,
    effect: (action, api) => {
      if (action.payload && !api.getOriginalState().ui.online) {
        api.dispatch(showToast({ text: 'Conexión restablecida', icon: 'check' }));
      }
    },
  });

  return listener.middleware;
}

/** Crea un store nuevo; las pruebas lo usan con un estado inicial propio. */
export function makeStore(preloadedState) {
  return configureStore({
    reducer: {
      ui: uiReducer,
      favorites: favoritesReducer,
      search: searchReducer,
      species: speciesReducer,
      occurrences: occurrencesReducer,
      home: homeReducer,
    },
    preloadedState,
    middleware: (getDefault) => getDefault().prepend(listeners()),
  });
}

export const store = makeStore();
