import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSpecimen, selectSpecimen } from '../../features/home/homeSlice.js';
import { usePhotoFallback } from '../../hooks/usePhotoFallback.js';
import { licenseLabel } from '../../utils/format.js';
import { speciesHref } from '../../utils/routes.js';
import { NoData } from '../ui/Provenance.jsx';
import { Icon } from '../ui/Icon.jsx';

const NO_PHOTOS = [];

const Placeholder = ({ message }) => (
  <div className="specimen-card__placeholder"><Icon name="image" size={24} /><span>{message}</span></div>
);

/** Tarjeta con datos: si la foto de GBIF no carga, se prueba la siguiente y luego iNaturalist. */
function LoadedSpecimen({ entry, name, specimenKey }) {
  const { photos, broken, markBroken } = usePhotoFallback(entry.photos ?? NO_PHOTOS, name);
  const photo = photos[0];

  // Una consulta fallida no equivale a "sin foto": se dice cuál de los tres pasó
  let message = 'Sin fotografía documentada';
  if (broken) message = 'No se pudo cargar la fotografía';
  else if (entry.photosFailed) message = 'No se pudo consultar la fotografía';

  return (
    <>
      <div className="specimen-card__media">
        {photo ? (
          <img
            key={photo.url}
            className="specimen-card__img"
            src={photo.url}
            loading="lazy"
            decoding="async"
            alt={`Fotografía de ${name}${photo.creator ? `, por ${photo.creator}` : ''}`}
            onError={() => markBroken(photo.url)}
          />
        ) : <Placeholder message={message} />}
      </div>
      <div className="specimen-card__body">
        <h3 className="specimen-card__name" id={`specimen-${specimenKey}`}>
          <Link className="specimen-card__link" to={speciesHref(specimenKey)}><i lang="la">{name}</i></Link>
        </h3>
        <p className="specimen-card__common">
          {entry.vernacular ? entry.vernacular.vernacularName : <NoData label="Sin nombre común en español" />}
        </p>
        <p className="specimen-card__meta">{entry.family ? `Familia ${entry.family}` : ''}</p>
      </div>
      <p className="specimen-card__credit">
        {photo && [`Foto: ${photo.creator || 'autoría no indicada'}`, licenseLabel(photo.license)].filter(Boolean).join(' · ')}
      </p>
    </>
  );
}

/** Mientras carga (o si falló la consulta): misma estructura con esqueletos. */
function PendingSpecimen({ name, specimenKey, failed }) {
  return (
    <>
      <div className="specimen-card__media">
        {failed ? <Placeholder message="No se pudo consultar la fotografía" /> : <span className="skeleton specimen-card__skeleton" />}
      </div>
      <div className="specimen-card__body">
        <h3 className="specimen-card__name" id={`specimen-${specimenKey}`}>
          <Link className="specimen-card__link" to={speciesHref(specimenKey)}><i lang="la">{name}</i></Link>
        </h3>
        <p className="specimen-card__common">{failed ? <NoData /> : <span className="skeleton skeleton--line" />}</p>
        <p className="specimen-card__meta" />
      </div>
      <p className="specimen-card__credit" />
    </>
  );
}

export function SpecimenCard({ specimen: { key, name } }) {
  const dispatch = useDispatch();
  const state = useSelector(selectSpecimen(key));

  useEffect(() => {
    dispatch(fetchSpecimen({ key, name }));
  }, [dispatch, key, name]);

  return (
    <li className="explore-home__specimen">
      <article className="specimen-card" aria-labelledby={`specimen-${key}`}>
        {state?.status === 'succeeded'
          ? <LoadedSpecimen entry={state.value} name={name} specimenKey={key} />
          : <PendingSpecimen name={name} specimenKey={key} failed={state?.status === 'failed'} />}
      </article>
    </li>
  );
}
