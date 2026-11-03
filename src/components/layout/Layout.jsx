// Estructura común de todas las páginas

import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectTheme } from '../../features/ui/uiSlice.js';
import { Header } from './Header.jsx';
import { Footer } from './Footer.jsx';
import { Toast } from '../feedback/Toast.jsx';
import { Announcer } from '../feedback/Announcer.jsx';

export function Layout() {
  const main = useRef(null);
  const { pathname } = useLocation();
  const theme = useSelector(selectTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // Al cambiar de página: arriba del todo y foco en el título (lectores de pantalla)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    main.current?.querySelector('h1[tabindex="-1"]')?.focus({ preventScroll: true });
  }, [pathname]);

  // Con HashRouter, href="#app" se leería como una ruta: el salto se hace a mano
  const skipToContent = (event) => {
    event.preventDefault();
    main.current?.focus();
  };

  return (
    <>
      <a className="skip-link" href="#app" onClick={skipToContent}>Saltar al contenido</a>
      <Header />
      <main id="app" className="page" tabIndex={-1} ref={main}>
        <Outlet />
      </main>
      <Footer />
      {/* Regiones vivas: siempre presentes para que se anuncien sus cambios */}
      <Toast />
      <Announcer />
    </>
  );
}
