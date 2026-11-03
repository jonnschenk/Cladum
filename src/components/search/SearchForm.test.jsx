import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchForm } from './SearchForm.jsx';
import { renderWithProviders } from '../../test/renderWithProviders.jsx';
import { LocationProbe } from '../../test/LocationProbe.jsx';
import { mockApis, jaguar } from '../../test/apiMocks.js';

const { gbifMock, reset } = mockApis();
beforeEach(() => {
  reset();
  gbifMock.onGet('/species/suggest').reply(200, [jaguar, { ...jaguar, key: 2435194, canonicalName: 'Panthera', rank: 'GENUS' }]);
});

const initial = { q: '', rank: 'SPECIES', status: 'ACCEPTED' };
const searchBox = () => screen.getByRole('combobox', { name: /Buscar nombre científico o común/ });
const suggestions = () => within(screen.getByRole('listbox', { hidden: true }));
const renderForm = () => renderWithProviders(<><SearchForm initial={initial} /><LocationProbe /></>);

test('sugiere taxones mientras escribes y se navega con el teclado', async () => {
  const user = userEvent.setup();
  renderForm();
  const input = searchBox();
  await user.type(input, 'Panth');

  expect(await suggestions().findAllByRole('option')).toHaveLength(2);
  expect(input).toHaveAttribute('aria-expanded', 'true');

  await user.keyboard('{ArrowDown}');
  expect(input).toHaveAttribute('aria-activedescendant', 'suggest-0');
  await user.keyboard('{Enter}');
  expect(screen.getByTestId('location')).toHaveTextContent('/especie/5219426');
});

test('Escape cierra las sugerencias', async () => {
  const user = userEvent.setup();
  renderForm();
  const input = searchBox();
  await user.type(input, 'Panth');
  await suggestions().findAllByRole('option');
  await user.keyboard('{Escape}');
  expect(suggestions().queryAllByRole('option', { hidden: true })).toHaveLength(0);
  expect(input).toHaveAttribute('aria-expanded', 'false');
});

test('Enter sin elegir sugerencia busca el texto con los filtros', async () => {
  const user = userEvent.setup();
  renderForm();
  await user.type(searchBox(), 'ajolote{Enter}');
  expect(screen.getByTestId('location')).toHaveTextContent('/?q=ajolote&rank=SPECIES&status=ACCEPTED');
});

test('sin sugerencias explica que Enter busca en todo el texto', async () => {
  gbifMock.reset();
  gbifMock.onGet('/species/suggest').reply(200, []);
  const user = userEvent.setup();
  renderForm();
  await user.type(searchBox(), 'zzzz');
  expect(await screen.findByText(/Sin sugerencias para «zzzz»/)).toBeInTheDocument();
});
