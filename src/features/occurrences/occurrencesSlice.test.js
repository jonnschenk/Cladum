import { makeStore } from '../../app/store.js';
import { mockApis, jaguar, page, byParams } from '../../test/apiMocks.js';
import {
  loadOccurrences, refreshOccurrences, fetchMoreRecords, selectRecord, occurrenceQuery,
} from './occurrencesSlice.js';

const { gbifMock, reset } = mockApis();
beforeEach(reset);

const facet = { facets: [{ field: 'COUNTRY', counts: [{ name: 'MX', count: 10 }, { name: 'BR', count: 5 }] }] };
const all = { country: '', coords: true };

function mockOccurrences() {
  gbifMock.onGet('/species/5219426').reply(200, jaguar);
  gbifMock.onGet('/occurrence/search').reply(byParams([
    { when: { facet: 'country' }, reply: [200, facet] },
    { when: { country: 'MX' }, reply: [200, page([{ key: 3 }], { count: 1 })] },
    { when: { offset: 20 }, reply: [200, page([{ key: 2 }], { offset: 20, count: 21 })] },
  ], [200, page([{ key: 1 }], { count: 21 })]));
}

test('la consulta solo pide coordenadas si el filtro está activo', () => {
  expect(occurrenceQuery(1, { country: '', coords: false }).hasCoordinate).toBeUndefined();
  expect(occurrenceQuery(1, all).hasCoordinate).toBe(true);
});

test('carga taxón, registros y países', async () => {
  mockOccurrences();
  const store = makeStore();
  await store.dispatch(loadOccurrences({ key: 5219426, filters: all }));
  const state = store.getState().occurrences;
  expect(state).toMatchObject({ status: 'succeeded', count: 21, offset: 20 });
  expect(state.countries.map((c) => c.name)).toEqual(['MX', 'BR']);
  expect(store.getState().species.lastSpecies.name).toBe('Panthera onca');
});

test('un filtro actualiza los registros sin perder el taxón', async () => {
  mockOccurrences();
  const store = makeStore();
  await store.dispatch(loadOccurrences({ key: 5219426, filters: all }));
  store.dispatch(selectRecord(0));
  const pending = store.dispatch(refreshOccurrences({ key: 5219426, filters: { country: 'MX', coords: true } }));
  expect(store.getState().occurrences).toMatchObject({ updating: true, filters: { country: 'MX' } });
  await pending;
  const state = store.getState().occurrences;
  expect(state).toMatchObject({ updating: false, count: 1, selected: 0 });
  expect(state.taxon.key).toBe(5219426);
  expect(state.records.map((r) => r.key)).toEqual([3]);
});

test('si falla la actualización, se conserva la vista y se informa', async () => {
  mockOccurrences();
  const store = makeStore();
  await store.dispatch(loadOccurrences({ key: 5219426, filters: all }));
  gbifMock.reset();
  gbifMock.onGet().reply(429, {}, { 'retry-after': '5' });
  await store.dispatch(refreshOccurrences({ key: 5219426, filters: { country: 'BR', coords: true } }));
  expect(store.getState().occurrences).toMatchObject({
    status: 'succeeded',
    updating: false,
    updateError: { kind: 'rate-limit', retryAfter: 5 },
  });
});

test('"Cargar más" añade registros', async () => {
  mockOccurrences();
  const store = makeStore();
  await store.dispatch(loadOccurrences({ key: 5219426, filters: all }));
  await store.dispatch(fetchMoreRecords());
  expect(store.getState().occurrences.records.map((r) => r.key)).toEqual([1, 2]);
});
