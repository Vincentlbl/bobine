module.exports = {
  testEnvironment: 'node',
  // Exécuté avant chaque fichier de test : force l'environnement "test".
  setupFiles: ['<rootDir>/tests/setup-env.js'],
  testTimeout: 20000,
};
