const request = require('supertest');
const app = require('../src/app');

// Ces tests n'ont pas besoin de base de données : l'application Express
// s'importe sans ouvrir de port ni de connexion.
describe('Santé et routes inconnues', () => {
  test('GET /api/health répond 200 avec exactement {"status":"ok"}', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  test('une route inconnue répond 404 au format d\'erreur du contrat', async () => {
    const response = await request(app).get('/api/inconnue');

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
    expect(response.body.error.message).toEqual(expect.any(String));
  });

  test('un JSON illisible répond 400 INVALID_INPUT', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email": ');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_INPUT');
  });
});
