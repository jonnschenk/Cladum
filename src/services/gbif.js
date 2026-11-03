// ─────────────────────────────────────────────
// Servicio GBIF: única capa que habla con la API de GBIF.
// Documentación: https://techdocs.gbif.org/en/openapi/
// ─────────────────────────────────────────────

import {
  GBIF_API, BACKBONE_KEY, PAGE_SIZE, SUGGEST_LIMIT, VERNACULAR_LANG, GALLERY_SIZE,
} from '../config.js';
import { createApi } from './http.js';

export const gbif = createApi({ baseURL: GBIF_API, source: 'GBIF' });

/** URL pública de una consulta (se muestra para la trazabilidad de cada dato). */
export const apiUrl = gbif.url;

// ── Especies ────────────────────────────────

export function suggestSpecies(q, opts) {
  return gbif.get('/species/suggest', { q, limit: SUGGEST_LIMIT, datasetKey: BACKBONE_KEY }, opts);
}

export function searchSpecies({ q, rank, status, higherTaxonKey, offset = 0, limit = PAGE_SIZE }, opts) {
  return gbif.get('/species/search', {
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
  return gbif.get('/species/match', { name }, opts);
}

export function getSpecies(key, opts) {
  return gbif.get(`/species/${key}`, {}, opts);
}

export async function getVernacularNames(key, opts) {
  const data = await gbif.get(`/species/${key}/vernacularNames`, { limit: 100 }, opts);
  return data.results ?? [];
}

/** Elige el nombre común en español; si no hay, devuelve null (nunca se inventa). */
export function pickVernacular(list = []) {
  return list.find((v) => v.language === VERNACULAR_LANG) ?? null;
}

// ── Ocurrencias ─────────────────────────────

export function searchOccurrences({ taxonKey, country, hasCoordinate, mediaType, offset = 0, limit = 20 }, opts) {
  return gbif.get('/occurrence/search', {
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
  const data = await gbif.get('/occurrence/search', {
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
  return gbif.get('/occurrence/count', {}, opts);
}

export async function countDatasets(opts) {
  const data = await gbif.get('/dataset/search', { limit: 0 }, opts);
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
