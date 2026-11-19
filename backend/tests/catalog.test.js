const request = require('supertest');
const { app, startTestDatabases, stopTestDatabases } = require('./helpers');
const { MOVIE_IDS } = require('./fixtures/movies');

beforeAll(startTestDatabases);
afterAll(stopTestDatabases);

describe('GET /api/movies', () => {
  test('liste publique (sans jeton), paginée, sans les séries', async () => {
    const response = await request(app).get('/api/movies');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ page: 1, limit: 24, total: 5, totalPages: 1 });
    expect(response.body.items).toHaveLength(5);
    expect(response.body.items.map((movie) => movie.title)).not.toContain('Some Series');
  });

  test('chaque film a la forme publique attendue (id, pas _id)', async () => {
    const response = await request(app).get('/api/movies?limit=1');

    expect(response.body.items[0]).toEqual({
      id: MOVIE_IDS.alien, // le plus de votes : premier du tri "popular"
      title: 'Alien Planet',
      year: 1979,
      genres: ['Horror', 'Sci-Fi'],
      poster: expect.any(String),
      runtime: 120,
      imdbRating: 8.5,
      imdbVotes: 800000,
    });
  });

  test('recherche par titre, insensible à la casse', async () => {
    const response = await request(app).get('/api/movies?q=aMeLiE');

    expect(response.body.items.map((movie) => movie.title)).toEqual(['Amelie']);
  });

  test('les caractères spéciaux de la recherche ne cassent pas la requête', async () => {
    const response = await request(app).get('/api/movies').query({ q: '.*(' });

    expect(response.status).toBe(200);
    expect(response.body.items).toEqual([]);
  });

  test('filtre par genre et par année', async () => {
    const sciFi = await request(app).get('/api/movies?genre=Sci-Fi');
    const year2001 = await request(app).get('/api/movies?year=2001');

    expect(sciFi.body.items.map((movie) => movie.title).sort()).toEqual([
      'Alien Planet',
      'Space Odyssey',
    ]);
    expect(year2001.body.total).toBe(2);
  });

  test('tri par note : les films trop peu votés sont écartés', async () => {
    const response = await request(app).get('/api/movies?sort=rating');

    const titles = response.body.items.map((movie) => movie.title);
    expect(titles[0]).toBe('Spirited Garden'); // 8.6, la meilleure note
    expect(titles).not.toContain('Heat Wave'); // seulement 500 votes
  });

  test('pagination', async () => {
    const page2 = await request(app).get('/api/movies?limit=2&page=2');

    expect(page2.body).toMatchObject({ page: 2, limit: 2, total: 5, totalPages: 3 });
    expect(page2.body.items).toHaveLength(2);
  });

  test.each(['limit=0', 'limit=51', 'page=abc', 'year=12', 'sort=random'])(
    'paramètre invalide (%s) : 400',
    async (queryString) => {
      const response = await request(app).get(`/api/movies?${queryString}`);

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_INPUT');
    }
  );
});

describe('GET /api/movies/:id', () => {
  test('fiche complète', async () => {
    const response = await request(app).get(`/api/movies/${MOVIE_IDS.amelie}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: MOVIE_IDS.amelie,
      title: 'Amelie',
      plot: 'Résumé de Amelie.',
      directors: ['Réalisateur Fictif'],
      released: '2001-06-15',
    });
  });

  test('identifiant malformé : 400 ; film inconnu ou série : 404', async () => {
    const malformed = await request(app).get('/api/movies/123');
    const unknown = await request(app).get('/api/movies/64a0000000000000000000ff');
    const series = await request(app).get(`/api/movies/${MOVIE_IDS.series}`);

    expect(malformed.status).toBe(400);
    expect(unknown.status).toBe(404);
    expect(series.status).toBe(404);
  });
});

describe('GET /api/genres', () => {
  test('genres des films, triés, sans doublon', async () => {
    const response = await request(app).get('/api/genres');

    expect(response.status).toBe(200);
    expect(response.body.items).toEqual([
      'Adventure',
      'Animation',
      'Comedy',
      'Crime',
      'Drama',
      'Family',
      'Horror',
      'Romance',
      'Sci-Fi',
    ]);
  });
});

describe('Le catalogue est en lecture seule', () => {
  test.each(['post', 'patch', 'delete'])('%s sur un film : aucune route', async (method) => {
    const response = await request(app)[method](`/api/movies/${MOVIE_IDS.amelie}`).send({});

    expect(response.status).toBe(404);
  });
});
