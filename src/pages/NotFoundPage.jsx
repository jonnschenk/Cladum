import { Link } from 'react-router-dom';
import { Pending } from './Pending.jsx';

export default function NotFoundPage() {
  return (
    <Pending title="Página no encontrada">
      Esta dirección no existe en Cladum. <Link to="/">Ir a Explorar</Link>
    </Pending>
  );
}
