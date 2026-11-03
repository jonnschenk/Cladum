// ─────────────────────────────────────────────
// Servicio GBIF: única capa que habla con la API.
// Documentación: https://techdocs.gbif.org/en/openapi/
// ─────────────────────────────────────────────

import {
  GBIF_API, BACKBONE_KEY, PAGE_SIZE, SUGGEST_LIMIT, VERNACULAR_LANG, GALLERY_SIZE,
  REQUEST_TIMEOUT, RETRY_AFTER_DEFAULT,
} from '../config.js';

/**
 * Error tipado de GBIF. `kind` decide el texto y la acción que ve la persona:
 *   timeout     · no respondió en REQUEST_TIMEOUT
 *   rate-limit  · 429, demasiadas consultas (retryAfter en segundos)
 *   unavailable · 5xx, GBIF caído o en mantenimiento
 *   not-found   · 404, el recurso no existe
 *   offline     · el navegador no tiene conexión
 *   network     · hay conexión, pero no se pudo llegar a GBIF
 *   http        · cualquier otra respuesta inesperada
 */
export class GbifError extends Error {
  constructor(kind, { status = null, url = '', retryAfter = null } = {}) {
    super(`GBIF: ${kind}${status ? ` (${status})` : ''}`);
    this.name = 'GbifError';
    this.kind = kind;
    this.status = status;
    this.url = url;
    this.retryAfter = retryAfter;
  }
}

function kindFromStatus(status) {
  if (status === 404) return 'not-found';
  if (status === 429) return 'rate-limit';
  if (status >= 500) return 'unavailable';
  return 'http';
}

function retryAfterSeconds(res) {
  const seconds = Number(res.headers.get('Retry-After'));
  return Number.isFinite(seconds) && seconds > 0 ? seconds : RETRY_AFTER_DEFAULT;
}

// Caché en memoria por URL: evita repetir consultas al navegar entre vistas.
const cache = new Map();
const MAX_CACHE = 120;

/** Construye la URL pública de una consulta (también se usa para la trazabilidad). */
export function apiUrl(path, params = {}) {
  const url = new URL(GBIF_API + path);
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    url.searchParams.set(key, value);
  });
  return url.toString();
}

async function request(path, params = {}, { signal } = {}) {
  const href = apiUrl(path, params);
  if (cache.has(href)) return cache.get(href);
  if (signal?.aborted) throw new DOMException('Consulta cancelada', 'AbortError');

  // Un controlador propio une dos motivos de cancelación: el cambio de vista
  // (silencioso, AbortError) y el tiempo máximo (error visible, timeout).
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT);
  const cancel = () => controller.abort();
  signal?.addEventListener('abort', cancel, { once: true });

  try {
    const res = await fetch(href, { signal: controller.signal, headers: { Accept: 'application/json' } });
    if (!res.ok) {
      throw new GbifError(kindFromStatus(res.status), {
        status: res.status,
        url: href,
        retryAfter: res.status === 429 ? retryAfterSeconds(res) : null,
      });
    }
    const data = await res.json();
    // Solo se guardan respuestas correctas: un error nunca queda en caché
    if (cache.size >= MAX_CACHE) cache.delete(cache.keys().next().value);
    cache.set(href, data);
    return data;
  } catch (error) {
    if (error instanceof GbifError) throw error;
    if (timedOut) throw new GbifError('timeout', { url: href });
    if (signal?.aborted) throw error;
    // fetch solo rechaza así por fallos de red
    throw new GbifError(navigator.onLine ? 'network' : 'offline', { url: href });
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', cancel);
  }
}

// ── Especies ────────────────────────────────

export function suggestSpecies(q, opts) {
  return request('/species/suggest', { q, limit: SUGGEST_LIMIT, datasetKey: BACKBONE_KEY }, opts);
}

export function searchSpecies({ q, rank, status, higherTaxonKey, offset = 0, limit = PAGE_SIZE }, opts) {
  return request('/species/search', {
    q,
    rank,
    status,
    highertaxonKey: higherTaxonKey,
    datasetKey: BACKBONE_KEY,
    offset,
    limit,
  }, opts);
}

export function searchSpeciesUrl(params) {
  return apiUrl('/species/search', { ...params, datasetKey: BACKBONE_KEY });
}

/** Coincidencia aproximada: alimenta el "¿Quisiste decir…?". */
export function matchName(name, opts) {
  return request('/species/match', { name }, opts);
}

export function getSpecies(key, opts) {
  return request(`/species/${key}`, {}, opts);
}

export async function getVernacularNames(key, opts) {
  const data = await request(`/species/${key}/vernacularNames`, { limit: 100 }, opts);
  return data.results ?? [];
}

/** Elige el nombre común en español; si no hay, devuelve null (nunca se inventa). */
export function pickVernacular(list = []) {
  return list.find((v) => v.language === VERNACULAR_LANG) ?? null;
}

// ── Ocurrencias ─────────────────────────────

export function searchOccurrences({ taxonKey, country, hasCoordinate, mediaType, offset = 0, limit = 20 }, opts) {
  return request('/occurrence/search', {
    taxon_key: taxonKey,
    country,
    has_coordinate: hasCoordinate,
    media_type: mediaType,
    offset,
    limit,
  }, opts);
}

export function occurrencesUrl(params) {
  return apiUrl('/occurrence/search', {
    taxon_key: params.taxonKey,
    country: params.country,
    has_coordinate: params.hasCoordinate,
    limit: params.limit,
  });
}

/** Países con registros: alimenta el filtro de país. */
export async function getCountryFacet(taxonKey, hasCoordinate, opts) {
  const data = await request('/occurrence/search', {
    taxon_key: taxonKey,
    has_coordinate: hasCoordinate,
    limit: 0,
    facet: 'country',
    'country.facetLimit': 40,
  }, opts);
  const facet = (data.facets ?? []).find((f) => f.field === 'COUNTRY');
  return facet?.counts ?? [];
}

// ── Conteos globales (portada) ──────────────

/** Total de ocurrencias publicadas en GBIF. La API responde un número. */
export function countOccurrences(opts) {
  return request('/occurrence/count', {}, opts);
}

export async function countDatasets(opts) {
  const data = await request('/dataset/search', { limit: 0 }, opts);
  return data.count;
}

/** Especies aceptadas en el backbone, opcionalmente dentro de un taxón superior. */
export async function countAcceptedSpecies(higherTaxonKey, opts) {
  const data = await searchSpecies({ rank: 'SPECIES', status: 'ACCEPTED', higherTaxonKey, limit: 0 }, opts);
  return data.count;
}

/** Primera imagen (StillImage) de un registro, con su procedencia. */
function toPhoto(record) {
  const media = record?.media?.find((m) => m.type === 'StillImage' && m.identifier);
  if (!record || !media) return null;
  return {
    source: 'gbif',
    url: media.identifier,
    creator: media.creator || media.rightsHolder || null,
    license: media.license || record.license || null,
    publisher: media.publisher || record.publisher || record.datasetName || null,
    references: media.references || record.references || null,
    occurrenceKey: record.key,
    basisOfRecord: record.basisOfRecord || null,
  };
}

/**
 * Fotografías para la galería: una por registro (más variedad de individuos,
 * lugares y etapas) y sin URLs repetidas.
 */
export async function getPhotos(taxonKey, opts) {
  const data = await searchOccurrences({ taxonKey, mediaType: 'StillImage', limit: GALLERY_SIZE * 2 }, opts);
  const seen = new Set();
  const photos = [];
  for (const record of data.results ?? []) {
    const photo = toPhoto(record);
    if (!photo || seen.has(photo.url)) continue;
    seen.add(photo.url);
    photos.push(photo);
    if (photos.length === GALLERY_SIZE) break;
  }
  return photos;
}
