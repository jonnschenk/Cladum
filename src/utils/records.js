// Reglas sobre registros de ocurrencia

import { GENERALIZED_UNCERTAINTY } from '../config.js';

/** Ubicación difuminada por el publicador (especies sensibles) o con incertidumbre muy alta. */
export const isGeneralized = (record) =>
  Boolean(record?.dataGeneralizations || record?.informationWithheld) ||
  (record?.coordinateUncertaintyInMeters ?? 0) >= GENERALIZED_UNCERTAINTY;
