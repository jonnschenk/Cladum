// Estado de la interfaz: tema, conexión, avisos (toasts) y anuncios para lectores de pantalla

import { createSlice, nanoid } from '@reduxjs/toolkit';

// El tema ya lo aplicó el script de index.html antes de pintar; aquí solo se lee
const initialTheme = () =>
  typeof document !== 'undefined' && document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';

const uiSlice = createSlice({
  name: 'ui',
  initialState: () => ({
    theme: initialTheme(),
    online: typeof navigator === 'undefined' ? true : navigator.onLine,
    toast: null,
    announcement: null,
  }),
  reducers: {
    toggleTheme(state) {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
    },
    setOnline(state, action) {
      state.online = action.payload;
    },
    /**
     * Aviso breve. `name` es un nombre científico (va en cursiva antes del texto);
     * `undo` guarda lo necesario para deshacer quitar una especie de guardadas.
     */
    showToast: {
      reducer(state, action) {
        state.toast = action.payload;
      },
      prepare: ({ text, name = null, icon = null, undo = null, duration = 5000 }) => ({
        payload: { id: nanoid(), text, name, icon, undo, duration },
      }),
    },
    hideToast(state, action) {
      // Solo se cierra si sigue siendo el mismo aviso (pudo llegar otro antes)
      if (state.toast?.id === action.payload) state.toast = null;
    },
    /** Mensaje solo para lectores de pantalla. El id fuerza el anuncio aunque el texto se repita. */
    announce: {
      reducer(state, action) {
        state.announcement = action.payload;
      },
      prepare: (text) => ({ payload: { id: nanoid(), text } }),
    },
  },
});

export const { toggleTheme, setOnline, showToast, hideToast, announce } = uiSlice.actions;
export default uiSlice.reducer;

export const selectTheme = (state) => state.ui.theme;
export const selectOnline = (state) => state.ui.online;
export const selectToast = (state) => state.ui.toast;
export const selectAnnouncement = (state) => state.ui.announcement;
