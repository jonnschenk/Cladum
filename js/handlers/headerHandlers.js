// Encabezado: tema, navegación activa, contador de guardadas y estado de conexión

import { STORAGE_KEYS } from '../config.js';
import { getFavorites, onFavoritesChange } from '../state/favorites.js';
import { icons } from '../ui/components.js';

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const button = document.querySelector('[data-theme-toggle]');
  if (!button) return;
  const dark = theme === 'dark';
  button.setAttribute('aria-label', dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
  button.innerHTML = dark ? icons.sun(18) : icons.moon(18);
}

function paintConnection() {
  const online = navigator.onLine;
  const dot = document.querySelector('[data-connection] .pill__dot');
  const text = document.querySelector('[data-connection-text]');
  dot?.classList.toggle('pill__dot--offline', !online);
  if (text) text.textContent = online ? 'GBIF · en vivo' : 'Sin conexión';
}

function paintFavCount(list = getFavorites()) {
  const badge = document.querySelector('[data-fav-count]');
  if (badge) badge.textContent = String(list.length);
}

export function initHeader() {
  applyTheme(document.documentElement.dataset.theme || 'light');

  document.querySelector('[data-theme-toggle]')?.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try {
      localStorage.setItem(STORAGE_KEYS.theme, next);
    } catch {
      /* sin persistencia */
    }
  });

  paintConnection();
  window.addEventListener('online', paintConnection);
  window.addEventListener('offline', paintConnection);

  paintFavCount();
  onFavoritesChange(paintFavCount);
}

/** Marca la sección activa y habilita Taxonomía / Ocurrencias si hay una especie reciente. */
export function updateNav(routeName, lastSpecies) {
  document.querySelectorAll('[data-nav]').forEach((link) => {
    const name = link.dataset.nav;
    if (name === 'species' || name === 'occurrences') {
      // Sin especie reciente el enlace pierde su href: deja de ser enfocable y navegable
      if (lastSpecies?.key) {
        link.href = name === 'species' ? `#/especie/${lastSpecies.key}` : `#/especie/${lastSpecies.key}/ocurrencias`;
        link.removeAttribute('aria-disabled');
      } else {
        link.removeAttribute('href');
        link.setAttribute('aria-disabled', 'true');
      }
    }
    if (name === routeName) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}
