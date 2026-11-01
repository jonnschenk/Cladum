// Vista: Ocurrencias documentadas de un taxón

import { getSpecies, searchOccurrences, getCountryFacet, occurrencesUrl } from '../../services/gbif.js';
import { setState } from '../../state/store.js';
import { buildHash, navigate } from '../../router.js';
import { esc, safeUrl, isAbort } from '../../utils/dom.js';
import {
  formatNumber, formatMeters, formatDate, countryName, rankLabel, statusLabel, basisLabel, isItalicRank,
} from '../../utils/format.js';
import { OCCURRENCE_PAGE_SIZE } from '../../config.js';
import { renderTaxIndex } from '../taxIndex.js';
import { isGeneralized } from './speciesView.js';
import { announce } from '../../handlers/feedback.js';
import {
  icons, verified, external, noData, taxonName, apiLink, externalLink, stateBlock, skeletonPage,
} from '../components.js';

const value = (v) => (v ? esc(v) : noData());

function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'fuente externa';
  }
}

// Las cabeceras de columna están ocultas a lectores de pantalla,
// así que la etiqueta de cada fila nombra cada dato.
function rowLabel(r, place, issues) {
  return [
    `Registro ${r.key}`,
    [countryName(r.countryCode) || 'país sin dato', place].filter(Boolean).join(', '),
    `observado: ${formatDate(r.eventDate) || 'sin fecha'}`,
    `por ${r.recordedBy || 'observador sin dato'}`,
    `incertidumbre: ${formatMeters(r.coordinateUncertaintyInMeters) || 'sin dato'}`,
    issues ? `${issues} ${issues === 1 ? 'incidencia' : 'incidencias'}` : 'sin incidencias',
    isGeneralized(r) ? 'ubicación generalizada' : basisLabel(r.basisOfRecord),
  ].join('; ');
}

function recordRow(r, selected) {
  const issues = r.issues?.length ?? 0;
  const place = [r.stateProvince, r.locality].filter(Boolean).join(', ');
  return `
    <li>
      <button class="records__row" type="button" aria-pressed="${selected}" data-record="${esc(r.key)}"
        aria-label="${esc(rowLabel(r, place, issues))}">
        <span class="records__cols">
          <span class="records__id">${esc(r.key)}</span>
          <span class="records__place">
            <span class="records__country">${esc(countryName(r.countryCode) || '—')}</span>
            <span class="records__sub">${esc(place || 'Sin región')}</span>
          </span>
          <span class="records__date">${esc(formatDate(r.eventDate) || '—')}</span>
          <span class="records__observer">${esc(r.recordedBy || '—')}</span>
          <span class="records__uncertainty">${esc(formatMeters(r.coordinateUncertaintyInMeters) || '—')}</span>
          <span class="records__quality">
            ${issues
              ? `<span class="records__issues">${icons.warn(14)}${issues} ${issues === 1 ? 'incidencia' : 'incidencias'}</span>`
              : `<span class="records__issues records__issues--none">${icons.check(14)}Sin incidencias</span>`}
            <span class="records__basis">${isGeneralized(r) ? 'Generalizado' : esc(basisLabel(r.basisOfRecord))}</span>
          </span>
        </span>
      </button>
    </li>`;
}

function recordDetail(r, taxon) {
  const generalized = isGeneralized(r);
  const original = safeUrl(r.references);
  return `
    <section class="card card--xl record-detail" aria-labelledby="record-title" data-detail>
      <div class="card__head card__head--top">
        <div class="record-detail__heading">
          <span class="eyebrow">Detalle del registro · ${esc(basisLabel(r.basisOfRecord))}</span>
          <h2 class="record-detail__id" id="record-title">GBIF:${esc(r.key)}</h2>
        </div>
        ${verified()}
      </div>
      <div class="record-detail__cols">
        <dl class="def-list">
          <div class="def-list__row"><dt class="def-list__term">Taxón</dt><dd class="def-list__desc">${taxonName(r.species || taxon.canonicalName, 'SPECIES')}</dd></div>
          <div class="def-list__row"><dt class="def-list__term">Fecha</dt><dd class="def-list__desc">${value(formatDate(r.eventDate))}</dd></div>
          <div class="def-list__row"><dt class="def-list__term">Observador/a</dt><dd class="def-list__desc">${value(r.recordedBy)}</dd></div>
        </dl>
        <dl class="def-list">
          <div class="def-list__row"><dt class="def-list__term">País</dt><dd class="def-list__desc">${value(countryName(r.countryCode))}</dd></div>
          <div class="def-list__row"><dt class="def-list__term">Región / localidad</dt><dd class="def-list__desc">${value([r.stateProvince, r.locality].filter(Boolean).join(' / '))}</dd></div>
          <div class="def-list__row"><dt class="def-list__term">Incertidumbre</dt><dd class="def-list__desc def-list__desc--mono">${value(formatMeters(r.coordinateUncertaintyInMeters))}</dd></div>
        </dl>
      </div>
      ${generalized ? `
        <div class="callout callout--warn" role="note">
          <span class="callout__icon">${icons.shield(16)}</span>
          <span class="callout__body"><span class="callout__title">Ubicación generalizada para proteger el taxón</span>
          <span class="callout__text">No interpretar como ubicación exacta ni reconstruir la localización oculta. La incertidumbre y las incidencias se muestran tal como aparecen en GBIF.</span></span>
        </div>` : ''}
      <div class="grid-auto record-detail__grid" style="--min:300px">
        <div class="record-detail__group">
          <h3 class="record-detail__sub">Incidencias reportadas</h3>
          ${r.issues?.length
            ? `<div class="record-detail__issues">${r.issues.map((i) => `<span class="issue">${esc(i)}</span>`).join('')}</div>
               <span class="record-detail__note">Cotejar con GBIF no elimina las advertencias de calidad.</span>`
            : '<span class="record-detail__note">Sin incidencias reportadas.</span>'}
        </div>
        <div class="source-links">
          <h3 class="record-detail__sub">Fuente y registro original</h3>
          ${apiLink(`https://www.gbif.org/occurrence/${r.key}`, `gbif.org/occurrence/${r.key}`)}
          ${original ? `<span class="record-detail__source">${external(hostOf(original))}${externalLink(original, 'Abrir registro original')}</span>` : ''}
          ${r.datasetName ? `<span class="record-detail__note">${esc(r.datasetName)}</span>` : ''}
        </div>
      </div>
    </section>`;
}

function toolbar({ countries, country, coords }) {
  const opts = countries
    .map((c) => `<option value="${esc(c.name)}" ${c.name === country ? 'selected' : ''}>${esc(countryName(c.name))} · ${formatNumber(c.count)}</option>`)
    .join('');
  return `
    <div class="toolbar">
      <label class="select">
        <span class="u-visually-hidden">País</span>
        <select class="select__control" data-country><option value="">País · Todos</option>${opts}</select>
        <span class="select__chevron">${icons.chevron(14)}</span>
      </label>
      <label class="switch"><input class="switch__input" type="checkbox" role="switch" data-coords ${coords ? 'checked' : ''}>Solo con coordenadas</label>
      <div class="segmented toolbar__end" role="group" aria-label="Vista">
        <button class="segmented__btn" type="button" aria-pressed="true" data-view="list">${icons.list(16)}Lista</button>
        <button class="segmented__btn" type="button" aria-pressed="false" data-view="map">${icons.map(16)}Mapa</button>
      </div>
    </div>`;
}

export async function renderOccurrencesView(app, route, { signal }) {
  const key = route.key;
  const country = route.params.get('country') ?? '';
  const coords = route.params.get('coords') !== '0';
  const query = { taxonKey: key, country, hasCoordinate: coords ? true : undefined, limit: OCCURRENCE_PAGE_SIZE };

  app.innerHTML = skeletonPage();

  let taxon;
  let data;
  let countries = [];
  try {
    const [t, d, c] = await Promise.all([
      getSpecies(key, { signal }),
      searchOccurrences(query, { signal }),
      getCountryFacet(key, coords ? true : undefined, { signal }).catch(() => []),
    ]);
    taxon = t;
    data = d;
    countries = c;
  } catch (error) {
    if (isAbort(error)) return;
    app.innerHTML = stateBlock({
      type: 'error',
      title: 'No se pudieron consultar las ocurrencias',
      text: 'GBIF no respondió. Tus filtros se conservaron.',
      actions: '<button class="btn btn--primary" type="button" data-retry>Reintentar</button>',
      level: 1,
    });
    app.querySelector('[data-retry]').addEventListener('click', () =>
      navigate(`/especie/${key}/ocurrencias`, { country, coords: coords ? '' : '0' }),
    );
    return;
  }

  const name = taxon.canonicalName || taxon.scientificName;
  setState({ lastSpecies: { key: taxon.key, name } });
  document.title = `Ocurrencias de ${name} · Cladum`;

  let records = [...data.results];
  let selected = 0;
  let offset = data.offset + data.limit;

  app.innerHTML = `
    <div class="stack stack--inherit" data-occ-view>
    <nav class="breadcrumb" aria-label="Ruta">
      <ol class="breadcrumb__list">
        <li class="breadcrumb__item"><a class="breadcrumb__back" href="${buildHash(`/especie/${key}`)}">${icons.back(16)}Volver a la ficha</a></li>
        <li class="breadcrumb__item">${taxonName(name, taxon.rank)}</li>
        <li class="breadcrumb__item breadcrumb__sep" aria-hidden="true">/</li>
        <li class="breadcrumb__item" aria-current="page">Ocurrencias</li>
      </ol>
    </nav>
    <div class="layout u-view-enter">
      <div class="layout__aside">${renderTaxIndex(taxon)}</div>
      <section class="layout__content" aria-labelledby="occ-title">
        <header class="species-hero">
          <div class="species-hero__text">
            <span class="eyebrow">Ocurrencias · Registros documentados</span>
            <h1 class="species-hero__name species-hero__name--sm ${isItalicRank(taxon.rank) ? 'u-binomial' : 'species-hero__name--plain'}" id="occ-title" tabindex="-1" ${isItalicRank(taxon.rank) ? 'lang="la"' : ''}>${esc(name)}</h1>
            <span class="species-hero__sub">${esc(taxon.authorship || '')}</span>
          </div>
          <div class="page-head__badges">
            <span class="pill pill--ink">${taxon.taxonomicStatus === 'ACCEPTED' ? icons.check(14) : ''}${esc(statusLabel(taxon.taxonomicStatus))} · ${esc(rankLabel(taxon.rank))}</span>
            ${verified('Verificado · GBIF', 'pill--chip')}
          </div>
        </header>

        ${toolbar({ countries, country, coords })}

        <div class="split-row">
          <div class="split-row__main">
            <p class="count count--sm"><span class="count__num">${formatNumber(data.count)}</span><span class="count__label">${coords ? 'registros con coordenadas' : 'registros'}${country ? ` en ${esc(countryName(country))}` : ''}</span></p>
            <span class="split-row__note">No es toda la distribución ni un recuento de población.</span>
          </div>
          <span class="pill pill--raised" data-loaded><span class="u-mono">${records.length}</span>&nbsp;cargados</span>
        </div>

        <div data-records></div>
        <div data-detail-slot></div>

        <section class="source-links" aria-labelledby="query-title">
          <h2 class="eyebrow" id="query-title">Consulta · Verificado · GBIF</h2>
          ${apiLink(occurrencesUrl(query), 'occurrence/search')}
        </section>
      </section>
    </div>
    </div>`;

  // Los eventos se escuchan en la raíz de esta vista (no en #app),
  // así se descartan solos cuando el router pinta otra pantalla.
  const root = app.querySelector('[data-occ-view]');
  const recordsSlot = app.querySelector('[data-records]');
  const detailSlot = app.querySelector('[data-detail-slot]');
  const loaded = app.querySelector('[data-loaded]');

  const paintDetail = () => {
    detailSlot.innerHTML = records[selected] ? recordDetail(records[selected], taxon) : '';
  };

  const paintList = () => {
    if (!records.length) {
      recordsSlot.innerHTML = stateBlock({
        type: 'no-results',
        title: 'Sin registros con estos filtros',
        text: 'Prueba con otro país o incluye registros sin coordenadas.',
      });
      detailSlot.innerHTML = '';
      return;
    }
    recordsSlot.innerHTML = `
      <div class="card card--flush records">
        <div class="records__head" aria-hidden="true"><span>ID GBIF</span><span>País / región</span><span>Observación</span><span>Observador/a</span><span>Incertidumbre</span><span>Calidad</span></div>
        <ul class="records__list" data-list>${records.map((r, i) => recordRow(r, i === selected)).join('')}</ul>
        ${offset < data.count ? '<div class="load-more"><button class="btn btn--secondary" type="button" data-more>Cargar más</button></div>' : ''}
      </div>`;
    paintDetail();
  };

  const paintMap = () => {
    recordsSlot.innerHTML = stateBlock({
      type: 'empty',
      title: 'Mapa en preparación',
      text: 'Se prioriza la lista. Cuando se active el mapa, los registros generalizados se dibujarán como áreas, nunca como puntos exactos.',
      actions: '<button class="btn btn--secondary" type="button" data-back-list>Volver a la lista</button>',
    });
    detailSlot.innerHTML = '';
  };

  paintList();

  // Delegación de eventos sobre la vista
  root.addEventListener('click', async (event) => {
    const row = event.target.closest('[data-record]');
    if (row) {
      selected = records.findIndex((r) => String(r.key) === row.dataset.record);
      recordsSlot.querySelectorAll('[data-record]').forEach((b) => b.setAttribute('aria-pressed', String(b === row)));
      paintDetail();
      detailSlot.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      return;
    }

    const viewButton = event.target.closest('[data-view]');
    if (viewButton || event.target.closest('[data-back-list]')) {
      const view = viewButton ? viewButton.dataset.view : 'list';
      root.querySelectorAll('[data-view]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === view)));
      if (view === 'map') paintMap();
      else paintList();
      return;
    }

    const more = event.target.closest('[data-more]');
    if (more) {
      more.disabled = true;
      more.textContent = 'Cargando…';
      try {
        const page = await searchOccurrences({ ...query, offset });
        records = records.concat(page.results);
        offset = page.offset + page.limit;
        loaded.innerHTML = `<span class="u-mono">${records.length}</span>&nbsp;cargados`;
        paintList();
        announce(`${page.results.length} registros más cargados. ${records.length} en total.`);
      } catch {
        more.disabled = false;
        more.textContent = 'No se pudo cargar. Reintentar';
      }
    }
  });

  app.querySelector('[data-country]').addEventListener('change', (event) =>
    navigate(`/especie/${key}/ocurrencias`, { country: event.target.value, coords: coords ? '' : '0' }),
  );
  app.querySelector('[data-coords]').addEventListener('change', (event) =>
    navigate(`/especie/${key}/ocurrencias`, { country, coords: event.target.checked ? '' : '0' }),
  );
}
