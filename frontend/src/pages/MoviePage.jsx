import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { fetchMovie } from '../api/movies';
import EntryPanel from '../components/EntryPanel';
import Poster from '../components/Poster';
import { StarIcon } from '../components/Icons';
import { formatCount, formatDate, formatRating, formatRuntime } from '../utils/format';
import { genreLabel } from '../utils/genres';
import './MoviePage.css';

// Fiche d'un film + bloc "Mon journal".
export default function MoviePage() {
  const { id } = useParams();
  const location = useLocation();

  // Résumé transmis par la carte cliquée (voir MovieCard) : il permet
  // d'afficher l'affiche et le titre immédiatement.
  const preview = location.state?.movie?.id === id ? location.state.movie : null;

  const [loaded, setLoaded] = useState(null); // { movie } ou { error }

  useEffect(() => {
    let ignore = false;
    fetchMovie(id)
      .then((movie) => {
        if (!ignore) setLoaded({ id, movie });
      })
      .catch((error) => {
        if (!ignore) setLoaded({ id, error });
      });
    return () => {
      ignore = true;
    };
  }, [id]);

  // On ignore une réponse qui concernerait un autre film que celui de l'URL.
  const current = loaded?.id === id ? loaded : null;
  const movie = current?.movie || preview;

  if (current?.error) {
    const notFound = current.error.status === 404 || current.error.status === 400;
    return (
      <div className="page empty-state" role="alert">
        <h1>{notFound ? 'Ce film n’est pas au catalogue' : 'La fiche ne se charge pas'}</h1>
        <p className="muted">
          {notFound ? 'Le lien est peut-être incomplet.' : current.error.message}
        </p>
        <Link to="/" className="button button--primary">
          Retour au catalogue
        </Link>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="page movie" aria-busy="true" aria-label="Chargement du film">
        <div className="movie__poster">
          <div className="skeleton" style={{ aspectRatio: '2 / 3' }} />
        </div>
        <div className="movie__body">
          <div className="skeleton" style={{ height: '4rem', maxWidth: '28rem' }} />
          <div className="skeleton" style={{ height: '8rem' }} />
        </div>
      </div>
    );
  }

  const details = current?.movie; // null tant que la fiche complète n'est pas arrivée

  return (
    <div className="movie-backdrop">
      {/* L'affiche, très floutée, teinte le haut de la page comme un faisceau coloré */}
      {movie.poster && <img className="movie-backdrop__glow" src={movie.poster} alt="" aria-hidden="true" />}

      <article className="page movie">
        <div className="movie__poster">
          <Poster key={movie.id} movie={movie} width={500} alt={`Affiche de ${movie.title}`} transitionName="poster" />
        </div>

        <div className="movie__body">
          <header className="movie__header">
            <h1>{movie.title}</h1>
            <ul className="movie__facts">
              <li>{movie.year}</li>
              {movie.runtime && <li>{formatRuntime(movie.runtime)}</li>}
              {details?.rated && <li>Classification {details.rated}</li>}
              <li className="movie__imdb">
                <StarIcon size={16} filled />
                {formatRating(movie.imdbRating)} sur IMDb
                <span className="muted">({formatCount(movie.imdbVotes)} votes)</span>
              </li>
            </ul>
            <ul className="movie__genres">
              {movie.genres.map((genre) => (
                <li key={genre}>
                  <Link to={`/?genre=${encodeURIComponent(genre)}`} className="chip movie__genre">
                    {genreLabel(genre)}
                  </Link>
                </li>
              ))}
            </ul>
          </header>

          <EntryPanel key={movie.id} movie={movie} />

          {details ? (
            <section className="movie__details">
              {details.plot && <p className="movie__plot">{details.plot}</p>}
              <dl className="movie__credits">
                <Credit label="Réalisation" values={details.directors} />
                <Credit label="Avec" values={details.cast} />
                <Credit label="Pays" values={details.countries} />
                {details.released && <Credit label="Sortie" values={[formatDate(details.released)]} />}
              </dl>
            </section>
          ) : (
            <div className="skeleton" style={{ height: '9rem' }} />
          )}
        </div>
      </article>
    </div>
  );
}

function Credit({ label, values }) {
  if (!values || values.length === 0) return null;
  return (
    <div className="movie__credit">
      <dt>{label}</dt>
      <dd>{values.join(', ')}</dd>
    </div>
  );
}
