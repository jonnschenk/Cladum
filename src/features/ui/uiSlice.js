// Estado de la interfaz: tema y conexión

import { createSlice } from '@reduxjs/toolkit';

// El tema ya lo aplicó el script de index.html antes de pintar; aquí solo se lee
const initialTheme = () =>
  typeof document !== 'undefined' && document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';

const uiSlice = createSlice({
  name: 'ui',
  initialState: () => ({
    theme: initialTheme(),
    online: typeof navigator === 'undefined' ? true : navigator.onLine,
  }),
  reducers: {
    toggleTheme(state) {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
    },
    setOnline(state, action) {
      state.online = action.payload;
    },
  },
});

export const { toggleTheme, setOnline } = uiSlice.actions;
export default uiSlice.reducer;

export const selectTheme = (state) => state.ui.theme;
export const selectOnline = (state) => state.ui.online;
