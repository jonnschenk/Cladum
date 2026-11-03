import { makeStore } from '../../app/store.js';
import { mockApis } from '../../test/apiMocks.js';
import { fetchStat, fetchKingdomCount } from './homeSlice.js';

const { gbifMock, reset } = mockApis();
beforeEach(reset);

test('una cifra ya cargada no se vuelve a pedir', async () => {
  gbifMock.onGet('/occurrence/count').reply(200, 3086010427);
  const store = makeStore();
  await store.dispatch(fetchStat('occurrences'));
  await store.dispatch(fetchStat('occurrences'));
  expect(store.getState().home.stats.occurrences).toEqual({ status: 'succeeded', value: 3086010427 });
  expect(gbifMock.history.get).toHaveLength(1);
});

test('una cifra que falló se puede volver a pedir', async () => {
  gbifMock.onGet('/species/search').replyOnce(500).onGet('/species/search').reply(200, { count: 4626 });
  const store = makeStore();
  await store.dispatch(fetchKingdomCount(5));
  expect(store.getState().home.kingdoms[5].status).toBe('failed');
  await store.dispatch(fetchKingdomCount(5));
  expect(store.getState().home.kingdoms[5]).toEqual({ status: 'succeeded', value: 4626 });
});
