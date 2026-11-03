import { makeStore } from '../../app/store.js';
import { mockApis, jaguar, page, byParams } from '../../test/apiMocks.js';
import { fetchSpecies } from './speciesSlice.js';
import { STORAGE_KEYS } from '../../config.js';

const { gbifMock, inatMock, reset } = mockApis();
beforeEach(() => {
  reset();
  sessionStorage.clear();
});

const photoRecord = { key: 10, media: [{ type: 'StillImage', identifier: 'https://a.org/1.jpg' }] };

test('reúne taxón, nombre común, fotos y ocurrencias', async () => {
  gbifMock.onGet('/species/5219426').reply(200, jaguar);
  gbifMock.onGet('/species/5219426/vernacularNames').reply(200, { results: [{ vernacularName: 'Jaguar', language: 'spa' }] });
  gbifMock.onGet('/occurrence/search').reply(byParams(
    [{ when: { media_type: 'StillImage' }, reply: [200, page([photoRecord])] }],
    [200, page([], { count: 826161 })],
  ));

  const store = makeStore();
  await store.dispatch(fetchSpecies(5219426));
  const { status, data } = store.getState().species;
  expect(status).toBe('succeeded');
  expect(data.vernacular.vernacularName).toBe('Jaguar');
  expect(data.photos[0].source).toBe('gbif');
  expect(data.occ.count).toBe(826161);
});

test('si fallan las fotos, la ficha se muestra igual y lo indica', async () => {
  gbifMock.onGet('/species/5219426').reply(200, jaguar);
  gbifMock.onGet('/species/5219426/vernacularNames').reply(200, { results: [] });
  gbifMock.onGet('/occurrence/search').reply(503);
  inatMock.onGet('/taxa').networkError();

  const store = makeStore();
  await store.dispatch(fetchSpecies(5219426));
  const { status, data } = store.getState().species;
  expect(status).toBe('succeeded');
  expect(data).toMatchObject({ photos: [], photosFailed: true, occ: null, vernacular: null });
});

test('sin taxón la ficha falla con el tipo de error', async () => {
  gbifMock.onGet('/species/1').reply(404);
  const store = makeStore();
  await store.dispatch(fetchSpecies(1));
  expect(store.getState().species).toMatchObject({ status: 'failed', error: { kind: 'not-found' } });
});

test('recuerda la última ficha en esta pestaña', async () => {
  gbifMock.onGet('/species/5219426').reply(200, jaguar);
  gbifMock.onGet().reply(200, page([]));
  const store = makeStore();
  await store.dispatch(fetchSpecies(5219426));
  const last = { key: 5219426, name: 'Panthera onca', rank: 'SPECIES' };
  expect(store.getState().species.lastSpecies).toEqual(last);
  expect(JSON.parse(sessionStorage.getItem(STORAGE_KEYS.lastSpecies))).toEqual(last);
});
