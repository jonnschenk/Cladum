import { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

/**
 * Despacha `thunk(arg)` al montar y cada vez que cambia `arg`; la petición anterior
 * se cancela al salir de la vista o al cambiar de argumento.
 * Devuelve `retry`, que vuelve a despacharla.
 */
export function useThunk(thunk, arg, { enabled = true } = {}) {
  const dispatch = useDispatch();
  const [attempt, setAttempt] = useState(0);
  // Por valor, no por referencia: un objeto nuevo con los mismos datos no repite la consulta
  const argKey = JSON.stringify(arg);

  useEffect(() => {
    if (!enabled) return undefined;
    const promise = dispatch(thunk(JSON.parse(argKey)));
    return () => promise.abort();
  }, [dispatch, thunk, argKey, attempt, enabled]);

  return useCallback(() => setAttempt((n) => n + 1), []);
}
