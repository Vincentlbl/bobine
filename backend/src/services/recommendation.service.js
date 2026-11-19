const { Entry } = require('../models/entry.model');
const catalogService = require('./catalog.service');

// --- Réglages de l'algorithme (tous au même endroit, faciles à expliquer) ---

// Ce que "pèse" un film du journal quand il n'a pas de note.
const SIGNAL_WATCHED_UNRATED = 0.2; // vu sans note : léger intérêt
const SIGNAL_WATCHLIST = 0.3; // dans la watchlist : envie déclarée
const FAVORITE_BONUS = 0.5; // coup de cœur : s'ajoute au reste

// Combien de genres préférés servent à chercher des candidats.
const LIKED_GENRES_COUNT = 3;
// Combien de candidats on demande au catalogue avant de les classer.
const CANDIDATE_POOL_SIZE = 500;

// Part de chaque critère dans le score final (la somme fait 1).
const AFFINITY_SHARE = 0.7; // tes goûts
const QUALITY_SHARE = 0.3; // la note publique IMDb

// Étape 1 : transformer UNE entrée du journal en un nombre entre -1 et 1,5.
// Une note de 5/10 est neutre : au-dessus le film compte "pour" ses genres,
// en dessous il compte "contre".
function entrySignal(entry) {
  let signal;
  if (entry.status === 'watchlist') signal = SIGNAL_WATCHLIST;
  else if (entry.rating === null) signal = SIGNAL_WATCHED_UNRATED;
  else signal = (entry.rating - 5) / 5;

  return entry.favorite ? signal + FAVORITE_BONUS : signal;
}

// Étape 2 : additionner ces signaux par genre.
// Résultat : { 'Sci-Fi': 1.8, Horror: -0.8, ... } = le "profil de goûts".
function buildGenreProfile(entries) {
  const profile = {};
  for (const entry of entries) {
    const signal = entrySignal(entry);
    for (const genre of entry.genres) {
      profile[genre] = (profile[genre] || 0) + signal;
    }
  }
  return profile;
}

// Les genres au poids positif, du plus aimé au moins aimé.
function likedGenresOf(profile) {
  return Object.entries(profile)
    .filter(([, weight]) => weight > 0)
    .map(([genre, weight]) => ({ genre, weight: Math.round(weight * 100) / 100 }))
    .sort((a, b) => b.weight - a.weight || a.genre.localeCompare(b.genre));
}

// Étape 3 : noter un film candidat entre 0 et 100.
//  - affinité : moyenne des poids de SES genres, ramenée entre -1 et 1
//    (un genre que tu n'aimes pas fait baisser la moyenne) ;
//  - qualité : la note IMDb ramenée entre 0 et 1.
function scoreMovie(movie, profile, maxWeight) {
  const genres = movie.genres.length > 0 ? movie.genres : [null];
  const weightSum = genres.reduce((sum, genre) => sum + (profile[genre] || 0), 0);
  const affinity = Math.max(-1, weightSum / genres.length / maxWeight);
  const quality = movie.imdbRating / 10;

  const score = AFFINITY_SHARE * affinity + QUALITY_SHARE * quality;
  return Math.max(0, Math.round(score * 100));
}

// Recommandations pour un compte. ownerId vient du JWT, comme pour le journal.
async function getRecommendations(ownerId, limit) {
  // Le journal (base application), puis les genres de ses films (base catalogue).
  const entries = await Entry.find({ ownerId });
  const journalMovieIds = entries.map((entry) => entry.movieId);
  const summariesById = await catalogService.findSummariesByIds(journalMovieIds);

  const profile = buildGenreProfile(
    entries.map((entry) => ({
      status: entry.status,
      rating: entry.rating,
      favorite: entry.favorite,
      genres: summariesById[entry.movieId.toString()]?.genres || [],
    }))
  );
  const likedGenres = likedGenresOf(profile);

  // Journal vide, ou rien d'aimé : on ne peut rien déduire. On propose
  // les films les mieux notés du catalogue (hors journal).
  if (likedGenres.length === 0) {
    const movies = await catalogService.findTopRated({ excludeIds: journalMovieIds, limit });
    return {
      basedOn: 'popular',
      likedGenres: [],
      items: movies.map((movie) => ({ movie, score: null, matchedGenres: [] })),
    };
  }

  // Candidats : les films bien notés qui ont au moins un des genres préférés
  // et qui ne sont pas déjà dans le journal.
  const searchGenres = likedGenres.slice(0, LIKED_GENRES_COUNT).map((item) => item.genre);
  const candidates = await catalogService.findTopRated({
    genres: searchGenres,
    excludeIds: journalMovieIds,
    limit: CANDIDATE_POOL_SIZE,
  });

  const maxWeight = likedGenres[0].weight;
  const items = candidates
    .map((movie) => ({
      movie,
      score: scoreMovie(movie, profile, maxWeight),
      // Sert à l'interface pour expliquer la recommandation.
      matchedGenres: movie.genres.filter((genre) => profile[genre] > 0),
    }))
    .sort((a, b) => b.score - a.score || b.movie.imdbVotes - a.movie.imdbVotes)
    .slice(0, limit);

  return { basedOn: 'journal', likedGenres: likedGenres.slice(0, 5), items };
}

module.exports = { getRecommendations, buildGenreProfile, scoreMovie };
