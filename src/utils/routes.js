// Direcciones de la app (para <Link to>), con los mismos parámetros que la versión anterior

/** "?q=…&rank=…" sin parámetros vacíos. */
export function queryString(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') search.set(key, value);
  });
  const query = search.toString();
  return query ? `?${query}` : '';
}

export const searchHref = (params) => `/${queryString(params)}`;
export const speciesHref = (key) => `/especie/${key}`;
export const occurrencesHref = (key, params) => `/especie/${key}/ocurrencias${queryString(params)}`;

/** Especies dentro de un taxón superior (reino, familia, género…). */
export const higherTaxonHref = (key, label) =>
  searchHref({ higher: key, label, rank: 'SPECIES', status: 'ACCEPTED' });
