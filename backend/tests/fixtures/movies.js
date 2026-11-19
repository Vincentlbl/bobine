// Petit catalogue fictif, au même format que la collection publique
// sample_mflix.movies. Les tests ne dépendent ainsi jamais du vrai catalogue.
const { Types } = require('mongoose');

const MOVIE_IDS = {
  odyssey: '64a000000000000000000001',
  amelie: '64a000000000000000000002',
  alien: '64a000000000000000000003',
  heat: '64a000000000000000000004',
  spirited: '64a000000000000000000005',
  series: '64a000000000000000000006',
};

function movie(id, title, year, genres, rating, votes, extra = {}) {
  return {
    _id: new Types.ObjectId(id),
    type: 'movie',
    title,
    year,
    genres,
    poster: `https://example.test/posters/${id}.jpg`,
    plot: `Résumé de ${title}.`,
    runtime: 120,
    directors: ['Réalisateur Fictif'],
    cast: ['Actrice Fictive', 'Acteur Fictif'],
    countries: ['France'],
    languages: ['French'],
    released: new Date(`${year}-06-15T00:00:00Z`),
    imdb: { rating, votes },
    ...extra,
  };
}

const movies = [
  movie(MOVIE_IDS.odyssey, 'Space Odyssey', 1968, ['Adventure', 'Sci-Fi'], 8.3, 600000),
  movie(MOVIE_IDS.amelie, 'Amelie', 2001, ['Comedy', 'Romance'], 8.3, 700000),
  movie(MOVIE_IDS.alien, 'Alien Planet', 1979, ['Horror', 'Sci-Fi'], 8.5, 800000),
  movie(MOVIE_IDS.heat, 'Heat Wave', 1995, ['Crime', 'Drama'], 8.2, 500),
  movie(MOVIE_IDS.spirited, 'Spirited Garden', 2001, ['Animation', 'Family'], 8.6, 650000),
  // Une série : présente dans le jeu public, mais l'API ne doit jamais la renvoyer.
  movie(MOVIE_IDS.series, 'Some Series', 2010, ['Drama'], 9.9, 900000, { type: 'series' }),
];

module.exports = { movies, MOVIE_IDS };
