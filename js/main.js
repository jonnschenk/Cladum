// ─────────────────────────────────────────────
// Cladum · punto de entrada
// Arquitectura: services (API) · state (datos) · ui (vistas) · handlers (eventos)
// ─────────────────────────────────────────────

import { startRouter } from './router.js';
import { setState, subscribe } from './state/store.js';
import { initHeader, updateNav } from './handlers/headerHandlers.js';
import { isAbort } from './utils/dom.js';
import { renderSearchView } from './ui/views/searchView.js';
import { renderSpeciesView } from './ui/views/speciesView.js';
import { renderOccurrencesView } from './ui/views/occurrencesView.js';
import { renderSavedView } from './ui/views/savedView.js';
import { renderAboutView } from './ui/views/aboutView.js';
import { renderError } from './ui/states.js';

const app = document.getElementById('app');

const views = {
  search: renderSearchView,
  species: renderSpeciesView,
  occurrences: renderOccurrencesView,
  saved: renderSavedView,
  about: renderAboutView,
};

let controller = null;
// Vista en pantalla. Si expone update(), los cambios de parámetros de esa misma
// vista (p. ej. un filtro) se aplican en su sitio, sin redibujar ni mover el foco.
let current = null;

const sameView = (route) => current?.update && current.name === route.name && current.key === route.key;

async function onRoute(route) {
  // Cancela las consultas de la vista anterior (o de la actualización anterior)
  controller?.abort();
  controller = new AbortController();
  setState({ route });

  if (sameView(route)) {
    try {
      await current.update(route, { signal: controller.signal });
    } catch (error) {
      if (!isAbort(error)) console.error(error);
    }
    return;
  }

  current = null;
  document.title = 'Cladum · Explorador de biodiversidad';
  window.scrollTo({ top: 0, behavior: 'instant' });

  try {
    const view = await views[route.name](app, route, { signal: controller.signal });
    if (controller.signal.aborted) return;
    current = { name: route.name, key: route.key, update: view?.update };
    // Mueve el foco al título de la nueva vista (lectores de pantalla)
    app.querySelector('h1[tabindex="-1"]')?.focus({ preventScroll: true });
  } catch (error) {
    if (isAbort(error)) return;
    console.error(error);
    renderError(app, error, { onRetry: () => onRoute(route) });
    app.querySelector('h1[tabindex="-1"]')?.focus({ preventScroll: true });
  }
}

initHeader();
subscribe((state) => updateNav(state.route?.name));
startRouter(onRoute);
