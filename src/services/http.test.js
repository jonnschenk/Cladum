import MockAdapter from 'axios-mock-adapter';
import { createApi, ApiError } from './http.js';
import { isAbort } from '../utils/net.js';

const api = createApi({ baseURL: 'https://api.test/v1', source: 'Prueba' });
const mock = new MockAdapter(api.client);

beforeEach(() => {
  mock.reset();
  api.clearCache();
});

test('devuelve los datos y no repite una consulta ya hecha', async () => {
  mock.onGet('/species/1').reply(200, { key: 1 });
  expect(await api.get('/species/1')).toEqual({ key: 1 });
  expect(await api.get('/species/1')).toEqual({ key: 1 });
  expect(mock.history.get).toHaveLength(1);
});

test('no guarda errores en caché', async () => {
  mock.onGet('/species/1').replyOnce(503).onGet('/species/1').reply(200, { key: 1 });
  await expect(api.get('/species/1')).rejects.toThrow(ApiError);
  expect(await api.get('/species/1')).toEqual({ key: 1 });
});

test('omite parámetros vacíos en la consulta y en su URL pública', async () => {
  mock.onGet('/species/search').reply(200, {});
  await api.get('/species/search', { q: 'onca', rank: '', status: null });
  expect(mock.history.get[0].params).toEqual({ q: 'onca' });
  expect(api.url('/species/search', { q: 'onca', rank: '' })).toBe('https://api.test/v1/species/search?q=onca');
});

test.each([
  [404, 'not-found'],
  [503, 'unavailable'],
  [400, 'http'],
])('un %i se traduce a "%s"', async (status, kind) => {
  mock.onGet('/x').reply(status);
  await expect(api.get('/x')).rejects.toMatchObject({ kind, status, url: 'https://api.test/v1/x' });
});

test('un 429 indica cuánto esperar', async () => {
  mock.onGet('/x').reply(429, {}, { 'retry-after': '30' });
  await expect(api.get('/x')).rejects.toMatchObject({ kind: 'rate-limit', retryAfter: 30 });
});

test('distingue tiempo agotado de fallo de red', async () => {
  mock.onGet('/lento').timeout();
  mock.onGet('/caido').networkError();
  await expect(api.get('/lento')).rejects.toMatchObject({ kind: 'timeout' });
  await expect(api.get('/caido')).rejects.toMatchObject({ kind: 'network' });
});

test('una consulta cancelada no se convierte en error visible', async () => {
  mock.onGet('/x').reply(200, {});
  const controller = new AbortController();
  controller.abort();
  const error = await api.get('/x', {}, { signal: controller.signal }).catch((e) => e);
  expect(isAbort(error)).toBe(true);
  expect(error).not.toBeInstanceOf(ApiError);
});
