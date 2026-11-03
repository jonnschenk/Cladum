import { makeStore } from '../../app/store.js';
import { mockApis, jaguar, page, byParams } from '../../test/apiMocks.js';
import { fetchSearch, fetchMoreResults, searchParamsFrom } from './searchSlice.js';
import { relevance } from './relevance.js';

const { gbifMock, reset } = mockApis();
beforeEach(reset);

const params = (q, extra = {}) => ({ ...searchParamsFrom(new URLSearchParams({ q })), ...extra });
const searchCalls = () => gbifMock.history.get.filter((r) => r.url === '/species/search');

test('lee los filtros de la URL con valores por defecto', () => {
  expect(searchParamsFrom(new URLSearchParams('q=onca&modo=texto'))).toEqual({
    q: 'onca', rank: 'SPECIES', status: 'ACCEPTED', higher: '', label: '', textMode: true,
  });
});

test('una palabra que es un género busca las especies de ese género', async () => {
  gbifMock.onGet('/species/match').reply(200, { rank: 'GENUS', matchType: 'EXACT', usageKey: 2435194, canonicalName: 'Panthera', family: 'Felidae' });
  gbifMock.onGet('/species/search').reply(200, page([jaguar]));
  const store = makeStore();
  await store.dispatch(fetchSearch(params('Panthera')));

  const { status, query, results } = store.getState().search;
  expect(status).toBe('succeeded');
  expect(query.genus).toMatchObject({ key: 2435194, name: 'Panthera' });
  expect(searchCalls()[0].params).toMatchObject({ highertaxonKey: 2435194 });
  expect(results).toHaveLength(1);
});

test('con homónimos no adivina: busca por texto', async () => {
  gbifMock.onGet('/species/match').reply(200, { matchType: 'NONE' });
  gbifMock.onGet('/species/search').reply(byParams([{
    when: { rank: 'GENUS' },
    reply: [200, page([
      { key: 1, canonicalName: 'Giardia', taxonomicStatus: 'ACCEPTED' },
      { key: 2, canonicalName: 'Giardia', taxonomicStatus: 'DOUBTFUL' },
    ])],
  }], [200, page([])]));
  const store = makeStore();
  await store.dispatch(fetchSearch(params('Giardia')));
  expect(store.getState().search.query.genus).toBeNull();
});

test('sin resultados sugiere una coincidencia aproximada', async () => {
  gbifMock.onGet('/species/search').reply(200, page([]));
  gbifMock.onGet('/species/match').reply(200, { usageKey: 5219426, canonicalName: 'Panthera onca', rank: 'SPECIES', matchType: 'FUZZY' });
  const store = makeStore();
  await store.dispatch(fetchSearch(params('Pantera onka')));
  expect(store.getState().search.suggestion).toEqual({ key: 5219426, name: 'Panthera onca', rank: 'SPECIES', fuzzy: true });
});

test('un error de GBIF queda como dato serializable', async () => {
  gbifMock.onGet('/species/search').reply(503);
  const store = makeStore();
  await store.dispatch(fetchSearch(params('Panthera onca')));
  expect(store.getState().search).toMatchObject({ status: 'failed', error: { kind: 'unavailable', status: 503 } });
});

test('"Cargar más" añade la siguiente página', async () => {
  gbifMock.onGet('/species/search').reply(byParams(
    [{ when: { offset: 20 }, reply: [200, page([{ key: 2, canonicalName: 'B' }], { offset: 20, count: 21 })] }],
    [200, page([{ key: 1, canonicalName: 'A' }], { count: 21, endOfRecords: false })],
  ));
  const store = makeStore();
  await store.dispatch(fetchSearch(params('a b', { textMode: true })));
  await store.dispatch(fetchMoreResults());
  const { results, endOfRecords, more } = store.getState().search;
  expect(results.map((r) => r.key)).toEqual([1, 2]);
  expect(endOfRecords).toBe(true);
  expect(more).toBe('idle');
});

test('la respuesta de una búsqueda vieja no pisa la nueva', async () => {
  gbifMock.onGet('/species/search').reply((config) => (config.params.q === 'lenta'
    ? new Promise((resolve) => setTimeout(() => resolve([200, page([{ key: 1 }])]), 30))
    : [200, page([{ key: 2 }])]));
  const store = makeStore();
  const old = store.dispatch(fetchSearch(params('lenta', { textMode: true })));
  await store.dispatch(fetchSearch(params('rapida', { textMode: true })));
  await old;
  expect(store.getState().search.results.map((r) => r.key)).toEqual([2]);
});

describe('relevance', () => {
  test('prioriza la coincidencia exacta y luego el género', () => {
    const exact = { canonicalName: 'Quercus' };
    const species = { canonicalName: 'Quercus rugosa', genus: 'Quercus' };
    const other = { canonicalName: 'Fagus sylvatica' };
    expect(relevance(exact, 'quercus')).toBeGreaterThan(relevance(species, 'quercus'));
    expect(relevance(species, 'quercus')).toBeGreaterThan(relevance(other, 'quercus'));
  });

  test('reconoce el nombre común', () => {
    expect(relevance({ canonicalName: 'Ambystoma mexicanum', vernacularNames: [{ vernacularName: 'Ajolote' }] }, 'ajolote')).toBe(50);
  });
});
