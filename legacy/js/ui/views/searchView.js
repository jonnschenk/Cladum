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
import { renderExploreHome, hydrateExploreHome } from './homeView.js';
import { renderLoading, renderError, withSlowNotice, loadMore } from '../states.js';
import {
  icons, verified, noData, taxonName, apiLink, stateBlock, saveButton, chip,
} from '../components.js';

// "ALL" representa "sin filtro" en la URL (un valor vacío se perdería al construirla)
const ANY = 'ALL';
const RANKS = [
  ['SPECIES', 'Rango · Especie'],
  ['GENUS', 'Rango · Género'],
  ['FAMILY', 'Rango · Familia'],
  [ANY, 'Rango · Cualquiera'],
];
const STATUSES = [
  ['ACCEPTED', 'Estado · Aceptado'],
  [ANY, 'Estado · Incluir sinónimos'],
];
const apiFilter = (value) => (value === ANY ? undefined : value);
const filterLabel = (list, value) => list.find(([v]) => v === value)?.[1].split(' · ')[1] ?? value;

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
          <p class="suggest__status" role="status" data-suggest-status hidden></p>
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
        <span class="pill pill--accent">${exact ? 'Coincidencia exacta' : 'Primer resultado'}</span>
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

const lower = (value) => (value || '').toLowerCase();

/** Puntúa qué tan bien coincide un taxón con lo que se escribió (mayor = más relevante). */
function relevance(taxon, q) {
  const query = lower(q.trim());
  const name = lower(taxon.canonicalName || taxon.scientificName);
  if (!query) return 10;
  if (lower(taxon.canonicalName) === query) return 100;
  if (lower(taxon.genus) === query) return 90;
  if (name.split(/\s+/)[0] === query) return 80;
  if (name.startsWith(query)) return 60;
  if ((taxon.vernacularNames ?? []).some((v) => lower(v.vernacularName) === query)) return 50;
  return 10;
}

/**
 * Si la consulta es exactamente un género, devuelve { key, name, kingdom, family }; si no, null.
 * /species/match responde NONE cuando hay homónimos (p. ej. «Giardia»: una planta y un
 * caracol, ambos sinónimos, y el protozoario). En ese caso se buscan los géneros con ese
 * nombre y se usa el único que no sea sinónimo; si hay varios, no se adivina.
 */
async function findGenus(q, signal) {
  const match = await matchName(q, { signal });
  if (match?.rank === 'GENUS' && match.matchType === 'EXACT' && match.usageKey) {
    return { key: match.usageKey, name: match.canonicalName || q, kingdom: match.kingdom, family: match.family };
  }
  if (match?.matchType !== 'NONE') return null;

  const genera = await searchSpecies({ q, rank: 'GENUS', limit: 20 }, { signal });
  const candidates = (genera.results ?? []).filter(
    (t) => lower(t.canonicalName) === lower(q) && !/SYNONYM|MISAPPLIED/.test(t.taxonomicStatus ?? ''),
  );
  if (candidates.length !== 1) return null;
  const [genus] = candidates;
  return { key: genus.key, name: genus.canonicalName, kingdom: genus.kingdom, family: genus.family };
}

/** Aviso del modo género, con salida a la búsqueda por texto. */
function genusNote(genus, params) {
  const where = [genus.kingdom && `Reino ${esc(genus.kingdom)}`, genus.family && `Familia ${esc(genus.family)}`]
    .filter(Boolean)
    .join(' · ');
  const textHref = buildHash('/', { q: params.q, rank: params.rank, status: params.status, modo: 'texto' });
  return `
    <div class="callout" role="note">
      <span class="callout__body">
        <span class="callout__text"><strong>Mostrando especies del género <i lang="la">${esc(genus.name)}</i></strong>${where ? ` · ${where}` : ''}</span>
        <span class="callout__text"><a href="${textHref}">Buscar como texto</a> para ver cualquier nombre que contenga «${esc(params.q)}».</span>
      </span>
    </div>`;
}

/** Filtros activos que se pueden quitar para ampliar la búsqueda. */
function removableFilters(params, textMode) {
  const base = { q: params.q, rank: params.rank, status: params.status, higher: params.higher, label: params.label, modo: textMode ? 'texto' : '' };
  const list = [];
  if (params.higher) list.push([`Dentro de: ${params.label || params.higher}`, { ...base, higher: '', label: '' }]);
  if (params.rank !== ANY) list.push([`Rango: ${filterLabel(RANKS, params.rank)}`, { ...base, rank: ANY }]);
  if (params.status !== ANY) list.push([`Estado: ${filterLabel(STATUSES, params.status)}`, { ...base, status: ANY }]);
  return list;
}

async function renderNoResults(container, params, textMode, signal) {
  const { q } = params;
  let suggestion = '';
  if (q) {
    try {
      const match = await matchName(q, { signal });
      if (match?.usageKey && match.matchType !== 'NONE') {
        suggestion = `
          <p class="did-you-mean">¿Quisiste decir <a href="${buildHash(`/especie/${match.usageKey}`)}">${taxonName(match.canonicalName || match.scientificName, match.rank)}</a>?
            <span class="did-you-mean__source">${match.matchType === 'FUZZY' ? 'coincidencia aproximada' : 'coincidencia'} · ${apiLink(apiUrl('/species/match', { name: q }), 'species/match')}</span>
          </p>`;
      }
    } catch (error) {
      if (isAbort(error)) return;
    }
  }

  const filters = removableFilters(params, textMode);
  const chips = filters.length
    ? `<div class="chip-row">
        <span class="chip-row__label">${suggestion ? 'O amplía la búsqueda quitando un filtro:' : 'Amplía la búsqueda quitando un filtro:'}</span>
        ${filters.map(([label, next]) => chip(buildHash('/', next), `Quitar «${esc(label)}»`)).join('')}
      </div>`
    : '';

  container.innerHTML = stateBlock({
    type: 'no-results',
    title: q ? `Ningún taxón coincide con «${esc(q)}»` : 'Sin resultados',
    text: (suggestion || filters.length) ? '' : 'Revisa la ortografía o prueba con el nombre científico.',
    body: suggestion + chips,
    level: 1,
  });
}

/**
 * @param query Lo que realmente se envió a GBIF: { apiQ, higherTaxonKey, genus }.
 *              params.q es lo que escribió la persona y solo se usa para ordenar.
 */
function renderResults(container, data, params, query) {
  const { q, label } = params;
  const results = [...data.results].sort((a, b) => relevance(b, q) - relevance(a, q));
  const [featured, ...others] = results;
  const v = pickVernacular(featured.vernacularNames);
  let offset = data.offset + data.limit;

  container.innerHTML = `
    <div class="layout u-fade-in">
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

        ${query.genus ? genusNote(query.genus, params) : ''}

        ${featuredCard(featured, q)}

        ${others.length ? `
          <section class="results-group" aria-labelledby="others-title">
            <h2 class="eyebrow" id="others-title">Otros resultados</h2>
            <ul class="result-list" data-result-list>${others.map(resultRow).join('')}</ul>
            <div class="load-more" data-more-wrap>${data.endOfRecords
              ? `<p class="load-more__end">Mostrando ${data.count === 1 ? 'el único resultado' : `los ${formatNumber(data.count)} resultados`}</p>`
              : '<button class="btn btn--secondary" type="button" data-more>Cargar más</button>'}</div>
          </section>` : ''}

        <div class="grid-auto" style="--min:340px">
          <section class="card" aria-labelledby="trace-title">
            <h2 class="eyebrow" id="trace-title">Trazabilidad de la consulta</h2>
            <p class="card__text">Los resultados vienen directo de GBIF. No se añaden taxones ni datos no comprobados.</p>
            <div class="card__links">
              ${apiLink(searchSpeciesUrl({ q: query.apiQ, rank: apiFilter(params.rank), status: apiFilter(params.status), highertaxonKey: query.higherTaxonKey, limit: PAGE_SIZE }), 'species/search')}
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
  let shown = data.results.length;
  more?.addEventListener('click', async () => {
    loadMore.loading(more);
    try {
      const page = await searchSpecies({ q: query.apiQ, rank: apiFilter(params.rank), status: apiFilter(params.status), higherTaxonKey: query.higherTaxonKey, offset });
      container.querySelector('[data-result-list]').insertAdjacentHTML('beforeend', page.results.map(resultRow).join(''));
      offset = page.offset + page.limit;
      shown += page.results.length;
      announce(`${page.results.length} resultados más cargados`);
      if (page.endOfRecords) loadMore.end(more.parentElement, `Mostrando los ${formatNumber(shown)} resultados`);
      else loadMore.idle(more);
    } catch {
      loadMore.error(more);
    }
  });
}

export async function renderSearchView(app, route, { signal }) {
  const params = {
    q: route.params.get('q') ?? '',
    rank: route.params.get('rank') || 'SPECIES',
    status: route.params.get('status') || 'ACCEPTED',
    higher: route.params.get('higher') ?? '',
    label: route.params.get('label') ?? '',
  };
  const textMode = route.params.get('modo') === 'texto';

  // Sin consulta: portada con el buscador integrado
  if (!params.q && !params.higher) {
    app.innerHTML = renderExploreHome(searchForm(params));
    bindSearchForm(app.querySelector('[data-search-form]'));
    hydrateExploreHome(app.querySelector('[data-explore-home]'), { signal });
    return;
  }

  app.innerHTML = `${searchForm(params)}<div data-results></div>`;
  bindSearchForm(app.querySelector('[data-search-form]'));
  const container = app.querySelector('[data-results]');

  renderLoading(container, 'search');

  // Lo que se envía a GBIF. En modo género cambia respecto a lo que se escribió.
  let query = { apiQ: params.q, higherTaxonKey: params.higher, genus: null };

  const load = async () => {
    // Una sola palabra buscando especies: puede ser un género («Giardia», «Quercus»)
    if (params.q && !params.higher && params.rank === 'SPECIES' && !textMode && /^\S+$/.test(params.q.trim())) {
      try {
        const genus = await findGenus(params.q.trim(), signal);
        if (genus) query = { apiQ: '', higherTaxonKey: genus.key, genus };
      } catch (error) {
        if (isAbort(error)) throw error;
        // Si la detección falla, se sigue con la búsqueda normal por texto
      }
    }
    return searchSpecies(
      { q: query.apiQ, rank: apiFilter(params.rank), status: apiFilter(params.status), higherTaxonKey: query.higherTaxonKey },
      { signal },
    );
  };

  try {
    const data = await withSlowNotice(load(), container);
    if (!data.results?.length) {
      await renderNoResults(container, params, textMode, signal);
      return;
    }
    renderResults(container, data, params, query);
  } catch (error) {
    if (isAbort(error)) return;
    renderError(container, error, {
      onRetry: () => navigate('/', {
        q: params.q, rank: params.rank, status: params.status, higher: params.higher, label: params.label, modo: textMode ? 'texto' : '',
      }),
    });
  }
}
