// Enlaces que salen de Cladum. Solo http(s): cualquier otra URL se descarta.

import { safeUrl } from '../../utils/net.js';

// La flecha es decorativa; el aviso de pestaña nueva se lee en voz alta
const NewTab = () => (
  <>
    <span aria-hidden="true"> ↗</span>
    <span className="u-visually-hidden"> (se abre en una pestaña nueva)</span>
  </>
);

/** Enlace a la consulta exacta de la API que produjo un dato. */
export function ApiLink({ href, children, className = '' }) {
  const url = safeUrl(href);
  if (!url) return null;
  return (
    <a className={`api-link ${className}`.trim()} href={url} target="_blank" rel="noopener noreferrer">
      {children}<NewTab />
    </a>
  );
}

export function ExternalLink({ href, children }) {
  const url = safeUrl(href);
  if (!url) return null;
  return <a href={url} target="_blank" rel="noopener noreferrer">{children}<NewTab /></a>;
}
