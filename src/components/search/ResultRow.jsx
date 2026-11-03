import { Link } from 'react-router-dom';
import { pickVernacular } from '../../services/gbif.js';
import { rankLabel } from '../../utils/format.js';
import { speciesHref } from '../../utils/routes.js';
import { TaxonName } from '../ui/TaxonName.jsx';
import { Icon } from '../ui/Icon.jsx';

export function ResultRow({ taxon: t }) {
  const v = pickVernacular(t.vernacularNames);
  const meta = [rankLabel(t.rank), t.family && t.rank !== 'FAMILY' ? t.family : null, v?.vernacularName]
    .filter(Boolean)
    .join(' · ');
  return (
    <li className="result-list__item">
      <Link className="result-list__link" to={speciesHref(t.key)}>
        <span className="result-list__text">
          <span className="result-list__name">
            <TaxonName name={t.canonicalName || t.scientificName} rank={t.rank} /> <span className="result-list__author">{t.authorship}</span>
          </span>
          <span className="result-list__meta">{meta}</span>
        </span>
        <span className="result-list__key"><span className="u-visually-hidden">Identificador GBIF </span>{t.key}</span>
        <Icon name="arrow" />
      </Link>
    </li>
  );
}
