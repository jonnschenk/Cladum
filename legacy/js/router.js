// Router por hash (funciona en GitHub Pages / Firebase sin configuración extra)
//
//   #/                         → Explorar (búsqueda)
//   #/?q=Panthera%20onca       → resultados
//   #/especie/5219426          → ficha de especie
//   #/especie/5219426/ocurrencias
//   #/guardadas                → especies guardadas
//   #/datos                    → acerca de los datos

export function parseHash(hash = window.location.hash) {
  const clean = hash.replace(/^#/, '');
  const [path = '', query = ''] = clean.split('?');
  const params = new URLSearchParams(query);
  const parts = path.split('/').filter(Boolean);

  if (parts[0] === 'especie' && /^\d+$/.test(parts[1] ?? '')) {
    return {
      name: parts[2] === 'ocurrencias' ? 'occurrences' : 'species',
      key: Number(parts[1]),
      params,
    };
  }
  if (parts[0] === 'guardadas') return { name: 'saved', params };
  if (parts[0] === 'datos') return { name: 'about', params };
  return { name: 'search', params };
}

export function buildHash(path, params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') search.set(key, value);
  });
  const query = search.toString();
  return `#${path}${query ? `?${query}` : ''}`;
}

export function navigate(path, params) {
  const next = buildHash(path, params);
  if (next === window.location.hash) {
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else {
    window.location.hash = next;
  }
}

export function startRouter(onRoute) {
  window.addEventListener('hashchange', () => onRoute(parseHash()));
  onRoute(parseHash());
}
