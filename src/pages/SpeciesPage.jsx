import { useParams } from 'react-router-dom';
import { Pending } from './Pending.jsx';

export default function SpeciesPage() {
  const { key } = useParams();
  return <Pending title={`Ficha de especie ${key}`} />;
}
