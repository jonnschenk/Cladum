// Encabezado: tema, navegación activa, contador de guardadas y estado de conexión

import { STORAGE_KEYS } from '../config.js';
import { getFavorites, onFavoritesChange } from '../state/favorites.js';
import { icons } from '../ui/components.js';
import { showToast } from './feedback.js';

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

  // Banda persistente: se muestra vacía y luego se escribe, para que se anuncie
  const banner = document.querySelector('[data-net-banner]');
  if (!banner) return;
  banner.hidden = online;
  banner.textContent = '';
  if (!online) {
    requestAnimationFrame(() => {
      banner.innerHTML = `${icons.offline(18)}<span><strong>Sin conexión.</strong> Lo que ves puede estar desactualizado y las consultas nuevas esperarán a que vuelvas a conectarte.</span>`;
    });
  }
}

function onOnline() {
  paintConnection();
  // Las vistas que fallaron por falta de red se reintentan solas (ver states.js)
  showToast(`${icons.check(14)} Conexión restablecida`);
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
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', paintConnection);

  paintFavCount();
  onFavoritesChange(paintFavCount);
}

// La ficha y las ocurrencias se abren desde Explorar: cuentan como esa sección
const SECTION = { species: 'search', occurrences: 'search' };

/** Marca la sección activa del nav. */
export function updateNav(routeName) {
  const section = SECTION[routeName] ?? routeName;
  document.querySelectorAll('[data-nav]').forEach((link) => {
    if (link.dataset.nav !== section) link.removeAttribute('aria-current');
    // "page" solo en la propia página; dentro de la sección, "true"
    else link.setAttribute('aria-current', section === routeName ? 'page' : 'true');
  });
}
