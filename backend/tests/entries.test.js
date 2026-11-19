const request = require('supertest');
const {
  app,
  startTestDatabases,
  resetAppData,
  stopTestDatabases,
  registerUser,
  bearer,
} = require('./helpers');
const { connectDatabases, closeDatabases } = require('../src/config/db');
const { MOVIE_IDS } = require('./fixtures/movies');

let alice; // { token, user } du compte A
let bob; // { token, user } du compte B

beforeAll(startTestDatabases);
beforeEach(async () => {
  await resetAppData();
  alice = await registerUser('alice@example.test');
  bob = await registerUser('bob@example.test');
});
afterAll(stopTestDatabases);

// Raccourci : crée une entrée pour un compte et renvoie la réponse.
function createEntry(account, body) {
  return request(app).post('/api/entries').set(bearer(account.token)).send(body);
}

describe('Parcours CRUD nominal', () => {
  test('créer, lister, consulter, modifier puis supprimer une entrée', async () => {
    // Création
    const created = await createEntry(alice, { movieId: MOVIE_IDS.amelie, status: 'watchlist' });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({
      id: expect.any(String),
      movieId: MOVIE_IDS.amelie,
      status: 'watchlist',
      rating: null,
      watchedAt: null,
      review: '',
      favorite: false,
      movie: { id: MOVIE_IDS.amelie, title: 'Amelie', year: 2001 },
    });
    expect(created.body).not.toHaveProperty('_id');
    expect(created.body).not.toHaveProperty('ownerId');
    const entryId = created.body.id;

    // Liste
    const list = await request(app).get('/api/entries').set(bearer(alice.token));
    expect(list.status).toBe(200);
    expect(list.body.items).toHaveLength(1);
    expect(list.body.items[0].id).toBe(entryId);

    // Détail
    const detail = await request(app).get(`/api/entries/${entryId}`).set(bearer(alice.token));
    expect(detail.status).toBe(200);
    expect(detail.body.movie.title).toBe('Amelie');

    // Modification partielle
    const updated = await request(app)
      .patch(`/api/entries/${entryId}`)
      .set(bearer(alice.token))
      .send({ status: 'watched', rating: 9, watchedAt: '2026-11-14', review: '  Superbe.  ' });
    expect(updated.status).toBe(200);
    expect(updated.body).toMatchObject({
      id: entryId,
      status: 'watched',
      rating: 9,
      watchedAt: '2026-11-14',
      review: 'Superbe.',
      favorite: false, // champ non envoyé : inchangé
    });

    // Suppression : 204 sans corps, puis 404
    const deleted = await request(app).delete(`/api/entries/${entryId}`).set(bearer(alice.token));
    expect(deleted.status).toBe(204);
    expect(deleted.text).toBe('');

    const afterDelete = await request(app).get(`/api/entries/${entryId}`).set(bearer(alice.token));
    expect(afterDelete.status).toBe(404);
    expect(afterDelete.body.error.code).toBe('NOT_FOUND');
  });

  test('création complète d\'un film vu', async () => {
    const response = await createEntry(alice, {
      movieId: MOVIE_IDS.alien,
      status: 'watched',
      rating: 8,
      watchedAt: '2026-10-31',
      review: 'Parfait pour Halloween.',
      favorite: true,
    });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ status: 'watched', rating: 8, favorite: true });
  });

  test('filtres de la liste : status, favorite, movieId', async () => {
    await createEntry(alice, { movieId: MOVIE_IDS.amelie, status: 'watchlist' });
    await createEntry(alice, { movieId: MOVIE_IDS.alien, status: 'watched', favorite: true });

    const get = (query) => request(app).get(`/api/entries?${query}`).set(bearer(alice.token));
    const watchlist = await get('status=watchlist');
    const favorites = await get('favorite=true');
    const byMovie = await get(`movieId=${MOVIE_IDS.alien}`);
    const invalid = await get('status=seen');

    expect(watchlist.body.items.map((entry) => entry.movie.title)).toEqual(['Amelie']);
    expect(favorites.body.items.map((entry) => entry.movie.title)).toEqual(['Alien Planet']);
    expect(byMovie.body.items).toHaveLength(1);
    expect(invalid.status).toBe(400);
  });
});

describe('Validation des entrées : 400 INVALID_INPUT', () => {
  test.each([
    ['status hors énumération', { movieId: MOVIE_IDS.amelie, status: 'seen' }],
    ['status absent', { movieId: MOVIE_IDS.amelie }],
    ['movieId absent', { status: 'watchlist' }],
    ['movieId malformé', { movieId: '123', status: 'watchlist' }],
    ['film absent du catalogue', { movieId: '64a0000000000000000000ff', status: 'watchlist' }],
    ['note décimale', { movieId: MOVIE_IDS.amelie, status: 'watched', rating: 7.5 }],
    ['note hors bornes', { movieId: MOVIE_IDS.amelie, status: 'watched', rating: 11 }],
    ['note en chaîne', { movieId: MOVIE_IDS.amelie, status: 'watched', rating: '8' }],
    ['note sur un film pas encore vu', { movieId: MOVIE_IDS.amelie, status: 'watchlist', rating: 8 }],
    ['date impossible', { movieId: MOVIE_IDS.amelie, status: 'watched', watchedAt: '2026-02-30' }],
    ['date mal formatée', { movieId: MOVIE_IDS.amelie, status: 'watched', watchedAt: '14/11/2026' }],
    ['date dans le futur', { movieId: MOVIE_IDS.amelie, status: 'watched', watchedAt: '2999-01-01' }],
    ['critique trop longue', { movieId: MOVIE_IDS.amelie, status: 'watched', review: 'a'.repeat(2001) }],
    ['favorite non booléen', { movieId: MOVIE_IDS.amelie, status: 'watched', favorite: 'oui' }],
    ['ownerId fourni par le client', { movieId: MOVIE_IDS.amelie, status: 'watchlist', ownerId: '64b000000000000000000001' }],
    ['id fourni par le client', { movieId: MOVIE_IDS.amelie, status: 'watchlist', id: '64b000000000000000000001' }],
    ['champ inconnu', { movieId: MOVIE_IDS.amelie, status: 'watchlist', color: 'red' }],
  ])('POST refusé : %s', async (label, body) => {
    const response = await createEntry(alice, body);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_INPUT');
    expect(response.body.error.message).toEqual(expect.any(String));
  });

  test.each([
    ['corps vide', {}],
    ['champ inconnu', { title: 'Autre film' }],
    ['movieId non modifiable', { movieId: MOVIE_IDS.alien }],
    ['ownerId non modifiable', { ownerId: '64b000000000000000000001' }],
    ['id non modifiable', { id: '64b000000000000000000001' }],
    ['status invalide', { status: 'archived' }],
    ['note sans passer le film en "vu"', { rating: 7 }],
  ])('PATCH refusé : %s', async (label, body) => {
    const created = await createEntry(alice, { movieId: MOVIE_IDS.amelie, status: 'watchlist' });

    const response = await request(app)
      .patch(`/api/entries/${created.body.id}`)
      .set(bearer(alice.token))
      .send(body);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_INPUT');
  });

  test('identifiant malformé : 400 ; identifiant valide mais absent : 404', async () => {
    const malformed = await request(app).get('/api/entries/abc').set(bearer(alice.token));
    const absent = await request(app)
      .get('/api/entries/64c000000000000000000001')
      .set(bearer(alice.token));

    expect(malformed.status).toBe(400);
    expect(absent.status).toBe(404);
  });

  test('ajouter deux fois le même film : 409 ENTRY_ALREADY_EXISTS', async () => {
    await createEntry(alice, { movieId: MOVIE_IDS.amelie, status: 'watchlist' });

    const response = await createEntry(alice, { movieId: MOVIE_IDS.amelie, status: 'watched' });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('ENTRY_ALREADY_EXISTS');
  });
});

describe('Isolation entre les comptes A et B', () => {
  let aliceEntryId;

  beforeEach(async () => {
    const created = await createEntry(alice, { movieId: MOVIE_IDS.amelie, status: 'watchlist' });
    aliceEntryId = created.body.id;
  });

  test('la liste de B ne contient aucune entrée de A', async () => {
    const response = await request(app).get('/api/entries').set(bearer(bob.token));

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ items: [] });
  });

  test('B reçoit 404 en GET, PATCH et DELETE sur une entrée de A', async () => {
    const url = `/api/entries/${aliceEntryId}`;

    const read = await request(app).get(url).set(bearer(bob.token));
    const update = await request(app).patch(url).set(bearer(bob.token)).send({ favorite: true });
    const remove = await request(app).delete(url).set(bearer(bob.token));

    expect(read.status).toBe(404);
    expect(update.status).toBe(404);
    expect(remove.status).toBe(404);

    // L'entrée de A est intacte.
    const stillThere = await request(app).get(url).set(bearer(alice.token));
    expect(stillThere.status).toBe(200);
    expect(stillThere.body.favorite).toBe(false);
  });

  test('B peut ajouter le même film que A dans son propre journal', async () => {
    const response = await createEntry(bob, { movieId: MOVIE_IDS.amelie, status: 'watched' });

    expect(response.status).toBe(201);
  });
});

describe('Persistance', () => {
  test('une entrée reste disponible après une reconnexion à MongoDB', async () => {
    const created = await createEntry(alice, { movieId: MOVIE_IDS.amelie, status: 'watchlist' });

    // On simule un redémarrage de l'API : fermeture puis réouverture des connexions.
    await closeDatabases();
    await connectDatabases();

    const response = await request(app)
      .get(`/api/entries/${created.body.id}`)
      .set(bearer(alice.token));
    expect(response.status).toBe(200);
  });
});

describe('GET /api/entries/stats', () => {
  test('journal vide', async () => {
    const response = await request(app).get('/api/entries/stats').set(bearer(alice.token));

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      watchedCount: 0,
      watchlistCount: 0,
      favoriteCount: 0,
      averageRating: null,
      topGenres: [],
    });
  });

  test('compteurs, moyenne et genres les plus vus', async () => {
    await createEntry(alice, { movieId: MOVIE_IDS.odyssey, status: 'watched', rating: 9, favorite: true });
    await createEntry(alice, { movieId: MOVIE_IDS.alien, status: 'watched', rating: 8 });
    await createEntry(alice, { movieId: MOVIE_IDS.heat, status: 'watched' }); // vu, pas noté
    await createEntry(alice, { movieId: MOVIE_IDS.amelie, status: 'watchlist' });
    await createEntry(bob, { movieId: MOVIE_IDS.spirited, status: 'watched', rating: 1 }); // autre compte

    const response = await request(app).get('/api/entries/stats').set(bearer(alice.token));

    expect(response.body).toMatchObject({
      watchedCount: 3,
      watchlistCount: 1,
      favoriteCount: 1,
      averageRating: 8.5,
    });
    expect(response.body.topGenres[0]).toEqual({ genre: 'Sci-Fi', count: 2 });
  });
});
