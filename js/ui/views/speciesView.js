// Vista: Ficha de especie

import {
  getSpecies, getVernacularNames, pickVernacular, getPhoto, searchOccurrences, apiUrl, GbifError,
} from '../../services/gbif.js';
import { bindSaveButtons } from '../../handlers/feedback.js';
import { isFavorite } from '../../state/favorites.js';
import { setState } from '../../state/store.js';
import { buildHash } from '../../router.js';
import { esc, safeUrl, isAbort } from '../../utils/dom.js';
import { formatNumber, rankLabel, statusLabel, licenseLabel, isItalicRank } from '../../utils/format.js';
import { GENERALIZED_UNCERTAINTY } from '../../config.js';
import { renderTaxIndex } from '../taxIndex.js';
import {
  icons, verified, external, noData, taxonName, apiLink, externalLink, stateBlock, skeletonPage, saveButton,
} from '../components.js';

export const isGeneralized = (record) =>
  Boolean(record?.dataGeneralizations || record?.informationWithheld) ||
  (record?.coordinateUncertaintyInMeters ?? 0) >= GENERALIZED_UNCERTAINTY;

function breadcrumb(taxon) {
  const name = taxon?.canonicalName || '';
  return `
    <nav class="breadcrumb" aria-label="Ruta">
      <ol class="breadcrumb__list">
        <li class="breadcrumb__item"><a class="breadcrumb__back" href="${buildHash('/', { q: name, rank: 'SPECIES', status: 'ACCEPTED' })}">${icons.back(16)}Volver a la búsqueda</a></li>
        ${taxon ? `<li class="breadcrumb__item" aria-current="page">${taxonName(name, taxon.rank)}</li>` : ''}
      </ol>
      ${taxon ? `<span class="pill pill--chip pill--mono"><span class="u-visually-hidden">Identificador </span>GBIF:${esc(taxon.key)}</span>` : ''}
    </nav>`;
}

function photoCard(photo, name, failed = false) {
  if (!photo || !safeUrl(photo.url)) {
    const message = failed
      ? 'No se pudo cargar la fotografía desde su fuente original.'
      : 'No hay fotografía documentada en GBIF para este taxón.';
    return `
      <figure class="photo-card" id="fotografia" tabindex="-1">
        <div class="photo-card__empty">${icons.image(28)}<span>${message}</span>${noData()}</div>
      </figure>`;
  }
  const license = licenseLabel(photo.license);
  const originalUrl = photo.references || `https://www.gbif.org/occurrence/${photo.occurrenceKey}`;
  return `
    <figure class="photo-card" id="fotografia" tabindex="-1">
      <img class="photo-card__img" src="${esc(safeUrl(photo.url))}" loading="lazy" decoding="async"
        alt="Fotografía de ${esc(name)}${photo.creator ? `, por ${esc(photo.creator)}` : ''}" data-photo>
      <figcaption class="photo-card__caption">
        <div class="photo-card__credit">
          <span class="photo-card__author">${esc(photo.creator || 'Autoría no indicada')} <span class="photo-card__meta">${[photo.publisher, license].filter(Boolean).map(esc).join(' · ')}</span></span>
          ${externalLink(originalUrl, 'Ver original')}
        </div>
        <div class="photo-card__tags">
          ${external('Fuente externa · vía GBIF')}
          <span class="pill pill--mono pill--muted">Registro GBIF:${esc(photo.occurrenceKey)}</span>
        </div>
      </figcaption>
    </figure>`;
}

function identityCard(taxon, vernacular) {
  return `
    <section class="card" id="identidad" tabindex="-1" aria-labelledby="identity-title">
      <div class="card__head">
        <h2 class="card__title" id="identity-title">Identidad y nomenclatura</h2>
        ${verified()}
      </div>
      <dl class="def-list">
        <div class="def-list__row"><dt class="def-list__term">Nombre común</dt><dd class="def-list__desc">${
          vernacular
            ? `${esc(vernacular.vernacularName)} <span class="def-list__aside">· español</span><span class="def-list__note">${esc(vernacular.source || 'Fuente no indicada')}, vía GBIF. No se asume preferencia global.</span>`
            : noData('Sin nombre común en español')
        }</dd></div>
        <div class="def-list__row"><dt class="def-list__term">Autoría</dt><dd class="def-list__desc">${taxon.authorship ? esc(taxon.authorship) : noData()}</dd></div>
        <div class="def-list__row"><dt class="def-list__term">Rango</dt><dd class="def-list__desc">${esc(rankLabel(taxon.rank))} <span class="def-list__code">${esc(taxon.rank)}</span></dd></div>
        <div class="def-list__row"><dt class="def-list__term">Estado taxonómico</dt><dd class="def-list__desc">${esc(statusLabel(taxon.taxonomicStatus))} <span class="def-list__code">${esc(taxon.taxonomicStatus)}</span></dd></div>
        <div class="def-list__row"><dt class="def-list__term">Identificador GBIF</dt><dd class="def-list__desc def-list__desc--mono">${esc(taxon.key)}</dd></div>
      </dl>
      ${apiLink(apiUrl(`/species/${taxon.key}`), 'Consultar respuesta de especie')}
    </section>`;
}

function occurrencesCard(taxon, occ) {
  if (!occ) {
    return `
      <section class="card card--xl" id="ocurrencias" tabindex="-1" aria-labelledby="occ-title">
        <div class="card__head"><h2 class="eyebrow" id="occ-title">Ocurrencias documentadas</h2>${noData()}</div>
        <p class="card__text card__text--muted">No se pudo consultar el recuento de ocurrencias.</p>
      </section>`;
  }
  const generalized = occ.results.filter(isGeneralized).length;
  const issues = occ.results.filter((r) => r.issues?.length).length;
  return `
    <section class="card card--xl" id="ocurrencias" tabindex="-1" aria-labelledby="occ-title">
      <div class="card__head">
        <h2 class="eyebrow" id="occ-title">Ocurrencias documentadas</h2>
        ${verified()}
      </div>
      <div class="split-row">
        <div class="split-row__main">
          <p class="count"><span class="count__num">${formatNumber(occ.count)}</span><span class="count__label">registros con coordenadas</span></p>
          <span class="split-row__code">taxon_key=${esc(taxon.key)} · has_coordinate=true</span>
          <p class="split-row__note">Recuento de la consulta, no población ni total global de ejemplares.</p>
        </div>
        ${occ.count ? `<a class="btn btn--primary" href="${buildHash(`/especie/${taxon.key}/ocurrencias`)}">Ver registros ${icons.arrow(16)}</a>` : ''}
      </div>
      ${generalized ? `
        <div class="callout callout--warn" role="note">
          <span class="callout__icon">${icons.shield(16)}</span>
          <span class="callout__body"><span class="callout__title">Ubicación generalizada para proteger el taxón</span>
          <span class="callout__text">${generalized} de ${occ.results.length} registros de muestra tienen coordenadas generalizadas${issues ? ' y presentan incidencias' : ''}. No son ubicaciones exactas.</span></span>
        </div>` : ''}
    </section>`;
}

export async function renderSpeciesView(app, route, { signal }) {
  const key = route.key;
  app.innerHTML = breadcrumb(null) + skeletonPage();

  let taxon;
  try {
    taxon = await getSpecies(key, { signal });
  } catch (error) {
    if (isAbort(error)) return;
    const notFound = error instanceof GbifError && error.status === 404;
    app.innerHTML = breadcrumb(null) + stateBlock({
      type: 'error',
      title: notFound ? 'No encontramos ese taxón' : 'No se pudo consultar GBIF',
      text: notFound ? `GBIF no tiene un registro con el identificador ${esc(key)}.` : 'Revisa tu conexión e inténtalo de nuevo.',
      actions: `<a class="btn btn--primary" href="${buildHash(`/especie/${key}`)}">Reintentar</a>`,
      level: 1,
    });
    return;
  }

  const [vernacularRes, photoRes, occRes] = await Promise.allSettled([
    getVernacularNames(key, { signal }),
    getPhoto(key, { signal }),
    searchOccurrences({ taxonKey: key, hasCoordinate: true, limit: 3 }, { signal }),
  ]);
  if (signal.aborted) return;

  const name = taxon.canonicalName || taxon.scientificName;
  const vernacular = vernacularRes.status === 'fulfilled' ? pickVernacular(vernacularRes.value) : null;
  const photo = photoRes.status === 'fulfilled' ? photoRes.value : null;
  const occ = occRes.status === 'fulfilled' ? occRes.value : null;

  setState({ lastSpecies: { key: taxon.key, name } });
  document.title = `${name} · Cladum`;

  const synonymNote =
    taxon.taxonomicStatus !== 'ACCEPTED' && taxon.acceptedKey
      ? `<div class="callout callout--warn" role="note"><span class="callout__icon">${icons.alert(16)}</span><span class="callout__body"><span class="callout__title">Este nombre no es el aceptado</span><span class="callout__text">GBIF lo trata como ${esc(statusLabel(taxon.taxonomicStatus).toLowerCase())} de <a href="${buildHash(`/especie/${taxon.acceptedKey}`)}">${taxonName(taxon.accepted || 'el nombre aceptado', taxon.rank)}</a>.</span></span></div>`
      : '';

  app.innerHTML = `
    ${breadcrumb(taxon)}
    <div class="layout u-view-enter">
      <div class="layout__aside">${renderTaxIndex(taxon)}</div>
      <section class="layout__content" aria-labelledby="species-title">
        <header class="species-hero">
          <div class="species-hero__text">
            <span class="eyebrow">Taxonomía · Ficha de ${esc(rankLabel(taxon.rank).toLowerCase())}</span>
            <h1 class="species-hero__name ${isItalicRank(taxon.rank) ? 'u-binomial' : 'species-hero__name--plain'}" id="species-title" tabindex="-1" ${isItalicRank(taxon.rank) ? 'lang="la"' : ''}>${esc(name)}</h1>
            <span class="species-hero__sub">${[taxon.authorship, vernacular?.vernacularName].filter(Boolean).map(esc).join(' · ')}</span>
          </div>
          <div class="page-head__badges">
            <span class="pill pill--ink">${taxon.taxonomicStatus === 'ACCEPTED' ? icons.check(14) : ''}${esc(statusLabel(taxon.taxonomicStatus))} · ${esc(rankLabel(taxon.rank))}</span>
            ${saveButton(isFavorite(taxon.key), name)}
          </div>
        </header>

        ${synonymNote}

        <div class="segmented" role="group" aria-label="Ir a sección" data-sections>
          <button class="segmented__btn" type="button" aria-pressed="true" data-target="identidad">Identidad</button>
          <button class="segmented__btn" type="button" aria-pressed="false" data-target="fotografia">Fotografía</button>
          <button class="segmented__btn" type="button" aria-pressed="false" data-target="ocurrencias">Ocurrencias</button>
          <button class="segmented__btn" type="button" aria-pressed="false" data-target="fuentes">Fuentes</button>
        </div>

        <div class="grid-auto grid-auto--start" style="--min:400px">
          ${photoCard(photo, name)}
          ${identityCard(taxon, vernacular)}
        </div>

        ${occurrencesCard(taxon, occ)}

        <section class="grid-auto" id="fuentes" tabindex="-1" style="--min:300px" aria-label="Fuentes">
          <div class="source-links">
            <span class="eyebrow">Fuentes de identidad</span>
            ${apiLink(apiUrl(`/species/${taxon.key}/vernacularNames`, { limit: 100 }), `GBIF · especie ${taxon.key} y nombres vernáculos`)}
            ${apiLink(`https://www.gbif.org/species/${taxon.key}`, 'Ficha en GBIF.org')}
          </div>
          <div class="source-links">
            <span class="eyebrow">Derechos del archivo</span>
            ${photo?.license ? apiLink(photo.license, `Fuente externa · ${licenseLabel(photo.license)}`) : noData('Sin fotografía')}
          </div>
        </section>
      </section>
    </div>`;

  bindSaveButtons(app, {
    key: taxon.key,
    name,
    authorship: taxon.authorship || '',
    vernacular: vernacular?.vernacularName ?? null,
    family: taxon.family ?? null,
    rank: taxon.rank,
  });

  // Si la imagen remota falla, se muestra el estado "sin dato"
  app.querySelector('[data-photo]')?.addEventListener('error', (event) => {
    event.target.closest('.photo-card').outerHTML = photoCard(null, name, true);
  });

  // Pestañas segmentadas: desplazan a cada sección
  const group = app.querySelector('[data-sections]');
  group.addEventListener('click', (event) => {
    const button = event.target.closest('[data-target]');
    if (!button) return;
    group.querySelectorAll('[data-target]').forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
    const section = app.querySelector(`#${button.dataset.target}`);
    section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    section?.focus({ preventScroll: true });
  });
}
