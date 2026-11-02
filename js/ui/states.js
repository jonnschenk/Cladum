// Estados reutilizables: carga, demora y error.
// Las vistas solo llaman a renderLoading(), withSlowNotice() y renderError().
//
// Los skeletons usan las MISMAS clases que el contenido final (layout, tarjetas,
// filas…) con "huesos" en lugar de texto. Así cada bloque ocupa el sitio exacto
// del dato que va a llegar y el cambio no produce saltos.

import { SLOW_THRESHOLD, REQUEST_TIMEOUT } from '../config.js';
import { GbifError } from '../services/gbif.js';
import { esc } from '../utils/dom.js';
import { stateBlock, apiLink, icons } from './components.js';
import { announce } from '../handlers/feedback.js';

const LOADING_TEXT = 'Consultando GBIF…';
const SLOW_TEXT = 'GBIF está tardando más de lo normal…';

// ── Loader de marca ─────────────────────────
// Un cladograma que se dibuja del tronco a las hojas; los nodos aparecen al final.
// Cada trazo lleva su orden en --step (el retraso se calcula en CSS).
const BRANCHES = [
  ['M2 12H7', 0],
  ['M7 6V18', 1],
  ['M7 6H13M7 18H13', 2],
  ['M13 3.5V8.5M13 15.5V20.5', 3],
  ['M13 3.5H21M13 8.5H21M13 15.5H21M13 20.5H21', 4],
];
const NODES = [3.5, 8.5, 15.5, 20.5];

export function brandLoader(size = 'sm') {
  return `
    <svg class="loader loader--${size}" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
      ${BRANCHES.map(([d, step]) => `<path class="loader__branch" d="${d}" pathLength="1" style="--step:${step}"/>`).join('')}
      ${NODES.map((y, i) => `<circle class="loader__node" cx="21" cy="${y}" r="1.7" style="--step:${5 + i * 0.5}"/>`).join('')}
    </svg>`;
}

// ── Huesos ──────────────────────────────────

/** Hueso de texto: ocupa la altura de línea del elemento que lo contiene. --w en ch o px. */
const bone = (w) => `<span class="bone" style="--w:${w}"></span>`;
/** Hueso con forma propia: píldora, botón o bloque. */
const shape = (kind, w = '', h = '') =>
  `<span class="bone bone--${kind}" style="${w ? `--w:${w};` : ''}${h ? `--h:${h}` : ''}"></span>`;

// El rango sí se conoce de antemano: se muestra, solo el nombre es hueso
const TAX_RANKS = [
  ['Reino', '9ch'], ['Filo', '11ch'], ['Clase', '8ch'], ['Orden', '12ch'],
  ['Familia', '13ch'], ['Género', '9ch'], ['Especie', '15ch'],
];

const taxIndexBones = () => `
  <div class="tax-index">
    <div class="tax-index__head">
      <span class="tax-index__title">Índice taxonómico</span>
      ${shape('pill', '64px')}
    </div>
    <div class="tax-index__list">
      ${TAX_RANKS.map(([rank, w]) => `
        <div class="tax-index__link">
          <span class="tax-index__rank">${rank}</span>
          <span class="tax-index__key">${bone('5ch')}</span>
          <span class="tax-index__name">${bone(w)}</span>
        </div>`).join('')}
    </div>
    <span class="tax-index__note">${bone('90%')}<br>${bone('60%')}</span>
    ${shape('pill', '136px', '32px')}
  </div>`;

/** Encabezado de estado: es lo único que leen los lectores de pantalla. */
const loadingEyebrow = () => `
  <span class="eyebrow loading-label">
    ${brandLoader('sm')}<span data-loading-text>${LOADING_TEXT}</span>
  </span>`;

const SKELETONS = {
  search: () => `
    <div class="layout">
      <div class="layout__aside" aria-hidden="true">${taxIndexBones()}</div>
      <div class="layout__content">
        <div class="page-head">
          <div class="page-head__text">
            ${loadingEyebrow()}
            <div class="page-head__title" aria-hidden="true">${bone('11ch')}</div>
            <div class="page-head__lead" aria-hidden="true">${bone('30ch')}</div>
          </div>
          <span aria-hidden="true">${shape('pill', '128px', '36px')}</span>
        </div>
        <div class="card card--xl result-featured" aria-hidden="true">
          <div class="card__head">${shape('pill', '132px')}${shape('pill', '120px')}</div>
          <div class="result-featured__top">
            <div class="result-featured__heading">
              <div class="result-featured__name">${bone('9ch')}</div>
              <div class="result-featured__author">${bone('15ch')}</div>
            </div>
            <div class="result-featured__actions">${shape('btn', '116px')}${shape('btn', '140px')}</div>
          </div>
          <div class="result-featured__tiles">
            ${['Rango', 'Estado taxonómico', 'Identificador GBIF'].map((label) => `
              <div class="tile"><span class="tile__label">${label}</span><span class="tile__value">${bone('8ch')}</span></div>`).join('')}
          </div>
          <div class="result-featured__names">
            <div class="result-featured__group"><span class="result-featured__common">${bone('10ch')}</span><span class="result-featured__note">${bone('34ch')}</span></div>
            <div class="result-featured__group"><span class="result-featured__family">${bone('14ch')}</span><span class="result-featured__note">${bone('30ch')}</span></div>
          </div>
        </div>
        <div class="results-group" aria-hidden="true">
          <span class="eyebrow">Otros resultados</span>
          <div class="result-list">
            ${['14ch', '18ch', '12ch', '16ch'].map((w) => `
              <div class="result-list__link">
                <span class="result-list__text">
                  <span class="result-list__name">${bone(w)}</span>
                  <span class="result-list__meta">${bone('22ch')}</span>
                </span>
                <span class="result-list__key">${bone('7ch')}</span>
              </div>`).join('')}
          </div>
        </div>
      </div>
    </div>`,

  species: () => `
    <div class="layout">
      <div class="layout__aside" aria-hidden="true">${taxIndexBones()}</div>
      <div class="layout__content">
        <div class="species-hero">
          <div class="species-hero__text">
            ${loadingEyebrow()}
            <div class="species-hero__name" aria-hidden="true">${bone('10ch')}</div>
            <div class="species-hero__sub" aria-hidden="true">${bone('24ch')}</div>
          </div>
          <div class="page-head__badges" aria-hidden="true">${shape('pill', '150px', '34px')}${shape('btn', '124px')}</div>
        </div>
        <div class="grid-auto grid-auto--start" style="--min:400px" aria-hidden="true">
          <div class="photo-card">
            <div class="photo-card__figure">
              <span class="photo-card__img bone bone--fill"></span>
              <div class="photo-card__caption">
                <span class="photo-card__credit">${bone('26ch')}</span>
                <span>${shape('pill', '150px')} ${shape('pill', '130px')}</span>
                <span>${shape('pill', '180px')}</span>
              </div>
            </div>
            <div class="photo-card__thumbs">${Array.from({ length: 5 }, () => '<span class="photo-card__thumb bone bone--fill"></span>').join('')}</div>
          </div>
          <div class="card">
            <div class="card__head"><span class="card__title">Identidad y nomenclatura</span>${shape('pill', '120px')}</div>
            <div class="def-list">
              <div class="def-list__row"><span class="def-list__term">Nombre común</span><span class="def-list__desc">${bone('16ch')}<span class="def-list__note">${bone('90%')}</span></span></div>
              ${[['Autoría', '14ch'], ['Rango', '10ch'], ['Estado taxonómico', '12ch'], ['Identificador GBIF', '8ch']].map(([term, w]) => `
                <div class="def-list__row"><span class="def-list__term">${term}</span><span class="def-list__desc">${bone(w)}</span></div>`).join('')}
            </div>
            ${shape('pill', '220px', '34px')}
          </div>
        </div>
        <div class="card card--xl" aria-hidden="true">
          <div class="card__head"><span class="eyebrow">Ocurrencias documentadas</span>${shape('pill', '120px')}</div>
          <div class="split-row">
            <div class="split-row__main">
              <div class="count"><span class="count__num">${bone('6ch')}</span><span class="count__label">registros con coordenadas</span></div>
              <span class="split-row__code">${bone('32ch')}</span>
            </div>
            ${shape('btn', '150px')}
          </div>
        </div>
      </div>
    </div>`,

  occurrences: ({ countLabel = 'registros' }) => `
    <div class="layout">
      <div class="layout__aside" aria-hidden="true">${taxIndexBones()}</div>
      <div class="layout__content">
        <div class="species-hero">
          <div class="species-hero__text">
            ${loadingEyebrow()}
            <div class="species-hero__name species-hero__name--sm" aria-hidden="true">${bone('10ch')}</div>
            <div class="species-hero__sub" aria-hidden="true">${bone('14ch')}</div>
          </div>
          <div class="page-head__badges" aria-hidden="true">${shape('pill', '150px', '34px')}${shape('pill', '130px')}</div>
        </div>
        <div class="toolbar" aria-hidden="true">
          ${shape('pill', '170px', '52px')}${shape('pill', '200px', '44px')}
          <span class="toolbar__end">${shape('pill', '200px', '48px')}</span>
        </div>
        <div class="split-row" aria-hidden="true">
          <div class="split-row__main">
            <div class="count count--sm"><span class="count__num">${bone('6ch')}</span><span class="count__label">${esc(countLabel)}</span></div>
            <span class="split-row__note">${bone('34ch')}</span>
          </div>
          ${shape('pill', '120px', '36px')}
        </div>
        <div class="card card--flush records" aria-hidden="true">
          <div class="records__head"><span>ID GBIF</span><span>País / región</span><span>Observación</span><span>Observador/a</span><span>Incertidumbre</span><span>Calidad</span></div>
          <div class="records__list">
            ${['70%', '55%', '80%', '62%', '74%', '58%', '66%', '50%'].map((w) => `
              <div class="records__row">
                <span class="records__cols">
                  <span class="records__id">${bone('10ch')}</span>
                  <span class="records__place"><span class="records__country">${bone(w)}</span><span class="records__sub">${bone('60%')}</span></span>
                  <span class="records__date">${bone('9ch')}</span>
                  <span class="records__observer">${bone(w)}</span>
                  <span class="records__uncertainty">${bone('6ch')}</span>
                  <span class="records__quality"><span class="records__issues">${bone('12ch')}</span><span class="records__basis">${bone('14ch')}</span></span>
                </span>
              </div>`).join('')}
          </div>
        </div>
      </div>
    </div>`,
};

/**
 * Pinta el skeleton de una vista. `before` permite conservar piezas reales
 * que ya se conocen (p. ej. el enlace "Volver"); el resto de opciones pasa
 * al skeleton (p. ej. countLabel en ocurrencias).
 */
export function renderLoading(container, view, { before = '', ...opts } = {}) {
  container.innerHTML = `
    ${before}
    <div class="skeleton-view" role="status" aria-busy="true" data-loading>
      ${SKELETONS[view](opts)}
    </div>`;
}

/**
 * Si la promesa tarda más de SLOW_THRESHOLD, cambia el texto de carga de `root`.
 * Solo se reemplaza el texto: el loader sigue su animación sin reiniciarse.
 */
export function withSlowNotice(promise, root) {
  const timer = setTimeout(() => {
    root.querySelectorAll('[data-loading]').forEach((el) => el.classList.add('is-slow'));
    root.querySelectorAll('[data-loading-text]').forEach((el) => {
      el.textContent = SLOW_TEXT;
    });
  }, SLOW_THRESHOLD);
  return Promise.resolve(promise).finally(() => clearTimeout(timer));
}

// ── Errores ─────────────────────────────────

const ERROR_COPY = {
  timeout: {
    title: 'GBIF no respondió a tiempo',
    text: `La consulta superó los ${REQUEST_TIMEOUT / 1000} segundos y se canceló. Lo que buscabas se conserva.`,
  },
  'rate-limit': {
    title: 'Demasiadas consultas seguidas',
    text: 'GBIF limita cuántas consultas se hacen por minuto. Espera unos segundos y vuelve a intentarlo.',
  },
  unavailable: {
    title: 'GBIF no está disponible ahora',
    text: 'El servicio respondió con un error. No es un problema de tu conexión: suele resolverse en unos minutos.',
  },
  'not-found': {
    title: 'No encontramos este dato',
    text: 'GBIF no tiene un registro con ese identificador.',
  },
  offline: {
    title: 'Estás sin conexión',
    text: 'Cladum necesita internet para consultar GBIF. Revisa tu conexión y vuelve a intentarlo.',
  },
  network: {
    title: 'No se pudo conectar con GBIF',
    text: 'Tu conexión funciona, pero GBIF no respondió. Inténtalo de nuevo en un momento.',
  },
  http: {
    title: 'GBIF respondió algo inesperado',
    text: 'La consulta no se pudo completar. Inténtalo de nuevo.',
  },
};

const KIND_LABELS = {
  timeout: 'Tiempo agotado',
  'rate-limit': 'Límite de consultas (429)',
  unavailable: 'Servicio no disponible',
  'not-found': 'No encontrado (404)',
  offline: 'Sin conexión',
  network: 'Error de red',
  http: 'Respuesta inesperada',
};

/** Detalle técnico plegado: tipo, código y la consulta exacta que falló. */
function technicalDetails(error) {
  if (!(error instanceof GbifError)) return '';
  return `
    <dl class="state__tech">
      <dt>Tipo</dt><dd>${esc(KIND_LABELS[error.kind] ?? error.kind)}</dd>
      ${error.status ? `<dt>Código</dt><dd>${esc(error.status)}</dd>` : ''}
      ${error.url ? `<dt>Consulta</dt><dd>${apiLink(error.url, error.url.replace(/^https:\/\//, ''))}</dd>` : ''}
    </dl>`;
}

// Reintentos automáticos: se cancelan solos si el bloque deja de estar en pantalla
function startCountdown(container, seconds, onDone) {
  const number = container.querySelector('[data-countdown]');
  let left = seconds;
  const timer = setInterval(() => {
    if (!container.isConnected) {
      clearInterval(timer);
      return;
    }
    left -= 1;
    if (number) number.textContent = String(left);
    if (left <= 0) {
      clearInterval(timer);
      announce('Reintentando la consulta');
      onDone();
    }
  }, 1000);
  return () => clearInterval(timer);
}

function retryWhenOnline(container, onRetry) {
  const handler = () => {
    if (container.isConnected) onRetry();
  };
  window.addEventListener('online', handler, { once: true });
}

/**
 * Pinta el estado de error según su tipo.
 * @param {HTMLElement} container
 * @param {unknown} error
 * @param {{ onRetry?: () => void, copy?: Record<string,{title?:string,text?:string}>, actions?: string,
 *           level?: number, focus?: boolean }} opts
 *   copy: textos propios de la vista por tipo (p. ej. un 404 de especie).
 *   focus: mueve el foco a Reintentar (errores que aparecen tras una acción en la misma vista).
 *          Sin él, el título h1 recibe el foco desde el router.
 *
 * 429 → cuenta regresiva y reintento automático. Sin conexión → reintenta al volver la red.
 */
export function renderError(container, error, { onRetry, copy = {}, actions = '', level = 1, focus = false } = {}) {
  const kind = error instanceof GbifError ? error.kind : 'unknown';
  const base = ERROR_COPY[kind] ?? { title: 'Algo salió mal', text: 'Recarga la página para intentarlo de nuevo.' };
  const { title, text } = { ...base, ...copy[kind] };
  const canRetry = onRetry && kind !== 'not-found';
  const wait = kind === 'rate-limit' ? error.retryAfter : 0;

  let body = '';
  if (canRetry && wait) {
    // El número es visual; la frase oculta se lee una sola vez con la alerta
    body = `
      <p class="countdown">${icons.clock(16)}<span aria-hidden="true">Reintentando en <span data-countdown>${wait}</span>&nbsp;s</span>
      <span class="u-visually-hidden">Se reintentará automáticamente en ${wait} segundos.</span></p>`;
  } else if (canRetry && kind === 'offline') {
    body = '<p class="countdown">Se reintentará en cuanto vuelva la conexión.</p>';
  }

  const retry = canRetry
    ? `<button class="btn btn--primary" type="button" data-retry>${wait ? 'Reintentar ahora' : 'Reintentar'}</button>`
    : '';

  container.innerHTML = stateBlock({
    type: 'error',
    art: kind === 'offline' ? 'offline' : kind === 'timeout' ? 'clock' : 'warn',
    title: esc(title),
    text: esc(text),
    body,
    actions: retry + actions,
    details: technicalDetails(error),
    level,
  });

  if (!canRetry) return;
  let stop = () => {};
  const run = () => {
    stop();
    onRetry();
  };
  container.querySelector('[data-retry]').addEventListener('click', run);
  if (wait) stop = startCountdown(container, wait, run);
  if (kind === 'offline') retryWhenOnline(container, run);
  if (focus) container.querySelector('[data-retry]').focus();
}

// ── Cargar más ──────────────────────────────

/**
 * Estados del botón "Cargar más": cargando (spinner, el único permitido),
 * error con reintento, y fin de la lista con el total mostrado.
 */
export const loadMore = {
  loading(button) {
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    button.innerHTML = `<span class="spinner">${icons.spinner(16)}</span>Cargando…`;
  },
  idle(button) {
    button.disabled = false;
    button.removeAttribute('aria-busy');
    button.textContent = 'Cargar más';
  },
  error(button) {
    button.disabled = false;
    button.removeAttribute('aria-busy');
    button.innerHTML = `${icons.alert(16)}No se pudo cargar · Reintentar`;
    button.focus();
    announce('No se pudieron cargar más resultados. Puedes reintentar.');
  },
  /** Reemplaza el botón por el aviso de fin de lista; si el botón tenía el foco, lo recibe el aviso. */
  end(wrapper, text) {
    const hadFocus = wrapper.contains(document.activeElement);
    wrapper.innerHTML = `<p class="load-more__end" tabindex="-1">${esc(text)}</p>`;
    if (hadFocus) wrapper.firstElementChild.focus();
  },
};
