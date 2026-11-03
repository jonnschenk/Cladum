import { useEffect } from 'react';

const BASE = 'Cladum · Explorador de biodiversidad';

/** Título de la pestaña: "<título> · Cladum", o el genérico si aún no hay título. */
export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · Cladum` : BASE;
  }, [title]);
}
