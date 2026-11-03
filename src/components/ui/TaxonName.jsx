import { isItalicRank } from '../../utils/format.js';

/** Nombre científico con cursiva solo en género o rangos inferiores. */
export function TaxonName({ name, rank, className }) {
  if (!name) return null;
  return isItalicRank(rank)
    ? <i className={className} lang="la">{name}</i>
    : <span className={className}>{name}</span>;
}
