import { useEffect, useState } from 'react';

/** Devuelve `value` solo cuando deja de cambiar durante `delay` ms. */
export function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
