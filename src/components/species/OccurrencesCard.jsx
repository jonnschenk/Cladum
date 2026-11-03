import { Link } from 'react-router-dom';
import { formatNumber } from '../../utils/format.js';
import { isGeneralized } from '../../utils/records.js';
import { occurrencesHref } from '../../utils/routes.js';
import { Verified, NoData } from '../ui/Provenance.jsx';
import { Icon } from '../ui/Icon.jsx';

/** Recuento de ocurrencias con coordenadas y aviso si la muestra trae ubicaciones generalizadas. */
export function OccurrencesCard({ taxon, occ }) {
  if (!occ) {
    return (
      <section className="card card--xl" aria-labelledby="occ-title">
        <div className="card__head"><h2 className="eyebrow" id="occ-title">Ocurrencias documentadas</h2><NoData /></div>
        <p className="card__text card__text--muted">No se pudo consultar el recuento de ocurrencias.</p>
      </section>
    );
  }

  const generalized = occ.results.filter(isGeneralized).length;
  const issues = occ.results.filter((r) => r.issues?.length).length;

  return (
    <section className="card card--xl" aria-labelledby="occ-title">
      <div className="card__head">
        <h2 className="eyebrow" id="occ-title">Ocurrencias documentadas</h2>
        <Verified />
      </div>
      <div className="split-row">
        <div className="split-row__main">
          <p className="count">
            <span className="count__num">{formatNumber(occ.count)}</span>
            <span className="count__label">registros con coordenadas</span>
          </p>
          <span className="split-row__code">taxon_key={taxon.key} · has_coordinate=true</span>
          <p className="split-row__note">
            {occ.count
              ? 'Recuento de la consulta, no población ni total global de ejemplares.'
              : 'GBIF no tiene registros con coordenadas de este taxón. Puede haber registros sin ubicación precisa.'}
          </p>
        </div>
        {occ.count ? (
          <Link className="btn btn--primary" to={occurrencesHref(taxon.key)}>Ver registros <Icon name="arrow" /></Link>
        ) : (
          <Link className="btn btn--secondary" to={occurrencesHref(taxon.key, { coords: '0' })}>
            Ver registros sin coordenadas <Icon name="arrow" />
          </Link>
        )}
      </div>
      {generalized > 0 && (
        <div className="callout callout--warn" role="note">
          <span className="callout__icon"><Icon name="shield" /></span>
          <span className="callout__body">
            <span className="callout__title">Ubicación generalizada para proteger el taxón</span>
            <span className="callout__text">
              {generalized} de {occ.results.length} registros de muestra tienen coordenadas generalizadas{issues ? ' y presentan incidencias' : ''}. No son ubicaciones exactas.
            </span>
          </span>
        </div>
      )}
    </section>
  );
}
