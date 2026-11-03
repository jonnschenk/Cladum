// Especies guardadas: colección local, con búsqueda y "Deshacer"

import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectFavorites, selectPersistFailed, toggleSaved, STORAGE_WARNING,
} from '../features/favorites/favoritesSlice.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { storageAvailable } from '../utils/storage.js';
import { formatDate, rankLabel } from '../utils/format.js';
import { speciesHref } from '../utils/routes.js';
import { StateBlock } from '../components/ui/StateBlock.jsx';
import { TaxonName } from '../components/ui/TaxonName.jsx';
import { Icon } from '../components/ui/Icon.jsx';

const matches = (f, q) => [f.name, f.vernacular, f.family].filter(Boolean).join(' ').toLowerCase().includes(q);

const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** La fila se pliega antes de desaparecer; así se ve qué se quitó. */
function collapse(row) {
  if (!row?.animate) return Promise.resolve();
  if (reduceMotion()) return row.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150 }).finished;
  row.style.overflow = 'hidden';
  return row.animate(
    [
      { opacity: 1, height: `${row.offsetHeight}px` },
      { opacity: 0, height: '0px', paddingTop: '0px', paddingBottom: '0px', marginBottom: '-8px' },
    ],
    { duration: 220, easing: 'cubic-bezier(0.2, 0, 0, 1)' },
  ).finished;
}

function SavedItem({ item, onRemove, removing, restored }) {
  const row = useRef(null);
  const link = useRef(null);
  const meta = [rankLabel(item.rank), item.family, item.vernacular].filter(Boolean).join(' · ');

  // Vuelve con "Deshacer": aparece con un fundido y recibe el foco
  useEffect(() => {
    if (restored) link.current?.focus();
  }, [restored]);

  return (
    <li className={`saved-list__item${restored ? ' u-swap' : ''}`} ref={row}>
      <Link className="saved-list__link" to={speciesHref(item.key)} ref={link}>
        <span className="saved-list__name">
          <TaxonName name={item.name} rank={item.rank} /> <span className="saved-list__author">{item.authorship}</span>
        </span>
        <span className="saved-list__meta">{meta}</span>
      </Link>
      <span className="saved-list__date"><span className="u-visually-hidden">Guardada el </span>{formatDate(item.savedAt)}</span>
      <button
        className="btn btn--ghost btn--sm"
        type="button"
        disabled={removing}
        data-remove
        aria-label={`Quitar ${item.name} de guardadas`}
        onClick={() => onRemove(item, row.current)}
      >
        Quitar
      </button>
    </li>
  );
}

export default function SavedPage() {
  useDocumentTitle('Guardadas');
  const dispatch = useDispatch();
  const favorites = useSelector(selectFavorites);
  const persistFailed = useSelector(selectPersistFailed);
  const [filter, setFilter] = useState('');
  const [removing, setRemoving] = useState(null);
  const filterInput = useRef(null);
  const list = useRef(null);
  // Tras quitar, el foco pasa a la fila que ocupó su lugar
  const focusIndex = useRef(null);

  // Claves ya vistas: una que aparece de nuevo solo puede venir de "Deshacer"
  const seen = useRef(new Set(favorites.map((f) => f.key)));
  const restoredKey = favorites.find((f) => !seen.current.has(f.key))?.key ?? null;
  useEffect(() => {
    seen.current = new Set(favorites.map((f) => f.key));
  }, [favorites]);

  const q = filter.trim().toLowerCase();
  const shown = useMemo(() => (q ? favorites.filter((f) => matches(f, q)) : favorites), [favorites, q]);
  const canStore = useMemo(() => !persistFailed && storageAvailable(), [persistFailed]);

  useEffect(() => {
    if (focusIndex.current === null) return;
    const buttons = [...(list.current?.querySelectorAll('[data-remove]') ?? [])];
    (buttons[focusIndex.current] ?? buttons[focusIndex.current - 1] ?? filterInput.current)?.focus();
    focusIndex.current = null;
  }, [shown]);

  const remove = async (item, row) => {
    setRemoving(item.key);
    await collapse(row).catch(() => {});
    focusIndex.current = shown.findIndex((f) => f.key === item.key);
    dispatch(toggleSaved(item));
    setRemoving(null);
  };

  const clearFilter = () => {
    setFilter('');
    filterInput.current?.focus();
  };

  let content;
  if (!favorites.length) {
    content = (
      <StateBlock
        type="empty"
        art="bookmark"
        title="Aún no guardas especies"
        text="Usa el botón Guardar en la ficha de una especie o en los resultados de búsqueda. Tu colección vive en este navegador, sin cuenta."
        actions={<Link className="btn btn--primary" to="/">Explorar especies</Link>}
      />
    );
  } else if (!shown.length) {
    content = (
      <StateBlock
        type="no-results"
        title={`Nada coincide con «${filter.trim()}»`}
        text="Se busca en el nombre científico, el nombre común y la familia."
        actions={<button className="btn btn--secondary" type="button" onClick={clearFilter}>Limpiar búsqueda</button>}
      />
    );
  } else {
    content = (
      <ul className="saved-list" ref={list}>
        {shown.map((item) => (
          <SavedItem
            key={item.key}
            item={item}
            onRemove={remove}
            removing={removing === item.key}
            restored={item.key === restoredKey}
          />
        ))}
      </ul>
    );
  }

  return (
    <div className="stack u-view-enter">
      <header className="page-head">
        <div className="page-head__text">
          <span className="eyebrow">Colección personal · guardada en este navegador</span>
          <h1 className="page-head__title" tabIndex={-1}>
            Especies guardadas <span className="page-head__count">{favorites.length}</span>
          </h1>
          <p className="page-head__lead">Sin cuenta y sin servidor. Si borras los datos del navegador, se borra la colección.</p>
        </div>
      </header>

      {!canStore && (
        <div className="callout callout--warn" role="status">
          <span className="callout__icon"><Icon name="alert" /></span>
          <span className="callout__body">
            <span className="callout__title">Tu colección no se conservará</span>
            <span className="callout__text">{STORAGE_WARNING}</span>
          </span>
        </div>
      )}

      <div className="search search--compact" role="search">
        <div className="search__box">
          <label className="search__field">
            <Icon name="search" size={18} />
            <span className="u-visually-hidden">Buscar en tu colección</span>
            <input
              className="search__input"
              type="search"
              placeholder="Buscar en tu colección"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              ref={filterInput}
            />
          </label>
        </div>
      </div>

      {content}
    </div>
  );
}
