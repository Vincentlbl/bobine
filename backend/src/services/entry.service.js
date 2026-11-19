const { Entry } = require('../models/entry.model');
const catalogService = require('./catalog.service');
const AppError = require('../utils/AppError');

const DUPLICATE_KEY_ERROR = 11000;

// Règle métier : un film pas encore vu n'a ni note ni date de visionnage.
function assertCoherent(entry) {
  if (entry.status === 'watchlist' && (entry.rating !== null || entry.watchedAt !== null)) {
    throw AppError.invalidInput(
      'Un film de la watchlist ne peut avoir ni note ni date de visionnage (passez status à "watched").'
    );
  }
}

// Les deux bases ne peuvent pas être jointes par MongoDB : on lit les entrées
// dans notre base, puis les films correspondants dans le catalogue, et on
// assemble ici. Deux requêtes en tout, quel que soit le nombre d'entrées.
async function withMovies(entries) {
  const movieIds = entries.map((entry) => entry.movieId);
  const summariesById = await catalogService.findSummariesByIds(movieIds);
  return entries.map((entry) => ({
    ...entry.toJSON(),
    movie: summariesById[entry.movieId.toString()] || null,
  }));
}

async function withMovie(entry) {
  const [enriched] = await withMovies([entry]);
  return enriched;
}

// Toutes les fonctions reçoivent ownerId (issu du JWT) et filtrent dessus :
// c'est ce qui garantit qu'un compte ne voit jamais les données d'un autre.

async function listEntries(ownerId, filters = {}) {
  const entries = await Entry.find({ ...filters, ownerId }).sort({ updatedAt: -1 });
  return withMovies(entries);
}

async function createEntry(ownerId, data) {
  const alreadyInJournal = () =>
    AppError.conflict('ENTRY_ALREADY_EXISTS', 'Ce film est déjà dans votre journal.');

  if (!(await catalogService.movieExists(data.movieId))) {
    throw AppError.invalidInput("movieId ne correspond à aucun film du catalogue.");
  }
  if (await Entry.exists({ ownerId, movieId: data.movieId })) {
    throw alreadyInJournal();
  }

  const entry = new Entry({ ...data, ownerId });
  assertCoherent(entry);
  try {
    await entry.save();
  } catch (error) {
    if (error.code === DUPLICATE_KEY_ERROR) throw alreadyInJournal();
    throw error;
  }
  return withMovie(entry);
}

// Entrée absente OU appartenant à un autre compte : même réponse 404,
// pour ne pas révéler l'existence des données des autres.
async function findOwnedEntry(ownerId, id) {
  const entry = await Entry.findOne({ _id: id, ownerId });
  if (!entry) throw AppError.notFound('Entrée introuvable.');
  return entry;
}

async function getEntry(ownerId, id) {
  const entry = await findOwnedEntry(ownerId, id);
  return withMovie(entry);
}

async function updateEntry(ownerId, id, changes) {
  const entry = await findOwnedEntry(ownerId, id);
  entry.set(changes);
  assertCoherent(entry);
  await entry.save();
  return withMovie(entry);
}

async function deleteEntry(ownerId, id) {
  const result = await Entry.deleteOne({ _id: id, ownerId });
  if (result.deletedCount === 0) throw AppError.notFound('Entrée introuvable.');
}

// Statistiques du journal : quelques compteurs et les genres les plus vus.
async function getStats(ownerId) {
  const entries = await listEntries(ownerId);
  const watched = entries.filter((entry) => entry.status === 'watched');
  const rated = watched.filter((entry) => entry.rating !== null);

  const genreCounts = {};
  for (const entry of watched) {
    for (const genre of entry.movie?.genres || []) {
      genreCounts[genre] = (genreCounts[genre] || 0) + 1;
    }
  }
  const topGenres = Object.entries(genreCounts)
    .map(([genre, count]) => ({ genre, count }))
    .sort((a, b) => b.count - a.count || a.genre.localeCompare(b.genre))
    .slice(0, 5);

  const ratingSum = rated.reduce((sum, entry) => sum + entry.rating, 0);

  return {
    watchedCount: watched.length,
    watchlistCount: entries.length - watched.length,
    favoriteCount: entries.filter((entry) => entry.favorite).length,
    averageRating: rated.length > 0 ? Math.round((ratingSum / rated.length) * 10) / 10 : null,
    topGenres,
  };
}

module.exports = { listEntries, createEntry, getEntry, updateEntry, deleteEntry, getStats };
