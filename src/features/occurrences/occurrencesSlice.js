// Ocurrencias de un taxón: registros, filtros (país, coordenadas), "Cargar más" y registro seleccionado

import { createSlice } from '@reduxjs/toolkit';
import { getSpecies, searchOccurrences, getCountryFacet } from '../../services/gbif.js';
import { OCCURRENCE_PAGE_SIZE } from '../../config.js';
import { apiThunk, isLatest } from '../errors.js';
import { setLastSpecies, taxonSummary } from '../species/speciesSlice.js';

/** Consulta a GBIF para un taxón y unos filtros. */
export const occurrenceQuery = (key, { country, coords }, offset = 0) => ({
  taxonKey: key,
  country,
  hasCoordinate: coords ? true : undefined,
  limit: OCCURRENCE_PAGE_SIZE,
  offset,
});

/** Primera carga: taxón, primera página y países disponibles. */
export const loadOccurrences = apiThunk('occurrences/load', async ({ key, filters }, { signal, dispatch }) => {
  const [taxon, data, countries] = await Promise.all([
    getSpecies(key, { signal }),
    searchOccurrences(occurrenceQuery(key, filters), { signal }),
    // Sin países el filtro queda vacío, pero la vista sigue funcionando
    getCountryFacet(key, filters.coords ? true : undefined, { signal }).catch(() => []),
  ]);
  dispatch(setLastSpecies(taxonSummary(taxon)));
  return { taxon, data, countries };
});

/** Cambio de filtro sobre el mismo taxón: la vista no se redibuja, solo se actualiza. */
export const refreshOccurrences = apiThunk('occurrences/refresh', async ({ key, filters }, { signal, getState }) => {
  const [data, countries] = await Promise.all([
    searchOccurrences(occurrenceQuery(key, filters), { signal }),
    getCountryFacet(key, filters.coords ? true : undefined, { signal }).catch(() => getState().occurrences.countries),
  ]);
  return { data, countries };
});

export const fetchMoreRecords = apiThunk('occurrences/fetchMore', async (_, { getState, signal }) => {
  const { key, filters, offset, requestId } = getState().occurrences;
  const page = await searchOccurrences(occurrenceQuery(key, filters, offset), { signal });
  return { page, queryId: requestId };
});

const initialState = {
  requestId: null,
  key: null,
  status: 'idle',
  // Actualizando por un cambio de filtro (lo anterior se atenúa)
  updating: false,
  updateError: null,
  error: null,
  taxon: null,
  filters: { country: '', coords: true },
  countries: [],
  records: [],
  count: 0,
  offset: 0,
  selected: 0,
  view: 'list',
  more: 'idle',
};

function applyPage(state, data) {
  state.records = data.results ?? [];
  state.count = data.count;
  state.offset = data.offset + data.limit;
  state.selected = 0;
  state.more = 'idle';
}

const occurrencesSlice = createSlice({
  name: 'occurrences',
  initialState,
  reducers: {
    selectRecord(state, action) {
      state.selected = action.payload;
    },
    setView(state, action) {
      state.view = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadOccurrences.pending, (state, action) => {
        Object.assign(state, initialState, {
          requestId: action.meta.requestId,
          key: action.meta.arg.key,
          filters: action.meta.arg.filters,
          status: 'loading',
        });
      })
      .addCase(loadOccurrences.fulfilled, (state, action) => {
        if (!isLatest(state, action)) return;
        const { taxon, data, countries } = action.payload;
        state.status = 'succeeded';
        state.taxon = taxon;
        state.countries = countries;
        applyPage(state, data);
      })
      .addCase(loadOccurrences.rejected, (state, action) => {
        if (!isLatest(state, action) || action.meta.aborted) return;
        state.status = 'failed';
        state.error = action.payload ?? { kind: 'unknown' };
      })
      .addCase(refreshOccurrences.pending, (state, action) => {
        state.requestId = action.meta.requestId;
        state.updating = true;
        state.updateError = null;
        // Los controles reflejan la URL desde ya (también con Atrás/Adelante)
        state.filters = action.meta.arg.filters;
      })
      .addCase(refreshOccurrences.fulfilled, (state, action) => {
        if (!isLatest(state, action)) return;
        state.updating = false;
        state.countries = action.payload.countries;
        applyPage(state, action.payload.data);
      })
      .addCase(refreshOccurrences.rejected, (state, action) => {
        // Cancelada por un cambio más reciente: ese se encarga de la vista
        if (!isLatest(state, action) || action.meta.aborted) return;
        state.updating = false;
        state.updateError = action.payload ?? { kind: 'unknown' };
      })
      .addCase(fetchMoreRecords.pending, (state) => {
        state.more = 'loading';
      })
      .addCase(fetchMoreRecords.fulfilled, (state, action) => {
        const { page, queryId } = action.payload;
        if (queryId !== state.requestId) return;
        state.records.push(...page.results);
        state.offset = page.offset + page.limit;
        state.more = 'idle';
      })
      .addCase(fetchMoreRecords.rejected, (state, action) => {
        if (!action.meta.aborted) state.more = 'failed';
      });
  },
});

export const { selectRecord, setView } = occurrencesSlice.actions;
export default occurrencesSlice.reducer;
export const selectOccurrences = (state) => state.occurrences;
