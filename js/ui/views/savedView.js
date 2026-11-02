// Vista: Especies guardadas (localStorage)

import {
  getFavorites, toggleFavorite, restoreFavorite, storageAvailable, STORAGE_WARNING,
} from '../../state/favorites.js';
import { showToast } from '../../handlers/feedback.js';
import { buildHash } from '../../router.js';
import { esc } from '../../utils/dom.js';
import { formatDate, rankLabel } from '../../utils/format.js';
import { icons, taxonName, stateBlock } from '../components.js';

function item(f) {
  const meta = [rankLabel(f.rank), f.family, f.vernacular].filter(Boolean).map(esc).join(' · ');
  return `
    <li class="saved-list__item" data-item="${esc(f.key)}">
      <a class="saved-list__link" href="${buildHash(`/especie/${f.key}`)}">
        <span class="saved-list__name">${taxonName(f.name, f.rank)} <span class="saved-list__author">${esc(f.authorship)}</span></span>
        <span class="saved-list__meta">${meta}</span>
      </a>
      <span class="saved-list__date"><span class="u-visually-hidden">Guardada el </span>${esc(formatDate(f.savedAt))}</span>
      <button class="btn btn--ghost btn--sm" type="button" data-remove="${esc(f.key)}" aria-label="Quitar ${esc(f.name)} de guardadas">Quitar</button>
    </li>`;
}

export function renderSavedView(app) {
  document.title = 'Guardadas · Cladum';

  app.innerHTML = `
    <div class="stack u-view-enter" data-saved-view>
      <header class="page-head">
        <div class="page-head__text">
          <span class="eyebrow">Colección personal · guardada en este navegador</span>
          <h1 class="page-head__title" tabindex="-1">Especies guardadas <span class="page-head__count" data-total></span></h1>
          <p class="page-head__lead">Sin cuenta y sin servidor. Si borras los datos del navegador, se borra la colección.</p>
        </div>
      </header>
      ${storageAvailable() ? '' : `
        <div class="callout callout--warn" role="status">
          <span class="callout__icon">${icons.alert(16)}</span>
          <span class="callout__body"><span class="callout__title">Tu colección no se conservará</span><span class="callout__text">${esc(STORAGE_WARNING)}</span></span>
        </div>`}
      <div class="search search--compact" role="search">
        <div class="search__box">
          <label class="search__field">
            ${icons.search(18)}
            <span class="u-visually-hidden">Buscar en tu colección</span>
            <input class="search__input" type="search" placeholder="Buscar en tu colección" data-filter>
          </label>
        </div>
      </div>
      <div data-list></div>
    </div>`;

  const root = app.querySelector('[data-saved-view]');
  const listSlot = root.querySelector('[data-list]');
  const filter = root.querySelector('[data-filter]');
  const total = root.querySelector('[data-total]');

  const paint = () => {
    const all = getFavorites();
    total.textContent = String(all.length);
    const q = filter.value.trim().toLowerCase();
    const shown = q
      ? all.filter((f) => [f.name, f.vernacular, f.family].filter(Boolean).join(' ').toLowerCase().includes(q))
      : all;

    if (!all.length) {
      listSlot.innerHTML = stateBlock({
        type: 'empty',
        art: 'bookmark',
        title: 'Aún no guardas especies',
        text: 'Usa el botón Guardar en la ficha de una especie o en los resultados de búsqueda. Tu colección vive en este navegador, sin cuenta.',
        actions: `<a class="btn btn--primary" href="${buildHash('/')}">Explorar especies</a>`,
      });
      return;
    }
    if (!shown.length) {
      listSlot.innerHTML = stateBlock({
        type: 'no-results',
        title: `Nada coincide con «${esc(filter.value.trim())}»`,
        text: 'Se busca en el nombre científico, el nombre común y la familia.',
        actions: '<button class="btn btn--secondary" type="button" data-clear>Limpiar búsqueda</button>',
      });
      return;
    }
    listSlot.innerHTML = `<ul class="saved-list">${shown.map(item).join('')}</ul>`;
  };

  filter.addEventListener('input', paint);

  const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** La fila se pliega antes de desaparecer; así se ve qué se quitó. */
  const collapse = (row) => {
    if (reduceMotion()) return row.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150 }).finished;
    const height = row.offsetHeight;
    row.style.overflow = 'hidden';
    return row.animate(
      [
        { opacity: 1, height: `${height}px` },
        { opacity: 0, height: '0px', paddingTop: '0px', paddingBottom: '0px', marginBottom: '-8px' },
      ],
      { duration: 220, easing: 'cubic-bezier(0.2, 0, 0, 1)' },
    ).finished;
  };

  /** Tras quitar, el foco pasa a la fila siguiente (o a la anterior, o al buscador). */
  const focusAfterRemoval = (index) => {
    const buttons = [...listSlot.querySelectorAll('[data-remove]')];
    (buttons[index] ?? buttons[index - 1] ?? filter).focus();
  };

  root.addEventListener('click', async (event) => {
    if (event.target.closest('[data-clear]')) {
      filter.value = '';
      paint();
      filter.focus();
      return;
    }

    const button = event.target.closest('[data-remove]');
    if (!button || button.disabled) return;
    const key = Number(button.dataset.remove);
    const list = getFavorites();
    const position = list.findIndex((f) => f.key === key);
    const entry = list[position];
    if (!entry) return;

    const row = button.closest('[data-item]');
    const index = [...listSlot.querySelectorAll('[data-item]')].indexOf(row);
    button.disabled = true;
    await collapse(row).catch(() => {});

    toggleFavorite(entry);
    paint();
    focusAfterRemoval(index);
    showToast(`<i lang="la">${esc(entry.name)}</i> se quitó de guardadas`, {
      actionLabel: 'Deshacer',
      onAction: () => {
        restoreFavorite(entry, position);
        paint();
        // La fila vuelve a su sitio con un fundido y recibe el foco
        const restored = listSlot.querySelector(`[data-item="${entry.key}"]`);
        restored?.classList.add('u-swap');
        restored?.querySelector('a')?.focus();
      },
    });
  });

  paint();
}
