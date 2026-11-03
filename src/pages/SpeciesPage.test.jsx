import { screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App.jsx';
import { renderWithProviders } from '../test/renderWithProviders.jsx';
import { mockApis, mockGbifDefaults, jaguar, page, byParams } from '../test/apiMocks.js';

const { gbifMock, inatMock, reset } = mockApis();

const gbifPhoto = (key) => ({
  key,
  basisOfRecord: 'HUMAN_OBSERVATION',
  media: [{ type: 'StillImage', identifier: `https://museo.org/${key}.jpg`, creator: `Autor ${key}`, license: 'http://creativecommons.org/licenses/by/4.0/' }],
});

beforeEach(() => {
  reset();
  // Primero las respuestas por defecto: una regla nueva para la misma URL reemplaza a la anterior
  mockGbifDefaults(gbifMock, inatMock);
  gbifMock.onGet('/occurrence/search').reply(byParams(
    [{ when: { media_type: 'StillImage' }, reply: [200, page([gbifPhoto(1), gbifPhoto(2)])] }],
    [200, page([], { count: 826161 })],
  ));
});

test('muestra identidad, nombre común y recuento', async () => {
  renderWithProviders(<App />, { route: '/especie/5219426' });
  expect(await screen.findByRole('heading', { level: 1, name: 'Panthera onca' })).toBeInTheDocument();
  expect(screen.getAllByText('Jaguar').length).toBeGreaterThan(0);
  expect(screen.getByText('826.161')).toBeInTheDocument();
});

test('una foto que no carga se retira de la galería', async () => {
  renderWithProviders(<App />, { route: '/especie/5219426' });
  const gallery = await screen.findByRole('region', { name: 'Fotografías (2)' });
  fireEvent.error(within(gallery).getByRole('img', { name: /por Autor 1/ }));
  expect(await screen.findByRole('region', { name: 'Fotografía' })).toBeInTheDocument();
  expect(screen.getByRole('img', { name: /por Autor 2/ })).toBeInTheDocument();
});

test('si fallan todas las de GBIF, muestra las de iNaturalist', async () => {
  inatMock.reset();
  inatMock.onGet('/taxa').reply(200, { results: [{ id: 41970, name: 'Panthera onca' }] });
  inatMock.onGet('/taxa/41970').reply(200, {
    results: [{ taxon_photos: [{ photo: { id: 9, license_code: 'cc-by-nc', attribution_name: 'Luis', url: 'https://static.inaturalist.org/photos/9/square.jpg' } }] }],
  });
  renderWithProviders(<App />, { route: '/especie/5219426' });
  await screen.findByRole('region', { name: 'Fotografías (2)' });
  fireEvent.error(screen.getByRole('img', { name: /por Autor 1/ }));
  fireEvent.error(await screen.findByRole('img', { name: /por Autor 2/ }));
  expect(await screen.findByRole('img', { name: /por Luis/ })).toBeInTheDocument();
  expect(screen.getByText('Fuente externa · vía iNaturalist')).toBeInTheDocument();
});

test('las flechas cambian de foto en la galería', async () => {
  const user = userEvent.setup();
  renderWithProviders(<App />, { route: '/especie/5219426' });
  const first = await screen.findByRole('button', { name: /Fotografía 1 de 2/ });
  first.focus();
  await user.keyboard('{ArrowRight}');
  expect(screen.getByRole('button', { name: /Fotografía 2 de 2/ })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('img', { name: /por Autor 2/ })).toBeInTheDocument();
});

test('guardar la especie la añade a la colección', async () => {
  const user = userEvent.setup();
  const { store } = renderWithProviders(<App />, { route: '/especie/5219426' });
  await user.click(await screen.findByRole('button', { name: 'Guardar Panthera onca' }));
  expect(store.getState().favorites.items[0]).toMatchObject({ key: 5219426, vernacular: 'Jaguar', family: 'Felidae' });
  expect(screen.getByRole('button', { name: 'Quitar de guardadas Panthera onca' })).toHaveAttribute('aria-pressed', 'true');
});

test('un taxón inexistente explica el 404 sin ofrecer reintentar', async () => {
  gbifMock.reset();
  gbifMock.onGet('/species/999').reply(404);
  renderWithProviders(<App />, { route: '/especie/999' });
  expect(await screen.findByRole('heading', { level: 1, name: 'No encontramos ese taxón' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Reintentar' })).not.toBeInTheDocument();
  expect(jaguar.key).toBe(5219426);
});
