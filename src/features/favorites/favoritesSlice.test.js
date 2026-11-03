import reducer, {
  toggleFavorite, restoreFavorite, selectIsFavorite, selectFavoritesCount,
} from './favoritesSlice.js';

const jaguar = { key: 5219426, name: 'Panthera onca' };
const ajolote = { key: 2431950, name: 'Ambystoma mexicanum' };
const empty = { items: [], persistFailed: false };

test('guarda una especie al principio, con fecha', () => {
  let state = reducer(empty, toggleFavorite(jaguar));
  state = reducer(state, toggleFavorite(ajolote));
  expect(state.items.map((f) => f.key)).toEqual([2431950, 5219426]);
  expect(state.items[0].savedAt).toEqual(expect.any(String));
});

test('si ya estaba guardada, la quita', () => {
  const state = reducer(reducer(empty, toggleFavorite(jaguar)), toggleFavorite(jaguar));
  expect(state.items).toEqual([]);
});

test('normaliza la clave a número', () => {
  const state = reducer(empty, toggleFavorite({ ...jaguar, key: '5219426' }));
  expect(selectIsFavorite(5219426)({ favorites: state })).toBe(true);
});

test('deshacer devuelve la especie a su posición', () => {
  let state = reducer(empty, toggleFavorite(jaguar));
  state = reducer(state, toggleFavorite(ajolote));
  const removed = state.items[1];
  state = reducer(state, toggleFavorite(removed));
  state = reducer(state, restoreFavorite({ entry: removed, position: 1 }));
  expect(state.items.map((f) => f.key)).toEqual([2431950, 5219426]);
  expect(selectFavoritesCount({ favorites: state })).toBe(2);
});
