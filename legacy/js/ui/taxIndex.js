// Índice taxonómico lateral: la ruta Reino → Especie con sus identificadores.

import { esc } from '../utils/dom.js';
import { rankLabel, isItalicRank } from '../utils/format.js';
import { buildHash } from '../router.js';
import { verified, apiLink } from './components.js';
import { apiUrl } from '../services/gbif.js';

const PATH = [
  ['KINGDOM', 'kingdom', 'kingdomKey'],
  ['PHYLUM', 'phylum', 'phylumKey'],
  ['CLASS', 'class', 'classKey'],
  ['ORDER', 'order', 'orderKey'],
  ['FAMILY', 'family', 'familyKey'],
  ['GENUS', 'genus', 'genusKey'],
  ['SPECIES', 'species', 'speciesKey'],
];

/** Convierte un taxón de GBIF en la lista de rangos que conocemos. */
export function lineage(taxon) {
  const items = PATH
    .filter(([, nameField, keyField]) => taxon[nameField] && taxon[keyField])
    .map(([rank, nameField, keyField]) => ({ rank, name: taxon[nameField], key: taxon[keyField] }));

  // Si el taxón no es especie (p. ej. un género) se añade al final
  if (!items.some((i) => i.key === taxon.key)) {
    items.push({ rank: taxon.rank, name: taxon.canonicalName || taxon.scientificName, key: taxon.key });
  }
  return items;
}

export function renderTaxIndex(taxon) {
  const items = lineage(taxon);
  const rows = items
    .map((item) => {
      const current = item.key === taxon.key;
      // Rangos superiores a especie → búsqueda dentro de ese taxón
      const href =
        item.rank === 'SPECIES' || current
          ? buildHash(`/especie/${item.key}`)
          : buildHash('/', { higher: item.key, label: item.name, rank: 'SPECIES', status: 'ACCEPTED' });
      return `
        <li class="tax-index__item">
          <a class="tax-index__link" href="${href}" ${current ? 'aria-current="page"' : ''}>
            <span class="tax-index__rank">${rankLabel(item.rank)}</span>
            <span class="tax-index__key">${esc(item.key)}</span>
            <span class="tax-index__name ${isItalicRank(item.rank) ? 'tax-index__name--italic' : ''}" ${isItalicRank(item.rank) ? 'lang="la"' : ''}>${esc(item.name)}</span>
          </a>
        </li>`;
    })
    .join('');

  return `
    <nav class="tax-index" aria-labelledby="tax-index-title">
      <div class="tax-index__head">
        <h2 class="tax-index__title" id="tax-index-title">Índice taxonómico</h2>
        ${verified('GBIF')}
      </div>
      <ol class="tax-index__list">${rows}</ol>
      <p class="tax-index__note">Ruta cotejada con la respuesta de GBIF. Cada identificador corresponde a su rango.</p>
      ${apiLink(apiUrl(`/species/${taxon.key}`), `species/${taxon.key}`, 'tax-index__api')}
    </nav>`;
}
