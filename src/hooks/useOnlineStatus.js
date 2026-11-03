import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setOnline, selectOnline } from '../features/ui/uiSlice.js';

/** Sincroniza el estado de conexión del navegador con Redux y lo devuelve. */
export function useOnlineStatus() {
  const dispatch = useDispatch();
  const online = useSelector(selectOnline);

  useEffect(() => {
    const update = () => dispatch(setOnline(navigator.onLine));
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, [dispatch]);

  return online;
}
