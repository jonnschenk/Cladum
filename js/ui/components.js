// Piezas de interfaz reutilizables (devuelven HTML como texto).
// Todo dato externo pasa por esc() o safeUrl().

import { esc, safeUrl } from '../utils/dom.js';
import { isItalicRank } from '../utils/format.js';

const svg = (d, size = 16, stroke = 2) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;

export const icons = {
  arrow: (s) => svg('<path d="M4 12h15M13 6l6 6-6 6"/>', s, 2.2),
  back: (s) => svg('<path d="M15 6l-6 6 6 6"/>', s),
  chevron: (s) => svg('<path d="M6 9l6 6 6-6"/>', s, 2.2),
  check: (s) => svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>', s, 2.6),
  search: (s) => svg('<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>', s),
  noResults: (s) => svg('<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4M8.5 8.5l5 5M13.5 8.5l-5 5"/>', s),
  alert: (s) => svg('<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.5v.5"/>', s),
  warn: (s) => svg('<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/>', s),
  shield: (s) => svg('<path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z"/><path d="M12 8v5M12 16v.5"/>', s),
  list: (s) => svg('<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>', s),
  map: (s) => svg('<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>', s, 1.8),
  bookmark: (s) => svg('<path d="M6 3h12v18l-6-4-6 4z"/>', s, 1.8),
  bookmarkFilled: (s) =>
    `<svg width="${s ?? 16}" height="${s ?? 16}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4z"/></svg>`,
  image: (s) => svg('<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="M21 17l-5-5-9 8"/>', s, 1.8),
  moon: (s) => svg('<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>', s, 1.8),
  offline: (s) => svg('<path d="M2 8.8a15 15 0 0 1 4.2-2.6M9.8 5.1A15 15 0 0 1 22 8.8M5 12.6a10 10 0 0 1 3.7-2.2M14.6 10.3A10 10 0 0 1 19 12.6M8.5 16.4a5 5 0 0 1 7 0M12 20h.01M3 3l18 18"/>', s, 1.8),
  clock: (s) => svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', s, 1.8),
  spinner: (s) => svg('<path d="M21 12a9 9 0 1 1-6.2-8.6"/>', s, 2.2),
  sun: (s) => svg('<circle cx="12" cy="12" r="4.5"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/>', s, 1.8),
};

// ── Procedencia ─────────────────────────────

export const verified = (label = 'Verificado · GBIF', extra = '') =>
  `<span class="pill ${extra}"><span class="pill__dot" aria-hidden="true"></span>${esc(label)}</span>`;

export const external = (label = 'Fuente externa', extra = '') =>
  `<span class="pill ${extra}"><span class="pill__ring" aria-hidden="true"></span>${esc(label)}</span>`;

export const noData = (label = 'Sin dato') =>
  `<span class="pill pill--outline"><span class="pill__dash" aria-hidden="true"></span>${esc(label)}</span>`;

// ── Nombres ─────────────────────────────────

/** Nombre científico con cursiva solo en género o rangos inferiores. */
export function taxonName(name, rank, className = '') {
  if (!name) return '';
  const cls = className ? ` class="${className}"` : '';
  if (isItalicRank(rank)) {
    return `<i${cls} lang="la">${esc(name)}</i>`;
  }
  return `<span${cls}>${esc(name)}</span>`;
}

// ── Enlaces ─────────────────────────────────

// La flecha es decorativa; el aviso de pestaña nueva se lee en voz alta
const NEW_TAB = '<span aria-hidden="true"> ↗</span><span class="u-visually-hidden"> (se abre en una pestaña nueva)</span>';

export function apiLink(href, label, extraClass = '') {
  const url = safeUrl(href);
  if (!url) return '';
  return `<a class="api-link ${extraClass}" href="${esc(url)}" target="_blank" rel="noopener">${esc(label)}${NEW_TAB}</a>`;
}

export function externalLink(href, label) {
  const url = safeUrl(href);
  if (!url) return '';
  return `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(label)}${NEW_TAB}</a>`;
}

// ── Estados ─────────────────────────────────

// Ilustraciones de estado: variaciones del cladograma de la marca.
// Completo = hay algo por explorar; con una rama punteada = no se encontró.
const ART = {
  cladogram: `
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
      <path d="M4 24h10M14 12v24M14 12h12M14 36h12M26 7v10M26 31v10M26 7h16M26 17h16M26 31h16M26 41h16"/>
      <circle cx="42" cy="7" r="2.6" fill="currentColor" stroke="none"/><circle cx="42" cy="17" r="2.6" fill="currentColor" stroke="none"/>
      <circle cx="42" cy="31" r="2.6" fill="currentColor" stroke="none"/><circle cx="42" cy="41" r="2.6" fill="currentColor" stroke="none"/>
    </svg>`,
  missing: `
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
      <path d="M4 24h10M14 12v24M14 12h12M26 7v10M26 7h16M26 17h16"/>
      <path d="M14 36h12M26 31v10M26 31h16M26 41h16" stroke-dasharray="2 4"/>
      <circle cx="42" cy="7" r="2.6" fill="currentColor" stroke="none"/><circle cx="42" cy="17" r="2.6" fill="currentColor" stroke="none"/>
      <circle cx="42" cy="31" r="3" stroke-dasharray="2 2.6"/><circle cx="42" cy="41" r="3" stroke-dasharray="2 2.6"/>
    </svg>`,
};

/**
 * Bloque de estado (vacío, sin resultados, error…): ilustración a la izquierda,
 * qué pasó y qué hacer después a la derecha.
 * level=1 cuando el estado ocupa toda la vista: así la página siempre tiene
 * un h1 y el router puede moverle el foco.
 * @param {{type?:string, title:string, text?:string, body?:string, actions?:string, details?:string, art?:string, level?:number}} opts
 *   body: contenido extra bajo el texto (sugerencias, chips…)
 *   details: HTML que va dentro de un <details> «Detalle técnico»
 *   art: 'cladogram' | 'missing' | nombre de un ícono
 */
export function stateBlock({ type = 'empty', title, text = '', body = '', actions = '', details = '', art, level = 2 }) {
  const name = art ?? { empty: 'cladogram', 'no-results': 'missing', error: 'warn' }[type] ?? 'cladogram';
  const figure = ART[name] ?? icons[name]?.(24) ?? '';

  return `
    <section class="state state--${type}" ${type === 'error' ? 'role="alert"' : ''}>
      <span class="state__art ${ART[name] ? 'state__art--drawing' : ''}" aria-hidden="true">${figure}</span>
      <div class="state__body">
        <h${level} class="state__title" ${level === 1 ? 'tabindex="-1"' : ''}>${title}</h${level}>
        ${text ? `<p class="state__text">${text}</p>` : ''}
        ${body}
        ${actions ? `<div class="state__actions">${actions}</div>` : ''}
        ${details ? `<details class="state__details"><summary class="state__summary">Detalle técnico</summary>${details}</details>` : ''}
      </div>
    </section>`;
}

/** Enlace con forma de chip: ejemplos de búsqueda, quitar un filtro… */
export const chip = (href, label) => `<a class="chip" href="${esc(href)}">${label}</a>`;

export function saveButton(saved, label) {
  return `
    <button class="btn btn--secondary btn--save" type="button" data-save aria-pressed="${saved}"
      aria-label="${saved ? 'Quitar de guardadas' : 'Guardar'} ${esc(label)}">
      ${saved ? icons.bookmarkFilled(16) : icons.bookmark(16)}
      <span data-save-text>${saved ? 'Guardada' : 'Guardar'}</span>
    </button>`;
}
