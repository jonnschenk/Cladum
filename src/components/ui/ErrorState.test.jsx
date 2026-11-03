import { screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorState } from './ErrorState.jsx';
import { renderWithProviders } from '../../test/renderWithProviders.jsx';

afterEach(() => jest.useRealTimers());

test('ante un 429 cuenta hacia atrás y reintenta solo', () => {
  jest.useFakeTimers();
  const onRetry = jest.fn();
  renderWithProviders(<ErrorState error={{ kind: 'rate-limit', status: 429, retryAfter: 3 }} onRetry={onRetry} />);
  expect(screen.getByRole('heading', { name: 'Demasiadas consultas seguidas' })).toBeInTheDocument();
  expect(screen.getByText('Reintentando en 3 s')).toBeInTheDocument();
  act(() => jest.advanceTimersByTime(3000));
  expect(onRetry).toHaveBeenCalledTimes(1);
});

test('sin conexión reintenta al volver la red', () => {
  const onRetry = jest.fn();
  renderWithProviders(<ErrorState error={{ kind: 'offline' }} onRetry={onRetry} />);
  act(() => window.dispatchEvent(new Event('online')));
  expect(onRetry).toHaveBeenCalledTimes(1);
});

test('un 404 no ofrece reintentar', () => {
  renderWithProviders(<ErrorState error={{ kind: 'not-found', status: 404 }} onRetry={jest.fn()} />);
  expect(screen.queryByRole('button', { name: /Reintentar/ })).not.toBeInTheDocument();
});

test('muestra el detalle técnico con la consulta que falló', async () => {
  const user = userEvent.setup();
  const url = 'https://api.gbif.org/v1/species/1';
  renderWithProviders(<ErrorState error={{ kind: 'unavailable', status: 503, url }} onRetry={jest.fn()} />);
  await user.click(screen.getByText('Detalle técnico'));
  expect(screen.getByText('503')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /api\.gbif\.org\/v1\/species\/1/ })).toHaveAttribute('href', url);
});
