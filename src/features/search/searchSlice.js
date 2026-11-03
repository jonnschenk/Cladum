// Búsqueda de taxones: resultados, "Cargar más" y "¿Quisiste decir…?"

import { createSlice } from '@reduxjs/toolkit';
import { searchSpecies, matchName } from '../../services/gbif.js';
import { apiThunk, isLatest } from '../errors.js';
import { isAbort } from '../../utils/net.js';
import { findGenus } from './findGenus.js';
import { sortByRelevance } from './relevance.js';

// "ALL" representa "sin filtro" en la URL (un valor vacío se perdería al construirla)
export const ANY = 'ALL';
export const apiFilter = (value) => (value === ANY ? undefined : value);

/** Parámetros de búsqueda a partir de la URL (?q=…&rank=…). */
export function searchParamsFrom(params) {
  return {
    q: params.get('q') ?? '',
    rank: params.get('rank') || 'SPECIES',
    status: params.get('status') || 'ACCEPTED',
    higher: params.get('higher') ?? '',
    label: params.get('label') ?? '',
    textMode: params.get('modo') === 'texto',
  };
}

/** Lo que realmente se envía a GBIF. En modo género cambia respecto a lo que se escribió. */
const apiQuery = (params, query, offset = 0) => ({
  q: query.apiQ,
  rank: apiFilter(params.rank),
  status: apiFilter(params.status),
  higherTaxonKey: query.higherTaxonKey,
  offset,
});

// Una sola palabra buscando especies: puede ser un género («Giardia», «Quercus»)
const mayBeGenus = (p) => p.q && !p.higher && p.rank === 'SPECIES' && !p.textMode && /^\S+$/.test(p.q.trim());

export const fetchSearch = apiThunk('search/fetch', async (params, { signal }) => {
  let query = { apiQ: params.q, higherTaxonKey: params.higher || undefined, genus: null };

  if (mayBeGenus(params)) {
    try {
      const genus = await findGenus(params.q.trim(), { signal });
      if (genus) query = { apiQ: '', higherTaxonKey: genus.key, genus };
    } catch (error) {
      if (isAbort(error)) throw error;
      // Si la detección falla, se sigue con la búsqueda normal por texto
    }
  }

  const data = await searchSpecies(apiQuery(params, query), { signal });

  // Sin resultados: se busca una coincidencia aproximada para sugerirla
  let suggestion = null;
  if (!data.results?.length && params.q) {
    try {
      const match = await matchName(params.q, { signal });
      if (match?.usageKey && match.matchType !== 'NONE') {
        suggestion = {
          key: match.usageKey,
          name: match.canonicalName || match.scientificName,
          rank: match.rank,
          fuzzy: match.matchType === 'FUZZY',
        };
      }
    } catch (error) {
      if (isAbort(error)) throw error;
    }
  }

  return { data, query, suggestion };
});

export const fetchMoreResults = apiThunk('search/fetchMore', async (_, { getState, signal }) => {
  const { params, query, offset, requestId } = getState().search;
  const page = await searchSpecies(apiQuery(params, query, offset), { signal });
  // Se anota a qué búsqueda pertenece: si mientras tanto cambió, la página se descarta
  return { page, searchId: requestId };
});

const initialState = {
  requestId: null,
  status: 'idle',
  params: null,
  query: null,
  results: [],
  count: 0,
  offset: 0,
  endOfRecords: true,
  suggestion: null,
  error: null,
  more: 'idle',
};

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSearch.pending, (state, action) => {
        Object.assign(state, initialState, {
          requestId: action.meta.requestId,
          status: 'loading',
          params: action.meta.arg,
        });
      })
      .addCase(fetchSearch.fulfilled, (state, action) => {
        if (!isLatest(state, action)) return;
        const { data, query, suggestion } = action.payload;
        state.status = 'succeeded';
        state.query = query;
        // Solo la primera página se reordena: lo que llega con "Cargar más" se añade al final
        state.results = sortByRelevance(data.results ?? [], state.params.q);
        state.count = data.count;
        state.offset = data.offset + data.limit;
        state.endOfRecords = data.endOfRecords;
        state.suggestion = suggestion;
      })
      .addCase(fetchSearch.rejected, (state, action) => {
        if (!isLatest(state, action) || action.meta.aborted) return;
        state.status = 'failed';
        state.error = action.payload ?? { kind: 'unknown' };
      })
      .addCase(fetchMoreResults.pending, (state) => {
        state.more = 'loading';
      })
      .addCase(fetchMoreResults.fulfilled, (state, action) => {
        const { page, searchId } = action.payload;
        if (searchId !== state.requestId) return;
        state.results.push(...page.results);
        state.offset = page.offset + page.limit;
        state.endOfRecords = page.endOfRecords;
        state.more = 'idle';
      })
      .addCase(fetchMoreResults.rejected, (state, action) => {
        if (!action.meta.aborted) state.more = 'failed';
      });
  },
});

export default searchSlice.reducer;
export const selectSearch = (state) => state.search;
