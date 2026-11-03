const PATH = [
  ['KINGDOM', 'kingdom', 'kingdomKey'],
  ['PHYLUM', 'phylum', 'phylumKey'],
  ['CLASS', 'class', 'classKey'],
  ['ORDER', 'order', 'orderKey'],
  ['FAMILY', 'family', 'familyKey'],
  ['GENUS', 'genus', 'genusKey'],
  ['SPECIES', 'species', 'speciesKey'],
];

/** Convierte un taxón de GBIF en la lista de rangos que conocemos (Reino → Especie). */
export function lineage(taxon) {
  const items = PATH
    .filter(([, nameField, keyField]) => taxon[nameField] && taxon[keyField])
    .map(([rank, nameField, keyField]) => ({ rank, name: taxon[nameField], key: taxon[keyField] }));

  // Si el taxón no está en la ruta (p. ej. una subespecie) se añade al final
  if (!items.some((i) => i.key === taxon.key)) {
    items.push({ rank: taxon.rank, name: taxon.canonicalName || taxon.scientificName, key: taxon.key });
  }
  return items;
}
