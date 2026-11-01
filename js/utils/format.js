// Formato de datos para la interfaz (español)

const numberFormat = new Intl.NumberFormat('es-ES');
const dateFormat = new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
let regionNames = null;
try {
  regionNames = new Intl.DisplayNames(['es'], { type: 'region' });
} catch {
  regionNames = null;
}

export const formatNumber = (n) => (typeof n === 'number' ? numberFormat.format(n) : '—');

export const formatMeters = (m) => (typeof m === 'number' ? `${numberFormat.format(Math.round(m))} m` : null);

/** "2026-01-04T10:20" o "2026-01-04/2026-01-05" → "04 ene 2026" */
export function formatDate(value) {
  if (!value) return null;
  const first = String(value).split('/')[0];
  // "2026-01-17" sin hora se interpretaría en UTC y podría mostrar el día anterior
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(first) ? `${first}T00:00:00` : first);
  if (Number.isNaN(date.getTime())) return first;
  return dateFormat.format(date).replace('.', '');
}

export function countryName(code) {
  if (!code) return null;
  try {
    return regionNames?.of(code) ?? code;
  } catch {
    return code;
  }
}

export const RANK_LABELS = {
  KINGDOM: 'Reino',
  PHYLUM: 'Filo',
  CLASS: 'Clase',
  ORDER: 'Orden',
  FAMILY: 'Familia',
  GENUS: 'Género',
  SPECIES: 'Especie',
  SUBSPECIES: 'Subespecie',
  VARIETY: 'Variedad',
  FORM: 'Forma',
};

export const STATUS_LABELS = {
  ACCEPTED: 'Aceptado',
  DOUBTFUL: 'Dudoso',
  SYNONYM: 'Sinónimo',
  HETEROTYPIC_SYNONYM: 'Sinónimo heterotípico',
  HOMOTYPIC_SYNONYM: 'Sinónimo homotípico',
  PROPARTE_SYNONYM: 'Sinónimo pro parte',
  MISAPPLIED: 'Mal aplicado',
};

export const BASIS_LABELS = {
  HUMAN_OBSERVATION: 'Observación humana',
  MACHINE_OBSERVATION: 'Observación automática',
  PRESERVED_SPECIMEN: 'Ejemplar preservado',
  LIVING_SPECIMEN: 'Ejemplar vivo',
  FOSSIL_SPECIMEN: 'Fósil',
  MATERIAL_SAMPLE: 'Muestra de material',
  MATERIAL_CITATION: 'Cita de material',
  OCCURRENCE: 'Ocurrencia',
  OBSERVATION: 'Observación',
};

export const rankLabel = (rank) => RANK_LABELS[rank] ?? rank ?? '—';
export const statusLabel = (status) => STATUS_LABELS[status] ?? status ?? '—';
export const basisLabel = (basis) => BASIS_LABELS[basis] ?? basis ?? 'Registro';

// Géneros y rangos inferiores van en cursiva (ICZN / ICN)
const ITALIC_RANKS = new Set(['GENUS', 'SUBGENUS', 'SPECIES', 'SUBSPECIES', 'VARIETY', 'FORM']);
export const isItalicRank = (rank) => ITALIC_RANKS.has(rank);

/** URL de licencia Creative Commons → etiqueta corta ("CC BY 4.0"). */
export function licenseLabel(license) {
  if (!license) return null;
  const s = String(license).toLowerCase();
  if (s.includes('publicdomain/zero') || s === 'cc0_1_0' || s.includes('cc0')) return 'CC0 1.0';
  const match = s.match(/licenses\/([a-z-]+)\/(\d\.\d)/);
  if (match) return `CC ${match[1].toUpperCase()} ${match[2]}`;
  if (s.startsWith('cc_')) return s.toUpperCase().replace(/_/g, ' ').replace(/ (\d) (\d)$/, ' $1.$2');
  return license;
}
