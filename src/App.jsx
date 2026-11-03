// Rutas de Cladum
//
//   /                          → Explorar (búsqueda)
//   /?q=Panthera%20onca        → resultados
//   /especie/5219426           → ficha de especie
//   /especie/5219426/ocurrencias
//   /guardadas                 → especies guardadas
//   /datos                     → acerca de los datos

import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout.jsx';
import SearchPage from './pages/SearchPage.jsx';
import SpeciesPage from './pages/SpeciesPage.jsx';
import OccurrencesPage from './pages/OccurrencesPage.jsx';
import SavedPage from './pages/SavedPage.jsx';
import AboutPage from './pages/AboutPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<SearchPage />} />
        <Route path="especie/:key" element={<SpeciesPage />} />
        <Route path="especie/:key/ocurrencias" element={<OccurrencesPage />} />
        <Route path="guardadas" element={<SavedPage />} />
        <Route path="datos" element={<AboutPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
