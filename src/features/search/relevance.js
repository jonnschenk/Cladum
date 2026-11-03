// Orden de resultados: GBIF ordena por su propio criterio; aquí se prioriza lo que se escribió.

const lower = (value) => (value || '').toLowerCase();

/** Puntúa qué tan bien coincide un taxón con lo que se escribió (mayor = más relevante). */
export function relevance(taxon, q = '') {
  const query = lower(q.trim());
  const name = lower(taxon.canonicalName || taxon.scientificName);
  if (!query) return 10;
  if (lower(taxon.canonicalName) === query) return 100;
  if (lower(taxon.genus) === query) return 90;
  if (name.split(/\s+/)[0] === query) return 80;
  if (name.startsWith(query)) return 60;
  if ((taxon.vernacularNames ?? []).some((v) => lower(v.vernacularName) === query)) return 50;
  return 10;
}

export const sortByRelevance = (results, q) => [...results].sort((a, b) => relevance(b, q) - relevance(a, q));
