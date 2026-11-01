// ─────────────────────────────────────────────
// Cladum · punto de entrada
// Arquitectura: services (API) · state (datos) · ui (vistas) · handlers (eventos)
// ─────────────────────────────────────────────

import { startRouter } from './router.js';
import { getState, setState, subscribe } from './state/store.js';
import { initHeader, updateNav } from './handlers/headerHandlers.js';
import { isAbort } from './utils/dom.js';
import { renderSearchView } from './ui/views/searchView.js';
import { renderSpeciesView } from './ui/views/speciesView.js';
import { renderOccurrencesView } from './ui/views/occurrencesView.js';
import { renderSavedView } from './ui/views/savedView.js';
import { stateBlock } from './ui/components.js';

const app = document.getElementById('app');

const views = {
  search: renderSearchView,
  species: renderSpeciesView,
  occurrences: renderOccurrencesView,
  saved: renderSavedView,
};

let controller = null;

async function onRoute(route) {
  // Cancela las consultas de la vista anterior
  controller?.abort();
  controller = new AbortController();

  setState({ route });
  document.title = 'Cladum · Explorador de biodiversidad';
  window.scrollTo({ top: 0, behavior: 'instant' });

  try {
    await views[route.name](app, route, { signal: controller.signal });
    // Mueve el foco al título de la nueva vista (lectores de pantalla)
    app.querySelector('h1[tabindex="-1"]')?.focus({ preventScroll: true });
  } catch (error) {
    if (isAbort(error)) return;
    console.error(error);
    app.innerHTML = stateBlock({
      type: 'error',
      title: 'Algo salió mal',
      text: 'Recarga la página para intentarlo de nuevo.',
      level: 1,
    });
  }
}

initHeader();
subscribe((state) => updateNav(state.route?.name, state.lastSpecies));
updateNav(null, getState().lastSpecies);
startRouter(onRoute);
