import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { StateBlock } from '../components/ui/StateBlock.jsx';

export default function NotFoundPage() {
  useDocumentTitle('Página no encontrada');
  return (
    <StateBlock
      type="no-results"
      level={1}
      title="Página no encontrada"
      text="Esta dirección no existe en Cladum."
      actions={<Link className="btn btn--primary" to="/">Ir a Explorar</Link>}
    />
  );
}
