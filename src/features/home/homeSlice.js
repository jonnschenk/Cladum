// Portada: cifras globales, especies por reino y ejemplares destacados.
// Son datos que casi no cambian: se piden una vez por sesión y quedan en el store.

import { createSlice } from '@reduxjs/toolkit';
import {
  countAcceptedSpecies, countOccurrences, countDatasets, getSpecies, getVernacularNames, pickVernacular,
} from '../../services/gbif.js';
import { getTaxonPhotos } from '../../services/photos.js';
import { apiThunk } from '../errors.js';

const STAT_LOADERS = {
  species: (opts) => countAcceptedSpecies(undefined, opts),
  occurrences: countOccurrences,
  datasets: countDatasets,
};

// Se vuelve a pedir solo si nunca se pidió o si falló la vez anterior
const notLoaded = (entry) => !entry || entry.status === 'failed';

export const fetchStat = apiThunk(
  'home/fetchStat',
  (id, { signal }) => STAT_LOADERS[id]({ signal }),
  { condition: (id, { getState }) => notLoaded(getState().home.stats[id]) },
);

export const fetchKingdomCount = apiThunk(
  'home/fetchKingdomCount',
  (key, { signal }) => countAcceptedSpecies(key, { signal }),
  { condition: (key, { getState }) => notLoaded(getState().home.kingdoms[key]) },
);

export const fetchSpecimen = apiThunk(
  'home/fetchSpecimen',
  async ({ key, name }, { signal }) => {
    const [taxon, vernacular, photos] = await Promise.allSettled([
      getSpecies(key, { signal }),
      getVernacularNames(key, { signal }),
      getTaxonPhotos(key, name, { signal }),
    ]);
    return {
      family: taxon.status === 'fulfilled' ? taxon.value.family ?? null : null,
      vernacular: vernacular.status === 'fulfilled' ? pickVernacular(vernacular.value) : null,
      photos: photos.status === 'fulfilled' ? photos.value : [],
      photosFailed: photos.status === 'rejected',
    };
  },
  { condition: ({ key }, { getState }) => notLoaded(getState().home.specimens[key]) },
);

/** Reducers comunes para datos guardados por clave: { [id]: { status, value } }. */
function keyed(builder, thunk, field, idOf = (arg) => arg) {
  builder
    .addCase(thunk.pending, (state, action) => {
      state[field][idOf(action.meta.arg)] = { status: 'loading', value: null };
    })
    .addCase(thunk.fulfilled, (state, action) => {
      state[field][idOf(action.meta.arg)] = { status: 'succeeded', value: action.payload };
    })
    .addCase(thunk.rejected, (state, action) => {
      state[field][idOf(action.meta.arg)] = { status: 'failed', value: null };
    });
}

const homeSlice = createSlice({
  name: 'home',
  initialState: { stats: {}, kingdoms: {}, specimens: {} },
  reducers: {},
  extraReducers: (builder) => {
    keyed(builder, fetchStat, 'stats');
    keyed(builder, fetchKingdomCount, 'kingdoms');
    keyed(builder, fetchSpecimen, 'specimens', (arg) => arg.key);
  },
});

export default homeSlice.reducer;
export const selectStat = (id) => (state) => state.home.stats[id];
export const selectKingdomCount = (key) => (state) => state.home.kingdoms[key];
export const selectSpecimen = (key) => (state) => state.home.specimens[key];
