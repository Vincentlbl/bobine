const request = require('supertest');
const jwt = require('jsonwebtoken');
const {
  app,
  startTestDatabases,
  resetAppData,
  stopTestDatabases,
  registerUser,
  bearer,
} = require('./helpers');

beforeAll(startTestDatabases);
beforeEach(resetAppData);
afterAll(stopTestDatabases);

const credentials = { email: 'alice@example.test', password: 'MotDePasse123!' };

describe('POST /api/auth/register', () => {
  test('crée un compte : 201, utilisateur et JWT, sans mot de passe ni hash', async () => {
    const response = await request(app).post('/api/auth/register').send(credentials);

    expect(response.status).toBe(201);
    expect(response.body.user).toEqual({ id: expect.any(String), email: 'alice@example.test' });
    expect(response.body.token.split('.')).toHaveLength(3); // un JWT a 3 parties
    expect(JSON.stringify(response.body)).not.toMatch(/password|hash/i);
  });

  test('email déjà utilisé (même avec des majuscules) : 409 EMAIL_ALREADY_USED', async () => {
    await request(app).post('/api/auth/register').send(credentials);

    const response = await request(app)
      .post('/api/auth/register')
      .send({ ...credentials, email: 'ALICE@Example.test' });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('EMAIL_ALREADY_USED');
  });

  test.each([
    ['email invalide', { email: 'pas-un-email', password: 'MotDePasse123!' }],
    ['mot de passe trop court', { email: 'bob@example.test', password: '1234567' }],
    ['mot de passe absent', { email: 'bob@example.test' }],
    ['corps qui n\'est pas un objet', ['alice@example.test']],
  ])('%s : 400 INVALID_INPUT', async (label, body) => {
    const response = await request(app).post('/api/auth/register').send(body);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_INPUT');
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(() => request(app).post('/api/auth/register').send(credentials));

  test('bons identifiants : 200 et JWT', async () => {
    const response = await request(app).post('/api/auth/login').send(credentials);

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe('alice@example.test');
    expect(response.body.token).toEqual(expect.any(String));
  });

  test('mauvais mot de passe et email inconnu : même réponse 401', async () => {
    const wrongPassword = await request(app)
      .post('/api/auth/login')
      .send({ ...credentials, password: 'MauvaisMotDePasse' });
    const unknownEmail = await request(app)
      .post('/api/auth/login')
      .send({ ...credentials, email: 'inconnu@example.test' });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body).toEqual(unknownEmail.body);
    expect(wrongPassword.body.error.code).toBe('UNAUTHORIZED');
  });
});

describe('Protection des routes privées par le jeton Bearer', () => {
  test('sans jeton : 401', async () => {
    const response = await request(app).get('/api/entries');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  test('jeton falsifié : 401', async () => {
    const { token } = await registerUser('alice@example.test');
    const forgedToken = token.slice(0, -3) + 'abc'; // signature modifiée

    const response = await request(app).get('/api/entries').set(bearer(forgedToken));

    expect(response.status).toBe(401);
  });

  test('jeton signé avec une autre clé : 401', async () => {
    const token = jwt.sign({ sub: '64b000000000000000000001' }, 'une-autre-cle');

    const response = await request(app).get('/api/entries').set(bearer(token));

    expect(response.status).toBe(401);
  });

  test('jeton expiré : 401', async () => {
    const { user } = await registerUser('alice@example.test');
    const expiredToken = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: -10 });

    const response = await request(app).get('/api/entries').set(bearer(expiredToken));

    expect(response.status).toBe(401);
  });

  test('jeton valide : accès autorisé', async () => {
    const { token } = await registerUser('alice@example.test');

    const response = await request(app).get('/api/entries').set(bearer(token));

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ items: [] });
  });
});
