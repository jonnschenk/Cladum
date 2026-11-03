// Índice taxonómico lateral: la ruta Reino → Especie con sus identificadores

import { Link } from 'react-router-dom';
import { apiUrl } from '../../services/gbif.js';
import { rankLabel, isItalicRank } from '../../utils/format.js';
import { speciesHref, higherTaxonHref } from '../../utils/routes.js';
import { Verified } from '../ui/Provenance.jsx';
import { ApiLink } from '../ui/Links.jsx';
import { lineage } from './lineage.js';

export function TaxIndex({ taxon }) {
  return (
    <nav className="tax-index" aria-labelledby="tax-index-title">
      <div className="tax-index__head">
        <h2 className="tax-index__title" id="tax-index-title">Índice taxonómico</h2>
        <Verified label="GBIF" />
      </div>
      <ol className="tax-index__list">
        {lineage(taxon).map((item) => {
          const current = item.key === taxon.key;
          const italic = isItalicRank(item.rank);
          // Rangos superiores a especie → búsqueda dentro de ese taxón
          const to = item.rank === 'SPECIES' || current ? speciesHref(item.key) : higherTaxonHref(item.key, item.name);
          return (
            <li className="tax-index__item" key={item.key}>
              <Link className="tax-index__link" to={to} aria-current={current ? 'page' : undefined}>
                <span className="tax-index__rank">{rankLabel(item.rank)}</span>
                <span className="tax-index__key">{item.key}</span>
                <span className={`tax-index__name${italic ? ' tax-index__name--italic' : ''}`} lang={italic ? 'la' : undefined}>
                  {item.name}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
      <p className="tax-index__note">Ruta cotejada con la respuesta de GBIF. Cada identificador corresponde a su rango.</p>
      <ApiLink href={apiUrl(`/species/${taxon.key}`)} className="tax-index__api">species/{taxon.key}</ApiLink>
    </nav>
  );
}
