import { useEffect, useState } from 'react';
import { suggestSpecies } from '../services/gbif.js';
import { SUGGEST_DELAY } from '../config.js';
import { isAbort } from '../utils/net.js';
import { useDebounce } from './useDebounce.js';

const IDLE = { status: 'idle', items: [], query: '' };

/**
 * Sugerencias de GBIF mientras se escribe: espera a que la persona deje de teclear,
 * cancela la consulta anterior y solo busca desde 2 caracteres.
 * status: idle | loading | ready | error
 */
export function useSuggestions(value, delay = SUGGEST_DELAY) {
  const query = useDebounce(value.trim(), delay);
  const [state, setState] = useState(IDLE);

  useEffect(() => {
    if (query.length < 2) {
      setState(IDLE);
      return undefined;
    }
    const controller = new AbortController();
    setState((s) => ({ ...s, status: 'loading', query }));
    suggestSpecies(query, { signal: controller.signal })
      .then((items) => setState({ status: 'ready', items: items ?? [], query }))
      .catch((error) => {
        // Error silencioso: el buscador sigue funcionando con Enter
        if (!isAbort(error)) setState({ status: 'error', items: [], query });
      });
    return () => controller.abort();
  }, [query]);

  return state;
}
