import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__key">
          <h2 className="site-footer__title">Clave de procedencia</h2>
          <div className="site-footer__items">
            <div className="site-footer__item">
              <span className="pill pill--raised"><span className="pill__dot" aria-hidden="true" />Verificado · GBIF</span>
              Cotejado con la respuesta de la API; no garantiza ausencia de errores.
            </div>
            <div className="site-footer__item">
              <span className="pill pill--raised"><span className="pill__ring" aria-hidden="true" />Fuente externa</span>
              Contenido con procedencia y derechos identificados.
            </div>
            <div className="site-footer__item">
              <span className="pill pill--outline"><span className="pill__dash" aria-hidden="true" />Sin dato</span>
              Información no disponible o no cotejada.
            </div>
          </div>
          <Link className="site-footer__more" to="/datos">Cómo leer y citar estos datos</Link>
        </div>
        <div className="site-footer__meta">
          <span>Cladum · Atlas de precisión</span>
          <span>
            Datos:{' '}
            <a href="https://www.gbif.org" target="_blank" rel="noopener noreferrer">
              GBIF.org<span className="u-visually-hidden"> (se abre en una pestaña nueva)</span>
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
