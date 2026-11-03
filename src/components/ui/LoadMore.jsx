// "Cargar más": cargando (spinner, el único permitido), error con reintento y fin de la lista

import { useEffect, useRef } from 'react';
import { useAnnounce } from '../../hooks/useAnnounce.js';
import { Icon } from './Icon.jsx';

export function LoadMore({ status, done, endText, onMore }) {
  const wrap = useRef(null);
  const button = useRef(null);
  const end = useRef(null);
  // Si el botón tenía el foco al terminar la lista, lo recibe el aviso de fin
  const hadFocus = useRef(false);
  const announce = useAnnounce();

  useEffect(() => {
    if (status !== 'failed') return;
    button.current?.focus();
    announce('No se pudieron cargar más resultados. Puedes reintentar.');
  }, [status, announce]);

  useEffect(() => {
    if (done && hadFocus.current) end.current?.focus();
  }, [done]);

  const handleClick = () => {
    hadFocus.current = wrap.current?.contains(document.activeElement) ?? false;
    onMore();
  };

  return (
    <div className="load-more" ref={wrap}>
      {done ? (
        <p className="load-more__end" tabIndex={-1} ref={end}>{endText}</p>
      ) : (
        <button
          className="btn btn--secondary"
          type="button"
          ref={button}
          onClick={handleClick}
          disabled={status === 'loading'}
          aria-busy={status === 'loading' || undefined}
        >
          {status === 'loading' && <><span className="spinner"><Icon name="spinner" /></span>Cargando…</>}
          {status === 'failed' && <><Icon name="alert" />No se pudo cargar · Reintentar</>}
          {status === 'idle' && 'Cargar más'}
        </button>
      )}
    </div>
  );
}
