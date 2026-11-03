import { forwardRef } from 'react';
import { formatDate, formatMeters, countryName, basisLabel } from '../../utils/format.js';
import { isGeneralized } from '../../utils/records.js';
import { safeUrl } from '../../utils/net.js';
import { Verified, External, NoData } from '../ui/Provenance.jsx';
import { ApiLink, ExternalLink } from '../ui/Links.jsx';
import { TaxonName } from '../ui/TaxonName.jsx';
import { Icon } from '../ui/Icon.jsx';

const Value = ({ children }) => children || <NoData />;

function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'fuente externa';
  }
}

export const RecordDetail = forwardRef(function RecordDetail({ record: r, taxon, animate }, ref) {
  const original = safeUrl(r.references);
  return (
    <section className={`card card--xl record-detail${animate ? ' u-swap' : ''}`} aria-labelledby="record-title" ref={ref}>
      <div className="card__head card__head--top">
        <div className="record-detail__heading">
          <span className="eyebrow">Detalle del registro · {basisLabel(r.basisOfRecord)}</span>
          <h2 className="record-detail__id" id="record-title">GBIF:{r.key}</h2>
        </div>
        <Verified />
      </div>
      <div className="record-detail__cols">
        <dl className="def-list">
          <div className="def-list__row"><dt className="def-list__term">Taxón</dt><dd className="def-list__desc"><TaxonName name={r.species || taxon.canonicalName} rank="SPECIES" /></dd></div>
          <div className="def-list__row"><dt className="def-list__term">Fecha</dt><dd className="def-list__desc"><Value>{formatDate(r.eventDate)}</Value></dd></div>
          <div className="def-list__row"><dt className="def-list__term">Observador/a</dt><dd className="def-list__desc"><Value>{r.recordedBy}</Value></dd></div>
        </dl>
        <dl className="def-list">
          <div className="def-list__row"><dt className="def-list__term">País</dt><dd className="def-list__desc"><Value>{countryName(r.countryCode)}</Value></dd></div>
          <div className="def-list__row"><dt className="def-list__term">Región / localidad</dt><dd className="def-list__desc"><Value>{[r.stateProvince, r.locality].filter(Boolean).join(' / ')}</Value></dd></div>
          <div className="def-list__row"><dt className="def-list__term">Incertidumbre</dt><dd className="def-list__desc def-list__desc--mono"><Value>{formatMeters(r.coordinateUncertaintyInMeters)}</Value></dd></div>
        </dl>
      </div>
      {isGeneralized(r) && (
        <div className="callout callout--warn" role="note">
          <span className="callout__icon"><Icon name="shield" /></span>
          <span className="callout__body">
            <span className="callout__title">Ubicación generalizada para proteger el taxón</span>
            <span className="callout__text">No interpretar como ubicación exacta ni reconstruir la localización oculta. La incertidumbre y las incidencias se muestran tal como aparecen en GBIF.</span>
          </span>
        </div>
      )}
      <div className="grid-auto record-detail__grid" style={{ '--min': '300px' }}>
        <div className="record-detail__group">
          <h3 className="record-detail__sub">Incidencias reportadas</h3>
          {r.issues?.length ? (
            <>
              <div className="record-detail__issues">{r.issues.map((i) => <span className="issue" key={i}>{i}</span>)}</div>
              <span className="record-detail__note">Cotejar con GBIF no elimina las advertencias de calidad.</span>
            </>
          ) : <span className="record-detail__note">Sin incidencias reportadas.</span>}
        </div>
        <div className="source-links">
          <h3 className="record-detail__sub">Fuente y registro original</h3>
          <ApiLink href={`https://www.gbif.org/occurrence/${r.key}`}>gbif.org/occurrence/{r.key}</ApiLink>
          {original && (
            <span className="record-detail__source">
              <External label={hostOf(original)} />
              <ExternalLink href={original}>Abrir registro original</ExternalLink>
            </span>
          )}
          {r.datasetName && <span className="record-detail__note">{r.datasetName}</span>}
        </div>
      </div>
    </section>
  );
});
