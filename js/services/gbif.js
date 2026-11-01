// ─────────────────────────────────────────────
// Servicio GBIF: única capa que habla con la API.
// Documentación: https://techdocs.gbif.org/en/openapi/
// ─────────────────────────────────────────────

import { GBIF_API, BACKBONE_KEY, PAGE_SIZE, SUGGEST_LIMIT, VERNACULAR_LANG } from '../config.js';

export class GbifError extends Error {
  constructor(status, url) {
    super(`GBIF respondió ${status}`);
    this.name = 'GbifError';
    this.status = status;
    this.url = url;
  }
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

  const res = await fetch(href, { signal, headers: { Accept: 'application/json' } });
  if (!res.ok) throw new GbifError(res.status, href);

  const data = await res.json();
  if (cache.size >= MAX_CACHE) cache.delete(cache.keys().next().value);
  cache.set(href, data);
  return data;
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

/** Primera fotografía documentada: una ocurrencia con media StillImage. */
export async function getPhoto(taxonKey, opts) {
  const data = await searchOccurrences({ taxonKey, mediaType: 'StillImage', limit: 1 }, opts);
  const record = data.results?.[0];
  const media = record?.media?.find((m) => m.type === 'StillImage' && m.identifier);
  if (!record || !media) return null;
  return {
    url: media.identifier,
    creator: media.creator || media.rightsHolder || null,
    license: media.license || record.license || null,
    publisher: media.publisher || record.publisher || record.datasetName || null,
    references: media.references || record.references || null,
    occurrenceKey: record.key,
  };
}
