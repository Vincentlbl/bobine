import { Link } from 'react-router-dom';
import Poster from './Poster';
import { CheckIcon, HeartIcon, StarIcon, TrashIcon } from './Icons';
import { formatDate } from '../utils/format';
import './EntryRow.css';

// Une ligne du journal : le film, ce qu'on en a noté, et les actions rapides.
export default function EntryRow({ entry, busy, onMarkWatched, onToggleFavorite, onDelete }) {
  // Le film peut avoir disparu du catalogue : on garde une ligne lisible.
  const movie = entry.movie || { id: entry.movieId, title: 'Film retiré du catalogue', poster: null };
  const isWatched = entry.status === 'watched';
  const movieUrl = `/films/${movie.id}`;

  return (
    <li className="entry-row">
      <Link to={movieUrl} state={{ movie: entry.movie }} className="entry-row__poster" tabIndex={-1} aria-hidden="true">
        <Poster movie={movie} width={185} />
      </Link>

      <div className="entry-row__body">
        <h3 className="entry-row__title">
          <Link to={movieUrl} state={{ movie: entry.movie }}>
            {movie.title}
          </Link>
          {movie.year && <span className="muted"> {movie.year}</span>}
        </h3>

        {isWatched && (
          <p className="entry-row__facts">
            {entry.rating !== null && (
              <span className="entry-row__rating">
                <StarIcon size={14} filled /> {entry.rating}/10
              </span>
            )}
            {entry.watchedAt && <span className="muted">Vu le {formatDate(entry.watchedAt)}</span>}
            {entry.favorite && (
              <span className="entry-row__favorite">
                <HeartIcon size={15} filled /> Coup de cœur
              </span>
            )}
          </p>
        )}

        {entry.review && <p className="entry-row__review">{entry.review}</p>}
      </div>

      <div className="entry-row__actions">
        {isWatched ? (
          <>
            <button
              type="button"
              className={`button button--small button--quiet ${entry.favorite ? 'entry-row__favorite' : ''}`}
              aria-pressed={entry.favorite}
              disabled={busy}
              onClick={() => onToggleFavorite(entry)}
            >
              <HeartIcon size={18} filled={entry.favorite} />
              <span className="entry-row__action-label">
                {/* Texte lu par les lecteurs d'écran quand seul le cœur est affiché (mobile) */}
                Coup de cœur
              </span>
            </button>
            <Link
              to={movieUrl}
              state={{ movie: entry.movie }}
              className="button button--small button--quiet entry-row__edit"
            >
              Modifier
            </Link>
          </>
        ) : (
          <button type="button" className="button button--small" disabled={busy} onClick={() => onMarkWatched(entry)}>
            <CheckIcon size={16} /> Marquer comme vu
          </button>
        )}
        <button
          type="button"
          className="button button--small button--quiet button--danger"
          disabled={busy}
          onClick={() => onDelete(entry)}
        >
          <TrashIcon size={18} />
          <span className="entry-row__action-label">Retirer</span>
        </button>
      </div>
    </li>
  );
}
