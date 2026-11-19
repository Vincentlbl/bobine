import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchGenres } from '../api/movies';
import MovieResults from '../components/MovieResults';
import { SearchIcon } from '../components/Icons';
import { genreLabel } from '../utils/genres';
import './CatalogPage.css';

const SORT_OPTIONS = [
  { value: 'popular', label: 'Les plus populaires' },
  { value: 'rating', label: 'Les mieux notés' },
  { value: 'recent', label: 'Les plus récents' },
  { value: 'title', label: 'Titre, de A à Z' },
];
const SEARCH_DELAY_MS = 350;
const VISIBLE_GENRES = 7; // les autres genres s'affichent à la demande

// Page d'accueil : chercher et parcourir le catalogue.
// La recherche en cours vit dans l'URL (/?q=alien&genre=Sci-Fi&sort=rating) :
// on peut la partager, et le bouton "retour" du navigateur la retrouve.
export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const genre = searchParams.get('genre') || '';
  const sort = searchParams.get('sort') || 'popular';

  // Texte en cours de frappe. Il a un temps d'avance sur "q" (l'URL), sauf si
  // l'URL change d'elle-même (clic sur "Films" dans le menu) : on se réaligne.
  const [searchText, setSearchText] = useState(q);
  const [knownQ, setKnownQ] = useState(q);
  if (q !== knownQ) {
    setKnownQ(q);
    if (q !== searchText.trim()) setSearchText(q);
  }

  const [genres, setGenres] = useState([]);
  const [showAllGenres, setShowAllGenres] = useState(false);

  // Le genre sélectionné passe en tête pour rester visible quand la liste est repliée.
  const orderedGenres = genre ? [genre, ...genres.filter((name) => name !== genre)] : genres;
  const visibleGenres = showAllGenres ? orderedGenres : orderedGenres.slice(0, VISIBLE_GENRES);
  const hiddenGenreCount = orderedGenres.length - visibleGenres.length;

  useEffect(() => {
    fetchGenres()
      .then(setGenres)
      .catch(() => setGenres([])); // sans les genres, la recherche reste utilisable
  }, []);

  // Met à jour un paramètre de l'URL (ou le retire s'il est vide).
  function updateParam(name, value) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(name, value);
    else next.delete(name);
    setSearchParams(next, { replace: true });
  }

  // On attend que l'utilisateur fasse une pause dans sa frappe avant de
  // lancer la recherche : une requête par mot, pas une par lettre.
  useEffect(() => {
    if (searchText.trim() === q) return;
    const timer = setTimeout(() => updateParam('q', searchText.trim()), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  });

  return (
    <div className="page catalog">
      <h1 className="visually-hidden">Catalogue de films</h1>

      <div className="catalog__search" role="search">
        <label htmlFor="movie-search" className="visually-hidden">
          Chercher un film par son titre
        </label>
        <SearchIcon size={34} />
        <input
          id="movie-search"
          type="search"
          className="catalog__search-input display"
          placeholder="Chercher un film"
          autoComplete="off"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
        />
      </div>

      <div className="catalog__filters">
        <div className="chips" role="group" aria-label="Filtrer par genre">
          <button
            type="button"
            className="chip"
            aria-pressed={genre === ''}
            onClick={() => updateParam('genre', '')}
          >
            Tous les genres
          </button>
          {visibleGenres.map((name) => (
            <button
              key={name}
              type="button"
              className="chip"
              aria-pressed={genre === name}
              onClick={() => updateParam('genre', genre === name ? '' : name)}
            >
              {genreLabel(name)}
            </button>
          ))}
          {genres.length > VISIBLE_GENRES && (
            <button
              type="button"
              className="chip chip--toggle"
              aria-expanded={showAllGenres}
              onClick={() => setShowAllGenres(!showAllGenres)}
            >
              {showAllGenres ? 'Moins de genres' : `+ ${hiddenGenreCount} genres`}
            </button>
          )}
        </div>

        <label className="catalog__sort">
          <span className="muted">Trier par</span>
          <select
            className="input"
            value={sort}
            onChange={(event) => updateParam('sort', event.target.value)}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* key : une nouvelle recherche = un nouveau composant, donc un état neuf */}
      <MovieResults key={`${q}|${genre}|${sort}`} q={q} genre={genre} sort={sort} />
    </div>
  );
}
