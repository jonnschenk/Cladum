// Movimiento con lógica: lo que CSS solo no puede hacer.
// Todo consulta prefersReducedMotion() y, si está activo, muestra el estado final sin animar.

import { formatNumber } from '../utils/format.js';

const reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

export const prefersReducedMotion = () => reduceQuery.matches;

/**
 * Transición entre vistas con View Transitions API. `update` debe pintar de forma
 * síncrona (el skeleton); lo que llegue después ya no forma parte de la transición.
 * Sin soporte o con movimiento reducido, se pinta directo (las vistas ya traen
 * su propio fundido de respaldo, .u-view-enter).
 */
export function viewTransition(update) {
  if (!document.startViewTransition || prefersReducedMotion()) {
    update();
    return;
  }
  document.documentElement.classList.add('has-view-transitions');
  document.startViewTransition(update);
}

/**
 * Entrada escalonada: cada hijo recibe su orden en --i (el retraso se calcula en CSS,
 * con tope). `from` permite escalonar solo lo recién añadido (p. ej. tras "Cargar más").
 */
export function stagger(container, { from = 0 } = {}) {
  if (!container) return;
  container.classList.add('u-stagger');
  [...container.children].slice(from).forEach((child, i) => child.style.setProperty('--i', i));
}

/**
 * Contador que sube de 0 al total. El número final siempre está en el DOM para
 * lectores de pantalla; lo animado es solo visual. El ancho se reserva antes de
 * empezar para que la etiqueta de al lado no se mueva.
 */
export function countUp(el, value, { duration = 600 } = {}) {
  if (!el || typeof value !== 'number' || value < 10 || prefersReducedMotion()) return;
  const final = formatNumber(value);
  el.innerHTML = `<span aria-hidden="true" data-ticker>${final}</span><span class="u-visually-hidden">${final}</span>`;
  const ticker = el.querySelector('[data-ticker]');
  ticker.style.display = 'inline-block';
  ticker.style.minWidth = `${ticker.getBoundingClientRect().width}px`;

  const start = performance.now();
  const easeOut = (t) => 1 - (1 - t) ** 3;
  const frame = (now) => {
    if (!ticker.isConnected) return;
    const t = Math.min((now - start) / duration, 1);
    ticker.textContent = formatNumber(Math.round(value * easeOut(t)));
    if (t < 1) requestAnimationFrame(frame);
  };
  ticker.textContent = '0';
  requestAnimationFrame(frame);
}

/**
 * Control segmentado con indicador que se desliza al botón activo.
 * Observa aria-pressed, así que la vista solo cambia ese atributo como antes.
 */
export function bindSegmented(group) {
  if (!group || group.querySelector('.segmented__indicator')) return;
  const indicator = document.createElement('span');
  indicator.className = 'segmented__indicator';
  indicator.setAttribute('aria-hidden', 'true');
  group.prepend(indicator);
  group.classList.add('segmented--sliding');

  const place = () => {
    const active = group.querySelector('[aria-pressed="true"]');
    if (!active) return;
    group.style.setProperty('--x', `${active.offsetLeft}px`);
    group.style.setProperty('--y', `${active.offsetTop}px`);
    group.style.setProperty('--w', `${active.offsetWidth}px`);
    group.style.setProperty('--h', `${active.offsetHeight}px`);
  };

  place();
  // La primera posición no se anima: el indicador aparece ya en su sitio
  requestAnimationFrame(() => group.classList.add('segmented--ready'));

  new MutationObserver(place).observe(group, { subtree: true, attributeFilter: ['aria-pressed'] });
  new ResizeObserver(place).observe(group);
}
