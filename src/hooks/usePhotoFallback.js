import { useCallback, useEffect, useRef, useState } from 'react';
import { getInatPhotos } from '../services/photos.js';

/**
 * Mantiene una lista de fotos sin huecos: la que no carga en el navegador se retira
 * y, si se caen todas las de GBIF, se piden las de iNaturalist una sola vez.
 *
 * @returns photos     lista vigente
 *          broken     true si alguna foto falló al cargar (para explicar el vacío)
 *          markBroken (url) => void, para el onError de cada <img>
 */
export function usePhotoFallback(initial, name) {
  const [photos, setPhotos] = useState(initial);
  const [broken, setBroken] = useState(false);
  // Si la lista ya viene de iNaturalist (o vacía tras consultar ambas), no hay más respaldo
  const fallbackTried = useRef(initial[0]?.source !== 'gbif');

  useEffect(() => {
    setPhotos(initial);
    setBroken(false);
    fallbackTried.current = initial[0]?.source !== 'gbif';
  }, [initial]);

  const markBroken = useCallback((url) => {
    setBroken(true);
    setPhotos((list) => list.filter((p) => p.url !== url));
  }, []);

  useEffect(() => {
    if (photos.length || fallbackTried.current) return undefined;
    fallbackTried.current = true;
    let active = true;
    let pending = true;
    getInatPhotos(name)
      .catch(() => [])
      .then((list) => {
        pending = false;
        if (active) setPhotos(list);
      });
    return () => {
      active = false;
      // Desmontado antes de responder: se podrá intentar de nuevo
      if (pending) fallbackTried.current = false;
    };
  }, [photos.length, name]);

  return { photos, broken, markBroken };
}
