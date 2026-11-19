import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import * as entriesApi from '../api/entries';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { todayISO } from '../utils/format';
import ConfirmDialog from './ConfirmDialog';
import StarRating from './StarRating';
import { BookmarkIcon, CheckIcon, HeartIcon, TrashIcon } from './Icons';
import './EntryPanel.css';

// Le bloc "Mon journal" de la fiche d'un film : c'est ici que l'on crée,
// modifie et supprime l'entrée du journal liée à ce film.
export default function EntryPanel({ movie }) {
  const { user } = useAuth();
  const location = useLocation();
  const showToast = useToast();

  // undefined = on ne sait pas encore ; null = film absent du journal.
  const [entry, setEntry] = useState(undefined);
  const [busy, setBusy] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    if (!user) return;
    let ignore = false;
    entriesApi
      .fetchEntryForMovie(movie.id)
      .then((found) => {
        if (!ignore) setEntry(found);
      })
      .catch(() => {
        if (!ignore) setEntry(null);
      });
    return () => {
      ignore = true;
    };
  }, [user, movie.id]);

  // Exécute un appel à l'API, puis affiche le résultat ou l'erreur.
  async function run(apiCall, successMessage) {
    setBusy(true);
    try {
      const result = await apiCall();
      setEntry(result);
      showToast(successMessage);
    } catch (error) {
      showToast(error.message, 'error');
    }
    setBusy(false);
  }

  const addToWatchlist = () =>
    run(
      () => entriesApi.createEntry({ movieId: movie.id, status: 'watchlist' }),
      'Ajouté à ta watchlist.'
    );

  const addAsWatched = () =>
    run(
      () => entriesApi.createEntry({ movieId: movie.id, status: 'watched', watchedAt: todayISO() }),
      'Ajouté à tes films vus.'
    );

  const update = (changes, successMessage) =>
    run(() => entriesApi.updateEntry(entry.id, changes), successMessage);

  const markWatched = () =>
    update({ status: 'watched', watchedAt: todayISO() }, 'Marqué comme vu.');

  // Un film "à voir" n'a ni note ni date : on les efface en même temps.
  const moveToWatchlist = () =>
    update({ status: 'watchlist', rating: null, watchedAt: null }, 'Remis dans ta watchlist.');

  async function remove() {
    setConfirmingDelete(false);
    await run(async () => {
      await entriesApi.deleteEntry(entry.id);
      return null;
    }, 'Retiré de ton journal.');
  }

  // --- Visiteur non connecté ---
  if (!user) {
    return (
      <section className="entry-panel" aria-labelledby="entry-panel-title">
        <h2 id="entry-panel-title">Mon journal</h2>
        <p className="muted">Connecte-toi pour garder ce film dans ta watchlist ou le noter.</p>
        <div className="entry-panel__actions">
          <Link to="/connexion" state={{ from: location.pathname }} className="button button--primary">
            Se connecter
          </Link>
          <Link to="/inscription" state={{ from: location.pathname }} className="button">
            Créer un compte
          </Link>
        </div>
      </section>
    );
  }

  // --- Chargement de l'entrée ---
  if (entry === undefined) {
    return (
      <section className="entry-panel" aria-busy="true">
        <h2>Mon journal</h2>
        <div className="skeleton" style={{ height: '2.75rem', maxWidth: '22rem' }} />
      </section>
    );
  }

  // --- Film absent du journal : création ---
  if (entry === null) {
    return (
      <section className="entry-panel" aria-labelledby="entry-panel-title">
        <h2 id="entry-panel-title">Mon journal</h2>
        <p className="muted">Ce film n'est pas encore dans ton journal.</p>
        <div className="entry-panel__actions">
          <button type="button" className="button button--primary" onClick={addToWatchlist} disabled={busy}>
            <BookmarkIcon /> Ajouter à ma watchlist
          </button>
          <button type="button" className="button" onClick={addAsWatched} disabled={busy}>
            <CheckIcon /> Je l'ai vu
          </button>
        </div>
      </section>
    );
  }

  // --- Film présent : consultation et modification ---
  const isWatched = entry.status === 'watched';

  return (
    <section className="entry-panel" aria-labelledby="entry-panel-title">
      <h2 id="entry-panel-title">Mon journal</h2>

      <p className={`entry-panel__status entry-panel__status--${entry.status}`}>
        {isWatched ? <CheckIcon size={18} /> : <BookmarkIcon size={18} />}
        {isWatched ? 'Tu as vu ce film' : 'Dans ta watchlist'}
      </p>

      {isWatched ? (
        <>
          <StarRating
            value={entry.rating}
            disabled={busy}
            onChange={(rating) =>
              update({ rating }, rating ? 'Note enregistrée.' : 'Note retirée.')
            }
          />

          <div className="entry-panel__row">
            <label className="field entry-panel__date">
              <span className="field__label">Vu le</span>
              <input
                type="date"
                className="input"
                max={todayISO()}
                value={entry.watchedAt || ''}
                disabled={busy}
                onChange={(event) =>
                  update({ watchedAt: event.target.value || null }, 'Date enregistrée.')
                }
              />
            </label>

            <button
              type="button"
              className={`button entry-panel__favorite ${entry.favorite ? 'entry-panel__favorite--on' : ''}`}
              aria-pressed={entry.favorite}
              disabled={busy}
              onClick={() =>
                update(
                  { favorite: !entry.favorite },
                  entry.favorite ? 'Retiré de tes coups de cœur.' : 'Ajouté à tes coups de cœur.'
                )
              }
            >
              <HeartIcon filled={entry.favorite} /> Coup de cœur
            </button>
          </div>

          <ReviewForm
            initialReview={entry.review}
            disabled={busy}
            onSave={(review) => update({ review }, 'Critique enregistrée.')}
          />
        </>
      ) : (
        <div className="entry-panel__actions">
          <button type="button" className="button button--primary" onClick={markWatched} disabled={busy}>
            <CheckIcon /> Marquer comme vu
          </button>
        </div>
      )}

      <div className="entry-panel__footer">
        {isWatched && (
          <button type="button" className="button button--small button--quiet" onClick={moveToWatchlist} disabled={busy}>
            Remettre dans ma watchlist
          </button>
        )}
        <button
          type="button"
          className="button button--small button--quiet button--danger"
          onClick={() => setConfirmingDelete(true)}
          disabled={busy}
        >
          <TrashIcon size={16} /> Retirer de mon journal
        </button>
      </div>

      <ConfirmDialog
        open={confirmingDelete}
        title="Retirer ce film de ton journal ?"
        message={`« ${movie.title} » sera retiré, avec ta note et ta critique. Cette action est définitive.`}
        confirmLabel="Retirer du journal"
        onConfirm={remove}
        onCancel={() => setConfirmingDelete(false)}
      />
    </section>
  );
}

const REVIEW_MAX_LENGTH = 2000;

function ReviewForm({ initialReview, disabled, onSave }) {
  const [review, setReview] = useState(initialReview);
  const unchanged = review.trim() === initialReview;

  function handleSubmit(event) {
    event.preventDefault();
    onSave(review.trim());
  }

  return (
    <form className="field" onSubmit={handleSubmit}>
      <label htmlFor="review" className="field__label">
        Ma critique
      </label>
      <textarea
        id="review"
        className="input"
        maxLength={REVIEW_MAX_LENGTH}
        placeholder="Ce que tu en as pensé, pour t'en souvenir plus tard."
        value={review}
        onChange={(event) => setReview(event.target.value)}
      />
      <div className="entry-panel__review-footer">
        <span className="field__hint">
          {review.length} / {REVIEW_MAX_LENGTH}
        </span>
        <button type="submit" className="button button--small" disabled={disabled || unchanged}>
          Enregistrer la critique
        </button>
      </div>
    </form>
  );
}
