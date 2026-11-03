import { useDispatch, useSelector } from 'react-redux';
import { selectIsFavorite, toggleSaved } from '../../features/favorites/favoritesSlice.js';
import { Icon } from './Icon.jsx';

/**
 * Guarda o quita una especie de la colección.
 * @param taxon { key, name, authorship, vernacular, family, rank }
 */
export function SaveButton({ taxon }) {
  const dispatch = useDispatch();
  const saved = useSelector(selectIsFavorite(taxon.key));
  return (
    <button
      className="btn btn--secondary btn--save"
      type="button"
      aria-pressed={saved}
      aria-label={`${saved ? 'Quitar de guardadas' : 'Guardar'} ${taxon.name}`}
      onClick={() => dispatch(toggleSaved(taxon))}
    >
      <Icon name={saved ? 'bookmarkFilled' : 'bookmark'} />
      <span>{saved ? 'Guardada' : 'Guardar'}</span>
    </button>
  );
}
