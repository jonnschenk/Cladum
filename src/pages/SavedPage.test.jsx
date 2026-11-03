import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App.jsx';
import { renderWithProviders } from '../test/renderWithProviders.jsx';

const favorites = {
  items: [
    { key: 5219426, name: 'Panthera onca', rank: 'SPECIES', family: 'Felidae', vernacular: 'Jaguar', savedAt: '2026-01-04T10:00:00Z' },
    { key: 2431950, name: 'Ambystoma mexicanum', rank: 'SPECIES', family: 'Ambystomatidae', vernacular: 'Ajolote', savedAt: '2026-01-05T10:00:00Z' },
  ],
  persistFailed: false,
};

const renderSaved = (items = favorites) =>
  renderWithProviders(<App />, { route: '/guardadas', preloadedState: { favorites: items } });

beforeEach(() => localStorage.clear());

test('lista la colección y filtra por nombre común', async () => {
  const user = userEvent.setup();
  renderSaved();
  expect(screen.getAllByRole('link', { name: /Panthera onca|Ambystoma mexicanum/ })).toHaveLength(2);
  await user.type(screen.getByRole('searchbox', { name: 'Buscar en tu colección' }), 'ajolote');
  expect(screen.getAllByRole('link', { name: /Panthera onca|Ambystoma mexicanum/ })).toHaveLength(1);
  expect(screen.getByRole('link', { name: /Ambystoma mexicanum/ })).toBeInTheDocument();
});

test('quitar una especie ofrece deshacer y la devuelve a su lugar', async () => {
  const user = userEvent.setup();
  const { store } = renderSaved();
  await user.click(screen.getByRole('button', { name: 'Quitar Panthera onca de guardadas' }));
  expect(store.getState().favorites.items.map((f) => f.key)).toEqual([2431950]);

  await user.click(await screen.findByRole('button', { name: 'Deshacer' }));
  expect(store.getState().favorites.items.map((f) => f.key)).toEqual([5219426, 2431950]);
});

test('sin guardadas invita a explorar', () => {
  renderSaved({ items: [], persistFailed: false });
  expect(screen.getByRole('heading', { name: 'Aún no guardas especies' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Explorar especies' })).toBeInTheDocument();
});

test('sin coincidencias ofrece limpiar la búsqueda', async () => {
  const user = userEvent.setup();
  renderSaved();
  const input = screen.getByRole('searchbox');
  await user.type(input, 'xyz');
  await user.click(screen.getByRole('button', { name: 'Limpiar búsqueda' }));
  expect(input).toHaveValue('');
  expect(input).toHaveFocus();
});
