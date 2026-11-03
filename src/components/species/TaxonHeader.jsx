// Encabezado común de la ficha y de las ocurrencias

import { rankLabel, statusLabel, isItalicRank } from '../../utils/format.js';
import { Icon } from '../ui/Icon.jsx';

export const taxonDisplayName = (taxon) => taxon.canonicalName || taxon.scientificName;

export function TaxonHeader({ taxon, eyebrow, sub, small = false, id, children }) {
  const italic = isItalicRank(taxon.rank);
  const nameClass = [
    'species-hero__name',
    small && 'species-hero__name--sm',
    italic ? 'u-binomial' : 'species-hero__name--plain',
  ].filter(Boolean).join(' ');

  return (
    <header className="species-hero">
      <div className="species-hero__text">
        <span className="eyebrow">{eyebrow}</span>
        <h1 className={nameClass} id={id} tabIndex={-1} lang={italic ? 'la' : undefined}>{taxonDisplayName(taxon)}</h1>
        <span className="species-hero__sub">{sub}</span>
      </div>
      <div className="page-head__badges">
        <span className="pill pill--ink">
          {taxon.taxonomicStatus === 'ACCEPTED' && <Icon name="check" size={14} />}
          {statusLabel(taxon.taxonomicStatus)} · {rankLabel(taxon.rank)}
        </span>
        {children}
      </div>
    </header>
  );
}
