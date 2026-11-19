import { useState } from 'react';
import './Poster.css';

// Les affiches du catalogue sont hébergées par IMDb en grande taille.
// Leur serveur d'images sait les redimensionner : on demande la largeur utile.
function resizedPosterUrl(url, width) {
  return url.replace(/\._V1_.*\.jpg$/, `._V1_SX${width}.jpg`);
}

// Affiche d'un film. Trois états :
//  - "loading" : l'image arrive (fond animé),
//  - "loaded"  : l'image apparaît en fondu,
//  - "missing" : pas d'affiche ou lien mort => on compose un carton avec le titre.
export default function Poster({ movie, width = 342, alt = '', transitionName }) {
  const [src, setSrc] = useState(movie.poster ? resizedPosterUrl(movie.poster, width) : null);
  const [state, setState] = useState(movie.poster ? 'loading' : 'missing');

  function handleError() {
    // Si la version redimensionnée échoue, on tente l'adresse d'origine.
    if (src !== movie.poster) {
      setSrc(movie.poster);
    } else {
      setState('missing');
    }
  }

  return (
    <div
      className={`poster poster--${state}`}
      // Même nom de transition sur la carte cliquée et sur la fiche :
      // le navigateur anime l'affiche de l'une vers l'autre.
      style={transitionName ? { viewTransitionName: transitionName } : undefined}
    >
      {state === 'missing' ? (
        <span className="poster__title-card" role={alt ? 'img' : undefined} aria-label={alt || undefined}>
          {movie.title}
        </span>
      ) : (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setState('loaded')}
          onError={handleError}
        />
      )}
    </div>
  );
}
