// Renderiza un componente con Redux y React Router, como en la app real

import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { makeStore } from '../app/store.js';

export function renderWithProviders(ui, { route = '/', preloadedState, store = makeStore(preloadedState) } = {}) {
  return {
    store,
    ...render(
      <Provider store={store}>
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      </Provider>,
    ),
  };
}
