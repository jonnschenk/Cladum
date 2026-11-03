import { screen } from '@testing-library/react';
import App from './App.jsx';
import { renderWithProviders } from './test/renderWithProviders.jsx';

test.each([
  ['/', 'Explorar'],
  ['/especie/5219426', 'Ficha de especie 5219426'],
  ['/especie/5219426/ocurrencias', 'Ocurrencias de 5219426'],
  ['/guardadas', 'Guardadas'],
  ['/datos', 'Acerca de los datos'],
  ['/no-existe', 'Página no encontrada'],
])('la ruta %s abre "%s"', (route, title) => {
  renderWithProviders(<App />, { route });
  expect(screen.getByRole('heading', { level: 1, name: title })).toBeInTheDocument();
});

test('todas las páginas comparten encabezado y pie', () => {
  renderWithProviders(<App />, { route: '/guardadas' });
  expect(screen.getByRole('navigation', { name: 'Principal' })).toBeInTheDocument();
  expect(screen.getByRole('contentinfo')).toBeInTheDocument();
});
