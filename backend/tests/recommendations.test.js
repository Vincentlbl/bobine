const request = require('supertest');
const { Types } = require('mongoose');
const {
  app,
  startTestDatabases,
  resetAppData,
  stopTestDatabases,
  registerUser,
  bearer,
} = require('./helpers');
const { catalogConnection } = require('../src/config/db');
const { MOVIE_IDS } = require('./fixtures/movies');
const { buildGenreProfile, scoreMovie } = require('../src/services/recommendation.service');

// Trois films ajoutés au catalogue fictif, uniquement pour ce fichier
// (chaque fichier de tests recharge le catalogue de base au démarrage).
const EXTRA_IDS = {
  starDrift: '64a0000000000000000000a1',
  nightScream: '64a0000000000000000000a2',
  screamStation: '64a0000000000000000000a3',
};

function extraMovie(id, title, genres, rating) {
  return {
    _id: new Types.ObjectId(id),
    type: 'movie',
    title,
    year: 2005,
    genres,
    imdb: { rating, votes: 50000 },
  };
}

let alice;
let bob;

beforeAll(async () => {
  await startTestDatabases();
  await catalogConnection.collection('movies').insertMany([
    extraMovie(EXTRA_IDS.starDrift, 'Star Drift', ['Sci-Fi'], 7.0),
    extraMovie(EXTRA_IDS.nightScream, 'Night Scream', ['Horror'], 8.0),
    extraMovie(EXTRA_IDS.screamStation, 'Scream Station', ['Horror', 'Sci-Fi'], 9.0),
  ]);
});
beforeEach(async () => {
  await resetAppData();
  alice = await registerUser('alice@example.test');
  bob = await registerUser('bob@example.test');
});
afterAll(stopTestDatabases);

function createEntry(account, body) {
  return request(app).post('/api/entries').set(bearer(account.token)).send(body);
}

function getRecommendations(account, query = '') {
  return request(app).get(`/api/recommendations${query}`).set(bearer(account.token));
}

const idsOf = (response) => response.body.items.map((item) => item.movie.id);

describe('GET /api/recommendations', () => {
  test('sans jeton : 401', async () => {
    const response = await request(app).get('/api/recommendations');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  test('journal vide : les films les mieux notés du catalogue', async () => {
    const response = await getRecommendations(alice);

    expect(response.status).toBe(200);
    expect(response.body.basedOn).toBe('popular');
    expect(response.body.likedGenres).toEqual([]);
    // Triés par note IMDb, sans la série ni le film trop peu voté.
    expect(idsOf(response).slice(0, 3)).toEqual([
      EXTRA_IDS.screamStation,
      MOVIE_IDS.spirited,
      MOVIE_IDS.alien,
    ]);
    expect(idsOf(response)).not.toContain(MOVIE_IDS.series);
    expect(idsOf(response)).not.toContain(MOVIE_IDS.heat);
    expect(response.body.items[0]).toMatchObject({ score: null, matchedGenres: [] });
  });

  test('un film bien noté fait remonter les films du même genre', async () => {
    await createEntry(alice, { movieId: MOVIE_IDS.odyssey, status: 'watched', rating: 10 });

    const response = await getRecommendations(alice);

    expect(response.status).toBe(200);
    expect(response.body.basedOn).toBe('journal');
    expect(response.body.likedGenres).toEqual([
      { genre: 'Adventure', weight: 1 },
      { genre: 'Sci-Fi', weight: 1 },
    ]);
    // Uniquement des films de science-fiction, le film 100 % Sci-Fi en tête.
    expect(idsOf(response)).toEqual([
      EXTRA_IDS.starDrift,
      EXTRA_IDS.screamStation,
      MOVIE_IDS.alien,
    ]);
    expect(response.body.items[0]).toMatchObject({
      movie: { id: EXTRA_IDS.starDrift, title: 'Star Drift', genres: ['Sci-Fi'] },
      score: 91, // 0,7 × affinité 1 + 0,3 × note 7,0/10
      matchedGenres: ['Sci-Fi'],
    });
  });

  test('un genre mal noté fait descendre les films qui le portent', async () => {
    await createEntry(alice, { movieId: MOVIE_IDS.odyssey, status: 'watched', rating: 10 });
    await createEntry(alice, { movieId: EXTRA_IDS.nightScream, status: 'watched', rating: 1 });

    const response = await getRecommendations(alice);
    const scores = Object.fromEntries(response.body.items.map((item) => [item.movie.id, item.score]));

    // Scream Station a la meilleure note IMDb (9,0), mais son genre Horror
    // est mal noté par Alice : il passe derrière Star Drift (7,0).
    expect(idsOf(response)[0]).toBe(EXTRA_IDS.starDrift);
    expect(scores[EXTRA_IDS.starDrift]).toBeGreaterThan(scores[EXTRA_IDS.screamStation]);
    expect(response.body.likedGenres.map((item) => item.genre)).not.toContain('Horror');
  });

  test('ne propose jamais un film déjà dans le journal (vu ou à voir)', async () => {
    await createEntry(alice, { movieId: MOVIE_IDS.odyssey, status: 'watched', rating: 9 });
    await createEntry(alice, { movieId: EXTRA_IDS.starDrift, status: 'watchlist' });

    const response = await getRecommendations(alice);

    expect(idsOf(response)).not.toContain(MOVIE_IDS.odyssey);
    expect(idsOf(response)).not.toContain(EXTRA_IDS.starDrift);
    expect(idsOf(response)).toContain(MOVIE_IDS.alien);
  });

  test('journal sans rien d\'aimé : retour aux films les mieux notés', async () => {
    await createEntry(alice, { movieId: EXTRA_IDS.nightScream, status: 'watched', rating: 2 });

    const response = await getRecommendations(alice);

    expect(response.body.basedOn).toBe('popular');
    expect(idsOf(response)).not.toContain(EXTRA_IDS.nightScream);
  });

  test('isolation : le journal de Bob n\'influence pas les recommandations d\'Alice', async () => {
    await createEntry(bob, { movieId: MOVIE_IDS.amelie, status: 'watched', rating: 10, favorite: true });

    const response = await getRecommendations(alice);

    expect(response.body.basedOn).toBe('popular');
    expect(idsOf(response)).toContain(MOVIE_IDS.amelie); // pas dans SON journal
  });

  test('limit : borne le nombre de résultats, et est validé', async () => {
    const one = await getRecommendations(alice, '?limit=1');
    expect(one.body.items).toHaveLength(1);

    for (const invalid of ['0', '25', 'abc', '1.5']) {
      const response = await getRecommendations(alice, `?limit=${invalid}`);
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_INPUT');
    }
  });
});

describe('Calcul du profil et du score (fonctions pures)', () => {
  test('profil : note, watchlist, vu sans note et coup de cœur', () => {
    const profile = buildGenreProfile([
      { status: 'watched', rating: 10, favorite: true, genres: ['Sci-Fi'] }, // 1 + 0,5
      { status: 'watched', rating: 5, favorite: false, genres: ['Drama'] }, // neutre
      { status: 'watched', rating: 1, favorite: false, genres: ['Horror'] }, // -0,8
      { status: 'watched', rating: null, favorite: false, genres: ['Comedy'] }, // 0,2
      { status: 'watchlist', rating: null, favorite: false, genres: ['Comedy', 'Sci-Fi'] }, // 0,3
    ]);

    expect(profile['Sci-Fi']).toBeCloseTo(1.8);
    expect(profile.Drama).toBeCloseTo(0);
    expect(profile.Horror).toBeCloseTo(-0.8);
    expect(profile.Comedy).toBeCloseTo(0.5);
  });

  test('score : entre 0 et 100, jamais négatif', () => {
    const profile = { 'Sci-Fi': 2, Horror: -4 };

    expect(scoreMovie({ genres: ['Sci-Fi'], imdbRating: 10 }, profile, 2)).toBe(100);
    expect(scoreMovie({ genres: ['Horror'], imdbRating: 5 }, profile, 2)).toBe(0);
    expect(scoreMovie({ genres: [], imdbRating: 8 }, profile, 2)).toBe(24);
  });
});
