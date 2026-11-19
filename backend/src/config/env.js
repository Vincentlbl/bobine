// Toute la configuration vient des variables d'environnement.
// Avec Docker elles sont fournies par docker-compose ; sans Docker,
// dotenv lit le fichier backend/.env (voir README).
require('dotenv').config({ quiet: true });

const isTest = process.env.NODE_ENV === 'test';

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variable d'environnement manquante : ${name}`);
  }
  return value;
}

module.exports = {
  isTest,
  port: Number(process.env.PORT) || 3000,

  // Clé de signature des JWT : jamais dans le code, jamais dans Git.
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '2h',

  // Pendant les tests, on bascule sur des bases dédiées pour ne jamais
  // toucher aux données de développement.
  appDbUri: required(isTest ? 'MONGODB_URI_TEST' : 'MONGODB_URI'),
  catalogDbUri: required(isTest ? 'CATALOG_MONGODB_URI_TEST' : 'CATALOG_MONGODB_URI'),
};
