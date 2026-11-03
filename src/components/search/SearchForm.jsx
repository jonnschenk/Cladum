// Buscador con sugerencias (patrón combobox de WAI-ARIA) y filtros de rango y estado

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ANY } from '../../features/search/searchSlice.js';
import { useSuggestions } from '../../hooks/useSuggestions.js';
import { useSlowNotice } from '../../hooks/useSlowNotice.js';
import { useAnnounce } from '../../hooks/useAnnounce.js';
import { rankLabel } from '../../utils/format.js';
import { searchHref, speciesHref } from '../../utils/routes.js';
import { TaxonName } from '../ui/TaxonName.jsx';
import { BrandLoader } from '../ui/BrandLoader.jsx';
import { Icon } from '../ui/Icon.jsx';

export const RANKS = [
  ['SPECIES', 'Rango · Especie'],
  ['GENUS', 'Rango · Género'],
  ['FAMILY', 'Rango · Familia'],
  [ANY, 'Rango · Cualquiera'],
];
export const STATUSES = [
  ['ACCEPTED', 'Estado · Aceptado'],
  [ANY, 'Estado · Incluir sinónimos'],
];

// La línea de estado solo se muestra si la consulta tarda: así no parpadea
const LOADING_DELAY = 200;

function Select({ label, options, value, onChange }) {
  return (
    <label className="select">
      <span className="u-visually-hidden">{label}</span>
      <select className="select__control" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map(([v, text]) => <option key={v} value={v}>{text}</option>)}
      </select>
      <span className="select__chevron"><Icon name="chevron" size={14} /></span>
    </label>
  );
}

export function SearchForm({ initial }) {
  const navigate = useNavigate();
  const announce = useAnnounce();
  const [q, setQ] = useState(initial.q);
  const [rank, setRank] = useState(initial.rank);
  const [status, setStatus] = useState(initial.status);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const blurTimer = useRef(null);
  const listbox = useRef(null);

  const suggestions = useSuggestions(q);
  const slowLoading = useSlowNotice(suggestions.status === 'loading', LOADING_DELAY);
  const items = suggestions.status === 'ready' ? suggestions.items : [];
  const showOptions = open && items.length > 0;
  const showEmpty = open && suggestions.status === 'ready' && !items.length;
  const showLoading = open && slowLoading;

  useEffect(() => {
    setActive(-1);
    if (suggestions.status === 'ready' && suggestions.items.length) {
      const n = suggestions.items.length;
      announce(`${n} ${n === 1 ? 'sugerencia disponible' : 'sugerencias disponibles'}`);
    }
  }, [suggestions, announce]);

  useEffect(() => {
    if (active >= 0) listbox.current?.children[active]?.scrollIntoView?.({ block: 'nearest' });
  }, [active]);

  useEffect(() => () => clearTimeout(blurTimer.current), []);

  const close = () => {
    setOpen(false);
    setActive(-1);
  };

  const submit = (next = {}) => {
    close();
    const values = { q: q.trim(), rank, status, ...next };
    navigate(searchHref(values));
  };

  const openOption = (index) => {
    const item = items[index];
    if (!item) return;
    close();
    navigate(speciesHref(item.key));
  };

  const onKeyDown = (event) => {
    if (!open) return;
    if (event.key === 'ArrowDown' && showOptions) {
      event.preventDefault();
      setActive((i) => Math.min(i + 1, items.length - 1));
    } else if (event.key === 'ArrowUp' && showOptions) {
      event.preventDefault();
      setActive((i) => Math.max(i - 1, -1));
    } else if (event.key === 'Enter' && active >= 0) {
      event.preventDefault();
      openOption(active);
    } else if (event.key === 'Escape') {
      close();
    }
  };

  // Los filtros vuelven a buscar al cambiar, si ya hay consulta
  const changeFilter = (setter, field) => (value) => {
    setter(value);
    if (q.trim()) submit({ [field]: value });
  };

  return (
    <form
      className="search"
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <div className="search__box">
        <div className="search__field">
          <Icon name="search" size={20} />
          <div className="search__text">
            <label className="search__label" htmlFor="q">Buscar nombre científico o común</label>
            <input
              className="search__input"
              id="q"
              name="q"
              type="search"
              autoComplete="off"
              spellCheck="false"
              placeholder="Panthera onca, ajolote, Quercus…"
              role="combobox"
              aria-autocomplete="list"
              aria-controls="suggest"
              aria-expanded={showOptions}
              aria-activedescendant={showOptions && active >= 0 ? `suggest-${active}` : undefined}
              value={q}
              onChange={(event) => {
                setQ(event.target.value);
                setOpen(true);
              }}
              onKeyDown={onKeyDown}
              onBlur={() => {
                blurTimer.current = setTimeout(close, 120);
              }}
            />
          </div>
          <button className="btn btn--primary btn--icon" type="submit" aria-label="Buscar"><Icon name="arrow" size={18} /></button>
        </div>
        <div className="suggest" hidden={!(showOptions || showEmpty || showLoading)}>
          <p className="suggest__status" role="status" hidden={showOptions || !(showEmpty || showLoading)}>
            {showLoading && <><BrandLoader size="sm" />Buscando sugerencias…</>}
            {!showLoading && showEmpty && `Sin sugerencias para «${q.trim()}». Pulsa Enter para buscar en todo el texto.`}
          </p>
          <div className="suggest__list" id="suggest" role="listbox" aria-label="Sugerencias" ref={listbox}>
            {showOptions && items.map((item, i) => (
              <div
                key={item.key}
                className="suggest__option"
                role="option"
                id={`suggest-${i}`}
                aria-selected={i === active}
                // mousedown para que el clic llegue antes del blur del input
                onMouseDown={(event) => {
                  event.preventDefault();
                  openOption(i);
                }}
              >
                <span className="suggest__name"><TaxonName name={item.canonicalName || item.scientificName} rank={item.rank} /></span>
                <span className="suggest__meta">
                  {rankLabel(item.rank)}{item.family && item.rank !== 'FAMILY' ? ` · ${item.family}` : ''}
                </span>
              </div>
            ))}
          </div>
          <p className="suggest__hint" aria-hidden="true" hidden={!showOptions}>↑ ↓ para moverte · Enter para abrir · Esc para cerrar</p>
        </div>
      </div>
      <div className="search__filters">
        <Select label="Rango" options={RANKS} value={rank} onChange={changeFilter(setRank, 'rank')} />
        <Select label="Estado taxonómico" options={STATUSES} value={status} onChange={changeFilter(setStatus, 'status')} />
      </div>
    </form>
  );
}
