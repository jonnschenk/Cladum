import { screen } from '@testing-library/react';
import App from './App.jsx';
import { renderWithProviders } from './test/renderWithProviders.jsx';
import { mockApis, mockGbifDefaults } from './test/apiMocks.js';

const { gbifMock, inatMock, reset } = mockApis();
beforeEach(() => {
  reset();
  mockGbifDefaults(gbifMock, inatMock);
});

test.each([
  ['/', 'La biodiversidad, con datos que puedes verificar.'],
  ['/?q=Panthera%20onca&modo=texto', 'Resultados de búsqueda'],
  ['/especie/5219426', 'Panthera onca'],
  ['/especie/5219426/ocurrencias', 'Panthera onca'],
  ['/guardadas', /Especies guardadas/],
  ['/datos', 'Acerca de los datos'],
  ['/no-existe', 'Página no encontrada'],
])('la ruta %s abre "%s"', async (route, title) => {
  renderWithProviders(<App />, { route });
  expect(await screen.findByRole('heading', { level: 1, name: title })).toBeInTheDocument();
});

test('un identificador que no es número no consulta GBIF', () => {
  renderWithProviders(<App />, { route: '/especie/abc' });
  expect(screen.getByRole('heading', { level: 1, name: 'No encontramos ese taxón' })).toBeInTheDocument();
  expect(gbifMock.history.get).toHaveLength(0);
});

test('todas las páginas comparten encabezado y pie', () => {
  renderWithProviders(<App />, { route: '/guardadas' });
  expect(screen.getByRole('navigation', { name: 'Principal' })).toBeInTheDocument();
  expect(screen.getByRole('contentinfo')).toBeInTheDocument();
});
