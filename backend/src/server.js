const app = require('./app');
const env = require('./config/env');
const { connectDatabases, closeDatabases } = require('./config/db');

async function start() {
  await connectDatabases();
  console.log('Connecté aux deux bases MongoDB (application + catalogue).');

  const server = app.listen(env.port, () => {
    console.log(`API Bobine à l'écoute sur le port ${env.port}`);
  });

  // Arrêt propre quand Docker (ou Ctrl+C) demande l'arrêt.
  const shutdown = async () => {
    server.close();
    await closeDatabases();
    process.exit(0);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

start().catch((error) => {
  console.error("Impossible de démarrer l'API :", error.message);
  process.exit(1);
});
