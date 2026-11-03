import {
  formatNumber, formatCompact, formatDate, licenseLabel, rankLabel, isItalicRank,
} from './format.js';

describe('formatCompact', () => {
  test('resume miles de millones y millones', () => {
    expect(formatCompact(3_887_469_368)).toBe('3,9 mil millones');
    expect(formatCompact(2_614_593)).toBe('2,6 millones');
  });

  test('muestra un guion si no hay número', () => {
    expect(formatCompact(undefined)).toBe('—');
    expect(formatNumber(null)).toBe('—');
  });
});

describe('formatDate', () => {
  test('no corre la fecha un día por la zona horaria', () => {
    expect(formatDate('2026-01-17')).toBe('17 ene 2026');
  });

  test('de un intervalo toma la primera fecha', () => {
    expect(formatDate('2026-01-04/2026-01-05')).toBe('04 ene 2026');
  });

  test('sin fecha devuelve null', () => {
    expect(formatDate('')).toBeNull();
  });
});

describe('licenseLabel', () => {
  test('convierte URLs de Creative Commons', () => {
    expect(licenseLabel('http://creativecommons.org/licenses/by-nc/4.0/legalcode')).toBe('CC BY-NC 4.0');
    expect(licenseLabel('https://creativecommons.org/publicdomain/zero/1.0/')).toBe('CC0 1.0');
  });

  test('acepta licencias sin versión (iNaturalist)', () => {
    expect(licenseLabel('https://creativecommons.org/licenses/by-sa/')).toBe('CC BY-SA');
  });

  test('sin licencia devuelve null', () => {
    expect(licenseLabel(null)).toBeNull();
  });
});

test('rangos: etiqueta en español y cursiva desde género', () => {
  expect(rankLabel('FAMILY')).toBe('Familia');
  expect(isItalicRank('GENUS')).toBe(true);
  expect(isItalicRank('FAMILY')).toBe(false);
});
