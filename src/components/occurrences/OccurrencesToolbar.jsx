import { formatNumber, countryName } from '../../utils/format.js';
import { Icon } from '../ui/Icon.jsx';

export function OccurrencesToolbar({ countries, filters, view, onFilter, onView }) {
  return (
    <div className="toolbar">
      <label className="select">
        <span className="u-visually-hidden">País</span>
        <select className="select__control" value={filters.country} onChange={(e) => onFilter({ country: e.target.value })}>
          <option value="">País · Todos</option>
          {countries.map((c) => (
            <option key={c.name} value={c.name}>{countryName(c.name)} · {formatNumber(c.count)}</option>
          ))}
        </select>
        <span className="select__chevron"><Icon name="chevron" size={14} /></span>
      </label>
      <label className="switch">
        <input
          className="switch__input"
          type="checkbox"
          role="switch"
          checked={filters.coords}
          onChange={(e) => onFilter({ coords: e.target.checked })}
        />
        Solo con coordenadas
      </label>
      <div className="segmented toolbar__end" role="group" aria-label="Vista">
        <button className="segmented__btn" type="button" aria-pressed={view === 'list'} onClick={() => onView('list')}>
          <Icon name="list" />Lista
        </button>
        <button className="segmented__btn" type="button" aria-pressed={view === 'map'} onClick={() => onView('map')}>
          <Icon name="map" />Mapa
        </button>
      </div>
    </div>
  );
}
