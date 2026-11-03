// Errores en Redux: el estado solo admite datos simples, no instancias de clase

import { createAsyncThunk } from '@reduxjs/toolkit';
import { ApiError } from '../services/http.js';
import { isAbort } from '../utils/net.js';

/** ApiError → objeto plano con lo que necesita la interfaz para explicar el fallo. */
export function toErrorInfo(error) {
  if (error instanceof ApiError) {
    const { kind, status, url, retryAfter, source } = error;
    return { kind, status, url, retryAfter, source };
  }
  return { kind: 'unknown', message: String(error?.message ?? error) };
}

/**
 * createAsyncThunk que pasa la señal de cancelación a los servicios y
 * convierte los errores de la API en un payload serializable.
 */
export const apiThunk = (type, run, options) =>
  createAsyncThunk(type, async (arg, api) => {
    try {
      return await run(arg, api);
    } catch (error) {
      if (isAbort(error)) throw error;
      return api.rejectWithValue(toErrorInfo(error));
    }
  }, options);

/** ¿La respuesta es de la última petición? Las anteriores se descartan. */
export const isLatest = (state, action) => state.requestId === action.meta.requestId;
