import { apiUrl } from '../../services/gbif.js';
import { rankLabel, statusLabel } from '../../utils/format.js';
import { Verified, NoData } from '../ui/Provenance.jsx';
import { ApiLink } from '../ui/Links.jsx';

export function IdentityCard({ taxon, vernacular }) {
  return (
    <section className="card" aria-labelledby="identity-title">
      <div className="card__head">
        <h2 className="card__title" id="identity-title">Identidad y nomenclatura</h2>
        <Verified />
      </div>
      <dl className="def-list">
        <div className="def-list__row">
          <dt className="def-list__term">Nombre común</dt>
          <dd className="def-list__desc">
            {vernacular ? (
              <>
                {vernacular.vernacularName} <span className="def-list__aside">· español</span>
                <span className="def-list__note">{vernacular.source || 'Fuente no indicada'}, vía GBIF. No se asume preferencia global.</span>
              </>
            ) : <NoData label="Sin nombre común en español" />}
          </dd>
        </div>
        <div className="def-list__row">
          <dt className="def-list__term">Autoría</dt>
          <dd className="def-list__desc">{taxon.authorship || <NoData />}</dd>
        </div>
        <div className="def-list__row">
          <dt className="def-list__term">Rango</dt>
          <dd className="def-list__desc">{rankLabel(taxon.rank)} <span className="def-list__code">{taxon.rank}</span></dd>
        </div>
        <div className="def-list__row">
          <dt className="def-list__term">Estado taxonómico</dt>
          <dd className="def-list__desc">{statusLabel(taxon.taxonomicStatus)} <span className="def-list__code">{taxon.taxonomicStatus}</span></dd>
        </div>
        <div className="def-list__row">
          <dt className="def-list__term">Identificador GBIF</dt>
          <dd className="def-list__desc def-list__desc--mono">{taxon.key}</dd>
        </div>
      </dl>
      <ApiLink href={apiUrl(`/species/${taxon.key}`)}>Consultar respuesta de especie</ApiLink>
    </section>
  );
}
