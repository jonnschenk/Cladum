// Encabezado: navegación, contador de guardadas, conexión y tema

import { Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toggleTheme, selectTheme } from '../../features/ui/uiSlice.js';
import { selectFavoritesCount } from '../../features/favorites/favoritesSlice.js';
import { useOnlineStatus } from '../../hooks/useOnlineStatus.js';
import { Icon } from '../ui/Icon.jsx';

const NAV = [
  { section: 'search', to: '/', label: 'Explorar' },
  { section: 'about', to: '/datos', label: 'Acerca de los datos' },
  { section: 'saved', to: '/guardadas', label: 'Guardadas' },
];

/**
 * Sección activa del nav y su aria-current. La ficha y las ocurrencias se abren
 * desde Explorar: cuentan como esa sección, pero no son "la página" Explorar.
 */
export function navState(pathname) {
  if (pathname.startsWith('/guardadas')) return { section: 'saved', current: 'page' };
  if (pathname.startsWith('/datos')) return { section: 'about', current: 'page' };
  if (pathname.startsWith('/especie/')) return { section: 'search', current: 'true' };
  return { section: 'search', current: 'page' };
}

export function Header() {
  const dispatch = useDispatch();
  const theme = useSelector(selectTheme);
  const favCount = useSelector(selectFavoritesCount);
  const online = useOnlineStatus();
  const { pathname } = useLocation();
  const active = navState(pathname);
  const dark = theme === 'dark';

  return (
    <div className="site-header">
      <header className="site-header__bar">
        <Link className="brand" to="/" aria-label="Cladum, inicio">Cladum<span className="brand__dot">.</span></Link>

        <nav className="main-nav" aria-label="Principal">
          <ul className="main-nav__list">
            {NAV.map(({ section, to, label }) => (
              <li className="main-nav__item" key={section}>
                <Link
                  className="main-nav__link"
                  to={to}
                  aria-current={active.section === section ? active.current : undefined}
                >
                  {label}
                  {section === 'saved' && (
                    <>
                      {' '}<span className="main-nav__count">{favCount}</span>
                      <span className="u-visually-hidden"> especies</span>
                    </>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="site-header__actions">
          <span className="pill pill--chip pill--lg" role="status">
            <span className={`pill__dot${online ? '' : ' pill__dot--offline'}`} aria-hidden="true" />
            <span>{online ? 'GBIF · en vivo' : 'Sin conexión'}</span>
          </span>
          <button
            className="icon-btn"
            type="button"
            onClick={() => dispatch(toggleTheme())}
            aria-label={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            <Icon name={dark ? 'sun' : 'moon'} size={18} />
          </button>
        </div>
      </header>

      {/* Siempre presente para que los lectores de pantalla anuncien el cambio */}
      <div className="net-banner" role="status" hidden={online}>
        {!online && (
          <>
            <Icon name="offline" size={18} />
            <span><strong>Sin conexión.</strong> Lo que ves puede estar desactualizado y las consultas nuevas esperarán a que vuelvas a conectarte.</span>
          </>
        )}
      </div>
    </div>
  );
}
