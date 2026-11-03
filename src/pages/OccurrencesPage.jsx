import { useParams } from 'react-router-dom';
import { Pending } from './Pending.jsx';

export default function OccurrencesPage() {
  const { key } = useParams();
  return <Pending title={`Ocurrencias de ${key}`} />;
}
