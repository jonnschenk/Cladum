import { useLocation } from 'react-router-dom';

/** Muestra la ruta actual para que las pruebas comprueben la navegación. */
export function LocationProbe() {
  const { pathname, search } = useLocation();
  return <output data-testid="location">{pathname + search}</output>;
}
