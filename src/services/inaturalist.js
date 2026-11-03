// ─────────────────────────────────────────────
// Servicio iNaturalist: respaldo de fotografías cuando GBIF no tiene
// o sus imágenes no cargan. Solo se usan fotos con licencia abierta.
// Documentación: https://api.inaturalist.org/v1/docs/
// ─────────────────────────────────────────────

import { INAT_API, GALLERY_SIZE } from '../config.js';
import { createApi } from './http.js';

export const inat = createApi({ baseURL: INAT_API, source: 'iNaturalist', maxCache: 60 });

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
  const data = await inat.get('/taxa', { q: name, is_active: 'true', per_page: 10 }, opts);
  const target = name.toLowerCase();
  return data.results?.find((taxon) => taxon.name?.toLowerCase() === target) ?? null;
}

/** Fotografías del taxón curadas en iNaturalist, con autoría y licencia. */
export async function getInatPhotos(name, opts) {
  if (!name) return [];
  const taxon = await findTaxon(name, opts);
  if (!taxon) return [];
  const data = await inat.get(`/taxa/${taxon.id}`, {}, opts);
  return (data.results?.[0]?.taxon_photos ?? [])
    .map((entry) => toPhoto(entry, taxon.id))
    .filter(Boolean)
    .slice(0, GALLERY_SIZE);
}
