// Utilidades para datos que llegan de la red

/** Solo permite URLs http(s); cualquier otra cosa se descarta. */
export function safeUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : '';
  } catch {
    return '';
  }
}

/** Cancelación deliberada (cambio de vista): no es un error que mostrar. */
export const isAbort = (error) => error?.name === 'AbortError' || error?.name === 'CanceledError';
