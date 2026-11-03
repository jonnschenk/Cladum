import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { announce } from '../features/ui/uiSlice.js';

/** Devuelve una función para anunciar un mensaje a lectores de pantalla. */
export function useAnnounce() {
  const dispatch = useDispatch();
  return useCallback((text) => dispatch(announce(text)), [dispatch]);
}
