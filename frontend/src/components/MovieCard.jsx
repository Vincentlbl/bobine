import { Link, useViewTransitionState } from 'react-router-dom';
import Poster from './Poster';
import { StarIcon } from './Icons';
import { formatRating } from '../utils/format';
import './MovieCard.css';

// Une affiche cliquable dans une grille de films.
export default function MovieCard({ movie }) {
  const to = `/films/${movie.id}`;
  // Vrai pendant la transition vers (ou depuis) la fiche de CE film :
  // seule l'affiche concernée est alors animée.
  const isOpening = useViewTransitionState(to);

  return (
    // "state" transmet le résumé du film à la fiche, qui peut ainsi afficher
    // l'affiche et le titre tout de suite, avant même la réponse de l'API.
    <Link to={to} state={{ movie }} viewTransition className="movie-card">
      <Poster movie={movie} transitionName={isOpening ? 'poster' : undefined} />
      <span className="movie-card__title">{movie.title}</span>
      <span className="movie-card__meta">
        <span>{movie.year}</span>
        <span className="movie-card__rating">
          <StarIcon size={13} filled />
          <span className="visually-hidden">Note IMDb : </span>
          {formatRating(movie.imdbRating)}
        </span>
      </span>
    </Link>
  );
}
