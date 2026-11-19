import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import * as entriesApi from '../api/entries';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { todayISO } from '../utils/format';
import ConfirmDialog from './ConfirmDialog';
import RatingPips from './RatingPips';
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
  const [confirmingWatchlist, setConfirmingWatchlist] = useState(false);

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
  function moveToWatchlist() {
    setConfirmingWatchlist(false);
    update({ status: 'watchlist', rating: null, watchedAt: null }, 'Remis dans ta watchlist.');
  }

  // Clic sur "À voir" : si une note existe, on prévient avant de l'effacer.
  function requestWatchlist() {
    if (entry.rating !== null) setConfirmingWatchlist(true);
    else moveToWatchlist();
  }

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
      <section className="entry-panel entry-panel--simple" aria-labelledby="entry-panel-title">
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
      <section className="entry-panel entry-panel--simple" aria-busy="true">
        <h2>Mon journal</h2>
        <div className="skeleton" style={{ height: '2.75rem', maxWidth: '22rem' }} />
      </section>
    );
  }

  // --- Film absent du journal : création ---
  if (entry === null) {
    return (
      <section className="entry-panel entry-panel--simple" aria-labelledby="entry-panel-title">
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

  // Le bloc prend la forme d'un ticket de cinéma : un talon (titre + statut),
  // une ligne de découpe en pointillés, puis le corps du ticket.
  return (
    <section className="entry-panel entry-panel--ticket" aria-labelledby="entry-panel-title">
      <div className="entry-panel__stub">
        <h2 id="entry-panel-title">Mon journal</h2>

        {/* Sélecteur de statut : le bouton enfoncé est le statut actuel */}
        <div className="segmented" role="group" aria-label="Statut du film">
          <button
            type="button"
            className="segmented__option segmented__option--watchlist"
            aria-pressed={!isWatched}
            disabled={busy}
            onClick={isWatched ? requestWatchlist : undefined}
          >
            <BookmarkIcon size={17} /> À voir
          </button>
          <button
            type="button"
            className="segmented__option segmented__option--watched"
            aria-pressed={isWatched}
            disabled={busy}
            onClick={isWatched ? undefined : markWatched}
          >
            <CheckIcon size={17} /> Vu
          </button>
        </div>
      </div>

      <div className="entry-panel__body">
        {isWatched ? (
          <>
            <RatingPips
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
          <p className="muted">
            Dans ta watchlist. Passe-le en « Vu » pour le noter et écrire ta critique.
          </p>
        )}
      </div>

      <div className="entry-panel__footer">
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
        open={confirmingWatchlist}
        title="Remettre ce film dans ta watchlist ?"
        message="Un film « à voir » n’a ni note ni date : ta note et la date de visionnage seront effacées. Ta critique est conservée."
        confirmLabel="Remettre à voir"
        onConfirm={moveToWatchlist}
        onCancel={() => setConfirmingWatchlist(false)}
      />

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
