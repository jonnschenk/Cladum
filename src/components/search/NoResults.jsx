import { Link } from 'react-router-dom';
import { apiUrl } from '../../services/gbif.js';
import { ANY } from '../../features/search/searchSlice.js';
import { searchHref, speciesHref } from '../../utils/routes.js';
import { StateBlock } from '../ui/StateBlock.jsx';
import { ApiLink } from '../ui/Links.jsx';
import { TaxonName } from '../ui/TaxonName.jsx';
import { RANKS, STATUSES } from './SearchForm.jsx';

const filterLabel = (list, value) => list.find(([v]) => v === value)?.[1].split(' · ')[1] ?? value;

/** Filtros activos que se pueden quitar para ampliar la búsqueda: [etiqueta, parámetros sin ese filtro]. */
export function removableFilters(params) {
  const base = {
    q: params.q, rank: params.rank, status: params.status, higher: params.higher, label: params.label,
    modo: params.textMode ? 'texto' : '',
  };
  const list = [];
  if (params.higher) list.push([`Dentro de: ${params.label || params.higher}`, { ...base, higher: '', label: '' }]);
  if (params.rank !== ANY) list.push([`Rango: ${filterLabel(RANKS, params.rank)}`, { ...base, rank: ANY }]);
  if (params.status !== ANY) list.push([`Estado: ${filterLabel(STATUSES, params.status)}`, { ...base, status: ANY }]);
  return list;
}

export function NoResults({ params, suggestion }) {
  const filters = removableFilters(params);
  const { q } = params;
  return (
    <StateBlock
      type="no-results"
      level={1}
      title={q ? `Ningún taxón coincide con «${q}»` : 'Sin resultados'}
      text={suggestion || filters.length ? '' : 'Revisa la ortografía o prueba con el nombre científico.'}
    >
      {suggestion && (
        <p className="did-you-mean">
          ¿Quisiste decir <Link to={speciesHref(suggestion.key)}><TaxonName name={suggestion.name} rank={suggestion.rank} /></Link>?{' '}
          <span className="did-you-mean__source">
            {suggestion.fuzzy ? 'coincidencia aproximada' : 'coincidencia'} · <ApiLink href={apiUrl('/species/match', { name: q })}>species/match</ApiLink>
          </span>
        </p>
      )}
      {filters.length > 0 && (
        <div className="chip-row">
          <span className="chip-row__label">{suggestion ? 'O amplía la búsqueda quitando un filtro:' : 'Amplía la búsqueda quitando un filtro:'}</span>
          {filters.map(([label, next]) => (
            <Link className="chip" key={label} to={searchHref(next)}>Quitar «{label}»</Link>
          ))}
        </div>
      )}
    </StateBlock>
  );
}
