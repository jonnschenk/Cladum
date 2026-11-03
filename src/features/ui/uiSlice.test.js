import reducer, { toggleTheme, setOnline } from './uiSlice.js';

test('alterna entre modo claro y oscuro', () => {
  const state = reducer({ theme: 'light', online: true }, toggleTheme());
  expect(state.theme).toBe('dark');
  expect(reducer(state, toggleTheme()).theme).toBe('light');
});

test('registra la conexión', () => {
  expect(reducer({ theme: 'light', online: true }, setOnline(false)).online).toBe(false);
});
