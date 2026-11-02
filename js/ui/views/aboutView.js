// Vista: Acerca de los datos
// Explica de dónde viene cada dato, cómo leerlo, cómo citarlo y qué se guarda en el navegador.
// Es contenido fijo: no consulta GBIF, solo enlaza a las consultas que usa Cladum.

import { GBIF_API, BACKBONE_KEY, GENERALIZED_UNCERTAINTY } from '../../config.js';
import { apiUrl } from '../../services/gbif.js';
import { showToast } from '../../handlers/feedback.js';
import { esc } from '../../utils/dom.js';
import { formatNumber, BASIS_LABELS } from '../../utils/format.js';
import { verified, external, noData, apiLink, externalLink, icons } from '../components.js';

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

// Consultas reales de la API; el ejemplo usa la mariposa monarca (5133088)
const QUERIES = [
  { path: '/species/suggest', use: 'Sugerencias mientras escribes', params: { q: 'Danaus', datasetKey: BACKBONE_KEY } },
  { path: '/species/search', use: 'Resultados de búsqueda', params: { q: 'Danaus', datasetKey: BACKBONE_KEY } },
  { path: '/species/match', use: '«¿Quisiste decir…?» y detección de géneros', params: { name: 'Danaus plexipus' } },
  { path: '/species/5133088', use: 'Identidad y clasificación de la ficha' },
  { path: '/species/5133088/vernacularNames', use: 'Nombres comunes', params: { limit: 100 } },
  { path: '/occurrence/search', use: 'Registros, fotografías y filtro por país', params: { taxon_key: 5133088, has_coordinate: true } },
  { path: '/occurrence/count', use: 'Total de ocurrencias de la portada' },
  { path: '/dataset/search', use: 'Total de conjuntos de datos de la portada', params: { limit: 0 } },
];

const dateFormat = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });

function citation() {
  return `GBIF.org (${dateFormat.format(new Date())}). GBIF Home Page. Disponible en: https://www.gbif.org`;
}

function section(id, body) {
  const { title } = SECTIONS.find((s) => s.id === id);
  return `
    <section class="card about__section" aria-labelledby="about-${id}" data-section="${id}">
      <h2 class="card__title" id="about-${id}" tabindex="-1">${title}</h2>
      ${body}
    </section>`;
}

const toc = () => `
  <nav class="about__toc" aria-label="En esta página">
    <span class="eyebrow">En esta página</span>
    <ol class="about__toc-list">
      ${SECTIONS.map((s) => `<li><a class="about__toc-link" href="#/datos" data-goto="${s.id}">${s.title}</a></li>`).join('')}
    </ol>
  </nav>`;

export function renderAboutView(app) {
  document.title = 'Acerca de los datos · Cladum';
  const basis = Object.values(BASIS_LABELS).slice(0, 5).map((b) => b.toLowerCase()).join(', ');

  app.innerHTML = `
    <div class="stack u-view-enter">
      <header class="page-head">
        <div class="page-head__text">
          <span class="eyebrow">Procedencia · Lectura · Citación</span>
          <h1 class="page-head__title" tabindex="-1">Acerca de los datos</h1>
          <p class="page-head__lead">Cladum no produce datos: muestra lo que publica GBIF y señala qué está cotejado, qué viene de terceros y qué falta.</p>
        </div>
      </header>

      <div class="layout about">
        <aside class="layout__aside about__aside">${toc()}</aside>

        <div class="layout__content">
          ${section('origen', `
            <p class="card__text">Todo proviene de <strong>GBIF</strong> (Global Biodiversity Information Facility), una red internacional e infraestructura de datos abiertos financiada por gobiernos. Reúne registros publicados por museos, herbarios, universidades, proyectos de ciencia ciudadana y agencias ambientales de todo el mundo.</p>
            <p class="card__text">Cladum consulta la API pública de GBIF directamente desde tu navegador, sin servidores intermedios. Lo que ves es la respuesta de GBIF en ese momento; si un publicador corrige un registro, el cambio aparece aquí cuando GBIF lo actualiza.</p>
            <div class="card__links">${externalLink('https://www.gbif.org/what-is-gbif', '¿Qué es GBIF?')}</div>`)}

          ${section('etiquetas', `
            <dl class="def-list">
              <div class="def-list__row">
                <dt class="def-list__term">${verified()}</dt>
                <dd class="def-list__desc">El dato se cotejó con la respuesta de la API de GBIF. Indica procedencia, no que el dato sea correcto: un registro verificado puede tener errores del publicador.</dd>
              </div>
              <div class="def-list__row">
                <dt class="def-list__term">${external()}</dt>
                <dd class="def-list__desc">Contenido de terceros, como una fotografía alojada en el servidor de su publicador, con autoría y licencia identificadas.</dd>
              </div>
              <div class="def-list__row">
                <dt class="def-list__term">${noData()}</dt>
                <dd class="def-list__desc">GBIF no tiene ese dato o no se pudo cotejar. Cladum nunca rellena huecos con datos inventados ni estimados.</dd>
              </div>
            </dl>`)}

          ${section('numeros', `
            <p class="card__text">Una <strong>ocurrencia</strong> es el registro de un organismo en un lugar y un momento: ${esc(basis)}, entre otros.</p>
            <ul class="about__points">
              <li><strong>Un recuento no es una población.</strong> «826.161 registros» significa que existen esos registros, no esos individuos. El mismo organismo puede registrarse varias veces.</li>
              <li><strong>Los registros reflejan dónde hubo observadores.</strong> Hay más datos cerca de ciudades, carreteras y regiones con más científicos o ciencia ciudadana. Que no haya registros en una zona no prueba que la especie no esté ahí.</li>
              <li><strong>Algunas ubicaciones están generalizadas.</strong> Los publicadores difuminan las coordenadas de especies sensibles para protegerlas. Cladum trata como generalizada toda ubicación con una incertidumbre de ${formatNumber(GENERALIZED_UNCERTAINTY / 1000)}&nbsp;km o más, y nunca la muestra como un punto exacto.</li>
              <li><strong>Los registros pueden traer advertencias.</strong> GBIF marca problemas de calidad (coordenadas dudosas, fechas incompletas…). Cladum las muestra en el detalle de cada registro.</li>
            </ul>`)}

          ${section('nombres', `
            <ul class="about__points">
              <li><strong>Clasificación:</strong> Cladum usa el backbone taxonómico de GBIF, construido a partir de varias listas de referencia, principalmente el Catalogue of Life. Puede diferir de otras autoridades taxonómicas.</li>
              <li><strong>Sinónimos:</strong> si buscas un nombre que GBIF considera sinónimo, la ficha lo indica y enlaza al nombre aceptado.</li>
              <li><strong>Nombres comunes:</strong> se muestra el primer nombre en español que devuelve GBIF, con su fuente. No implica que sea el nombre preferido en todos los países.</li>
            </ul>`)}

          ${section('fotografias', `
            <p class="card__text">Las fotografías vienen de los registros de ocurrencia, una por registro. Cladum no las aloja: se cargan desde el servidor de cada publicador, como iNaturalist o un museo.</p>
            <p class="card__text">Cada foto muestra su autoría, su licencia y el registro de origen. Si quieres reutilizarla, la licencia es la que manda: por ejemplo, <span class="u-mono">CC BY-NC</span> exige citar a la persona autora y prohíbe el uso comercial.</p>
            <div class="card__links">${externalLink('https://creativecommons.org/licenses/?lang=es', 'Licencias Creative Commons')}</div>`)}

          ${section('consultas', `
            <p class="card__text card__text--muted">Cada dato de Cladum tiene un enlace a la consulta exacta que lo produjo. Estas son todas las que usa, con un ejemplo que puedes abrir:</p>
            <ul class="about__queries">
              ${QUERIES.map((q) => `
                <li class="about__query">
                  <span class="about__query-use">${esc(q.use)}</span>
                  ${apiLink(apiUrl(q.path, q.params), q.path)}
                </li>`).join('')}
            </ul>
            <div class="card__links">${externalLink('https://techdocs.gbif.org/en/openapi/', 'Documentación de la API de GBIF')}</div>`)}

          ${section('citar', `
            <p class="card__text">Si usas información vista en Cladum, cita a GBIF, que es la fuente:</p>
            <figure class="about__cite">
              <blockquote class="about__cite-text" data-citation>${esc(citation())}</blockquote>
              <button class="btn btn--secondary btn--sm" type="button" data-copy>Copiar cita</button>
            </figure>
            <p class="card__text card__text--muted">Para una publicación científica, descarga los datos desde GBIF.org y cita el DOI de esa descarga: así se reconoce a cada publicador.</p>
            <div class="card__links">${externalLink('https://www.gbif.org/citation-guidelines', 'Guía de citación de GBIF')}</div>`)}

          ${section('privacidad', `
            <ul class="about__points">
              <li><strong>Sin cuentas ni analítica.</strong> Cladum no registra lo que buscas.</li>
              <li><strong>Tus guardadas y tu tema</strong> se guardan solo en este navegador (<span class="u-mono">localStorage</span>). La última ficha visitada se olvida al cerrar la pestaña.</li>
              <li><strong>Terceros:</strong> tu navegador se conecta a <span class="u-mono">${esc(new URL(GBIF_API).host)}</span> para los datos, a los servidores de cada publicador para las fotografías y a Google Fonts para las tipografías.</li>
            </ul>`)}
        </div>
      </div>
    </div>`;

  // Índice: desplaza a la sección y le pasa el foco (los #anclas los usa el router)
  app.querySelector('.about__toc').addEventListener('click', (event) => {
    const link = event.target.closest('[data-goto]');
    if (!link) return;
    event.preventDefault();
    const heading = app.querySelector(`#about-${link.dataset.goto}`);
    heading?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    heading?.focus({ preventScroll: true });
  });

  app.querySelector('[data-copy]').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(app.querySelector('[data-citation]').textContent);
      showToast(`${icons.check(14)} Cita copiada`);
    } catch {
      showToast('No se pudo copiar. Selecciona el texto de la cita.');
    }
  });
}
