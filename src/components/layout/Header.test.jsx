import { screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Header, navState } from './Header.jsx';
import { renderWithProviders } from '../../test/renderWithProviders.jsx';

const state = (extra = {}) => ({
  ui: { theme: 'light', online: true },
  favorites: { items: [], persistFailed: false },
  ...extra,
});

describe('navState', () => {
  test('la ficha cuenta como sección Explorar, sin ser la página', () => {
    expect(navState('/especie/5219426')).toEqual({ section: 'search', current: 'true' });
    expect(navState('/')).toEqual({ section: 'search', current: 'page' });
    expect(navState('/guardadas')).toEqual({ section: 'saved', current: 'page' });
  });
});

test('marca la página actual en la navegación', () => {
  renderWithProviders(<Header />, { route: '/datos', preloadedState: state() });
  expect(screen.getByRole('link', { name: 'Acerca de los datos' })).toHaveAttribute('aria-current', 'page');
  expect(screen.getByRole('link', { name: 'Explorar' })).not.toHaveAttribute('aria-current');
});

test('muestra cuántas especies hay guardadas', () => {
  const favorites = { items: [{ key: 1 }, { key: 2 }], persistFailed: false };
  renderWithProviders(<Header />, { preloadedState: state({ favorites }) });
  expect(screen.getByRole('link', { name: /Guardadas 2 especies/ })).toBeInTheDocument();
});

test('el botón de tema cambia el estado y su etiqueta', async () => {
  const { store } = renderWithProviders(<Header />, { preloadedState: state() });
  await userEvent.click(screen.getByRole('button', { name: 'Cambiar a modo oscuro' }));
  expect(store.getState().ui.theme).toBe('dark');
  expect(screen.getByRole('button', { name: 'Cambiar a modo claro' })).toBeInTheDocument();
});

test('avisa cuando se pierde la conexión', () => {
  renderWithProviders(<Header />, { preloadedState: state() });
  const onLine = jest.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
  act(() => window.dispatchEvent(new Event('offline')));
  expect(screen.getByText('Sin conexión.')).toBeInTheDocument();
  onLine.mockRestore();
});
