// Configuración global de Cladum

export const GBIF_API = 'https://api.gbif.org/v1';

// Respaldo de fotografías cuando GBIF no tiene o no cargan
export const INAT_API = 'https://api.inaturalist.org/v1';

// Backbone taxonómico de GBIF. Si GBIF cambia de backbone,
// solo hay que actualizar este identificador.
export const BACKBONE_KEY = 'd7dddbf4-2cf0-4f39-9b2a-bb099caae36c';

export const PAGE_SIZE = 20;
export const OCCURRENCE_PAGE_SIZE = 20;
export const SUGGEST_LIMIT = 8;

// Fotografías en la galería de la ficha (una por registro)
export const GALLERY_SIZE = 8;
export const SUGGEST_DELAY = 250; // ms

// Tiempos de red (ms): a los 3 s se avisa de la demora; a los 10 s se cancela
export const SLOW_THRESHOLD = 3000;
export const REQUEST_TIMEOUT = 10000;
// Espera ante un 429 si GBIF no indica Retry-After (s)
export const RETRY_AFTER_DEFAULT = 10;

// Idioma preferido para nombres comunes (ISO 639-2)
export const VERNACULAR_LANG = 'spa';

// Incertidumbre (m) a partir de la cual tratamos una ubicación como generalizada
export const GENERALIZED_UNCERTAINTY = 10000;

export const STORAGE_KEYS = {
  favorites: 'cladum:favorites:v1',
  theme: 'cladum:theme',
  lastSpecies: 'cladum:last-species',
};
