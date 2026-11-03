import { matchName, searchSpecies } from '../../services/gbif.js';

const lower = (value) => (value || '').toLowerCase();

/**
 * Si la consulta es exactamente un género, devuelve { key, name, kingdom, family }; si no, null.
 * /species/match responde NONE cuando hay homónimos (p. ej. «Giardia»: una planta y un
 * caracol, ambos sinónimos, y el protozoario). En ese caso se buscan los géneros con ese
 * nombre y se usa el único que no sea sinónimo; si hay varios, no se adivina.
 */
export async function findGenus(q, opts) {
  const match = await matchName(q, opts);
  if (match?.rank === 'GENUS' && match.matchType === 'EXACT' && match.usageKey) {
    return { key: match.usageKey, name: match.canonicalName || q, kingdom: match.kingdom ?? null, family: match.family ?? null };
  }
  if (match?.matchType !== 'NONE') return null;

  const genera = await searchSpecies({ q, rank: 'GENUS', limit: 20 }, opts);
  const candidates = (genera.results ?? []).filter(
    (t) => lower(t.canonicalName) === lower(q) && !/SYNONYM|MISAPPLIED/.test(t.taxonomicStatus ?? ''),
  );
  if (candidates.length !== 1) return null;
  const [genus] = candidates;
  return { key: genus.key, name: genus.canonicalName, kingdom: genus.kingdom ?? null, family: genus.family ?? null };
}
