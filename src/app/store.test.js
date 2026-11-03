import { makeStore } from './store.js';
import { toggleFavorite } from '../features/favorites/favoritesSlice.js';
import { toggleTheme } from '../features/ui/uiSlice.js';
import { STORAGE_KEYS } from '../config.js';

beforeEach(() => localStorage.clear());
afterEach(() => jest.restoreAllMocks());

test('las guardadas se escriben en localStorage', () => {
  const store = makeStore();
  store.dispatch(toggleFavorite({ key: 5219426, name: 'Panthera onca' }));
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.favorites));
  expect(saved).toHaveLength(1);
  expect(saved[0].name).toBe('Panthera onca');
});

test('al arrancar, lee las guardadas de localStorage', () => {
  localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify([{ key: 1, name: 'Animalia' }]));
  expect(makeStore().getState().favorites.items).toHaveLength(1);
});

test('si el navegador no deja guardar, lo marca sin perder la colección', () => {
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('QuotaExceededError');
  });
  const store = makeStore();
  store.dispatch(toggleFavorite({ key: 5219426, name: 'Panthera onca' }));
  expect(store.getState().favorites.persistFailed).toBe(true);
  expect(store.getState().favorites.items).toHaveLength(1);
});

test('el tema elegido se recuerda', () => {
  const store = makeStore({ ui: { theme: 'light', online: true } });
  store.dispatch(toggleTheme());
  expect(localStorage.getItem(STORAGE_KEYS.theme)).toBe('dark');
});
