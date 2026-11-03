// Estado de error según su tipo, con reintento.
// 429 → cuenta regresiva y reintento automático. Sin conexión → reintenta al volver la red.

import { useEffect, useRef } from 'react';
import { REQUEST_TIMEOUT } from '../../config.js';
import { useCountdown } from '../../hooks/useCountdown.js';
import { useAnnounce } from '../../hooks/useAnnounce.js';
import { StateBlock } from './StateBlock.jsx';
import { ApiLink } from './Links.jsx';
import { Icon } from './Icon.jsx';

export const ERROR_COPY = {
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
  unknown: {
    title: 'Algo salió mal',
    text: 'Recarga la página para intentarlo de nuevo.',
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

const ART = { offline: 'offline', timeout: 'clock' };

/** Detalle plegado: tipo, código y la consulta exacta que falló. */
function TechnicalDetails({ error }) {
  return (
    <dl className="state__tech">
      <dt>Tipo</dt><dd>{KIND_LABELS[error.kind] ?? error.kind}</dd>
      {error.status && <><dt>Código</dt><dd>{error.status}</dd></>}
      {error.url && <><dt>Consulta</dt><dd><ApiLink href={error.url}>{error.url.replace(/^https:\/\//, '')}</ApiLink></dd></>}
    </dl>
  );
}

/**
 * @param error  { kind, status, url, retryAfter } (ver features/errors.js)
 * @param copy   textos propios de la vista por tipo (p. ej. un 404 de especie)
 * @param focus  mueve el foco a Reintentar (errores que aparecen tras una acción en la misma vista)
 */
export function ErrorState({ error, onRetry, copy = {}, actions, level = 1, focus = false }) {
  const kind = ERROR_COPY[error?.kind] ? error.kind : 'unknown';
  const { title, text } = { ...ERROR_COPY[kind], ...copy[kind] };
  const canRetry = Boolean(onRetry) && kind !== 'not-found';
  const wait = canRetry && kind === 'rate-limit' ? error.retryAfter ?? 0 : 0;
  const announce = useAnnounce();
  const retryButton = useRef(null);

  const left = useCountdown(wait, () => {
    announce('Reintentando la consulta');
    onRetry();
  });

  useEffect(() => {
    if (!canRetry || kind !== 'offline') return undefined;
    window.addEventListener('online', onRetry, { once: true });
    return () => window.removeEventListener('online', onRetry);
  }, [canRetry, kind, onRetry]);

  useEffect(() => {
    if (focus) retryButton.current?.focus();
  }, [focus]);

  return (
    <StateBlock
      type="error"
      art={ART[kind] ?? 'warn'}
      title={title}
      text={text}
      level={level}
      details={KIND_LABELS[kind] ? <TechnicalDetails error={error} /> : null}
      actions={(canRetry || actions) && (
        <>
          {canRetry && (
            <button className="btn btn--primary" type="button" onClick={onRetry} ref={retryButton}>
              {wait ? 'Reintentar ahora' : 'Reintentar'}
            </button>
          )}
          {actions}
        </>
      )}
    >
      {wait > 0 && (
        // El número es visual; la frase oculta se lee una sola vez con la alerta
        <p className="countdown">
          <Icon name="clock" />
          <span aria-hidden="true">Reintentando en {left}&nbsp;s</span>
          <span className="u-visually-hidden">Se reintentará automáticamente en {wait} segundos.</span>
        </p>
      )}
      {canRetry && kind === 'offline' && <p className="countdown">Se reintentará en cuanto vuelva la conexión.</p>}
    </StateBlock>
  );
}
