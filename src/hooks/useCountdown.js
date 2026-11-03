import { useEffect, useRef, useState } from 'react';

/**
 * Cuenta regresiva en segundos. Al llegar a cero llama a `onDone` una vez.
 * Con seconds = 0 no hace nada. Se detiene sola al desmontar el componente.
 */
export function useCountdown(seconds, onDone) {
  const [left, setLeft] = useState(seconds);
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    setLeft(seconds);
    if (!seconds) return undefined;
    let remaining = seconds;
    const timer = setInterval(() => {
      remaining -= 1;
      setLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        done.current?.();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [seconds]);

  return left;
}
