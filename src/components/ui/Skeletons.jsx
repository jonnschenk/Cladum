// Esqueletos de carga. Usan las MISMAS clases que el contenido final (layout, tarjetas,
// filas…) con "huesos" en lugar de texto: cada bloque ocupa el sitio exacto del dato
// que va a llegar y el cambio no produce saltos.

import { BrandLoader } from './BrandLoader.jsx';

const LOADING_TEXT = 'Consultando GBIF…';
const SLOW_TEXT = 'GBIF está tardando más de lo normal…';

/** Hueso de texto: ocupa la altura de línea del elemento que lo contiene. */
const Bone = ({ w }) => <span className="bone" style={{ '--w': w }} />;
/** Hueso con forma propia: píldora, botón o bloque. */
const Shape = ({ kind, w, h }) => <span className={`bone bone--${kind}`} style={{ '--w': w, '--h': h }} />;

// El rango sí se conoce de antemano: se muestra, solo el nombre es hueso
const TAX_RANKS = [
  ['Reino', '9ch'], ['Filo', '11ch'], ['Clase', '8ch'], ['Orden', '12ch'],
  ['Familia', '13ch'], ['Género', '9ch'], ['Especie', '15ch'],
];

const TaxIndexBones = () => (
  <div className="tax-index">
    <div className="tax-index__head">
      <span className="tax-index__title">Índice taxonómico</span>
      <Shape kind="pill" w="64px" />
    </div>
    <div className="tax-index__list">
      {TAX_RANKS.map(([rank, w]) => (
        <div className="tax-index__link" key={rank}>
          <span className="tax-index__rank">{rank}</span>
          <span className="tax-index__key"><Bone w="5ch" /></span>
          <span className="tax-index__name"><Bone w={w} /></span>
        </div>
      ))}
    </div>
    <span className="tax-index__note"><Bone w="90%" /><br /><Bone w="60%" /></span>
    <Shape kind="pill" w="136px" h="32px" />
  </div>
);

/** Encabezado de estado: es lo único que leen los lectores de pantalla. */
const LoadingEyebrow = ({ slow }) => (
  <span className="eyebrow loading-label">
    <BrandLoader size="sm" /><span>{slow ? SLOW_TEXT : LOADING_TEXT}</span>
  </span>
);

const SearchBones = ({ slow }) => (
  <div className="layout">
    <div className="layout__aside" aria-hidden="true"><TaxIndexBones /></div>
    <div className="layout__content">
      <div className="page-head">
        <div className="page-head__text">
          <LoadingEyebrow slow={slow} />
          <div className="page-head__title" aria-hidden="true"><Bone w="11ch" /></div>
          <div className="page-head__lead" aria-hidden="true"><Bone w="30ch" /></div>
        </div>
        <span aria-hidden="true"><Shape kind="pill" w="128px" h="36px" /></span>
      </div>
      <div className="card card--xl result-featured" aria-hidden="true">
        <div className="card__head"><Shape kind="pill" w="132px" /><Shape kind="pill" w="120px" /></div>
        <div className="result-featured__top">
          <div className="result-featured__heading">
            <div className="result-featured__name"><Bone w="9ch" /></div>
            <div className="result-featured__author"><Bone w="15ch" /></div>
          </div>
          <div className="result-featured__actions"><Shape kind="btn" w="116px" /><Shape kind="btn" w="140px" /></div>
        </div>
        <div className="result-featured__tiles">
          {['Rango', 'Estado taxonómico', 'Identificador GBIF'].map((label) => (
            <div className="tile" key={label}><span className="tile__label">{label}</span><span className="tile__value"><Bone w="8ch" /></span></div>
          ))}
        </div>
        <div className="result-featured__names">
          <div className="result-featured__group"><span className="result-featured__common"><Bone w="10ch" /></span><span className="result-featured__note"><Bone w="34ch" /></span></div>
          <div className="result-featured__group"><span className="result-featured__family"><Bone w="14ch" /></span><span className="result-featured__note"><Bone w="30ch" /></span></div>
        </div>
      </div>
      <div className="results-group" aria-hidden="true">
        <span className="eyebrow">Otros resultados</span>
        <div className="result-list">
          {['14ch', '18ch', '12ch', '16ch'].map((w) => (
            <div className="result-list__link" key={w}>
              <span className="result-list__text">
                <span className="result-list__name"><Bone w={w} /></span>
                <span className="result-list__meta"><Bone w="22ch" /></span>
              </span>
              <span className="result-list__key"><Bone w="7ch" /></span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const SpeciesBones = ({ slow }) => (
  <div className="layout">
    <div className="layout__aside" aria-hidden="true"><TaxIndexBones /></div>
    <div className="layout__content">
      <div className="species-hero">
        <div className="species-hero__text">
          <LoadingEyebrow slow={slow} />
          <div className="species-hero__name" aria-hidden="true"><Bone w="10ch" /></div>
          <div className="species-hero__sub" aria-hidden="true"><Bone w="24ch" /></div>
        </div>
        <div className="page-head__badges" aria-hidden="true"><Shape kind="pill" w="150px" h="34px" /><Shape kind="btn" w="124px" /></div>
      </div>
      <div className="grid-auto grid-auto--start" style={{ '--min': '400px' }} aria-hidden="true">
        <div className="photo-card">
          <div className="photo-card__figure">
            <span className="photo-card__img bone bone--fill" />
            <div className="photo-card__caption">
              <span className="photo-card__credit"><Bone w="26ch" /></span>
              <span><Shape kind="pill" w="150px" /> <Shape kind="pill" w="130px" /></span>
              <span><Shape kind="pill" w="180px" /></span>
            </div>
          </div>
          <div className="photo-card__thumbs">
            {[1, 2, 3, 4, 5].map((i) => <span className="photo-card__thumb bone bone--fill" key={i} />)}
          </div>
        </div>
        <div className="card">
          <div className="card__head"><span className="card__title">Identidad y nomenclatura</span><Shape kind="pill" w="120px" /></div>
          <div className="def-list">
            <div className="def-list__row"><span className="def-list__term">Nombre común</span><span className="def-list__desc"><Bone w="16ch" /><span className="def-list__note"><Bone w="90%" /></span></span></div>
            {[['Autoría', '14ch'], ['Rango', '10ch'], ['Estado taxonómico', '12ch'], ['Identificador GBIF', '8ch']].map(([term, w]) => (
              <div className="def-list__row" key={term}><span className="def-list__term">{term}</span><span className="def-list__desc"><Bone w={w} /></span></div>
            ))}
          </div>
          <Shape kind="pill" w="220px" h="34px" />
        </div>
      </div>
      <div className="card card--xl" aria-hidden="true">
        <div className="card__head"><span className="eyebrow">Ocurrencias documentadas</span><Shape kind="pill" w="120px" /></div>
        <div className="split-row">
          <div className="split-row__main">
            <div className="count"><span className="count__num"><Bone w="6ch" /></span><span className="count__label">registros con coordenadas</span></div>
            <span className="split-row__code"><Bone w="32ch" /></span>
          </div>
          <Shape kind="btn" w="150px" />
        </div>
      </div>
    </div>
  </div>
);

const RECORD_WIDTHS = ['70%', '55%', '80%', '62%', '74%', '58%', '66%', '50%'];

const OccurrencesBones = ({ slow, countLabel = 'registros' }) => (
  <div className="layout">
    <div className="layout__aside" aria-hidden="true"><TaxIndexBones /></div>
    <div className="layout__content">
      <div className="species-hero">
        <div className="species-hero__text">
          <LoadingEyebrow slow={slow} />
          <div className="species-hero__name species-hero__name--sm" aria-hidden="true"><Bone w="10ch" /></div>
          <div className="species-hero__sub" aria-hidden="true"><Bone w="14ch" /></div>
        </div>
        <div className="page-head__badges" aria-hidden="true"><Shape kind="pill" w="150px" h="34px" /><Shape kind="pill" w="130px" /></div>
      </div>
      <div className="toolbar" aria-hidden="true">
        <Shape kind="pill" w="170px" h="52px" /><Shape kind="pill" w="200px" h="44px" />
        <span className="toolbar__end"><Shape kind="pill" w="200px" h="48px" /></span>
      </div>
      <div className="split-row" aria-hidden="true">
        <div className="split-row__main">
          <div className="count count--sm"><span className="count__num"><Bone w="6ch" /></span><span className="count__label">{countLabel}</span></div>
          <span className="split-row__note"><Bone w="34ch" /></span>
        </div>
        <Shape kind="pill" w="120px" h="36px" />
      </div>
      <div className="card card--flush records" aria-hidden="true">
        <div className="records__head"><span>ID GBIF</span><span>País / región</span><span>Observación</span><span>Observador/a</span><span>Incertidumbre</span><span>Calidad</span></div>
        <div className="records__list">
          {RECORD_WIDTHS.map((w, i) => (
            <div className="records__row" key={i}>
              <span className="records__cols">
                <span className="records__id"><Bone w="10ch" /></span>
                <span className="records__place"><span className="records__country"><Bone w={w} /></span><span className="records__sub"><Bone w="60%" /></span></span>
                <span className="records__date"><Bone w="9ch" /></span>
                <span className="records__observer"><Bone w={w} /></span>
                <span className="records__uncertainty"><Bone w="6ch" /></span>
                <span className="records__quality"><span className="records__issues"><Bone w="12ch" /></span><span className="records__basis"><Bone w="14ch" /></span></span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const VIEWS = { search: SearchBones, species: SpeciesBones, occurrences: OccurrencesBones };

/** Esqueleto de una vista mientras llegan sus datos. `slow` cambia el texto de carga. */
export function LoadingView({ view, slow = false, ...props }) {
  const Bones = VIEWS[view];
  return (
    <div className={`skeleton-view${slow ? ' is-slow' : ''}`} role="status" aria-busy="true">
      <Bones slow={slow} {...props} />
    </div>
  );
}
