// ─────────────────────────────────────────────
// Cliente HTTP común (Axios): tiempo máximo, caché en memoria y errores tipados.
// gbif.js e inaturalist.js crean su propio cliente con createApi().
// ─────────────────────────────────────────────

import axios from 'axios';
import { REQUEST_TIMEOUT, RETRY_AFTER_DEFAULT } from '../config.js';

/**
 * Error tipado. `kind` decide el texto y la acción que ve la persona:
 *   timeout     · no respondió en REQUEST_TIMEOUT
 *   rate-limit  · 429, demasiadas consultas (retryAfter en segundos)
 *   unavailable · 5xx, el servicio está caído o en mantenimiento
 *   not-found   · 404, el recurso no existe
 *   offline     · el navegador no tiene conexión
 *   network     · hay conexión, pero no se pudo llegar al servicio
 *   http        · cualquier otra respuesta inesperada
 */
export class ApiError extends Error {
  constructor(kind, { source = 'API', status = null, url = '', retryAfter = null } = {}) {
    super(`${source}: ${kind}${status ? ` (${status})` : ''}`);
    this.name = 'ApiError';
    this.kind = kind;
    this.source = source;
    this.status = status;
    this.url = url;
    this.retryAfter = retryAfter;
  }
}

function kindFromStatus(status) {
  if (status === 404) return 'not-found';
  if (status === 429) return 'rate-limit';
  if (status >= 500) return 'unavailable';
  return 'http';
}

function retryAfterSeconds(headers = {}) {
  const seconds = Number(headers['retry-after']);
  return Number.isFinite(seconds) && seconds > 0 ? seconds : RETRY_AFTER_DEFAULT;
}

/** Quita parámetros vacíos: no deben llegar a la consulta ni a su URL pública. */
function cleanParams(params) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  );
}

/** Traduce un error de Axios a ApiError. Las cancelaciones se devuelven tal cual. */
export function toApiError(error, { source, url }) {
  if (axios.isCancel(error)) return error;
  const { response } = error;
  if (response) {
    return new ApiError(kindFromStatus(response.status), {
      source,
      url,
      status: response.status,
      retryAfter: response.status === 429 ? retryAfterSeconds(response.headers) : null,
    });
  }
  if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') return new ApiError('timeout', { source, url });
  // Sin respuesta ni tiempo agotado: fallo de red
  return new ApiError(navigator.onLine ? 'network' : 'offline', { source, url });
}

/**
 * Cliente para una API pública.
 *   get(path, params, { signal }) → datos de la respuesta (con caché)
 *   url(path, params)             → URL pública de la consulta (trazabilidad)
 */
export function createApi({ baseURL, source, maxCache = 120 }) {
  const client = axios.create({
    baseURL,
    timeout: REQUEST_TIMEOUT,
    headers: { Accept: 'application/json' },
    // Un tiempo agotado llega como ETIMEDOUT y no se confunde con otros cortes
    transitional: { clarifyTimeoutError: true },
  });
  // Caché por URL: evita repetir consultas al navegar entre vistas
  const cache = new Map();

  const url = (path, params = {}) => {
    const href = new URL(baseURL + path);
    Object.entries(cleanParams(params)).forEach(([key, value]) => href.searchParams.set(key, value));
    return href.toString();
  };

  async function get(path, params = {}, { signal } = {}) {
    const href = url(path, params);
    if (cache.has(href)) return cache.get(href);
    try {
      const { data } = await client.get(path, { params: cleanParams(params), signal });
      // Solo se guardan respuestas correctas: un error nunca queda en caché
      if (cache.size >= maxCache) cache.delete(cache.keys().next().value);
      cache.set(href, data);
      return data;
    } catch (error) {
      throw toApiError(error, { source, url: href });
    }
  }

  return { client, get, url, clearCache: () => cache.clear() };
}
