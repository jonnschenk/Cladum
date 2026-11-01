// Vista: Explorar / Resultados de búsqueda

import { searchSpecies, searchSpeciesUrl, matchName, pickVernacular, apiUrl } from '../../services/gbif.js';
import { bindSearchForm } from '../../handlers/searchHandlers.js';
import { bindSaveButtons, announce } from '../../handlers/feedback.js';
import { isFavorite } from '../../state/favorites.js';
import { buildHash, navigate } from '../../router.js';
import { esc, isAbort } from '../../utils/dom.js';
import { formatNumber, rankLabel, statusLabel } from '../../utils/format.js';
import { PAGE_SIZE } from '../../config.js';
import { renderTaxIndex } from '../taxIndex.js';
import {
  icons, verified, noData, taxonName, apiLink, stateBlock, skeletonPage, saveButton,
} from '../components.js';

const RANKS = [
  ['SPECIES', 'Rango · Especie'],
  ['GENUS', 'Rango · Género'],
  ['FAMILY', 'Rango · Familia'],
  ['', 'Rango · Cualquiera'],
];
const STATUSES = [
  ['ACCEPTED', 'Estado · Aceptado'],
  ['', 'Estado · Incluir sinónimos'],
];

const options = (list, current) =>
  list.map(([value, label]) => `<option value="${value}" ${value === current ? 'selected' : ''}>${label}</option>`).join('');

function searchForm({ q, rank, status }) {
  return `
    <form class="search" role="search" data-search-form>
      <div class="search__box">
        <div class="search__field">
          ${icons.search(20)}
          <div class="search__text">
            <label class="search__label" for="q">Buscar nombre científico o común</label>
            <input class="search__input" id="q" name="q" type="search" autocomplete="off" spellcheck="false"
              value="${esc(q)}" placeholder="Panthera onca, ajolote, Quercus…"
              role="combobox" aria-autocomplete="list" aria-controls="suggest" aria-expanded="false" data-search-input>
          </div>
          <button class="btn btn--primary btn--icon" type="submit" aria-label="Buscar">${icons.arrow(18)}</button>
        </div>
        <div class="suggest" hidden data-suggest>
          <div class="suggest__list" id="suggest" role="listbox" aria-label="Sugerencias" data-suggest-list></div>
          <p class="suggest__hint" aria-hidden="true">↑ ↓ para moverte · Enter para abrir · Esc para cerrar</p>
        </div>
      </div>
      <div class="search__filters">
        <label class="select">
          <span class="u-visually-hidden">Rango</span>
          <select class="select__control" name="rank">${options(RANKS, rank)}</select>
          <span class="select__chevron">${icons.chevron(14)}</span>
        </label>
        <label class="select">
          <span class="u-visually-hidden">Estado taxonómico</span>
          <select class="select__control" name="status">${options(STATUSES, status)}</select>
          <span class="select__chevron">${icons.chevron(14)}</span>
        </label>
      </div>
    </form>`;
}

const favEntry = (t, vernacular) => ({
  key: t.key,
  name: t.canonicalName || t.scientificName,
  authorship: t.authorship || '',
  vernacular: vernacular?.vernacularName ?? null,
  family: t.family ?? null,
  rank: t.rank,
});

function resultRow(t) {
  const v = pickVernacular(t.vernacularNames);
  const meta = [rankLabel(t.rank), t.family && t.rank !== 'FAMILY' ? t.family : null, v?.vernacularName]
    .filter(Boolean)
    .map(esc)
    .join(' · ');
  return `
    <li class="result-list__item">
      <a class="result-list__link" href="${buildHash(`/especie/${t.key}`)}">
        <span class="result-list__text">
          <span class="result-list__name">${taxonName(t.canonicalName || t.scientificName, t.rank)} <span class="result-list__author">${esc(t.authorship)}</span></span>
          <span class="result-list__meta">${meta}</span>
        </span>
        <span class="result-list__key"><span class="u-visually-hidden">Identificador GBIF </span>${esc(t.key)}</span>
        ${icons.arrow(16)}
      </a>
    </li>`;
}

function featuredCard(t, q) {
  const v = pickVernacular(t.vernacularNames);
  const name = t.canonicalName || t.scientificName;
  const exact = q && name.toLowerCase() === q.toLowerCase();
  return `
    <article class="card card--xl result-featured" aria-labelledby="featured-name">
      <div class="card__head">
        ${verified()}
        <span class="pill pill--accent">${exact ? 'Coincidencia exacta' : 'Mejor coincidencia'}</span>
      </div>
      <div class="result-featured__top">
        <div class="result-featured__heading">
          <h2 id="featured-name" class="result-featured__name u-binomial">${taxonName(name, t.rank)}</h2>
          <span class="result-featured__author">${esc(t.authorship) || '&nbsp;'}</span>
        </div>
        <div class="result-featured__actions">
          ${saveButton(isFavorite(t.key), name)}
          <a class="btn btn--primary" href="${buildHash(`/especie/${t.key}`)}">Abrir ficha ${icons.arrow(16)}</a>
        </div>
      </div>
      <dl class="result-featured__tiles">
        <div class="tile"><dt class="tile__label">Rango</dt><dd class="tile__value">${esc(rankLabel(t.rank))}</dd></div>
        <div class="tile"><dt class="tile__label">Estado taxonómico</dt><dd class="tile__value">${t.taxonomicStatus === 'ACCEPTED' ? `<span class="tile__check">${icons.check(16)}</span>` : ''}${esc(statusLabel(t.taxonomicStatus))}</dd></div>
        <div class="tile"><dt class="tile__label">Identificador GBIF</dt><dd class="tile__value u-mono">${esc(t.key)}</dd></div>
      </dl>
      <div class="result-featured__names">
        <div class="result-featured__group">
          ${v
            ? `<span class="result-featured__common">${esc(v.vernacularName)} <span class="result-featured__lang">· español</span></span>
               <span class="result-featured__note">${v.source ? `${esc(v.source)}, vía GBIF.` : 'Nombre común registrado en GBIF.'} No implica una preferencia global del nombre.</span>`
            : noData('Sin nombre común en español')}
        </div>
        <div class="result-featured__group">
          <span class="result-featured__family">${esc(t.family || '—')}${t.genus ? ` <span class="result-featured__sep" aria-hidden="true">/</span> <i lang="la">${esc(t.genus)}</i>` : ''}</span>
          <span class="result-featured__note">La clasificación completa está en el índice taxonómico.</span>
        </div>
      </div>
    </article>`;
}

async function renderNoResults(container, q, signal) {
  let suggestion = '';
  if (q) {
    try {
      const match = await matchName(q, { signal });
      if (match?.usageKey && match.matchType !== 'NONE') {
        suggestion = `¿Quisiste decir <a href="${buildHash(`/especie/${match.usageKey}`)}">${taxonName(match.canonicalName || match.scientificName, match.rank)}</a>?`;
      }
    } catch (error) {
      if (isAbort(error)) return;
    }
  }
  container.innerHTML = stateBlock({
    type: 'no-results',
    title: q ? `Ningún taxón coincide con «${esc(q)}»` : 'Sin resultados',
    text: suggestion || 'Revisa el nombre o cambia el rango y el estado taxonómico.',
    level: 1,
  });
}

function renderResults(container, data, params) {
  const { q, label } = params;
  const results = data.results;
  const featured =
    results.find((t) => (t.canonicalName || '').toLowerCase() === q.toLowerCase()) ?? results[0];
  const others = results.filter((t) => t !== featured);
  const v = pickVernacular(featured.vernacularNames);
  let offset = data.offset + data.limit;

  container.innerHTML = `
    <div class="layout u-view-enter">
      <div class="layout__aside">${renderTaxIndex(featured)}</div>
      <section class="layout__content" aria-labelledby="results-title">
        <header class="page-head">
          <div class="page-head__text">
            <span class="eyebrow">${label ? `Explorar · Dentro de ${esc(label)}` : 'Explorar · Búsqueda de taxones'}</span>
            <h1 class="page-head__title" id="results-title" tabindex="-1">${label ? `Especies de ${esc(label)}` : 'Resultados de búsqueda'}</h1>
            <p class="page-head__lead">Consulta en vivo al backbone taxonómico de GBIF.</p>
          </div>
          <span class="pill pill--raised"><span class="u-mono">${formatNumber(data.count)}</span>&nbsp;${data.count === 1 ? 'resultado' : 'resultados'}</span>
        </header>

        ${featuredCard(featured, q)}

        ${others.length ? `
          <section class="results-group" aria-labelledby="others-title">
            <h2 class="eyebrow" id="others-title">Otros resultados</h2>
            <ul class="result-list" data-result-list>${others.map(resultRow).join('')}</ul>
            ${data.endOfRecords ? '' : '<div class="load-more"><button class="btn btn--secondary" type="button" data-more>Cargar más</button></div>'}
          </section>` : ''}

        <div class="grid-auto" style="--min:340px">
          <section class="card" aria-labelledby="trace-title">
            <h2 class="eyebrow" id="trace-title">Trazabilidad de la consulta</h2>
            <p class="card__text">Los resultados vienen directo de GBIF. No se añaden taxones ni datos no comprobados.</p>
            <div class="card__links">
              ${apiLink(searchSpeciesUrl({ q, rank: params.rank, status: params.status, highertaxonKey: params.higher, limit: PAGE_SIZE }), 'species/search')}
              ${apiLink(apiUrl(`/species/${featured.key}`), `species/${featured.key}`)}
            </div>
          </section>
          <section class="card card--soft" aria-labelledby="next-title">
            <h2 class="eyebrow" id="next-title">Continuar la exploración</h2>
            <p class="card__lead">De la especie al registro.</p>
            <p class="card__text card__text--muted">Consulta la identidad, la fotografía documentada y las ocurrencias con sus incidencias.</p>
            <a class="btn btn--secondary card__action" href="${buildHash(`/especie/${featured.key}/ocurrencias`)}">Ver ocurrencias ${icons.arrow(16)}</a>
          </section>
        </div>
      </section>
    </div>`;

  bindSaveButtons(container, favEntry(featured, v));
  announce(`${formatNumber(data.count)} ${data.count === 1 ? 'resultado' : 'resultados'}${q ? ` para ${q}` : ''}`);

  const more = container.querySelector('[data-more]');
  more?.addEventListener('click', async () => {
    more.disabled = true;
    more.textContent = 'Cargando…';
    try {
      const page = await searchSpecies({ q, rank: params.rank, status: params.status, higherTaxonKey: params.higher, offset });
      container.querySelector('[data-result-list]').insertAdjacentHTML('beforeend', page.results.map(resultRow).join(''));
      offset = page.offset + page.limit;
      announce(`${page.results.length} resultados más cargados`);
      if (page.endOfRecords) more.parentElement.remove();
      else {
        more.disabled = false;
        more.textContent = 'Cargar más';
      }
    } catch {
      more.disabled = false;
      more.textContent = 'No se pudo cargar. Reintentar';
    }
  });
}

export async function renderSearchView(app, route, { signal }) {
  const params = {
    q: route.params.get('q') ?? '',
    rank: route.params.get('rank') ?? 'SPECIES',
    status: route.params.get('status') ?? 'ACCEPTED',
    higher: route.params.get('higher') ?? '',
    label: route.params.get('label') ?? '',
  };

  app.innerHTML = `${searchForm(params)}<div data-results></div>`;
  bindSearchForm(app.querySelector('[data-search-form]'));
  const container = app.querySelector('[data-results]');

  if (!params.q && !params.higher) {
    const examples = ['Panthera onca', 'Ambystoma mexicanum', 'Quercus rugosa', 'Danaus plexippus'];
    container.innerHTML = stateBlock({
      type: 'empty',
      title: 'Empieza por un nombre',
      text: 'Escribe un nombre científico o común. También puedes recorrer la clasificación desde el índice de cualquier especie.',
      actions: `<ul class="state__chips" aria-label="Ejemplos de búsqueda">${examples
        .map((n) => `<li class="state__chip"><a class="pill pill--raised" href="${buildHash('/', { q: n, rank: 'SPECIES', status: 'ACCEPTED' })}"><i lang="la">${esc(n)}</i></a></li>`)
        .join('')}</ul>`,
      level: 1,
    });
    return;
  }

  container.innerHTML = skeletonPage();

  try {
    const data = await searchSpecies(
      { q: params.q, rank: params.rank, status: params.status, higherTaxonKey: params.higher },
      { signal },
    );
    if (!data.results?.length) {
      await renderNoResults(container, params.q, signal);
      return;
    }
    renderResults(container, data, params);
  } catch (error) {
    if (isAbort(error)) return;
    container.innerHTML = stateBlock({
      type: 'error',
      title: 'No se pudo consultar GBIF',
      text: 'Tu búsqueda y tus filtros se conservaron. Revisa tu conexión e inténtalo de nuevo.',
      actions: '<button class="btn btn--primary" type="button" data-retry>Reintentar</button>',
      level: 1,
    });
    container.querySelector('[data-retry]').addEventListener('click', () =>
      navigate('/', { q: params.q, rank: params.rank, status: params.status, higher: params.higher, label: params.label }),
    );
  }
}
