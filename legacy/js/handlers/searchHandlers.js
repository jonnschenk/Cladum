// Buscador con sugerencias (patrón combobox de WAI-ARIA)

import { suggestSpecies } from '../services/gbif.js';
import { navigate } from '../router.js';
import { esc, debounce, isAbort } from '../utils/dom.js';
import { rankLabel } from '../utils/format.js';
import { taxonName } from '../ui/components.js';
import { brandLoader } from '../ui/states.js';
import { SUGGEST_DELAY } from '../config.js';
import { announce } from './feedback.js';

export function bindSearchForm(form) {
  const input = form.querySelector('[data-search-input]');
  const panel = form.querySelector('[data-suggest]');
  const listbox = form.querySelector('[data-suggest-list]');
  const status = form.querySelector('[data-suggest-status]');
  const hint = form.querySelector('.suggest__hint');
  if (!input || !panel || !listbox) return;

  // La línea de estado solo se muestra si la consulta tarda: así no parpadea
  const LOADING_DELAY = 200;
  let loadingTimer;

  let options = [];
  let active = -1;
  let controller = null;

  const close = () => {
    clearTimeout(loadingTimer);
    panel.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
    active = -1;
  };

  const setActive = (index) => {
    const nodes = listbox.querySelectorAll('[role="option"]');
    nodes.forEach((node, i) => node.setAttribute('aria-selected', String(i === index)));
    active = index;
    if (index >= 0 && nodes[index]) {
      input.setAttribute('aria-activedescendant', nodes[index].id);
      nodes[index].scrollIntoView({ block: 'nearest' });
    } else {
      input.removeAttribute('aria-activedescendant');
    }
  };

  /** Panel abierto solo con un mensaje (cargando o sin sugerencias). */
  const showStatus = (html) => {
    if (!status) return;
    options = [];
    listbox.innerHTML = '';
    status.innerHTML = html;
    status.hidden = false;
    if (hint) hint.hidden = true;
    panel.hidden = false;
    input.setAttribute('aria-expanded', 'false');
  };

  const render = (items, value) => {
    clearTimeout(loadingTimer);
    options = items;
    if (!items.length) {
      showStatus(`Sin sugerencias para «${esc(value.trim())}». Pulsa Enter para buscar en todo el texto.`);
      return;
    }
    if (status) status.hidden = true;
    if (hint) hint.hidden = false;
    listbox.innerHTML = items
      .map(
        (item, i) => `
        <div class="suggest__option" role="option" id="suggest-${i}" aria-selected="false" data-index="${i}">
          <span class="suggest__name">${taxonName(item.canonicalName || item.scientificName, item.rank)}</span>
          <span class="suggest__meta">${esc(rankLabel(item.rank))}${item.family && item.rank !== 'FAMILY' ? ` · ${esc(item.family)}` : ''}</span>
        </div>`,
      )
      .join('');
    panel.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    setActive(-1);
    announce(`${items.length} ${items.length === 1 ? 'sugerencia disponible' : 'sugerencias disponibles'}`);
  };

  const fetchSuggestions = debounce(async (value) => {
    controller?.abort();
    if (value.trim().length < 2) {
      close();
      return;
    }
    controller = new AbortController();
    clearTimeout(loadingTimer);
    loadingTimer = setTimeout(() => showStatus(`${brandLoader('sm')}Buscando sugerencias…`), LOADING_DELAY);
    try {
      const results = await suggestSpecies(value.trim(), { signal: controller.signal });
      if (input.value === value) render(results ?? [], value);
    } catch (error) {
      if (!isAbort(error)) close(); // error silencioso: el buscador sigue funcionando con Enter
    }
  }, SUGGEST_DELAY);

  const openOption = (index) => {
    const item = options[index];
    if (!item) return;
    close();
    navigate(`/especie/${item.key}`);
  };

  input.addEventListener('input', () => fetchSuggestions(input.value));

  input.addEventListener('keydown', (event) => {
    if (panel.hidden) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive(Math.min(active + 1, options.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive(Math.max(active - 1, -1));
    } else if (event.key === 'Enter' && active >= 0) {
      event.preventDefault();
      openOption(active);
    } else if (event.key === 'Escape') {
      close();
    }
  });

  // mousedown para que el clic llegue antes del blur del input
  listbox.addEventListener('mousedown', (event) => {
    const option = event.target.closest('[role="option"]');
    if (!option) return;
    event.preventDefault();
    openOption(Number(option.dataset.index));
  });

  input.addEventListener('blur', () => setTimeout(close, 120));

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    close();
    const data = new FormData(form);
    const q = String(data.get('q') ?? '').trim();
    navigate('/', {
      q,
      rank: data.get('rank'),
      status: data.get('status'),
    });
  });

  // Los filtros vuelven a buscar al cambiar, si ya hay consulta
  form.querySelectorAll('select').forEach((select) =>
    select.addEventListener('change', () => {
      if (input.value.trim()) form.requestSubmit();
    }),
  );
}
