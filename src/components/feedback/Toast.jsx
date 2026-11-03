// Aviso breve con acción opcional ("Deshacer")

import { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectToast, hideToast } from '../../features/ui/uiSlice.js';
import { restoreFavorite } from '../../features/favorites/favoritesSlice.js';
import { Icon } from '../ui/Icon.jsx';

export function Toast() {
  const dispatch = useDispatch();
  const toast = useSelector(selectToast);
  const timer = useRef(null);

  const current = useRef(toast);
  current.current = toast;

  const pause = () => clearTimeout(timer.current);
  const schedule = useCallback(() => {
    clearTimeout(timer.current);
    const shown = current.current;
    if (shown) timer.current = setTimeout(() => dispatch(hideToast(shown.id)), shown.duration);
  }, [dispatch]);

  // Cada aviso nuevo reinicia el tiempo
  useEffect(() => {
    schedule();
    return () => clearTimeout(timer.current);
  }, [toast, schedule]);

  const undo = () => {
    dispatch(restoreFavorite(toast.undo));
    dispatch(hideToast(toast.id));
  };

  return (
    // La región viva siempre existe; el aviso se inserta dentro
    <div className="toast-region" role="status" aria-live="polite">
      {toast && (
        // El tiempo se pausa mientras el aviso tiene el puntero o el foco (WCAG 2.2.1)
        <div className="toast" onMouseEnter={pause} onMouseLeave={schedule} onFocus={pause} onBlur={schedule}>
          <span className="toast__text">
            {toast.icon && <><Icon name={toast.icon} size={14} />{' '}</>}
            {toast.name && <><i lang="la">{toast.name}</i>{' '}</>}
            {toast.text}
          </span>
          {toast.undo && <button className="toast__action" type="button" onClick={undo}>Deshacer</button>}
        </div>
      )}
    </div>
  );
}
