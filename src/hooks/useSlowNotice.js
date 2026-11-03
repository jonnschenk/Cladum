import { useEffect, useState } from 'react';
import { SLOW_THRESHOLD } from '../config.js';

/** true si `loading` lleva más de SLOW_THRESHOLD ms activo (para avisar de la demora). */
export function useSlowNotice(loading, threshold = SLOW_THRESHOLD) {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    setSlow(false);
    if (!loading) return undefined;
    const timer = setTimeout(() => setSlow(true), threshold);
    return () => clearTimeout(timer);
  }, [loading, threshold]);
  return loading && slow;
}
