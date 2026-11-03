// Ficha de especie: identidad, nombre común, fotografías y recuento de ocurrencias.
// También recuerda la última ficha visitada (portada: "Continúa donde te quedaste").

import { createSlice } from '@reduxjs/toolkit';
import { getSpecies, getVernacularNames, pickVernacular, searchOccurrences } from '../../services/gbif.js';
import { getTaxonPhotos } from '../../services/photos.js';
import { STORAGE_KEYS } from '../../config.js';
import { readJson } from '../../utils/storage.js';
import { apiThunk, isLatest } from '../errors.js';

const settled = (result) => (result.status === 'fulfilled' ? result.value : null);

export const fetchSpecies = apiThunk('species/fetch', async (key, { signal }) => {
  // Sin taxón no hay ficha: este error sí se muestra a pantalla completa
  const taxon = await getSpecies(key, { signal });
  const name = taxon.canonicalName || taxon.scientificName;

  // El resto falla por separado: cada bloque explica su propio "sin dato"
  const [vernacular, photos, occ] = await Promise.allSettled([
    getVernacularNames(key, { signal }),
    getTaxonPhotos(key, name, { signal }),
    searchOccurrences({ taxonKey: key, hasCoordinate: true, limit: 3 }, { signal }),
  ]);
  if (signal.aborted) throw new DOMException('Consulta cancelada', 'AbortError');

  return {
    taxon,
    vernacular: pickVernacular(settled(vernacular) ?? []),
    photos: settled(photos) ?? [],
    photosFailed: photos.status === 'rejected',
    occ: settled(occ),
  };
}, {
  // Si la ficha ya está cargada (p. ej. al volver atrás), no se vuelve a pedir
  condition: (key, { getState }) => {
    const { species } = getState();
    return !(species.key === key && species.status === 'succeeded');
  },
});

/** Resumen mínimo de un taxón para "Última ficha" y para guardarlo. */
export const taxonSummary = (taxon) => ({
  key: taxon.key,
  name: taxon.canonicalName || taxon.scientificName,
  rank: taxon.rank,
});

const speciesSlice = createSlice({
  name: 'species',
  initialState: () => ({
    requestId: null,
    key: null,
    status: 'idle',
    data: null,
    error: null,
    lastSpecies: readJson(STORAGE_KEYS.lastSpecies, null, { session: true }),
  }),
  reducers: {
    setLastSpecies(state, action) {
      state.lastSpecies = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSpecies.pending, (state, action) => {
        state.requestId = action.meta.requestId;
        state.key = action.meta.arg;
        state.status = 'loading';
        state.data = null;
        state.error = null;
      })
      .addCase(fetchSpecies.fulfilled, (state, action) => {
        if (!isLatest(state, action)) return;
        state.status = 'succeeded';
        state.data = action.payload;
        state.lastSpecies = taxonSummary(action.payload.taxon);
      })
      .addCase(fetchSpecies.rejected, (state, action) => {
        if (!isLatest(state, action) || action.meta.aborted) return;
        state.status = 'failed';
        state.error = action.payload ?? { kind: 'unknown' };
      });
  },
});

export const { setLastSpecies } = speciesSlice.actions;
export default speciesSlice.reducer;

export const selectSpecies = (state) => state.species;
export const selectLastSpecies = (state) => state.species.lastSpecies;
