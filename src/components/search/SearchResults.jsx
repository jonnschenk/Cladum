// Resultados de búsqueda: tarjeta destacada, lista, "Cargar más" y trazabilidad

import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSearch, fetchMoreResults, selectSearch, apiFilter } from '../../features/search/searchSlice.js';
import { apiUrl, searchSpeciesUrl } from '../../services/gbif.js';
import { PAGE_SIZE } from '../../config.js';
import { useThunk } from '../../hooks/useThunk.js';
import { useSlowNotice } from '../../hooks/useSlowNotice.js';
import { useAnnounce } from '../../hooks/useAnnounce.js';
import { formatNumber } from '../../utils/format.js';
import { searchHref, occurrencesHref } from '../../utils/routes.js';
import { TaxIndex } from '../taxonomy/TaxIndex.jsx';
import { LoadingView } from '../ui/Skeletons.jsx';
import { ErrorState } from '../ui/ErrorState.jsx';
import { LoadMore } from '../ui/LoadMore.jsx';
import { ApiLink } from '../ui/Links.jsx';
import { Icon } from '../ui/Icon.jsx';
import { FeaturedCard } from './FeaturedCard.jsx';
import { ResultRow } from './ResultRow.jsx';
import { NoResults } from './NoResults.jsx';

/** Aviso del modo género, con salida a la búsqueda por texto. */
function GenusNote({ genus, params }) {
  const where = [genus.kingdom && `Reino ${genus.kingdom}`, genus.family && `Familia ${genus.family}`].filter(Boolean).join(' · ');
  const textHref = searchHref({ q: params.q, rank: params.rank, status: params.status, modo: 'texto' });
  return (
    <div className="callout" role="note">
      <span className="callout__body">
        <span className="callout__text">
          <strong>Mostrando especies del género <i lang="la">{genus.name}</i></strong>{where ? ` · ${where}` : ''}
        </span>
        <span className="callout__text">
          <Link to={textHref}>Buscar como texto</Link> para ver cualquier nombre que contenga «{params.q}».
        </span>
      </span>
    </div>
  );
}

function Results({ search }) {
  const dispatch = useDispatch();
  const announce = useAnnounce();
  const { params, query, results, count, endOfRecords, more } = search;
  const [featured, ...others] = results;

  useEffect(() => {
    announce(`${formatNumber(count)} ${count === 1 ? 'resultado' : 'resultados'}${params.q ? ` para ${params.q}` : ''}`);
  }, [announce, count, params.q]);

  const searchUrl = searchSpeciesUrl({
    q: query.apiQ,
    rank: apiFilter(params.rank),
    status: apiFilter(params.status),
    highertaxonKey: query.higherTaxonKey,
    limit: PAGE_SIZE,
  });

  return (
    <div className="layout u-fade-in">
      <div className="layout__aside"><TaxIndex taxon={featured} /></div>
      <section className="layout__content" aria-labelledby="results-title">
        <header className="page-head">
          <div className="page-head__text">
            <span className="eyebrow">{params.label ? `Explorar · Dentro de ${params.label}` : 'Explorar · Búsqueda de taxones'}</span>
            <h1 className="page-head__title" id="results-title" tabIndex={-1}>
              {params.label ? `Especies de ${params.label}` : 'Resultados de búsqueda'}
            </h1>
            <p className="page-head__lead">Consulta en vivo al backbone taxonómico de GBIF.</p>
          </div>
          <span className="pill pill--raised">
            <span className="u-mono">{formatNumber(count)}</span>&nbsp;{count === 1 ? 'resultado' : 'resultados'}
          </span>
        </header>

        {query.genus && <GenusNote genus={query.genus} params={params} />}

        <FeaturedCard taxon={featured} q={params.q} />

        {others.length > 0 && (
          <section className="results-group" aria-labelledby="others-title">
            <h2 className="eyebrow" id="others-title">Otros resultados</h2>
            <ul className="result-list">{others.map((t) => <ResultRow key={t.key} taxon={t} />)}</ul>
            <LoadMore
              status={more}
              done={endOfRecords}
              endText={`Mostrando ${count === 1 ? 'el único resultado' : `los ${formatNumber(results.length)} resultados`}`}
              onMore={() => dispatch(fetchMoreResults())}
            />
          </section>
        )}

        <div className="grid-auto" style={{ '--min': '340px' }}>
          <section className="card" aria-labelledby="trace-title">
            <h2 className="eyebrow" id="trace-title">Trazabilidad de la consulta</h2>
            <p className="card__text">Los resultados vienen directo de GBIF. No se añaden taxones ni datos no comprobados.</p>
            <div className="card__links">
              <ApiLink href={searchUrl}>species/search</ApiLink>
              <ApiLink href={apiUrl(`/species/${featured.key}`)}>species/{featured.key}</ApiLink>
            </div>
          </section>
          <section className="card card--soft" aria-labelledby="next-title">
            <h2 className="eyebrow" id="next-title">Continuar la exploración</h2>
            <p className="card__lead">De la especie al registro.</p>
            <p className="card__text card__text--muted">Consulta la identidad, la fotografía documentada y las ocurrencias con sus incidencias.</p>
            <Link className="btn btn--secondary card__action" to={occurrencesHref(featured.key)}>Ver ocurrencias <Icon name="arrow" /></Link>
          </section>
        </div>
      </section>
    </div>
  );
}

export function SearchResults({ params }) {
  const search = useSelector(selectSearch);
  const retry = useThunk(fetchSearch, params);

  // Hasta que el store responda por estos parámetros, lo que hay es de la búsqueda anterior
  const current = JSON.stringify(search.params) === JSON.stringify(params);
  const loading = !current || search.status === 'loading' || search.status === 'idle';
  const slow = useSlowNotice(loading);

  useEffect(() => {
    if (!loading) document.querySelector('main h1[tabindex="-1"]')?.focus({ preventScroll: true });
  }, [loading]);

  if (loading) return <LoadingView view="search" slow={slow} />;
  if (search.status === 'failed') return <ErrorState error={search.error} onRetry={retry} />;
  if (!search.results.length) return <NoResults params={params} suggestion={search.suggestion} />;
  return <Results search={search} />;
}
