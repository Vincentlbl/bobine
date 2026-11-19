import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchRecommendations } from '../api/recommendations';
import MovieCard from '../components/MovieCard';
import { genreLabel } from '../utils/genres';
import './RecommendationsPage.css';

const SKELETON_COUNT = 12;

// "Science-fiction, aventure et drame"
function listGenres(genres) {
  const labels = genres.map((genre) => genreLabel(genre).toLowerCase());
  if (labels.length <= 1) return labels.join('');
  return `${labels.slice(0, -1).join(', ')} et ${labels.at(-1)}`;
}

// Pour toi : des films choisis par l'API d'après le journal de l'utilisateur.
// Tout le calcul est fait côté serveur ; cette page ne fait qu'afficher.
export default function RecommendationsPage() {
  const [data, setData] = useState(null); // null = chargement en cours
  const [loadError, setLoadError] = useState('');
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    let ignore = false;
    fetchRecommendations()
      .then((loaded) => {
        if (ignore) return;
        setData(loaded);
        setLoadError('');
      })
      .catch((error) => {
        if (!ignore) setLoadError(error.message);
      });
    return () => {
      ignore = true;
    };
  }, [reloadCount]);

  if (loadError) {
    return (
      <div className="page empty-state" role="alert">
        <h1>Tes recommandations ne se chargent pas</h1>
        <p className="muted">{loadError}</p>
        <button
          type="button"
          className="button button--primary"
          onClick={() => setReloadCount((count) => count + 1)}
        >
          Recharger
        </button>
      </div>
    );
  }

  return (
    <div className="page reco">
      <header className="reco__header">
        <h1>Pour toi</h1>
        {data && <RecommendationsIntro data={data} />}
      </header>

      {data === null ? (
        <div className="movie-grid" aria-busy="true" aria-label="Chargement des recommandations">
          {Array.from({ length: SKELETON_COUNT }, (_, index) => (
            <div key={index} className="skeleton" style={{ aspectRatio: '2 / 3' }} />
          ))}
        </div>
      ) : data.items.length === 0 ? (
        <div className="empty-state">
          <p className="muted">
            Aucun film à te proposer pour l’instant. Ajoute ou note d’autres films pour élargir tes
            goûts.
          </p>
          <Link to="/" className="button button--primary">
            Parcourir le catalogue
          </Link>
        </div>
      ) : (
        <ul className="movie-grid">
          {data.items.map((item) => (
            <li key={item.movie.id}>
              <MovieCard movie={item.movie} />
              {item.score !== null && (
                <p className="reco__why">
                  <span className="reco__score">{item.score} %</span>
                  <span className="reco__genres">{listGenres(item.matchedGenres)}</span>
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// La phrase d'explication sous le titre : d'où viennent ces films.
function RecommendationsIntro({ data }) {
  if (data.basedOn === 'popular') {
    return (
      <p className="reco__intro">
        Ton journal ne nous dit pas encore ce que tu aimes : voici les films les mieux notés du
        catalogue. Note quelques films vus pour obtenir des recommandations à ton goût.
      </p>
    );
  }

  const topGenres = data.likedGenres.slice(0, 3).map((item) => item.genre);
  return (
    <p className="reco__intro">
      D’après tes notes, tes coups de cœur et ta watchlist, tu aimes surtout{' '}
      <strong>{listGenres(topGenres)}</strong>. Le pourcentage indique à quel point un film
      correspond à ces goûts.
    </p>
  );
}
