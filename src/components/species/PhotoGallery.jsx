// Foto principal + miniaturas. El crédito vive junto a la imagen y cambia con ella.

import { useRef, useState } from 'react';
import { licenseLabel, basisLabel } from '../../utils/format.js';
import { safeUrl } from '../../utils/net.js';
import { useAnnounce } from '../../hooks/useAnnounce.js';
import { External, NoData } from '../ui/Provenance.jsx';
import { ExternalLink } from '../ui/Links.jsx';
import { Icon } from '../ui/Icon.jsx';

// iNaturalist publica cada foto en varios tamaños (…/photos/123/original.jpg → small.jpg).
// Para otras fuentes se usa la URL tal cual.
const INAT_SIZE = /^(https:\/\/(?:inaturalist-open-data\.s3\.amazonaws\.com|static\.inaturalist\.org)\/photos\/\d+\/)(?:original|large|medium|small|square)(\.\w+)(\?.*)?$/;

export const sizedUrl = (url, size) => safeUrl(url).replace(INAT_SIZE, `$1${size}$2$3`);

export const photoAlt = (photo, name) => `Fotografía de ${name}${photo.creator ? `, por ${photo.creator}` : ''}`;

/** La imagen empieza transparente sobre el fondo del marco y aparece con un fundido al cargar. */
function FadeImage({ className, onError, ...props }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <img
      className={`${className}${loaded ? ' is-loaded' : ''}`}
      decoding="async"
      onLoad={() => setLoaded(true)}
      onError={onError}
      {...props}
    />
  );
}

function Caption({ photo }) {
  const fromGbif = photo.source === 'gbif';
  const license = licenseLabel(photo.license);
  const original = photo.references || `https://www.gbif.org/occurrence/${photo.occurrenceKey}`;
  return (
    <>
      <div className="photo-card__credit">
        <span className="photo-card__author">
          {photo.creator || 'Autoría no indicada'}{' '}
          <span className="photo-card__meta">{[photo.publisher, license].filter(Boolean).join(' · ')}</span>
        </span>
        <ExternalLink href={original}>Ver original</ExternalLink>
      </div>
      <div className="photo-card__tags">
        <External label={`Fuente externa · vía ${fromGbif ? 'GBIF' : 'iNaturalist'}`} />
        {fromGbif ? (
          <>
            <span className="pill">{basisLabel(photo.basisOfRecord)}</span>
            <span className="pill pill--mono pill--muted">Registro GBIF:{photo.occurrenceKey}</span>
          </>
        ) : (
          <span className="pill pill--mono pill--muted">Taxón iNat:{photo.taxonId}</span>
        )}
      </div>
    </>
  );
}

/**
 * @param photos   lista vigente (sin las rotas)
 * @param selected índice de la foto principal
 * @param onBroken (url) => void cuando una imagen no carga
 * @param empty    mensaje si no queda ninguna foto
 */
export function PhotoGallery({ photos, name, selected, onSelect, onBroken, empty }) {
  const thumbs = useRef([]);
  const announce = useAnnounce();

  if (!photos.length) {
    return (
      <section className="photo-card" aria-label="Fotografía">
        <div className="photo-card__empty"><Icon name="image" size={28} /><span>{empty}</span><NoData /></div>
      </section>
    );
  }

  const total = photos.length;
  const photo = photos[selected] ?? photos[0];

  const select = (index, { focus = false } = {}) => {
    onSelect(photos[index].url);
    if (focus) thumbs.current[index]?.focus();
    thumbs.current[index]?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
    announce(`${photoAlt(photos[index], name)}. ${index + 1} de ${total}`);
  };

  // Flechas / Inicio / Fin con tabindex itinerante
  const onKeyDown = (event) => {
    const last = total - 1;
    const next = {
      ArrowRight: selected === last ? 0 : selected + 1,
      ArrowLeft: selected === 0 ? last : selected - 1,
      Home: 0,
      End: last,
    }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    select(next, { focus: true });
  };

  return (
    <section className="photo-card" aria-label={total > 1 ? `Fotografías (${total})` : 'Fotografía'}>
      <figure className="photo-card__figure">
        <div className="photo-card__stage">
          <FadeImage
            key={photo.url}
            className="photo-card__img"
            src={sizedUrl(photo.url, 'large')}
            alt={photoAlt(photo, name)}
            onError={() => onBroken(photo.url)}
          />
        </div>
        {total > 1 && (
          <span className="pill photo-card__counter" aria-hidden="true">{selected + 1}&nbsp;de {total}</span>
        )}
        <figcaption className="photo-card__caption"><Caption photo={photo} /></figcaption>
      </figure>
      {total > 1 && (
        <div className="photo-card__thumbs" role="group" aria-label="Elegir fotografía" onKeyDown={onKeyDown}>
          {photos.map((p, i) => (
            <button
              key={p.url}
              ref={(el) => { thumbs.current[i] = el; }}
              className="photo-card__thumb"
              type="button"
              aria-pressed={i === selected}
              tabIndex={i === selected ? 0 : -1}
              aria-label={`Fotografía ${i + 1} de ${total}${p.creator ? `, por ${p.creator}` : ''}`}
              onClick={() => select(i)}
            >
              {/* Una miniatura que no carga delata una foto rota: se retira de la galería */}
              <FadeImage className="photo-card__thumb-img" src={sizedUrl(p.url, 'small')} alt="" onError={() => onBroken(p.url)} />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
