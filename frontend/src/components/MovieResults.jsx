import { useEffect, useRef, useState } from 'react';
import { fetchMovies } from '../api/movies';
import { useToast } from '../context/ToastContext';
import { formatCount } from '../utils/format';
import MovieCard from './MovieCard';

// Résultats déjà chargés, gardés en mémoire tant que l'onglet reste ouvert.
// Quand on revient de la fiche d'un film, la grille réapparaît tout de suite,
// au même endroit, sans rappeler l'API.
const cache = new Map();

const NO_RESULTS = { movies: [], page: 0, total: 0 };
const SKELETON_COUNT = 12;

// Grille de films pour UNE recherche (texte + genre + tri).
// CatalogPage lui donne une "key" différente à chaque nouvelle recherche :
// React recrée alors le composant, qui repart d'un état neuf.
export default function MovieResults({ q, genre, sort }) {
  const cacheKey = `${q}|${genre}|${sort}`;
  const [results, setResults] = useState(() => cache.get(cacheKey) || NO_RESULTS);
  const [status, setStatus] = useState(results.page === 0 ? 'loading' : 'ready');
  const [attempt, setAttempt] = useState(0);
  const showToast = useToast();
  const sentinelRef = useRef(null);

  const hasMore = results.movies.length < results.total;

  function saveResults(nextResults) {
    cache.set(cacheKey, nextResults);
    setResults(nextResults);
  }

  // Première page : chargée à l'arrivée du composant (sauf si elle est en cache).
  useEffect(() => {
    if (cache.has(cacheKey)) return;

    let ignore = false; // évite d'afficher une réponse arrivée trop tard
    fetchMovies({ q, genre, sort, page: 1 })
      .then((data) => {
        if (ignore) return;
        const firstPage = { movies: data.items, page: 1, total: data.total };
        cache.set(cacheKey, firstPage);
        setResults(firstPage);
        setStatus('ready');
      })
      .catch(() => {
        if (!ignore) setStatus('error');
      });

    return () => {
      ignore = true;
    };
  }, [cacheKey, q, genre, sort, attempt]);

  // Pages suivantes : ajoutées à la suite de la grille.
  async function loadMore() {
    if (status !== 'ready' || !hasMore) return;
    setStatus('loading-more');
    try {
      const data = await fetchMovies({ q, genre, sort, page: results.page + 1 });
      saveResults({
        movies: [...results.movies, ...data.items],
        page: data.page,
        total: data.total,
      });
    } catch (error) {
      showToast(error.message, 'error');
    }
    setStatus('ready');
  }

  // Défilement infini : dès que le bas de la grille approche de l'écran,
  // on charge la page suivante.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadMore();
      },
      { rootMargin: '600px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  });

  function retry() {
    setStatus('loading');
    setAttempt((current) => current + 1);
  }

  if (status === 'loading') {
    return (
      <div className="movie-grid" aria-busy="true" aria-label="Chargement des films">
        {Array.from({ length: SKELETON_COUNT }, (_, index) => (
          <div key={index} className="skeleton" style={{ aspectRatio: '2 / 3' }} />
        ))}
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="empty-state" role="alert">
        <h2>Le catalogue ne répond pas</h2>
        <p className="muted">Vérifie que l'API est démarrée, puis relance le chargement.</p>
        <button type="button" className="button button--primary" onClick={retry}>
          Recharger les films
        </button>
      </div>
    );
  }

  if (results.total === 0) {
    return (
      <div className="empty-state">
        <h2>Aucun film ne correspond</h2>
        <p className="muted">
          Le catalogue est en anglais : essaie le titre original, ou retire un filtre.
        </p>
      </div>
    );
  }

  return (
    <>
      <p className="catalog__count muted" aria-live="polite">
        {formatCount(results.total)} {results.total > 1 ? 'films' : 'film'}
      </p>

      <ul className="movie-grid">
        {results.movies.map((movie) => (
          <li key={movie.id}>
            <MovieCard movie={movie} />
          </li>
        ))}
      </ul>

      {hasMore && (
        <div ref={sentinelRef} className="catalog__more">
          <button
            type="button"
            className="button"
            onClick={loadMore}
            disabled={status === 'loading-more'}
          >
            {status === 'loading-more' ? 'Chargement…' : 'Afficher plus de films'}
          </button>
        </div>
      )}
    </>
  );
}
