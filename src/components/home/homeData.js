// Contenido fijo de la portada

import { apiUrl, searchSpeciesUrl } from '../../services/gbif.js';

// Claves del backbone cotejadas con /species/match
export const SPECIMENS = [
  { key: 5219426, name: 'Panthera onca' },
  { key: 2431950, name: 'Ambystoma mexicanum' },
  { key: 5133088, name: 'Danaus plexippus' },
  { key: 8386328, name: 'Quercus rugosa' },
];

// Reinos del backbone de GBIF (sus claves son fijas)
export const KINGDOMS = [
  { key: 1, name: 'Animalia', common: 'Animales' },
  { key: 6, name: 'Plantae', common: 'Plantas' },
  { key: 5, name: 'Fungi', common: 'Hongos' },
  { key: 4, name: 'Chromista', common: 'Cromistas' },
  { key: 3, name: 'Bacteria', common: 'Bacterias' },
  { key: 7, name: 'Protozoa', common: 'Protozoos' },
];

// Ejemplos para quien no sabe por dónde empezar: científico, común y género
export const EXAMPLES = [
  { q: 'Panthera onca', latin: true },
  { q: 'ajolote' },
  { q: 'Quercus', latin: true },
  { q: 'mariposa monarca' },
];

export const STATS = [
  {
    id: 'species',
    label: 'especies aceptadas',
    url: searchSpeciesUrl({ rank: 'SPECIES', status: 'ACCEPTED', limit: 0 }),
    api: 'species/search',
  },
  { id: 'occurrences', label: 'ocurrencias publicadas', url: apiUrl('/occurrence/count'), api: 'occurrence/count' },
  { id: 'datasets', label: 'conjuntos de datos', url: apiUrl('/dataset/search', { limit: 0 }), api: 'dataset/search' },
];
