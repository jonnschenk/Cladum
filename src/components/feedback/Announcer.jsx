// Región viva oculta: anuncia mensajes breves a lectores de pantalla

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectAnnouncement } from '../../features/ui/uiSlice.js';

export function Announcer() {
  const announcement = useSelector(selectAnnouncement);
  const [text, setText] = useState('');

  useEffect(() => {
    if (!announcement) return undefined;
    // Vaciar primero obliga a repetir el anuncio aunque el texto sea igual
    setText('');
    const frame = requestAnimationFrame(() => setText(announcement.text));
    return () => cancelAnimationFrame(frame);
  }, [announcement]);

  return <p className="u-visually-hidden" role="status" aria-live="polite">{text}</p>;
}
