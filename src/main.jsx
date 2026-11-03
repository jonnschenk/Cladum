// ─────────────────────────────────────────────
// Cladum · punto de entrada
// Arquitectura: services (API) · features (Redux) · pages (rutas) · components (UI)
// ─────────────────────────────────────────────

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { HashRouter } from 'react-router-dom';
import { store } from './app/store.js';
import App from './App.jsx';
import './styles/main.scss';

// HashRouter (#/especie/…): conserva las URLs de la versión anterior y
// funciona en GitHub Pages sin configurar redirecciones en el servidor
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <HashRouter>
        <App />
      </HashRouter>
    </Provider>
  </StrictMode>,
);
