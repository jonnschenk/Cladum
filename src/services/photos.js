// ─────────────────────────────────────────────
// Fotografías de un taxón con fuente de respaldo:
// GBIF primero; si no tiene o no responde, iNaturalist.
// ─────────────────────────────────────────────

import { getPhotos } from './gbif.js';
import { getInatPhotos } from './inaturalist.js';
import { safeUrl, isAbort } from '../utils/net.js';

export { getInatPhotos };

/** Solo lanza error si fallan las dos fuentes; [] significa que ninguna tiene fotos. */
export async function getTaxonPhotos(taxonKey, name, opts) {
  let gbifError = null;
  try {
    const photos = (await getPhotos(taxonKey, opts)).filter((p) => safeUrl(p.url));
    if (photos.length) return photos;
  } catch (error) {
    if (isAbort(error)) throw error;
    gbifError = error;
  }
  try {
    return (await getInatPhotos(name, opts)).filter((p) => safeUrl(p.url));
  } catch (error) {
    if (isAbort(error)) throw error;
    if (gbifError) throw gbifError;
    return [];
  }
}
