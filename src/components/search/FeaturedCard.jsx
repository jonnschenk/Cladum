import { Link } from 'react-router-dom';
import { pickVernacular } from '../../services/gbif.js';
import { rankLabel, statusLabel } from '../../utils/format.js';
import { speciesHref } from '../../utils/routes.js';
import { Verified, NoData } from '../ui/Provenance.jsx';
import { SaveButton } from '../ui/SaveButton.jsx';
import { TaxonName } from '../ui/TaxonName.jsx';
import { Icon } from '../ui/Icon.jsx';

/** Primer resultado: ficha resumida con acceso directo y botón de guardar. */
export function FeaturedCard({ taxon: t, q }) {
  const v = pickVernacular(t.vernacularNames);
  const name = t.canonicalName || t.scientificName;
  const exact = q && name.toLowerCase() === q.toLowerCase();
  const favorite = {
    key: t.key,
    name,
    authorship: t.authorship || '',
    vernacular: v?.vernacularName ?? null,
    family: t.family ?? null,
    rank: t.rank,
  };

  return (
    <article className="card card--xl result-featured" aria-labelledby="featured-name">
      <div className="card__head">
        <Verified />
        <span className="pill pill--accent">{exact ? 'Coincidencia exacta' : 'Primer resultado'}</span>
      </div>
      <div className="result-featured__top">
        <div className="result-featured__heading">
          <h2 id="featured-name" className="result-featured__name u-binomial"><TaxonName name={name} rank={t.rank} /></h2>
          <span className="result-featured__author">{t.authorship || ' '}</span>
        </div>
        <div className="result-featured__actions">
          <SaveButton taxon={favorite} />
          <Link className="btn btn--primary" to={speciesHref(t.key)}>Abrir ficha <Icon name="arrow" /></Link>
        </div>
      </div>
      <dl className="result-featured__tiles">
        <div className="tile"><dt className="tile__label">Rango</dt><dd className="tile__value">{rankLabel(t.rank)}</dd></div>
        <div className="tile">
          <dt className="tile__label">Estado taxonómico</dt>
          <dd className="tile__value">
            {t.taxonomicStatus === 'ACCEPTED' && <span className="tile__check"><Icon name="check" /></span>}
            {statusLabel(t.taxonomicStatus)}
          </dd>
        </div>
        <div className="tile"><dt className="tile__label">Identificador GBIF</dt><dd className="tile__value u-mono">{t.key}</dd></div>
      </dl>
      <div className="result-featured__names">
        <div className="result-featured__group">
          {v ? (
            <>
              <span className="result-featured__common">{v.vernacularName} <span className="result-featured__lang">· español</span></span>
              <span className="result-featured__note">
                {v.source ? `${v.source}, vía GBIF.` : 'Nombre común registrado en GBIF.'} No implica una preferencia global del nombre.
              </span>
            </>
          ) : <NoData label="Sin nombre común en español" />}
        </div>
        <div className="result-featured__group">
          <span className="result-featured__family">
            {t.family || '—'}
            {t.genus && <> <span className="result-featured__sep" aria-hidden="true">/</span> <i lang="la">{t.genus}</i></>}
          </span>
          <span className="result-featured__note">La clasificación completa está en el índice taxonómico.</span>
        </div>
      </div>
    </article>
  );
}
