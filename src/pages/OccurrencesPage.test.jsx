import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App.jsx';
import { renderWithProviders } from '../test/renderWithProviders.jsx';
import { LocationProbe } from '../test/LocationProbe.jsx';
import { mockApis, jaguar, page, byParams, occurrence } from '../test/apiMocks.js';

const { gbifMock, reset } = mockApis();

beforeEach(() => {
  reset();
  gbifMock.onGet('/species/5219426').reply(200, jaguar);
  gbifMock.onGet('/occurrence/search').reply(byParams([
    { when: { facet: 'country' }, reply: [200, { facets: [{ field: 'COUNTRY', counts: [{ name: 'MX', count: 2 }, { name: 'BR', count: 1 }] }] }] },
    { when: { country: 'BR' }, reply: [200, page([occurrence(3, { countryCode: 'BR', coordinateUncertaintyInMeters: 20000 })], { count: 1 })] },
  ], [200, page([occurrence(1), occurrence(2, { issues: ['COUNTRY_COORDINATE_MISMATCH'] })], { count: 2 })]));
});

const renderOccurrences = () =>
  renderWithProviders(<><App /><LocationProbe /></>, { route: '/especie/5219426/ocurrencias' });

test('lista registros y muestra el detalle del seleccionado', async () => {
  const user = userEvent.setup();
  renderOccurrences();
  // El detalle solo existe con datos (el esqueleto de carga también dice "registros con coordenadas")
  expect(await screen.findByRole('heading', { name: 'GBIF:1' })).toBeInTheDocument();
  expect(screen.getByText('registros con coordenadas')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /^Registro 2;/ }));
  expect(screen.getByRole('heading', { name: 'GBIF:2' })).toBeInTheDocument();
  expect(screen.getByText('COUNTRY_COORDINATE_MISMATCH')).toBeInTheDocument();
});

test('filtrar por país actualiza la URL y los registros sin recargar la vista', async () => {
  const user = userEvent.setup();
  renderOccurrences();
  const select = await screen.findByRole('combobox', { name: 'País' });
  await user.selectOptions(select, 'BR');
  expect(screen.getByTestId('location')).toHaveTextContent('/especie/5219426/ocurrencias?country=BR');
  expect(await screen.findByText('registros con coordenadas en Brasil')).toBeInTheDocument();
  expect(select).toHaveValue('BR');
  // Ubicación generalizada: incertidumbre de 20 km
  expect(screen.getByText('Ubicación generalizada para proteger el taxón')).toBeInTheDocument();
});

test('quitar el filtro de coordenadas se refleja en la URL', async () => {
  const user = userEvent.setup();
  renderOccurrences();
  await user.click(await screen.findByRole('switch', { name: 'Solo con coordenadas' }));
  expect(screen.getByTestId('location')).toHaveTextContent('coords=0');
});
