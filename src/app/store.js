// Store de Redux: une los slices y guarda en localStorage lo que debe sobrevivir a la pestaña

import { configureStore, createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import uiReducer, { toggleTheme } from '../features/ui/uiSlice.js';
import favoritesReducer, {
  toggleFavorite, restoreFavorite, setPersistFailed,
} from '../features/favorites/favoritesSlice.js';
import { STORAGE_KEYS } from '../config.js';
import { writeJson, writeText } from '../utils/storage.js';

function persistence() {
  const listener = createListenerMiddleware();

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

  return listener.middleware;
}

/** Crea un store nuevo; las pruebas lo usan con un estado inicial propio. */
export function makeStore(preloadedState) {
  return configureStore({
    reducer: { ui: uiReducer, favorites: favoritesReducer },
    preloadedState,
    middleware: (getDefault) => getDefault().prepend(persistence()),
  });
}

export const store = makeStore();
