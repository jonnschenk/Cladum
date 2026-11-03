// Portada de Explorar (sin consulta): buscador, cifras en vivo, recientes, ejemplares y reinos

import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchStat, fetchKingdomCount, selectStat, selectKingdomCount } from '../../features/home/homeSlice.js';
import { selectFavorites } from '../../features/favorites/favoritesSlice.js';
import { selectLastSpecies } from '../../features/species/speciesSlice.js';
import { formatCompact, formatNumber } from '../../utils/format.js';
import { searchHref, speciesHref, higherTaxonHref } from '../../utils/routes.js';
import { Verified, NoData } from '../ui/Provenance.jsx';
import { ApiLink } from '../ui/Links.jsx';
import { TaxonName } from '../ui/TaxonName.jsx';
import { Icon } from '../ui/Icon.jsx';
import { SpecimenCard } from './SpecimenCard.jsx';
import { SPECIMENS, KINGDOMS, EXAMPLES, STATS } from './homeData.js';

/** "1,8 millones de especies" / "4626 especies" */
const speciesCount = (n) => (n >= 1e6 ? `${formatCompact(n)} de especies` : `${formatNumber(n)} especies`);

// Cladograma decorativo del encabezado
const Cladogram = () => (
  <svg className="explore-home__cladogram" viewBox="0 0 240 220" fill="none" aria-hidden="true" focusable="false">
    <path d="M10 110H50M50 50V150M50 50H110M110 30V70M110 30H230M110 70H230M50 150H90M90 110V190M90 110H230M90 150H230M90 190H230" />
    {[30, 70, 110, 150, 190].map((y) => <circle key={y} className="explore-home__node" cx="230" cy={y} r="4" />)}
  </svg>
);

function Stat({ stat }) {
  const dispatch = useDispatch();
  const entry = useSelector(selectStat(stat.id));
  useEffect(() => {
    dispatch(fetchStat(stat.id));
  }, [dispatch, stat.id]);

  let value = <span className="skeleton skeleton--stat" />;
  if (entry?.status === 'succeeded') value = <data value={entry.value}>{formatCompact(entry.value)}</data>;
  if (entry?.status === 'failed') value = <NoData />;

  return (
    <div className="explore-home__stat">
      <dt className="explore-home__stat-label">{stat.label}</dt>
      <dd className="explore-home__stat-value">{value}</dd>
    </div>
  );
}

function Stats() {
  const busy = useSelector((state) => STATS.some((s) => {
    const status = state.home.stats[s.id]?.status;
    return !status || status === 'loading';
  }));
  return <dl className="explore-home__stats" aria-busy={busy}>{STATS.map((s) => <Stat key={s.id} stat={s} />)}</dl>;
}

/** Última ficha visitada y algunas guardadas, para retomar la exploración. */
function Recent() {
  const last = useSelector(selectLastSpecies);
  const favorites = useSelector(selectFavorites);
  const items = [];
  if (last?.key) items.push({ ...last, tag: 'Última ficha' });
  favorites
    .filter((f) => f.key !== last?.key)
    .slice(0, last?.key ? 4 : 5)
    .forEach((f) => items.push({ ...f, tag: 'Guardada' }));
  if (!items.length) return null;

  return (
    <section className="explore-home__section" aria-labelledby="recent-title">
      <div className="explore-home__section-head">
        <h2 className="explore-home__section-title" id="recent-title">Continúa donde te quedaste</h2>
        {favorites.length > 0 && (
          <Link className="btn btn--ghost btn--sm" to="/guardadas">Ver guardadas <Icon name="arrow" size={14} /></Link>
        )}
      </div>
      <ul className="explore-home__recent">
        {items.map((item) => (
          <li className="explore-home__recent-item" key={`${item.tag}-${item.key}`}>
            <Link className="pill pill--raised explore-home__recent-link" to={speciesHref(item.key)}>
              <span className="explore-home__recent-tag">{item.tag}</span>
              <TaxonName name={item.name} rank={item.rank || 'SPECIES'} />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function KingdomCard({ kingdom: { key, name, common } }) {
  const dispatch = useDispatch();
  const entry = useSelector(selectKingdomCount(key));
  useEffect(() => {
    dispatch(fetchKingdomCount(key));
  }, [dispatch, key]);

  let count = <span className="skeleton skeleton--line" />;
  if (entry?.status === 'succeeded') count = `${speciesCount(entry.value)} aceptadas`;
  if (entry?.status === 'failed') count = <NoData />;

  return (
    <li className="explore-home__kingdom">
      <Link className="kingdom-card" to={higherTaxonHref(key, name)}>
        <span className="kingdom-card__latin">{name}</span>
        <span className="kingdom-card__common">{common}</span>
        <span className="kingdom-card__count">{count}</span>
        <span className="kingdom-card__foot">
          <span className="kingdom-card__key">GBIF:{key}</span>
          <Icon name="arrow" />
        </span>
      </Link>
    </li>
  );
}

/** Recibe el formulario de búsqueda ya armado. */
export function ExploreHome({ form }) {
  return (
    <div className="explore-home u-view-enter">
      <section className="explore-home__hero" aria-labelledby="home-title">
        <Cladogram />
        <div className="explore-home__intro">
          <span className="eyebrow">Explorar · Backbone taxonómico de GBIF</span>
          <h1 className="explore-home__title" id="home-title" tabIndex={-1}>La biodiversidad, con datos que puedes verificar.</h1>
          <p className="explore-home__lead">Busca una especie por su nombre científico o común, recorre su clasificación y llega hasta cada registro documentado.</p>
        </div>
        {form}
        <div className="chip-row explore-home__examples">
          <span className="chip-row__label">Prueba con</span>
          {EXAMPLES.map(({ q, latin }) => (
            <Link className="chip" key={q} to={searchHref({ q })}>{latin ? <i lang="la">{q}</i> : q}</Link>
          ))}
        </div>
        <Stats />
        <div className="explore-home__trace">
          <Verified label="Cifras en vivo · GBIF" />
          {STATS.map((s) => <ApiLink key={s.id} href={s.url}>{s.api}</ApiLink>)}
        </div>
      </section>

      <Recent />

      <section className="explore-home__section" aria-labelledby="specimens-title">
        <div className="explore-home__section-head">
          <div className="explore-home__section-text">
            <h2 className="explore-home__section-title" id="specimens-title">Ejemplares destacados</h2>
            <p className="explore-home__section-lead">Cuatro especies de México para empezar. Fotografías y nombres tal como los publica GBIF.</p>
          </div>
        </div>
        <ul className="explore-home__specimens">{SPECIMENS.map((s) => <SpecimenCard key={s.key} specimen={s} />)}</ul>
      </section>

      <section className="explore-home__section" aria-labelledby="kingdoms-title">
        <div className="explore-home__section-head">
          <div className="explore-home__section-text">
            <h2 className="explore-home__section-title" id="kingdoms-title">Recorre el árbol de la vida</h2>
            <p className="explore-home__section-lead">Empieza por un reino y baja por la clasificación hasta la especie.</p>
          </div>
        </div>
        <ul className="explore-home__kingdoms">{KINGDOMS.map((k) => <KingdomCard key={k.key} kingdom={k} />)}</ul>
      </section>
    </div>
  );
}
