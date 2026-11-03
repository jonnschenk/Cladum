import { formatDate, formatMeters, countryName, basisLabel } from '../../utils/format.js';
import { isGeneralized } from '../../utils/records.js';
import { Icon } from '../ui/Icon.jsx';

// Las cabeceras de columna están ocultas a lectores de pantalla,
// así que la etiqueta de cada fila nombra cada dato.
export function rowLabel(r) {
  const issues = r.issues?.length ?? 0;
  const place = [r.stateProvince, r.locality].filter(Boolean).join(', ');
  return [
    `Registro ${r.key}`,
    [countryName(r.countryCode) || 'país sin dato', place].filter(Boolean).join(', '),
    `observado: ${formatDate(r.eventDate) || 'sin fecha'}`,
    `por ${r.recordedBy || 'observador sin dato'}`,
    `incertidumbre: ${formatMeters(r.coordinateUncertaintyInMeters) || 'sin dato'}`,
    issues ? `${issues} ${issues === 1 ? 'incidencia' : 'incidencias'}` : 'sin incidencias',
    isGeneralized(r) ? 'ubicación generalizada' : basisLabel(r.basisOfRecord),
  ].join('; ');
}

export function RecordRow({ record: r, selected, onSelect }) {
  const issues = r.issues?.length ?? 0;
  const place = [r.stateProvince, r.locality].filter(Boolean).join(', ');
  return (
    <li>
      <button className="records__row" type="button" aria-pressed={selected} aria-label={rowLabel(r)} onClick={onSelect}>
        <span className="records__cols">
          <span className="records__id">{r.key}</span>
          <span className="records__place">
            <span className="records__country">{countryName(r.countryCode) || '—'}</span>
            <span className="records__sub">{place || 'Sin región'}</span>
          </span>
          <span className="records__date">{formatDate(r.eventDate) || '—'}</span>
          <span className="records__observer">{r.recordedBy || '—'}</span>
          <span className="records__uncertainty">{formatMeters(r.coordinateUncertaintyInMeters) || '—'}</span>
          <span className="records__quality">
            {issues ? (
              <span className="records__issues"><Icon name="warn" size={14} />{issues} {issues === 1 ? 'incidencia' : 'incidencias'}</span>
            ) : (
              <span className="records__issues records__issues--none"><Icon name="check" size={14} />Sin incidencias</span>
            )}
            <span className="records__basis">{isGeneralized(r) ? 'Generalizado' : basisLabel(r.basisOfRecord)}</span>
          </span>
        </span>
      </button>
    </li>
  );
}
