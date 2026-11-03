// Explorar: portada sin consulta, o resultados de búsqueda

import { useMemo } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { searchParamsFrom } from '../features/search/searchSlice.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { SearchForm } from '../components/search/SearchForm.jsx';
import { SearchResults } from '../components/search/SearchResults.jsx';
import { ExploreHome } from '../components/home/ExploreHome.jsx';

export default function SearchPage() {
  const [urlParams] = useSearchParams();
  const { search } = useLocation();
  const params = useMemo(() => searchParamsFrom(urlParams), [urlParams]);
  useDocumentTitle(params.q ? `«${params.q}»` : params.label || null);

  // key: el buscador se reinicia con lo que diga la URL (p. ej. al pulsar un ejemplo)
  const form = <SearchForm key={search} initial={params} />;

  if (!params.q && !params.higher) return <ExploreHome form={form} />;
  return (
    <>
      {form}
      <SearchResults params={params} />
    </>
  );
}
