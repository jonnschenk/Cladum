import { makeStore } from '../../app/store.js';
import { toggleSaved, restoreFavorite } from './favoritesSlice.js';

beforeEach(() => localStorage.clear());
afterEach(() => jest.restoreAllMocks());

const jaguar = { key: 5219426, name: 'Panthera onca' };

test('al guardar, lo confirma', () => {
  const store = makeStore();
  store.dispatch(toggleSaved(jaguar));
  expect(store.getState().ui.toast).toMatchObject({ name: 'Panthera onca', text: 'se guardó en este navegador', undo: null });
});

test('al quitar, ofrece deshacer con la posición original', () => {
  const store = makeStore();
  store.dispatch(toggleSaved({ key: 1, name: 'A' }));
  store.dispatch(toggleSaved(jaguar));
  store.dispatch(toggleSaved({ key: 1, name: 'A' }));
  const { undo } = store.getState().ui.toast;
  expect(undo.position).toBe(1);
  store.dispatch(restoreFavorite(undo));
  expect(store.getState().favorites.items.map((f) => f.key)).toEqual([5219426, 1]);
});

test('no confirma en falso si el navegador no guardó', () => {
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('QuotaExceededError');
  });
  const store = makeStore();
  store.dispatch(toggleSaved(jaguar));
  expect(store.getState().ui.toast.text).toMatch(/solo mientras esta pestaña esté abierta/);
});
