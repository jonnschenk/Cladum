// Guardar especies + toasts con "Deshacer"

import { toggleFavorite, isFavorite, getFavorites, restoreFavorite } from '../state/favorites.js';
import { icons } from '../ui/components.js';
import { esc } from '../utils/dom.js';

let toastTimer;

/** Anuncia un mensaje breve a lectores de pantalla sin mostrarlo. */
export function announce(message) {
  const region = document.querySelector('[data-announcer]');
  if (!region) return;
  // Vaciar primero obliga a repetir el anuncio aunque el texto sea igual
  region.textContent = '';
  requestAnimationFrame(() => {
    region.textContent = message;
  });
}

export function showToast(html, { actionLabel, onAction, duration = 5000 } = {}) {
  const region = document.querySelector('[data-toast]');
  if (!region) return;
  clearTimeout(toastTimer);
  region.innerHTML = `
    <div class="toast">
      <span class="toast__text">${html}</span>
      ${actionLabel ? `<button class="toast__action" type="button">${esc(actionLabel)}</button>` : ''}
    </div>`;

  const toast = region.querySelector('.toast');
  const hide = () => {
    region.innerHTML = '';
  };
  const schedule = () => {
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hide, duration);
  };

  // El tiempo se pausa mientras el toast tiene el puntero o el foco (WCAG 2.2.1)
  toast.addEventListener('mouseenter', () => clearTimeout(toastTimer));
  toast.addEventListener('mouseleave', schedule);
  toast.addEventListener('focusin', () => clearTimeout(toastTimer));
  toast.addEventListener('focusout', schedule);

  const button = toast.querySelector('.toast__action');
  if (button && onAction) {
    button.addEventListener('click', () => {
      onAction();
      hide();
    }, { once: true });
  }
  schedule();
}

function paint(button, saved, label) {
  button.setAttribute('aria-pressed', String(saved));
  button.setAttribute('aria-label', `${saved ? 'Quitar de guardadas' : 'Guardar'} ${label}`);
  button.innerHTML = `${saved ? icons.bookmarkFilled(16) : icons.bookmark(16)}<span data-save-text>${saved ? 'Guardada' : 'Guardar'}</span>`;
}

/**
 * Conecta los botones [data-save] dentro de root con un taxón.
 * @param {HTMLElement} root
 * @param {{key:number,name:string}} taxon
 */
export function bindSaveButtons(root, taxon) {
  root.querySelectorAll('[data-save]').forEach((button) => {
    paint(button, isFavorite(taxon.key), taxon.name);

    button.addEventListener('click', () => {
      const before = getFavorites();
      const position = before.findIndex((f) => f.key === taxon.key);
      const entry = before[position];
      const saved = toggleFavorite(taxon);
      root.querySelectorAll('[data-save]').forEach((b) => paint(b, saved, taxon.name));

      if (saved) {
        showToast(`<i lang="la">${esc(taxon.name)}</i> se guardó en este navegador`);
      } else {
        showToast(`<i lang="la">${esc(taxon.name)}</i> se quitó de guardadas`, {
          actionLabel: 'Deshacer',
          onAction: () => {
            restoreFavorite(entry, position);
            root.querySelectorAll('[data-save]').forEach((b) => paint(b, true, taxon.name));
          },
        });
      }
    });
  });
}
