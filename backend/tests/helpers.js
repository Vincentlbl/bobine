const request = require('supertest');
const app = require('../src/app');
const {
  appConnection,
  catalogConnection,
  connectDatabases,
  closeDatabases,
} = require('../src/config/db');
const { movies } = require('./fixtures/movies');

// Garde-fou : on refuse de vider une base dont le nom ne finit pas par "_test".
function assertTestDatabase(connection) {
  if (!connection.name.endsWith('_test')) {
    throw new Error(`Refus de lancer les tests sur la base "${connection.name}".`);
  }
}

// À appeler dans beforeAll : connexion + catalogue fictif.
async function startTestDatabases() {
  await connectDatabases();
  assertTestDatabase(appConnection);
  assertTestDatabase(catalogConnection);

  const catalog = catalogConnection.collection('movies');
  await catalog.deleteMany({});
  await catalog.insertMany(movies);
}

// À appeler dans beforeEach : chaque test repart d'une base application vide.
async function resetAppData() {
  assertTestDatabase(appConnection);
  await appConnection.collection('users').deleteMany({});
  await appConnection.collection('entries').deleteMany({});
}

// À appeler dans afterAll.
async function stopTestDatabases() {
  await closeDatabases();
}

// Crée un compte et renvoie { token, user } pour l'utiliser dans un test.
async function registerUser(email, password = 'MotDePasse123!') {
  const response = await request(app).post('/api/auth/register').send({ email, password });
  return response.body;
}

// Raccourci : ajoute l'en-tête Authorization à une requête supertest.
function bearer(token) {
  return { Authorization: `Bearer ${token}` };
}

module.exports = {
  app,
  startTestDatabases,
  resetAppData,
  stopTestDatabases,
  registerUser,
  bearer,
};
