// Ocurrencias documentadas de un taxón, con filtros por país y coordenadas

import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector, useStore } from 'react-redux';
import {
  loadOccurrences, refreshOccurrences, fetchMoreRecords, selectRecord, setView, selectOccurrences, occurrenceQuery,
} from '../features/occurrences/occurrencesSlice.js';
import { occurrencesUrl } from '../services/gbif.js';
import { useSlowNotice } from '../hooks/useSlowNotice.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { useAnnounce } from '../hooks/useAnnounce.js';
import { formatNumber, countryName } from '../utils/format.js';
import { speciesHref, occurrencesHref } from '../utils/routes.js';
import { TaxIndex } from '../components/taxonomy/TaxIndex.jsx';
import { LoadingView } from '../components/ui/Skeletons.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { StateBlock } from '../components/ui/StateBlock.jsx';
import { LoadMore } from '../components/ui/LoadMore.jsx';
import { Verified } from '../components/ui/Provenance.jsx';
import { ApiLink } from '../components/ui/Links.jsx';
import { TaxonName } from '../components/ui/TaxonName.jsx';
import { Icon } from '../components/ui/Icon.jsx';
import { TaxonHeader, taxonDisplayName } from '../components/species/TaxonHeader.jsx';
import { OccurrencesToolbar } from '../components/occurrences/OccurrencesToolbar.jsx';
import { RecordRow } from '../components/occurrences/RecordRow.jsx';
import { RecordDetail } from '../components/occurrences/RecordDetail.jsx';

const countLabel = ({ country, coords }) =>
  `${coords ? 'registros con coordenadas' : 'registros'}${country ? ` en ${countryName(country)}` : ''}`;

function Breadcrumb({ taxonKey, taxon }) {
  return (
    <nav className="breadcrumb" aria-label="Ruta">
      <ol className="breadcrumb__list">
        <li className="breadcrumb__item">
          <Link className="breadcrumb__back" to={speciesHref(taxonKey)}><Icon name="back" />Volver a la ficha</Link>
        </li>
        {taxon && (
          <>
            <li className="breadcrumb__item"><TaxonName name={taxonDisplayName(taxon)} rank={taxon.rank} /></li>
            <li className="breadcrumb__item breadcrumb__sep" aria-hidden="true">/</li>
            <li className="breadcrumb__item" aria-current="page">Ocurrencias</li>
          </>
        )}
      </ol>
    </nav>
  );
}

/** Sin registros: explica qué filtro los deja fuera y ofrece quitarlo. */
function NoRecords({ filters, onFilter }) {
  const actions = (
    <>
      {filters.country && <button className="btn btn--secondary" type="button" onClick={() => onFilter({ country: '' })}>Quitar país</button>}
      {filters.coords && <button className="btn btn--secondary" type="button" onClick={() => onFilter({ coords: false })}>Incluir registros sin coordenadas</button>}
    </>
  );
  const filtered = filters.country || filters.coords;
  return (
    <StateBlock
      type="no-results"
      title={`Ningún registro${filters.country ? ` en ${countryName(filters.country)}` : ''}${filters.coords ? ' con coordenadas' : ''}`}
      text={filtered ? 'GBIF no tiene registros de este taxón que cumplan estos filtros.' : 'GBIF no tiene registros de este taxón.'}
      actions={filtered ? actions : null}
    />
  );
}

function OccurrencesContent({ taxonKey, onFilter, onRetry }) {
  const dispatch = useDispatch();
  const announce = useAnnounce();
  const occ = useSelector(selectOccurrences);
  const { taxon, records, count, offset, filters, selected, view, updating, updateError, more } = occ;
  const detail = useRef(null);
  const [animateDetail, setAnimateDetail] = useState(false);
  const slow = useSlowNotice(updating);

  // Al terminar una actualización se anuncia el nuevo recuento
  const wasUpdating = useRef(false);
  useEffect(() => {
    if (wasUpdating.current && !updating && !updateError) announce(`${formatNumber(count)} ${countLabel(filters)}`);
    wasUpdating.current = updating;
  }, [updating, updateError, count, filters, announce]);

  // Tras "Cargar más" se anuncia cuántos llegaron
  const loadedBefore = useRef(records.length);
  useEffect(() => {
    const added = records.length - loadedBefore.current;
    if (added > 0 && !updating) announce(`${added} registros más cargados. ${records.length} en total.`);
    loadedBefore.current = records.length;
  }, [records.length, updating, announce]);

  const choose = (index) => {
    dispatch(selectRecord(index));
    setAnimateDetail(true);
    detail.current?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' });
  };

  const name = taxonDisplayName(taxon);
  const dimmed = { className: updating ? 'is-updating' : undefined, inert: updating || undefined };

  let list;
  if (updateError) {
    list = <ErrorState error={updateError} level={2} focus onRetry={onRetry} />;
  } else if (view === 'map') {
    list = (
      <StateBlock
        type="empty"
        title="Mapa en preparación"
        text="Se prioriza la lista. Cuando se active el mapa, los registros generalizados se dibujarán como áreas, nunca como puntos exactos."
        actions={<button className="btn btn--secondary" type="button" onClick={() => dispatch(setView('list'))}>Volver a la lista</button>}
      />
    );
  } else if (!records.length) {
    list = <NoRecords filters={filters} onFilter={onFilter} />;
  } else {
    list = (
      <div className="card card--flush records">
        <div className="records__head" aria-hidden="true">
          <span>ID GBIF</span><span>País / región</span><span>Observación</span><span>Observador/a</span><span>Incertidumbre</span><span>Calidad</span>
        </div>
        <ul className="records__list">
          {records.map((r, i) => <RecordRow key={r.key} record={r} selected={i === selected} onSelect={() => choose(i)} />)}
        </ul>
        <LoadMore
          status={more}
          done={offset >= count}
          endText={`Mostrando ${records.length === 1 ? 'el único registro' : `los ${formatNumber(records.length)} registros`}`}
          onMore={() => dispatch(fetchMoreRecords())}
        />
      </div>
    );
  }

  const showDetail = !updateError && view === 'list' && records[selected];

  return (
    <div className="stack stack--inherit">
      <Breadcrumb taxonKey={taxonKey} taxon={taxon} />
      <div className="layout u-fade-in">
        <div className="layout__aside"><TaxIndex taxon={taxon} /></div>
        <section className="layout__content" aria-labelledby="occ-title">
          <TaxonHeader taxon={taxon} id="occ-title" small eyebrow="Ocurrencias · Registros documentados" sub={taxon.authorship || ''}>
            <Verified label="Verificado · GBIF" className="pill--chip" />
          </TaxonHeader>

          <OccurrencesToolbar
            countries={occ.countries}
            filters={filters}
            view={view}
            onFilter={onFilter}
            onView={(v) => dispatch(setView(v))}
          />

          <div className="split-row" {...dimmed}>
            <div className="split-row__main">
              <p className="count count--sm">
                {updateError ? (
                  <span className="count__label">No se pudo actualizar el recuento</span>
                ) : (
                  <>
                    <span className="count__num">{formatNumber(count)}</span>
                    <span className="count__label">{updating ? (slow ? 'GBIF está tardando más de lo normal…' : 'Actualizando…') : countLabel(filters)}</span>
                  </>
                )}
              </p>
              <span className="split-row__note">No es toda la distribución ni un recuento de población.</span>
            </div>
            <span className="pill pill--raised"><span className="u-mono">{records.length}</span>&nbsp;cargados</span>
          </div>

          <div aria-busy={updating} {...dimmed}>{list}</div>
          <div {...dimmed}>
            {showDetail && <RecordDetail key={records[selected].key} record={records[selected]} taxon={taxon} animate={animateDetail} ref={detail} />}
          </div>

          <section className="source-links" aria-labelledby="query-title">
            <h2 className="eyebrow" id="query-title">Consulta · Verificado · GBIF</h2>
            <span><ApiLink href={occurrencesUrl(occurrenceQuery(taxonKey, filters))}>occurrence/search</ApiLink></span>
          </section>
        </section>
      </div>
    </div>
  );
}

export default function OccurrencesPage() {
  const { key } = useParams();
  const valid = /^\d+$/.test(key);
  const taxonKey = Number(key);
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const store = useStore();
  const occ = useSelector(selectOccurrences);
  const [attempt, setAttempt] = useState(0);

  const country = params.get('country') ?? '';
  const coords = params.get('coords') !== '0';

  useEffect(() => {
    if (!valid) return undefined;
    const state = store.getState().occurrences;
    const filters = { country, coords };
    const loaded = state.key === taxonKey && state.status === 'succeeded';
    if (!loaded) {
      const promise = dispatch(loadOccurrences({ key: taxonKey, filters }));
      return () => promise.abort();
    }
    // Mismo taxón: si los filtros ya coinciden y no hubo error, no hay nada que pedir
    const same = state.filters.country === country && state.filters.coords === coords;
    if (!same || state.updateError) dispatch(refreshOccurrences({ key: taxonKey, filters }));
    return undefined;
  }, [dispatch, store, valid, taxonKey, country, coords, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  const onFilter = useCallback((next) => {
    const f = { country, coords, ...next };
    navigate(occurrencesHref(taxonKey, { country: f.country, coords: f.coords ? '' : '0' }));
  }, [navigate, taxonKey, country, coords]);

  const current = occ.key === taxonKey;
  const loading = !current || occ.status === 'loading' || occ.status === 'idle';
  const slow = useSlowNotice(loading);
  useDocumentTitle(current && occ.taxon ? `Ocurrencias de ${taxonDisplayName(occ.taxon)}` : null);

  useEffect(() => {
    if (!loading) document.querySelector('main h1[tabindex="-1"]')?.focus({ preventScroll: true });
  }, [loading]);

  if (!valid) {
    return (
      <StateBlock
        type="no-results"
        level={1}
        title="No encontramos ese taxón"
        text={`«${key}» no es un identificador de GBIF.`}
        actions={<Link className="btn btn--secondary" to="/">Ir a Explorar</Link>}
      />
    );
  }

  if (loading) {
    return (
      <>
        <Breadcrumb taxonKey={taxonKey} />
        <LoadingView view="occurrences" slow={slow} countLabel={coords ? 'registros con coordenadas' : 'registros'} />
      </>
    );
  }

  if (occ.status === 'failed') {
    return (
      <ErrorState
        error={occ.error}
        onRetry={retry}
        copy={{ 'not-found': { title: 'No encontramos ese taxón', text: `GBIF no tiene un taxón con el identificador ${key}.` } }}
      />
    );
  }

  return <OccurrencesContent taxonKey={taxonKey} onFilter={onFilter} onRetry={retry} />;
}
