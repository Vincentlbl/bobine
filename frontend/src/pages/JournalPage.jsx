import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import * as entriesApi from '../api/entries';
import ConfirmDialog from '../components/ConfirmDialog';
import EntryRow from '../components/EntryRow';
import { useToast } from '../context/ToastContext';
import { formatRating, todayISO } from '../utils/format';
import { genreLabel } from '../utils/genres';
import '../components/EntryRow.css';
import './JournalPage.css';

const TABS = [
  { id: 'a-voir', label: 'À voir', matches: (entry) => entry.status === 'watchlist' },
  { id: 'vus', label: 'Vus', matches: (entry) => entry.status === 'watched' },
  { id: 'coups-de-coeur', label: 'Coups de cœur', matches: (entry) => entry.favorite },
];

const EMPTY_MESSAGES = {
  'a-voir': 'Ta watchlist est vide. Parcours le catalogue et garde les films qui te tentent.',
  vus: 'Aucun film vu pour l’instant. Marque un film comme vu pour commencer ton journal.',
  'coups-de-coeur': 'Pas encore de coup de cœur. Tu peux en choisir parmi tes films vus.',
};

// Mon journal : la liste privée de l'utilisateur connecté.
export default function JournalPage() {
  const showToast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = TABS.find((tab) => tab.id === searchParams.get('onglet')) || TABS[0];

  const [entries, setEntries] = useState(null); // null = chargement en cours
  const [stats, setStats] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState(null);

  // Changer ce compteur relance le chargement ci-dessous.
  const [reloadCount, setReloadCount] = useState(0);
  const reload = () => setReloadCount((count) => count + 1);

  // Charge la liste et les statistiques depuis l'API.
  useEffect(() => {
    let ignore = false;
    Promise.all([entriesApi.fetchEntries(), entriesApi.fetchStats()])
      .then(([loadedEntries, loadedStats]) => {
        if (ignore) return;
        setEntries(loadedEntries);
        setStats(loadedStats);
        setLoadError('');
      })
      .catch((error) => {
        if (!ignore) setLoadError(error.message);
      });
    return () => {
      ignore = true;
    };
  }, [reloadCount]);

  // Exécute une modification, puis recharge pour afficher l'état réel du serveur.
  async function run(apiCall, successMessage) {
    setBusy(true);
    try {
      await apiCall();
      showToast(successMessage);
      reload();
    } catch (error) {
      showToast(error.message, 'error');
    }
    setBusy(false);
  }

  const markWatched = (entry) =>
    run(
      () => entriesApi.updateEntry(entry.id, { status: 'watched', watchedAt: todayISO() }),
      'Marqué comme vu.'
    );

  const toggleFavorite = (entry) =>
    run(
      () => entriesApi.updateEntry(entry.id, { favorite: !entry.favorite }),
      entry.favorite ? 'Retiré de tes coups de cœur.' : 'Ajouté à tes coups de cœur.'
    );

  function confirmDelete() {
    const entry = entryToDelete;
    setEntryToDelete(null);
    run(() => entriesApi.deleteEntry(entry.id), 'Retiré de ton journal.');
  }

  if (loadError) {
    return (
      <div className="page empty-state" role="alert">
        <h1>Ton journal ne se charge pas</h1>
        <p className="muted">{loadError}</p>
        <button type="button" className="button button--primary" onClick={reload}>
          Recharger le journal
        </button>
      </div>
    );
  }

  if (entries === null) {
    return (
      <div className="page" aria-busy="true" aria-label="Chargement du journal">
        <div className="skeleton" style={{ height: '4rem', maxWidth: '24rem', marginBottom: '2rem' }} />
        <div className="skeleton" style={{ height: '6rem', marginBottom: '1rem' }} />
        <div className="skeleton" style={{ height: '6rem' }} />
      </div>
    );
  }

  const visibleEntries = entries.filter(activeTab.matches);

  return (
    <div className="page journal">
      <header className="journal__header">
        <h1>Mon journal</h1>
        {stats && <JournalSummary stats={stats} />}
      </header>

      <div className="journal__tabs" role="tablist" aria-label="Parties du journal">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            className="journal__tab"
            aria-selected={tab.id === activeTab.id}
            onClick={() => setSearchParams({ onglet: tab.id }, { replace: true })}
          >
            {tab.label}
            <span className="journal__tab-count">{entries.filter(tab.matches).length}</span>
          </button>
        ))}
      </div>

      {visibleEntries.length === 0 ? (
        <div className="empty-state">
          <p className="muted">{EMPTY_MESSAGES[activeTab.id]}</p>
          <Link to="/" className="button button--primary">
            Parcourir le catalogue
          </Link>
        </div>
      ) : (
        <ul className="entry-list">
          {visibleEntries.map((entry) => (
            <EntryRow
              key={entry.id}
              entry={entry}
              busy={busy}
              onMarkWatched={markWatched}
              onToggleFavorite={toggleFavorite}
              onDelete={setEntryToDelete}
            />
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={entryToDelete !== null}
        title="Retirer ce film de ton journal ?"
        message={`« ${entryToDelete?.movie?.title || 'Ce film'} » sera retiré, avec ta note et ta critique. Cette action est définitive.`}
        confirmLabel="Retirer du journal"
        onConfirm={confirmDelete}
        onCancel={() => setEntryToDelete(null)}
      />
    </div>
  );
}

// Les statistiques du journal, en quatre colonnes : un grand chiffre
// et son libellé en dessous.
function JournalSummary({ stats }) {
  if (stats.watchedCount === 0 && stats.watchlistCount === 0) {
    return <p className="journal__empty muted">Ton journal est encore vide.</p>;
  }

  const genres = stats.topGenres.slice(0, 3).map((item) => genreLabel(item.genre));
  // "Drame, policier, science-fiction" : majuscule au premier seulement.
  const genreList = genres.map((label, index) => (index === 0 ? label : label.toLowerCase())).join(', ');

  return (
    <dl className="journal__stats">
      <div className="journal__stat">
        <dt>{stats.watchedCount > 1 ? 'films vus' : 'film vu'}</dt>
        <dd>{stats.watchedCount}</dd>
      </div>
      <div className="journal__stat journal__stat--watchlist">
        <dt>à voir</dt>
        <dd>{stats.watchlistCount}</dd>
      </div>
      <div className="journal__stat journal__stat--rating">
        <dt>note moyenne</dt>
        <dd>
          {stats.averageRating !== null ? (
            <>
              {formatRating(stats.averageRating)}
              <span className="journal__stat-unit">/10</span>
            </>
          ) : (
            '–'
          )}
        </dd>
      </div>
      <div className="journal__stat journal__stat--genres">
        <dt>genres les plus vus</dt>
        <dd>{genreList || '–'}</dd>
      </div>
    </dl>
  );
}
