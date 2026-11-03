// Vista: Portada de Explorar (sin consulta)
// Se pinta al instante con la estructura y luego se completa con datos en vivo de GBIF.

import {
  getSpecies, getVernacularNames, pickVernacular,
  countOccurrences, countDatasets, countAcceptedSpecies, apiUrl, searchSpeciesUrl,
} from '../../services/gbif.js';
import { getTaxonPhotos, getInatPhotos } from '../../services/photos.js';
import { getFavorites } from '../../state/favorites.js';
import { getState } from '../../state/store.js';
import { buildHash } from '../../router.js';
import { esc } from '../../utils/dom.js';
import { formatCompact, formatNumber, licenseLabel } from '../../utils/format.js';
import { icons, verified, noData, taxonName, apiLink, chip } from '../components.js';

// Claves del backbone cotejadas con /species/match
const SPECIMENS = [
  { key: 5219426, name: 'Panthera onca' },
  { key: 2431950, name: 'Ambystoma mexicanum' },
  { key: 5133088, name: 'Danaus plexippus' },
  { key: 8386328, name: 'Quercus rugosa' },
];

// Reinos del backbone de GBIF (sus claves son fijas)
const KINGDOMS = [
  { key: 1, name: 'Animalia', common: 'Animales' },
  { key: 6, name: 'Plantae', common: 'Plantas' },
  { key: 5, name: 'Fungi', common: 'Hongos' },
  { key: 4, name: 'Chromista', common: 'Cromistas' },
  { key: 3, name: 'Bacteria', common: 'Bacterias' },
  { key: 7, name: 'Protozoa', common: 'Protozoos' },
];

// Ejemplos para quien no sabe por dónde empezar: científico, común y género
const EXAMPLES = [
  ['Panthera onca', '<i lang="la">Panthera onca</i>'],
  ['ajolote', 'ajolote'],
  ['Quercus', '<i lang="la">Quercus</i>'],
  ['mariposa monarca', 'mariposa monarca'],
];

const STATS = [
  {
    id: 'species',
    label: 'especies aceptadas',
    load: (opts) => countAcceptedSpecies(undefined, opts),
    url: searchSpeciesUrl({ rank: 'SPECIES', status: 'ACCEPTED', limit: 0 }),
    api: 'species/search',
  },
  {
    id: 'occurrences',
    label: 'ocurrencias publicadas',
    load: countOccurrences,
    url: apiUrl('/occurrence/count'),
    api: 'occurrence/count',
  },
  {
    id: 'datasets',
    label: 'conjuntos de datos',
    load: countDatasets,
    url: apiUrl('/dataset/search', { limit: 0 }),
    api: 'dataset/search',
  },
];

/** "1,8 millones de especies" / "4626 especies" */
const speciesCount = (n) => (n >= 1e6 ? `${formatCompact(n)} de especies` : `${formatNumber(n)} especies`);

// Cladograma decorativo del encabezado
const CLADOGRAM = `
  <svg class="explore-home__cladogram" viewBox="0 0 240 220" fill="none" aria-hidden="true" focusable="false">
    <path d="M10 110H50M50 50V150M50 50H110M110 30V70M110 30H230M110 70H230M50 150H90M90 110V190M90 110H230M90 150H230M90 190H230" />
    ${[30, 70, 110, 150, 190].map((y) => `<circle class="explore-home__node" cx="230" cy="${y}" r="4" />`).join('')}
  </svg>`;

function statItem(stat) {
  return `
    <div class="explore-home__stat">
      <dt class="explore-home__stat-label">${esc(stat.label)}</dt>
      <dd class="explore-home__stat-value" data-stat="${stat.id}"><span class="skeleton skeleton--stat"></span></dd>
    </div>`;
}

function recentSection() {
  const last = getState().lastSpecies;
  const favorites = getFavorites();
  const items = [];
  if (last?.key) items.push({ ...last, tag: 'Última ficha' });
  favorites
    .filter((f) => f.key !== last?.key)
    .slice(0, last?.key ? 4 : 5)
    .forEach((f) => items.push({ ...f, tag: 'Guardada' }));
  if (!items.length) return '';

  return `
    <section class="explore-home__section" aria-labelledby="recent-title">
      <div class="explore-home__section-head">
        <h2 class="explore-home__section-title" id="recent-title">Continúa donde te quedaste</h2>
        ${favorites.length ? `<a class="btn btn--ghost btn--sm" href="${buildHash('/guardadas')}">Ver guardadas ${icons.arrow(14)}</a>` : ''}
      </div>
      <ul class="explore-home__recent">
        ${items.map((item) => `
          <li class="explore-home__recent-item">
            <a class="pill pill--raised explore-home__recent-link" href="${buildHash(`/especie/${item.key}`)}">
              <span class="explore-home__recent-tag">${item.tag}</span>
              ${taxonName(item.name, item.rank || 'SPECIES')}
            </a>
          </li>`).join('')}
      </ul>
    </section>`;
}

function specimenCard({ key, name }) {
  return `
    <li class="explore-home__specimen">
      <article class="specimen-card" aria-labelledby="specimen-${key}" data-specimen="${key}">
        <div class="specimen-card__media" data-media><span class="skeleton specimen-card__skeleton"></span></div>
        <div class="specimen-card__body">
          <h3 class="specimen-card__name" id="specimen-${key}">
            <a class="specimen-card__link" href="${buildHash(`/especie/${key}`)}"><i lang="la">${esc(name)}</i></a>
          </h3>
          <p class="specimen-card__common" data-common><span class="skeleton skeleton--line"></span></p>
          <p class="specimen-card__meta" data-meta></p>
        </div>
        <p class="specimen-card__credit" data-credit></p>
      </article>
    </li>`;
}

function kingdomCard({ key, name, common }) {
  const href = buildHash('/', { higher: key, label: name, rank: 'SPECIES', status: 'ACCEPTED' });
  return `
    <li class="explore-home__kingdom">
      <a class="kingdom-card" href="${href}">
        <span class="kingdom-card__latin">${esc(name)}</span>
        <span class="kingdom-card__common">${esc(common)}</span>
        <span class="kingdom-card__count" data-kingdom="${key}"><span class="skeleton skeleton--line"></span></span>
        <span class="kingdom-card__foot">
          <span class="kingdom-card__key">GBIF:${key}</span>
          ${icons.arrow(16)}
        </span>
      </a>
    </li>`;
}

/** Estructura de la portada. Recibe el formulario de búsqueda ya armado. */
export function renderExploreHome(formHtml) {
  return `
    <div class="explore-home u-view-enter" data-explore-home>
      <section class="explore-home__hero" aria-labelledby="home-title">
        ${CLADOGRAM}
        <div class="explore-home__intro">
          <span class="eyebrow">Explorar · Backbone taxonómico de GBIF</span>
          <h1 class="explore-home__title" id="home-title" tabindex="-1">La biodiversidad, con datos que puedes verificar.</h1>
          <p class="explore-home__lead">Busca una especie por su nombre científico o común, recorre su clasificación y llega hasta cada registro documentado.</p>
        </div>
        ${formHtml}
        <div class="chip-row explore-home__examples">
          <span class="chip-row__label">Prueba con</span>
          ${EXAMPLES.map(([q, label]) => chip(buildHash('/', { q }), label)).join('')}
        </div>
        <dl class="explore-home__stats" aria-busy="true" data-stats>${STATS.map(statItem).join('')}</dl>
        <div class="explore-home__trace">
          ${verified('Cifras en vivo · GBIF')}
          ${STATS.map((s) => apiLink(s.url, s.api)).join('')}
        </div>
      </section>

      ${recentSection()}

      <section class="explore-home__section" aria-labelledby="specimens-title">
        <div class="explore-home__section-head">
          <div class="explore-home__section-text">
            <h2 class="explore-home__section-title" id="specimens-title">Ejemplares destacados</h2>
            <p class="explore-home__section-lead">Cuatro especies de México para empezar. Fotografías y nombres tal como los publica GBIF.</p>
          </div>
        </div>
        <ul class="explore-home__specimens">${SPECIMENS.map(specimenCard).join('')}</ul>
      </section>

      <section class="explore-home__section" aria-labelledby="kingdoms-title">
        <div class="explore-home__section-head">
          <div class="explore-home__section-text">
            <h2 class="explore-home__section-title" id="kingdoms-title">Recorre el árbol de la vida</h2>
            <p class="explore-home__section-lead">Empieza por un reino y baja por la clasificación hasta la especie.</p>
          </div>
        </div>
        <ul class="explore-home__kingdoms">${KINGDOMS.map(kingdomCard).join('')}</ul>
      </section>
    </div>`;
}

function photoPlaceholder(message) {
  return `<div class="specimen-card__placeholder">${icons.image(24)}<span>${esc(message)}</span></div>`;
}

async function hydrateSpecimen(card, { key, name }, opts, alive) {
  const [taxonRes, vernacularRes, photoRes] = await Promise.allSettled([
    getSpecies(key, opts),
    getVernacularNames(key, opts),
    getTaxonPhotos(key, name, opts),
  ]);
  if (!alive()) return;

  const taxon = taxonRes.status === 'fulfilled' ? taxonRes.value : null;
  const vernacular = vernacularRes.status === 'fulfilled' ? pickVernacular(vernacularRes.value) : null;
  const photos = photoRes.status === 'fulfilled' ? photoRes.value : [];

  card.querySelector('[data-common]').innerHTML = vernacular
    ? esc(vernacular.vernacularName)
    : noData('Sin nombre común en español');
  card.querySelector('[data-meta]').textContent = taxon?.family ? `Familia ${taxon.family}` : '';

  const media = card.querySelector('[data-media]');
  const credit = card.querySelector('[data-credit]');
  // Si las fotos de GBIF fallan al cargar, se recurre una vez a iNaturalist
  let fallbackTried = photos[0]?.source !== 'gbif';
  let broken = false;

  const show = async (list) => {
    const [photo, ...rest] = list;
    if (!photo) {
      if (!fallbackTried) {
        fallbackTried = true;
        const fallback = await getInatPhotos(name, opts).catch(() => []);
        if (alive()) show(fallback);
        return;
      }
      // Una consulta fallida no equivale a "sin foto": se dice cuál de los tres pasó
      media.innerHTML = photoPlaceholder(
        broken ? 'No se pudo cargar la fotografía'
          : photoRes.status === 'rejected' ? 'No se pudo consultar la fotografía'
          : 'Sin fotografía documentada',
      );
      credit.textContent = '';
      return;
    }

    media.innerHTML = `
      <img class="specimen-card__img" src="${esc(photo.url)}" loading="lazy" decoding="async"
        alt="Fotografía de ${esc(name)}${photo.creator ? `, por ${esc(photo.creator)}` : ''}">`;
    credit.textContent = [`Foto: ${photo.creator || 'autoría no indicada'}`, licenseLabel(photo.license)]
      .filter(Boolean)
      .join(' · ');

    // Si la imagen remota falla, se prueba la siguiente en lugar de dejar el hueco
    media.querySelector('img').addEventListener('error', () => {
      broken = true;
      show(rest);
    }, { once: true });
  };

  show(photos);
}

/** Completa la portada con datos en vivo. Cada bloque falla por separado. */
export function hydrateExploreHome(root, { signal }) {
  if (!root) return;
  const opts = { signal };
  const alive = () => !signal.aborted && root.isConnected;

  const stats = STATS.map(async (stat) => {
    const slot = root.querySelector(`[data-stat="${stat.id}"]`);
    try {
      const n = await stat.load(opts);
      if (alive()) slot.innerHTML = `<data value="${esc(n)}">${esc(formatCompact(n))}</data>`;
    } catch {
      if (alive()) slot.innerHTML = noData();
    }
  });
  Promise.allSettled(stats).then(() => {
    if (alive()) root.querySelector('[data-stats]').setAttribute('aria-busy', 'false');
  });

  SPECIMENS.forEach((specimen) => {
    const card = root.querySelector(`[data-specimen="${specimen.key}"]`);
    hydrateSpecimen(card, specimen, opts, alive).catch(() => {});
  });

  KINGDOMS.forEach(async ({ key }) => {
    const slot = root.querySelector(`[data-kingdom="${key}"]`);
    try {
      const n = await countAcceptedSpecies(key, opts);
      if (alive()) slot.textContent = `${speciesCount(n)} aceptadas`;
    } catch {
      if (alive()) slot.innerHTML = noData();
    }
  });
}
