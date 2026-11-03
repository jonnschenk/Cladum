// Simuladores de GBIF e iNaturalist para las pruebas: ninguna prueba llama a la red

import MockAdapter from 'axios-mock-adapter';
import { gbif } from '../services/gbif.js';
import { inat } from '../services/inaturalist.js';

export function mockApis() {
  const gbifMock = new MockAdapter(gbif.client);
  const inatMock = new MockAdapter(inat.client);
  const reset = () => {
    gbifMock.reset();
    inatMock.reset();
    gbif.clearCache();
    inat.clearCache();
  };
  return { gbifMock, inatMock, reset };
}

export const jaguar = {
  key: 5219426,
  canonicalName: 'Panthera onca',
  scientificName: 'Panthera onca (Linnaeus, 1758)',
  authorship: '(Linnaeus, 1758)',
  rank: 'SPECIES',
  taxonomicStatus: 'ACCEPTED',
  kingdom: 'Animalia', kingdomKey: 1,
  phylum: 'Chordata', phylumKey: 44,
  class: 'Mammalia', classKey: 359,
  order: 'Carnivora', orderKey: 732,
  family: 'Felidae', familyKey: 9703,
  genus: 'Panthera', genusKey: 2435194,
  species: 'Panthera onca', speciesKey: 5219426,
};

/**
 * Respuesta según los parámetros de la consulta: la primera regla cuyo `when`
 * coincide (todas sus claves iguales) decide; `otherwise` es la respuesta por defecto.
 */
export const byParams = (rules, otherwise) => (config) => {
  const params = config.params ?? {};
  const rule = rules.find(({ when }) => Object.entries(when).every(([k, v]) => params[k] === v));
  return rule ? rule.reply : otherwise;
};

export const page = (results, { count = results.length, offset = 0, limit = 20, endOfRecords = true } = {}) =>
  ({ results, count, offset, limit, endOfRecords });
