const Movie = require('../models/movie.model');
const AppError = require('../utils/AppError');

// Le jeu de données public n'est pas parfait : il contient quelques séries
// et des fiches sans note. Ce filtre de base les écarte de toutes les requêtes.
const BASE_FILTER = {
  type: 'movie',
  'imdb.rating': { $type: 'number' },
  'imdb.votes': { $type: 'number' },
};

// Pour le tri "mieux notés", on ignore les films trop peu votés
// (sinon un film inconnu noté 9,5 par 12 personnes arrive en tête).
const MIN_VOTES_FOR_TOP_RATED = 10000;

const SORTS = {
  popular: { 'imdb.votes': -1, _id: 1 },
  rating: { 'imdb.rating': -1, 'imdb.votes': -1, _id: 1 },
  recent: { year: -1, 'imdb.votes': -1, _id: 1 },
  title: { title: 1, _id: 1 },
};

// On ne ramène de MongoDB que les champs utiles (projection).
const SUMMARY_FIELDS = 'title year genres poster runtime imdb.rating imdb.votes';
const DETAIL_FIELDS = `${SUMMARY_FIELDS} plot fullplot directors cast countries languages rated released`;

// Forme publique d'un film dans une liste.
function toSummary(movie) {
  return {
    id: movie._id.toString(),
    title: movie.title,
    year: movie.year,
    genres: movie.genres || [],
    poster: movie.poster || null,
    runtime: movie.runtime ?? null,
    imdbRating: movie.imdb.rating,
    imdbVotes: movie.imdb.votes,
  };
}

// Forme publique de la fiche complète.
function toDetail(movie) {
  return {
    ...toSummary(movie),
    plot: movie.fullplot || movie.plot || null,
    directors: movie.directors || [],
    cast: movie.cast || [],
    countries: movie.countries || [],
    languages: movie.languages || [],
    rated: movie.rated || null,
    released: movie.released ? movie.released.toISOString().slice(0, 10) : null,
  };
}

// L'utilisateur tape du texte libre : on neutralise les caractères spéciaux
// des expressions régulières avant de chercher dans les titres.
function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function searchMovies({ q, genre, year, sort, page, limit }) {
  const filter = { ...BASE_FILTER };
  if (q) filter.title = { $regex: escapeRegex(q), $options: 'i' };
  if (genre) filter.genres = genre;
  if (year) filter.year = year;
  if (sort === 'rating') {
    filter['imdb.votes'] = { $gte: MIN_VOTES_FOR_TOP_RATED };
  }

  const [movies, total] = await Promise.all([
    Movie.find(filter)
      .select(SUMMARY_FIELDS)
      .sort(SORTS[sort])
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Movie.countDocuments(filter),
  ]);

  return {
    items: movies.map(toSummary),
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

async function getMovieById(id) {
  const movie = await Movie.findOne({ ...BASE_FILTER, _id: id }).select(DETAIL_FIELDS).lean();
  if (!movie) throw AppError.notFound('Film introuvable.');
  return toDetail(movie);
}

async function listGenres() {
  const genres = await Movie.distinct('genres', BASE_FILTER);
  return genres.sort();
}

// --- Fonctions utilisées par le journal (entry.service) ---

async function movieExists(id) {
  const found = await Movie.exists({ ...BASE_FILTER, _id: id });
  return Boolean(found);
}

// Renvoie un dictionnaire { idDuFilm: résumé } pour une liste d'identifiants.
async function findSummariesByIds(ids) {
  const movies = await Movie.find({ _id: { $in: ids } }).select(SUMMARY_FIELDS).lean();
  const summariesById = {};
  for (const movie of movies) {
    summariesById[movie._id.toString()] = toSummary(movie);
  }
  return summariesById;
}

// --- Fonction utilisée par les recommandations (recommendation.service) ---

// Les films les mieux notés (et suffisamment votés), en option limités à
// certains genres, en excluant une liste d'identifiants (ceux du journal).
async function findTopRated({ genres, excludeIds = [], limit }) {
  const filter = {
    ...BASE_FILTER,
    'imdb.votes': { $gte: MIN_VOTES_FOR_TOP_RATED },
    _id: { $nin: excludeIds },
  };
  if (genres) filter.genres = { $in: genres };

  const movies = await Movie.find(filter)
    .select(SUMMARY_FIELDS)
    .sort(SORTS.rating)
    .limit(limit)
    .lean();
  return movies.map(toSummary);
}

module.exports = {
  searchMovies,
  getMovieById,
  listGenres,
  movieExists,
  findSummariesByIds,
  findTopRated,
};
