// Vista: Ficha de especie

import {
  getSpecies, getVernacularNames, pickVernacular, searchOccurrences, apiUrl,
} from '../../services/gbif.js';
import { getTaxonPhotos, getInatPhotos } from '../../services/photos.js';
import { bindSaveButtons, announce } from '../../handlers/feedback.js';
import { isFavorite } from '../../state/favorites.js';
import { setState } from '../../state/store.js';
import { buildHash, navigate } from '../../router.js';
import { esc, safeUrl, isAbort } from '../../utils/dom.js';
import { formatNumber, rankLabel, statusLabel, licenseLabel, basisLabel, isItalicRank } from '../../utils/format.js';
import { GENERALIZED_UNCERTAINTY } from '../../config.js';
import { renderTaxIndex } from '../taxIndex.js';
import { renderLoading, renderError, withSlowNotice } from '../states.js';
import {
  icons, verified, external, noData, taxonName, apiLink, externalLink, saveButton,
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

// ── Galería de fotografías ──────────────────

// iNaturalist publica cada foto en varios tamaños (…/photos/123/original.jpg → small.jpg).
// Para otras fuentes se usa la URL tal cual.
const INAT_SIZE = /^(https:\/\/(?:inaturalist-open-data\.s3\.amazonaws\.com|static\.inaturalist\.org)\/photos\/\d+\/)(?:original|large|medium|small|square)(\.\w+)(\?.*)?$/;

function sizedUrl(url, size) {
  const safe = safeUrl(url);
  return safe.replace(INAT_SIZE, `$1${size}$2$3`);
}

const photoAlt = (photo, name) => `Fotografía de ${name}${photo.creator ? `, por ${photo.creator}` : ''}`;

function photoStage(photo, name) {
  return `
    <img class="photo-card__img" src="${esc(sizedUrl(photo.url, 'large'))}" decoding="async"
      alt="${esc(photoAlt(photo, name))}" data-photo>`;
}

function photoCaption(photo) {
  const license = licenseLabel(photo.license);
  const fromGbif = photo.source === 'gbif';
  const originalUrl = photo.references || `https://www.gbif.org/occurrence/${photo.occurrenceKey}`;
  return `
    <div class="photo-card__credit">
      <span class="photo-card__author">${esc(photo.creator || 'Autoría no indicada')} <span class="photo-card__meta">${[photo.publisher, license].filter(Boolean).map(esc).join(' · ')}</span></span>
      ${externalLink(originalUrl, 'Ver original')}
    </div>
    <div class="photo-card__tags">
      ${external(`Fuente externa · vía ${fromGbif ? 'GBIF' : 'iNaturalist'}`)}
      ${fromGbif
        ? `<span class="pill">${esc(basisLabel(photo.basisOfRecord))}</span>
      <span class="pill pill--mono pill--muted">Registro GBIF:${esc(photo.occurrenceKey)}</span>`
        : `<span class="pill pill--mono pill--muted">Taxón iNat:${esc(photo.taxonId)}</span>`}
    </div>`;
}

const photoRights = (photo) =>
  photo?.license ? apiLink(photo.license, `Fuente externa · ${licenseLabel(photo.license)}`) : noData('Sin licencia indicada');

function photoThumb(photo, index, total, selected) {
  return `
    <button class="photo-card__thumb" type="button" aria-pressed="${selected}" tabindex="${selected ? 0 : -1}"
      data-photo-index="${index}" aria-label="Fotografía ${index + 1} de ${total}${photo.creator ? `, por ${esc(photo.creator)}` : ''}">
      <img class="photo-card__thumb-img" src="${esc(sizedUrl(photo.url, 'small'))}" alt="" decoding="async">
    </button>`;
}

/**
 * La imagen empieza transparente sobre el fondo del marco (el placeholder)
 * y aparece con un fundido cuando termina de cargar.
 */
function revealOnLoad(img) {
  const show = () => img.classList.add('is-loaded');
  if (img.complete && img.naturalWidth) show();
  else img.addEventListener('load', show, { once: true });
}

/** Foto principal + miniaturas. El crédito vive junto a la imagen y cambia con ella. */
function photoGallery(photos, name, { selected = 0, empty = '' } = {}) {
  if (!photos.length) {
    return `
      <section class="photo-card" aria-label="Fotografía">
        <div class="photo-card__empty">${icons.image(28)}<span>${empty}</span>${noData()}</div>
      </section>`;
  }
  const total = photos.length;
  const photo = photos[selected];
  return `
    <section class="photo-card" aria-label="${total > 1 ? `Fotografías (${total})` : 'Fotografía'}" data-gallery>
      <figure class="photo-card__figure">
        <div class="photo-card__stage" data-photo-stage>${photoStage(photo, name)}</div>
        ${total > 1 ? `<span class="pill photo-card__counter" aria-hidden="true"><span data-photo-current>${selected + 1}</span>&nbsp;de ${total}</span>` : ''}
        <figcaption class="photo-card__caption" data-photo-caption>${photoCaption(photo)}</figcaption>
      </figure>
      ${total > 1 ? `
        <div class="photo-card__thumbs" role="group" aria-label="Elegir fotografía" data-photo-thumbs>
          ${photos.map((p, i) => photoThumb(p, i, total, i === selected)).join('')}
        </div>` : ''}
    </section>`;
}

/** Selección con clic o con flechas / Inicio / Fin (tabindex itinerante). */
function bindGallery(root, photos, name, { selected, rights, onSelect, onBroken }) {
  const gallery = root.querySelector('[data-gallery]');
  if (!gallery) return;
  const stage = gallery.querySelector('[data-photo-stage]');
  const caption = gallery.querySelector('[data-photo-caption]');
  const current = gallery.querySelector('[data-photo-current]');
  const thumbs = [...gallery.querySelectorAll('[data-photo-index]')];

  const watchImage = (photo) => {
    const img = stage.querySelector('[data-photo]');
    if (!img) return;
    img.addEventListener('error', () => onBroken(photo), { once: true });
    revealOnLoad(img);
  };

  const select = (index, { focus = false } = {}) => {
    const photo = photos[index];
    stage.innerHTML = photoStage(photo, name);
    watchImage(photo);
    caption.innerHTML = photoCaption(photo);
    if (current) current.textContent = String(index + 1);
    if (rights) rights.innerHTML = photoRights(photo);
    thumbs.forEach((thumb, i) => {
      thumb.setAttribute('aria-pressed', String(i === index));
      thumb.tabIndex = i === index ? 0 : -1;
    });
    if (focus) thumbs[index].focus();
    thumbs[index].scrollIntoView({ block: 'nearest', inline: 'nearest' });
    announce(`${photoAlt(photo, name)}. ${index + 1} de ${photos.length}`);
    onSelect(photo);
  };

  watchImage(photos[selected]);

  // Una miniatura que no carga delata una foto rota: se retira de la galería
  gallery.querySelectorAll('.photo-card__thumb-img').forEach((img, i) => {
    revealOnLoad(img);
    img.addEventListener('error', () => onBroken(photos[i]), { once: true });
  });

  gallery.querySelector('[data-photo-thumbs]')?.addEventListener('click', (event) => {
    const thumb = event.target.closest('[data-photo-index]');
    if (thumb) select(Number(thumb.dataset.photoIndex));
  });

  gallery.querySelector('[data-photo-thumbs]')?.addEventListener('keydown', (event) => {
    const index = thumbs.indexOf(document.activeElement);
    if (index < 0) return;
    const last = thumbs.length - 1;
    const next = {
      ArrowRight: index === last ? 0 : index + 1,
      ArrowLeft: index === 0 ? last : index - 1,
      Home: 0,
      End: last,
    }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    select(next, { focus: true });
  });
}

const EMPTY_GALLERY = {
  failed: 'No se pudieron consultar las fotografías. Inténtalo más tarde.',
  none: 'No hay fotografía documentada en GBIF ni en iNaturalist para este taxón.',
  broken: 'No se pudieron cargar las fotografías desde su fuente original.',
};

/**
 * Pinta la galería y la mantiene sin huecos: una foto que no carga se retira;
 * si se caen todas las de GBIF, se recurre a iNaturalist antes de mostrar el vacío.
 */
function mountGallery(root, photos, name, { signal, failed }) {
  const slot = root.querySelector('[data-photo-slot]');
  const rights = root.querySelector('[data-photo-rights]');
  const broken = new Set();
  let list = photos;
  let currentUrl = photos[0]?.url;
  let fallbackTried = photos[0]?.source !== 'gbif';
  let empty = failed ? EMPTY_GALLERY.failed : EMPTY_GALLERY.none;
  let queued = false;

  const render = () => {
    const selected = Math.max(0, list.findIndex((p) => p.url === currentUrl));
    slot.innerHTML = photoGallery(list, name, { selected, empty });
    if (rights) rights.innerHTML = list.length ? photoRights(list[selected]) : noData('Sin fotografía');
    bindGallery(slot, list, name, {
      selected,
      rights,
      onSelect: (photo) => { currentUrl = photo.url; },
      onBroken,
    });
  };

  async function onBroken(photo) {
    if (broken.has(photo.url)) return;
    broken.add(photo.url);
    list = list.filter((p) => !broken.has(p.url));
    empty = EMPTY_GALLERY.broken;
    // Varias imágenes suelen fallar casi a la vez: se repinta una sola vez
    if (queued) return;
    queued = true;
    await new Promise(requestAnimationFrame);
    if (!list.length && !fallbackTried) {
      fallbackTried = true;
      list = await getInatPhotos(name, { signal }).catch(() => []);
    }
    queued = false;
    if (!signal.aborted && slot.isConnected) render();
  }

  render();
}

function identityCard(taxon, vernacular) {
  return `
    <section class="card" aria-labelledby="identity-title">
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
      <section class="card card--xl" aria-labelledby="occ-title">
        <div class="card__head"><h2 class="eyebrow" id="occ-title">Ocurrencias documentadas</h2>${noData()}</div>
        <p class="card__text card__text--muted">No se pudo consultar el recuento de ocurrencias.</p>
      </section>`;
  }
  const generalized = occ.results.filter(isGeneralized).length;
  const issues = occ.results.filter((r) => r.issues?.length).length;
  return `
    <section class="card card--xl" aria-labelledby="occ-title">
      <div class="card__head">
        <h2 class="eyebrow" id="occ-title">Ocurrencias documentadas</h2>
        ${verified()}
      </div>
      <div class="split-row">
        <div class="split-row__main">
          <p class="count"><span class="count__num">${formatNumber(occ.count)}</span><span class="count__label">registros con coordenadas</span></p>
          <span class="split-row__code">taxon_key=${esc(taxon.key)} · has_coordinate=true</span>
          <p class="split-row__note">${occ.count
            ? 'Recuento de la consulta, no población ni total global de ejemplares.'
            : 'GBIF no tiene registros con coordenadas de este taxón. Puede haber registros sin ubicación precisa.'}</p>
        </div>
        ${occ.count
          ? `<a class="btn btn--primary" href="${buildHash(`/especie/${taxon.key}/ocurrencias`)}">Ver registros ${icons.arrow(16)}</a>`
          : `<a class="btn btn--secondary" href="${buildHash(`/especie/${taxon.key}/ocurrencias`, { coords: '0' })}">Ver registros sin coordenadas ${icons.arrow(16)}</a>`}
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
  renderLoading(app, 'species', { before: breadcrumb(null) });

  let taxon;
  try {
    taxon = await withSlowNotice(getSpecies(key, { signal }), app);
  } catch (error) {
    if (isAbort(error)) return;
    app.innerHTML = `${breadcrumb(null)}<div data-error></div>`;
    renderError(app.querySelector('[data-error]'), error, {
      onRetry: () => navigate(`/especie/${key}`),
      copy: { 'not-found': { title: 'No encontramos ese taxón', text: `GBIF no tiene un taxón con el identificador ${key}.` } },
      actions: `<a class="btn btn--secondary" href="${buildHash('/')}">Ir a Explorar</a>`,
    });
    return;
  }

  const name = taxon.canonicalName || taxon.scientificName;
  const [vernacularRes, photoRes, occRes] = await withSlowNotice(Promise.allSettled([
    getVernacularNames(key, { signal }),
    getTaxonPhotos(key, name, { signal }),
    searchOccurrences({ taxonKey: key, hasCoordinate: true, limit: 3 }, { signal }),
  ]), app);
  if (signal.aborted) return;

  const vernacular = vernacularRes.status === 'fulfilled' ? pickVernacular(vernacularRes.value) : null;
  const photos = photoRes.status === 'fulfilled' ? photoRes.value : [];
  const occ = occRes.status === 'fulfilled' ? occRes.value : null;

  setState({ lastSpecies: { key: taxon.key, name, rank: taxon.rank } });
  document.title = `${name} · Cladum`;

  const synonymNote =
    taxon.taxonomicStatus !== 'ACCEPTED' && taxon.acceptedKey
      ? `<div class="callout callout--warn" role="note"><span class="callout__icon">${icons.alert(16)}</span><span class="callout__body"><span class="callout__title">Este nombre no es el aceptado</span><span class="callout__text">GBIF lo trata como ${esc(statusLabel(taxon.taxonomicStatus).toLowerCase())} de <a href="${buildHash(`/especie/${taxon.acceptedKey}`)}">${taxonName(taxon.accepted || 'el nombre aceptado', taxon.rank)}</a>.</span></span></div>`
      : '';

  app.innerHTML = `
    ${breadcrumb(taxon)}
    <div class="layout u-fade-in">
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

        <div class="grid-auto grid-auto--start" style="--min:400px">
          <div style="display:contents" data-photo-slot></div>
          ${identityCard(taxon, vernacular)}
        </div>

        ${occurrencesCard(taxon, occ)}

        <section class="grid-auto" style="--min:300px" aria-label="Fuentes">
          <div class="source-links">
            <span class="eyebrow">Fuentes de identidad</span>
            ${apiLink(apiUrl(`/species/${taxon.key}/vernacularNames`, { limit: 100 }), `GBIF · especie ${taxon.key} y nombres vernáculos`)}
            ${apiLink(`https://www.gbif.org/species/${taxon.key}`, 'Ficha en GBIF.org')}
          </div>
          <div class="source-links">
            <span class="eyebrow">Derechos de la fotografía mostrada</span>
            <span class="source-links__item" data-photo-rights></span>
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

  mountGallery(app, photos, name, { signal, failed: photoRes.status === 'rejected' });
}
