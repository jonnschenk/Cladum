// Ficha de especie: identidad, fotografías, nombre común y ocurrencias

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { fetchSpecies, selectSpecies } from '../features/species/speciesSlice.js';
import { apiUrl } from '../services/gbif.js';
import { useThunk } from '../hooks/useThunk.js';
import { useSlowNotice } from '../hooks/useSlowNotice.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { usePhotoFallback } from '../hooks/usePhotoFallback.js';
import { licenseLabel, rankLabel, statusLabel } from '../utils/format.js';
import { searchHref, speciesHref } from '../utils/routes.js';
import { TaxIndex } from '../components/taxonomy/TaxIndex.jsx';
import { LoadingView } from '../components/ui/Skeletons.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { StateBlock } from '../components/ui/StateBlock.jsx';
import { SaveButton } from '../components/ui/SaveButton.jsx';
import { TaxonName } from '../components/ui/TaxonName.jsx';
import { NoData } from '../components/ui/Provenance.jsx';
import { ApiLink } from '../components/ui/Links.jsx';
import { Icon } from '../components/ui/Icon.jsx';
import { PhotoGallery } from '../components/species/PhotoGallery.jsx';
import { IdentityCard } from '../components/species/IdentityCard.jsx';
import { OccurrencesCard } from '../components/species/OccurrencesCard.jsx';
import { TaxonHeader, taxonDisplayName } from '../components/species/TaxonHeader.jsx';

const NO_PHOTOS = [];

const EMPTY_GALLERY = {
  failed: 'No se pudieron consultar las fotografías. Inténtalo más tarde.',
  none: 'No hay fotografía documentada en GBIF ni en iNaturalist para este taxón.',
  broken: 'No se pudieron cargar las fotografías desde su fuente original.',
};

function Breadcrumb({ taxon }) {
  const name = taxon ? taxonDisplayName(taxon) : '';
  return (
    <nav className="breadcrumb" aria-label="Ruta">
      <ol className="breadcrumb__list">
        <li className="breadcrumb__item">
          <Link className="breadcrumb__back" to={searchHref({ q: name, rank: 'SPECIES', status: 'ACCEPTED' })}>
            <Icon name="back" />Volver a la búsqueda
          </Link>
        </li>
        {taxon && <li className="breadcrumb__item" aria-current="page"><TaxonName name={name} rank={taxon.rank} /></li>}
      </ol>
      {taxon && (
        <span className="pill pill--chip pill--mono"><span className="u-visually-hidden">Identificador </span>GBIF:{taxon.key}</span>
      )}
    </nav>
  );
}

/** Aviso cuando el nombre consultado es un sinónimo: enlaza al aceptado. */
function SynonymNote({ taxon }) {
  if (taxon.taxonomicStatus === 'ACCEPTED' || !taxon.acceptedKey) return null;
  return (
    <div className="callout callout--warn" role="note">
      <span className="callout__icon"><Icon name="alert" /></span>
      <span className="callout__body">
        <span className="callout__title">Este nombre no es el aceptado</span>
        <span className="callout__text">
          GBIF lo trata como {statusLabel(taxon.taxonomicStatus).toLowerCase()} de{' '}
          <Link to={speciesHref(taxon.acceptedKey)}><TaxonName name={taxon.accepted || 'el nombre aceptado'} rank={taxon.rank} /></Link>.
        </span>
      </span>
    </div>
  );
}

function SpeciesContent({ data }) {
  const { taxon, vernacular, occ, photosFailed } = data;
  const name = taxonDisplayName(taxon);
  const { photos, broken, markBroken } = usePhotoFallback(data.photos ?? NO_PHOTOS, name);
  const [currentUrl, setCurrentUrl] = useState(photos[0]?.url);
  const selected = Math.max(0, photos.findIndex((p) => p.url === currentUrl));
  const shown = photos[selected];

  let empty = EMPTY_GALLERY.none;
  if (broken) empty = EMPTY_GALLERY.broken;
  else if (photosFailed) empty = EMPTY_GALLERY.failed;

  const favorite = {
    key: taxon.key,
    name,
    authorship: taxon.authorship || '',
    vernacular: vernacular?.vernacularName ?? null,
    family: taxon.family ?? null,
    rank: taxon.rank,
  };

  return (
    <>
      <Breadcrumb taxon={taxon} />
      <div className="layout u-fade-in">
        <div className="layout__aside"><TaxIndex taxon={taxon} /></div>
        <section className="layout__content" aria-labelledby="species-title">
          <TaxonHeader
            taxon={taxon}
            id="species-title"
            eyebrow={`Taxonomía · Ficha de ${rankLabel(taxon.rank).toLowerCase()}`}
            sub={[taxon.authorship, vernacular?.vernacularName].filter(Boolean).join(' · ')}
          >
            <SaveButton taxon={favorite} />
          </TaxonHeader>

          <SynonymNote taxon={taxon} />

          <div className="grid-auto grid-auto--start" style={{ '--min': '400px' }}>
            <PhotoGallery
              photos={photos}
              name={name}
              selected={selected}
              onSelect={setCurrentUrl}
              onBroken={markBroken}
              empty={empty}
            />
            <IdentityCard taxon={taxon} vernacular={vernacular} />
          </div>

          <OccurrencesCard taxon={taxon} occ={occ} />

          <section className="grid-auto" style={{ '--min': '300px' }} aria-label="Fuentes">
            <div className="source-links">
              <span className="eyebrow">Fuentes de identidad</span>
              <ApiLink href={apiUrl(`/species/${taxon.key}/vernacularNames`, { limit: 100 })}>
                GBIF · especie {taxon.key} y nombres vernáculos
              </ApiLink>
              <ApiLink href={`https://www.gbif.org/species/${taxon.key}`}>Ficha en GBIF.org</ApiLink>
            </div>
            <div className="source-links">
              <span className="eyebrow">Derechos de la fotografía mostrada</span>
              <span className="source-links__item">
                {!shown && <NoData label="Sin fotografía" />}
                {shown && (shown.license
                  ? <ApiLink href={shown.license}>Fuente externa · {licenseLabel(shown.license)}</ApiLink>
                  : <NoData label="Sin licencia indicada" />)}
              </span>
            </div>
          </section>
        </section>
      </div>
    </>
  );
}

export default function SpeciesPage() {
  const { key } = useParams();
  const valid = /^\d+$/.test(key);
  const numericKey = Number(key);
  const species = useSelector(selectSpecies);
  const retry = useThunk(fetchSpecies, numericKey, { enabled: valid });

  // Hasta que el store responda por esta clave, lo que hay es de la ficha anterior
  const current = species.key === numericKey;
  const loading = valid && (!current || species.status === 'loading' || species.status === 'idle');
  const slow = useSlowNotice(loading);
  const taxon = current ? species.data?.taxon : null;
  useDocumentTitle(taxon ? taxonDisplayName(taxon) : null);

  // Al terminar de cargar, el foco va al título (lectores de pantalla)
  useEffect(() => {
    if (!loading) document.querySelector('main h1[tabindex="-1"]')?.focus({ preventScroll: true });
  }, [loading]);

  if (!valid) {
    return (
      <StateBlock
        type="no-results"
        level={1}
        title="No encontramos ese taxón"
        text={`«${key}» no es un identificador de GBIF.`}
        actions={<Link className="btn btn--secondary" to="/">Ir a Explorar</Link>}
      />
    );
  }

  if (loading) {
    return <><Breadcrumb taxon={null} /><LoadingView view="species" slow={slow} /></>;
  }

  if (species.status === 'failed') {
    return (
      <>
        <Breadcrumb taxon={null} />
        <ErrorState
          error={species.error}
          onRetry={retry}
          copy={{ 'not-found': { title: 'No encontramos ese taxón', text: `GBIF no tiene un taxón con el identificador ${key}.` } }}
          actions={<Link className="btn btn--secondary" to="/">Ir a Explorar</Link>}
        />
      </>
    );
  }

  // key: al cambiar de especie se reinicia la galería
  return <SpeciesContent key={numericKey} data={species.data} />;
}
