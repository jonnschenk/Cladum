// Vista: Especies guardadas (localStorage)

import { getFavorites, toggleFavorite, restoreFavorite } from '../../state/favorites.js';
import { showToast } from '../../handlers/feedback.js';
import { buildHash } from '../../router.js';
import { esc } from '../../utils/dom.js';
import { formatDate, rankLabel } from '../../utils/format.js';
import { icons, taxonName, stateBlock } from '../components.js';

function item(f) {
  const meta = [rankLabel(f.rank), f.family, f.vernacular].filter(Boolean).map(esc).join(' · ');
  return `
    <li class="saved-list__item">
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
        title: 'Aún no guardas especies',
        text: 'Usa el botón Guardar en una ficha o en los resultados de búsqueda.',
        actions: `<a class="btn btn--primary" href="${buildHash('/')}">Explorar especies</a>`,
      });
      return;
    }
    if (!shown.length) {
      listSlot.innerHTML = stateBlock({ type: 'no-results', title: 'Nada coincide en tu colección', text: 'Prueba con otro nombre.' });
      return;
    }
    listSlot.innerHTML = `<ul class="saved-list">${shown.map(item).join('')}</ul>`;
  };

  filter.addEventListener('input', paint);

  root.addEventListener('click', (event) => {
    const button = event.target.closest('[data-remove]');
    if (!button) return;
    const key = Number(button.dataset.remove);
    const list = getFavorites();
    const position = list.findIndex((f) => f.key === key);
    const entry = list[position];
    if (!entry) return;
    toggleFavorite(entry);
    paint();
    showToast(`<i lang="la">${esc(entry.name)}</i> se quitó de guardadas`, {
      actionLabel: 'Deshacer',
      onAction: () => {
        restoreFavorite(entry, position);
        paint();
      },
    });
  });

  paint();
}
