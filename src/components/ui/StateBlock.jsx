// Bloque de estado (vacío, sin resultados, error…): ilustración, qué pasó y qué hacer después.

import { Icon } from './Icon.jsx';

// Variaciones del cladograma de la marca.
// Completo = hay algo por explorar; con una rama punteada = no se encontró.
const Cladogram = () => (
  <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <path d="M4 24h10M14 12v24M14 12h12M14 36h12M26 7v10M26 31v10M26 7h16M26 17h16M26 31h16M26 41h16" />
    {[7, 17, 31, 41].map((y) => <circle key={y} cx="42" cy={y} r="2.6" fill="currentColor" stroke="none" />)}
  </svg>
);

const Missing = () => (
  <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <path d="M4 24h10M14 12v24M14 12h12M26 7v10M26 7h16M26 17h16" />
    <path d="M14 36h12M26 31v10M26 31h16M26 41h16" strokeDasharray="2 4" />
    <circle cx="42" cy="7" r="2.6" fill="currentColor" stroke="none" />
    <circle cx="42" cy="17" r="2.6" fill="currentColor" stroke="none" />
    <circle cx="42" cy="31" r="3" strokeDasharray="2 2.6" />
    <circle cx="42" cy="41" r="3" strokeDasharray="2 2.6" />
  </svg>
);

const DRAWINGS = { cladogram: Cladogram, missing: Missing };
const DEFAULT_ART = { empty: 'cladogram', 'no-results': 'missing', error: 'warn' };

/**
 * level=1 cuando el estado ocupa toda la vista: así la página siempre tiene
 * un h1 y puede recibir el foco al cambiar de ruta.
 *   art: 'cladogram' | 'missing' | nombre de un ícono
 *   details: contenido del <details> «Detalle técnico»
 */
export function StateBlock({ type = 'empty', title, text, children, actions, details, art, level = 2 }) {
  const name = art ?? DEFAULT_ART[type] ?? 'cladogram';
  const Drawing = DRAWINGS[name];
  const Heading = `h${level}`;

  return (
    <section className={`state state--${type}`} role={type === 'error' ? 'alert' : undefined}>
      <span className={`state__art${Drawing ? ' state__art--drawing' : ''}`} aria-hidden="true">
        {Drawing ? <Drawing /> : <Icon name={name} size={24} />}
      </span>
      <div className="state__body">
        <Heading className="state__title" tabIndex={level === 1 ? -1 : undefined}>{title}</Heading>
        {text && <p className="state__text">{text}</p>}
        {children}
        {actions && <div className="state__actions">{actions}</div>}
        {details && (
          <details className="state__details">
            <summary className="state__summary">Detalle técnico</summary>
            {details}
          </details>
        )}
      </div>
    </section>
  );
}
