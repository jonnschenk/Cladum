// ─────────────────────────────────────────────
// Servicio iNaturalist: respaldo de fotografías cuando GBIF no tiene
// o sus imágenes no cargan. Solo se usan fotos con licencia abierta.
// Documentación: https://api.inaturalist.org/v1/docs/
// ─────────────────────────────────────────────

import { INAT_API, GALLERY_SIZE, REQUEST_TIMEOUT } from '../config.js';

const cache = new Map();
const MAX_CACHE = 60;

async function request(path, params = {}, { signal } = {}) {
  const url = new URL(INAT_API + path);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  const href = url.toString();
  if (cache.has(href)) return cache.get(href);

  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT);
  const res = await fetch(href, {
    signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`iNaturalist: ${res.status}`);
  const data = await res.json();
  if (cache.size >= MAX_CACHE) cache.delete(cache.keys().next().value);
  cache.set(href, data);
  return data;
}

// iNaturalist da el código sin versión (cc-by-nc); se enlaza a la familia de la licencia
const licenseUrl = (code) =>
  code === 'cc0'
    ? 'https://creativecommons.org/publicdomain/zero/1.0/'
    : `https://creativecommons.org/licenses/${code.replace(/^cc-/, '')}/`;

function toPhoto({ photo } = {}, taxonId) {
  // Sin license_code la foto es "todos los derechos reservados": no se usa
  if (!photo?.license_code || !photo.url) return null;
  return {
    source: 'inaturalist',
    url: photo.medium_url || photo.url,
    creator: photo.attribution_name || null,
    license: licenseUrl(photo.license_code),
    publisher: 'iNaturalist',
    references: `https://www.inaturalist.org/photos/${photo.id}`,
    taxonId,
  };
}

/** Taxón con el mismo nombre científico. Solo coincidencia exacta: nunca se adivina. */
async function findTaxon(name, opts) {
  const data = await request('/taxa', { q: name, is_active: 'true', per_page: 10 }, opts);
  const target = name.toLowerCase();
  return data.results?.find((taxon) => taxon.name?.toLowerCase() === target) ?? null;
}

/** Fotografías del taxón curadas en iNaturalist, con autoría y licencia. */
export async function getInatPhotos(name, opts) {
  if (!name) return [];
  const taxon = await findTaxon(name, opts);
  if (!taxon) return [];
  const data = await request(`/taxa/${taxon.id}`, {}, opts);
  return (data.results?.[0]?.taxon_photos ?? [])
    .map((entry) => toPhoto(entry, taxon.id))
    .filter(Boolean)
    .slice(0, GALLERY_SIZE);
}
