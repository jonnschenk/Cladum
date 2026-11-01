// Configuración global de Cladum

export const GBIF_API = 'https://api.gbif.org/v1';

// Backbone taxonómico de GBIF. Si GBIF cambia de backbone,
// solo hay que actualizar este identificador.
export const BACKBONE_KEY = 'd7dddbf4-2cf0-4f39-9b2a-bb099caae36c';

export const PAGE_SIZE = 20;
export const OCCURRENCE_PAGE_SIZE = 20;
export const SUGGEST_LIMIT = 8;
export const SUGGEST_DELAY = 250; // ms

// Idioma preferido para nombres comunes (ISO 639-2)
export const VERNACULAR_LANG = 'spa';

// Incertidumbre (m) a partir de la cual tratamos una ubicación como generalizada
export const GENERALIZED_UNCERTAINTY = 10000;

export const STORAGE_KEYS = {
  favorites: 'cladum:favorites:v1',
  theme: 'cladum:theme',
  lastSpecies: 'cladum:last-species',
};
