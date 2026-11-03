import { safeUrl, isAbort } from './net.js';

test('safeUrl solo deja pasar http y https', () => {
  expect(safeUrl('https://example.org/foto.jpg')).toBe('https://example.org/foto.jpg');
  expect(safeUrl('javascript:alert(1)')).toBe('');
  expect(safeUrl('no es una url')).toBe('');
});

test('isAbort reconoce cancelaciones de fetch y de axios', () => {
  expect(isAbort({ name: 'AbortError' })).toBe(true);
  expect(isAbort({ name: 'CanceledError' })).toBe(true);
  expect(isAbort(new Error('otro'))).toBe(false);
});
