// Acerca de los datos: de dónde viene cada dato, cómo leerlo, cómo citarlo y qué se guarda.
// Es contenido fijo: no consulta las APIs, solo enlaza a las consultas que usa Cladum.

import { useDispatch } from 'react-redux';
import { GBIF_API, INAT_API, BACKBONE_KEY, GENERALIZED_UNCERTAINTY } from '../config.js';
import { apiUrl } from '../services/gbif.js';
import { inat } from '../services/inaturalist.js';
import { showToast } from '../features/ui/uiSlice.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { formatNumber, BASIS_LABELS } from '../utils/format.js';
import { Verified, External, NoData } from '../components/ui/Provenance.jsx';
import { ApiLink, ExternalLink } from '../components/ui/Links.jsx';

const SECTIONS = [
  { id: 'origen', title: 'De dónde vienen' },
  { id: 'etiquetas', title: 'Cómo leer las etiquetas' },
  { id: 'numeros', title: 'Qué significan los números' },
  { id: 'nombres', title: 'Nombres y clasificación' },
  { id: 'fotografias', title: 'Fotografías y licencias' },
  { id: 'consultas', title: 'Consultas que hace Cladum' },
  { id: 'citar', title: 'Cómo citar' },
  { id: 'privacidad', title: 'Privacidad' },
];

// Consultas reales de las APIs; el ejemplo usa la mariposa monarca (5133088)
const QUERIES = [
  { path: '/species/suggest', use: 'Sugerencias mientras escribes', params: { q: 'Danaus', datasetKey: BACKBONE_KEY } },
  { path: '/species/search', use: 'Resultados de búsqueda', params: { q: 'Danaus', datasetKey: BACKBONE_KEY } },
  { path: '/species/match', use: '«¿Quisiste decir…?» y detección de géneros', params: { name: 'Danaus plexipus' } },
  { path: '/species/5133088', use: 'Identidad y clasificación de la ficha' },
  { path: '/species/5133088/vernacularNames', use: 'Nombres comunes', params: { limit: 100 } },
  { path: '/occurrence/search', use: 'Registros, fotografías y filtro por país', params: { taxon_key: 5133088, has_coordinate: true } },
  { path: '/occurrence/count', use: 'Total de ocurrencias de la portada' },
  { path: '/dataset/search', use: 'Total de conjuntos de datos de la portada', params: { limit: 0 } },
].map((q) => ({ ...q, href: apiUrl(q.path, q.params) }));

const INAT_QUERIES = [
  { path: '/taxa', use: 'Fotografías de respaldo: localizar el taxón por nombre exacto', href: inat.url('/taxa', { q: 'Danaus plexippus', is_active: 'true' }) },
];

const dateFormat = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
const citation = () => `GBIF.org (${dateFormat.format(new Date())}). GBIF Home Page. Disponible en: https://www.gbif.org`;
const host = (url) => new URL(url).host;

function Section({ id, children }) {
  const { title } = SECTIONS.find((s) => s.id === id);
  return (
    <section className="card about__section" aria-labelledby={`about-${id}`}>
      <h2 className="card__title" id={`about-${id}`} tabIndex={-1}>{title}</h2>
      {children}
    </section>
  );
}

/** Índice: desplaza a la sección y le pasa el foco (las #anclas las usa el router). */
function Toc() {
  const goTo = (id) => {
    const heading = document.getElementById(`about-${id}`);
    heading?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
    heading?.focus({ preventScroll: true });
  };
  return (
    <nav className="about__toc" aria-label="En esta página">
      <span className="eyebrow">En esta página</span>
      <ol className="about__toc-list">
        {SECTIONS.map((s) => (
          <li key={s.id}>
            <a
              className="about__toc-link"
              href="#/datos"
              onClick={(event) => {
                event.preventDefault();
                goTo(s.id);
              }}
            >
              {s.title}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function QueryList({ queries }) {
  return (
    <ul className="about__queries">
      {queries.map((q) => (
        <li className="about__query" key={q.href}>
          <span className="about__query-use">{q.use}</span>
          <ApiLink href={q.href}>{q.path}</ApiLink>
        </li>
      ))}
    </ul>
  );
}

export default function AboutPage() {
  useDocumentTitle('Acerca de los datos');
  const dispatch = useDispatch();
  const basis = Object.values(BASIS_LABELS).slice(0, 5).map((b) => b.toLowerCase()).join(', ');
  const cite = citation();

  const copyCitation = async () => {
    try {
      await navigator.clipboard.writeText(cite);
      dispatch(showToast({ text: 'Cita copiada', icon: 'check' }));
    } catch {
      dispatch(showToast({ text: 'No se pudo copiar. Selecciona el texto de la cita.' }));
    }
  };

  return (
    <div className="stack u-view-enter">
      <header className="page-head">
        <div className="page-head__text">
          <span className="eyebrow">Procedencia · Lectura · Citación</span>
          <h1 className="page-head__title" tabIndex={-1}>Acerca de los datos</h1>
          <p className="page-head__lead">Cladum no produce datos: muestra lo que publica GBIF y señala qué está cotejado, qué viene de terceros y qué falta.</p>
        </div>
      </header>

      <div className="layout about">
        <aside className="layout__aside about__aside"><Toc /></aside>

        <div className="layout__content">
          <Section id="origen">
            <p className="card__text">Todo proviene de <strong>GBIF</strong> (Global Biodiversity Information Facility), una red internacional e infraestructura de datos abiertos financiada por gobiernos. Reúne registros publicados por museos, herbarios, universidades, proyectos de ciencia ciudadana y agencias ambientales de todo el mundo.</p>
            <p className="card__text">Cladum consulta la API pública de GBIF directamente desde tu navegador, sin servidores intermedios. Lo que ves es la respuesta de GBIF en ese momento; si un publicador corrige un registro, el cambio aparece aquí cuando GBIF lo actualiza.</p>
            <div className="card__links"><ExternalLink href="https://www.gbif.org/what-is-gbif">¿Qué es GBIF?</ExternalLink></div>
          </Section>

          <Section id="etiquetas">
            <dl className="def-list">
              <div className="def-list__row">
                <dt className="def-list__term"><Verified /></dt>
                <dd className="def-list__desc">El dato se cotejó con la respuesta de la API de GBIF. Indica procedencia, no que el dato sea correcto: un registro verificado puede tener errores del publicador.</dd>
              </div>
              <div className="def-list__row">
                <dt className="def-list__term"><External /></dt>
                <dd className="def-list__desc">Contenido de terceros, como una fotografía alojada en el servidor de su publicador, con autoría y licencia identificadas.</dd>
              </div>
              <div className="def-list__row">
                <dt className="def-list__term"><NoData /></dt>
                <dd className="def-list__desc">GBIF no tiene ese dato o no se pudo cotejar. Cladum nunca rellena huecos con datos inventados ni estimados.</dd>
              </div>
            </dl>
          </Section>

          <Section id="numeros">
            <p className="card__text">Una <strong>ocurrencia</strong> es el registro de un organismo en un lugar y un momento: {basis}, entre otros.</p>
            <ul className="about__points">
              <li><strong>Un recuento no es una población.</strong> «826.161 registros» significa que existen esos registros, no esos individuos. El mismo organismo puede registrarse varias veces.</li>
              <li><strong>Los registros reflejan dónde hubo observadores.</strong> Hay más datos cerca de ciudades, carreteras y regiones con más científicos o ciencia ciudadana. Que no haya registros en una zona no prueba que la especie no esté ahí.</li>
              <li><strong>Algunas ubicaciones están generalizadas.</strong> Los publicadores difuminan las coordenadas de especies sensibles para protegerlas. Cladum trata como generalizada toda ubicación con una incertidumbre de {formatNumber(GENERALIZED_UNCERTAINTY / 1000)}&nbsp;km o más, y nunca la muestra como un punto exacto.</li>
              <li><strong>Los registros pueden traer advertencias.</strong> GBIF marca problemas de calidad (coordenadas dudosas, fechas incompletas…). Cladum las muestra en el detalle de cada registro.</li>
            </ul>
          </Section>

          <Section id="nombres">
            <ul className="about__points">
              <li><strong>Clasificación:</strong> Cladum usa el backbone taxonómico de GBIF, construido a partir de varias listas de referencia, principalmente el Catalogue of Life. Puede diferir de otras autoridades taxonómicas.</li>
              <li><strong>Sinónimos:</strong> si buscas un nombre que GBIF considera sinónimo, la ficha lo indica y enlaza al nombre aceptado.</li>
              <li><strong>Nombres comunes:</strong> se muestra el primer nombre en español que devuelve GBIF, con su fuente. No implica que sea el nombre preferido en todos los países.</li>
            </ul>
          </Section>

          <Section id="fotografias">
            <p className="card__text">Las fotografías vienen de los registros de ocurrencia de GBIF, una por registro. Cladum no las aloja: se cargan desde el servidor de cada publicador, como iNaturalist o un museo.</p>
            <p className="card__text">Si GBIF no tiene fotos de un taxón, no responde o sus imágenes no cargan, Cladum usa como respaldo las fotografías curadas en <strong>iNaturalist</strong>: solo si el nombre científico coincide exactamente y solo las que tienen licencia abierta. Cada foto indica de qué fuente viene.</p>
            <p className="card__text">Cada foto muestra su autoría, su licencia y su origen. Si quieres reutilizarla, la licencia es la que manda: por ejemplo, <span className="u-mono">CC BY-NC</span> exige citar a la persona autora y prohíbe el uso comercial.</p>
            <div className="card__links"><ExternalLink href="https://creativecommons.org/licenses/?lang=es">Licencias Creative Commons</ExternalLink></div>
          </Section>

          <Section id="consultas">
            <p className="card__text card__text--muted">Cada dato de Cladum tiene un enlace a la consulta exacta que lo produjo. Estas son todas las que usa, con un ejemplo que puedes abrir:</p>
            <QueryList queries={QUERIES} />
            <QueryList queries={INAT_QUERIES} />
            <div className="card__links">
              <ExternalLink href="https://techdocs.gbif.org/en/openapi/">Documentación de la API de GBIF</ExternalLink>
              <ExternalLink href="https://api.inaturalist.org/v1/docs/">Documentación de la API de iNaturalist</ExternalLink>
            </div>
          </Section>

          <Section id="citar">
            <p className="card__text">Si usas información vista en Cladum, cita a GBIF, que es la fuente:</p>
            <figure className="about__cite">
              <blockquote className="about__cite-text">{cite}</blockquote>
              <button className="btn btn--secondary btn--sm" type="button" onClick={copyCitation}>Copiar cita</button>
            </figure>
            <p className="card__text card__text--muted">Para una publicación científica, descarga los datos desde GBIF.org y cita el DOI de esa descarga: así se reconoce a cada publicador.</p>
            <div className="card__links"><ExternalLink href="https://www.gbif.org/citation-guidelines">Guía de citación de GBIF</ExternalLink></div>
          </Section>

          <Section id="privacidad">
            <ul className="about__points">
              <li><strong>Sin cuentas ni analítica.</strong> Cladum no registra lo que buscas.</li>
              <li><strong>Tus guardadas y tu tema</strong> se guardan solo en este navegador (<span className="u-mono">localStorage</span>). La última ficha visitada se olvida al cerrar la pestaña.</li>
              <li><strong>Terceros:</strong> tu navegador se conecta a <span className="u-mono">{host(GBIF_API)}</span> para los datos, a <span className="u-mono">{host(INAT_API)}</span> para las fotografías de respaldo, a los servidores de cada publicador para las imágenes y a Google Fonts para las tipografías.</li>
            </ul>
          </Section>
        </div>
      </div>
    </div>
  );
}
