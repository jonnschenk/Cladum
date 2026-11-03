import MockAdapter from 'axios-mock-adapter';
import { gbif, getPhotos } from './gbif.js';
import { inat, getInatPhotos } from './inaturalist.js';
import { getTaxonPhotos } from './photos.js';

const gbifMock = new MockAdapter(gbif.client);
const inatMock = new MockAdapter(inat.client);

const occurrence = (key, url, extra = {}) => ({
  key,
  basisOfRecord: 'HUMAN_OBSERVATION',
  media: [{ type: 'StillImage', identifier: url, creator: 'Ana', license: 'http://creativecommons.org/licenses/by/4.0/' }],
  ...extra,
});

const inatPhoto = (id, license_code) => ({
  photo: { id, license_code, url: `https://static.inaturalist.org/photos/${id}/square.jpg`, medium_url: `https://static.inaturalist.org/photos/${id}/medium.jpg`, attribution_name: 'Luis' },
});

function mockInat({ name = 'Panthera onca', photos = [inatPhoto(1, 'cc-by-nc')] } = {}) {
  inatMock.onGet('/taxa').reply(200, { results: [{ id: 41970, name }] });
  inatMock.onGet('/taxa/41970').reply(200, { results: [{ taxon_photos: photos }] });
}

beforeEach(() => {
  gbifMock.reset();
  inatMock.reset();
  gbif.clearCache();
  inat.clearCache();
});

describe('GBIF', () => {
  test('una foto por URL, marcada como de GBIF', async () => {
    gbifMock.onGet('/occurrence/search').reply(200, {
      results: [occurrence(1, 'https://a.org/1.jpg'), occurrence(2, 'https://a.org/1.jpg'), occurrence(3, 'https://a.org/2.jpg'), { key: 4 }],
    });
    const photos = await getPhotos(5219426);
    expect(photos.map((p) => p.occurrenceKey)).toEqual([1, 3]);
    expect(photos[0]).toMatchObject({ source: 'gbif', creator: 'Ana' });
  });
});

describe('iNaturalist', () => {
  test('descarta fotos sin licencia abierta', async () => {
    mockInat({ photos: [inatPhoto(1, null), inatPhoto(2, 'cc-by-sa'), inatPhoto(3, 'cc0')] });
    const photos = await getInatPhotos('Panthera onca');
    expect(photos.map((p) => p.license)).toEqual([
      'https://creativecommons.org/licenses/by-sa/',
      'https://creativecommons.org/publicdomain/zero/1.0/',
    ]);
    expect(photos[0]).toMatchObject({ source: 'inaturalist', url: 'https://static.inaturalist.org/photos/2/medium.jpg' });
  });

  test('sin coincidencia exacta del nombre no devuelve fotos', async () => {
    mockInat({ name: 'Panthera onca mesembrina' });
    expect(await getInatPhotos('Panthera onca')).toEqual([]);
  });
});

describe('getTaxonPhotos: GBIF primero, iNaturalist de respaldo', () => {
  test('si GBIF tiene fotos, no consulta iNaturalist', async () => {
    gbifMock.onGet('/occurrence/search').reply(200, { results: [occurrence(1, 'https://a.org/1.jpg')] });
    const photos = await getTaxonPhotos(5219426, 'Panthera onca');
    expect(photos[0].source).toBe('gbif');
    expect(inatMock.history.get).toHaveLength(0);
  });

  test('si GBIF no tiene fotos, usa iNaturalist', async () => {
    gbifMock.onGet('/occurrence/search').reply(200, { results: [] });
    mockInat();
    expect((await getTaxonPhotos(5219426, 'Panthera onca'))[0].source).toBe('inaturalist');
  });

  test('si GBIF no responde, usa iNaturalist', async () => {
    gbifMock.onGet('/occurrence/search').timeout();
    mockInat();
    expect((await getTaxonPhotos(5219426, 'Panthera onca'))[0].source).toBe('inaturalist');
  });

  test('si fallan las dos fuentes, reporta el error de GBIF', async () => {
    gbifMock.onGet('/occurrence/search').reply(503);
    inatMock.onGet('/taxa').networkError();
    await expect(getTaxonPhotos(5219426, 'Panthera onca')).rejects.toMatchObject({ source: 'GBIF', kind: 'unavailable' });
  });

  test('si GBIF no tiene fotos e iNaturalist falla, no hay fotos (no es error)', async () => {
    gbifMock.onGet('/occurrence/search').reply(200, { results: [] });
    inatMock.onGet('/taxa').reply(500);
    expect(await getTaxonPhotos(5219426, 'Panthera onca')).toEqual([]);
  });
});
