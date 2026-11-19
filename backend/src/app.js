const path = require('node:path');
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

const { notFoundHandler, errorHandler } = require('./middlewares/errorHandler');

// Ce fichier construit l'application Express SANS ouvrir de port :
// les tests peuvent l'importer directement (voir tests/), et server.js
// se charge de la démarrer.
const app = express();

app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));

// Route de santé, publique.
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Documentation interactive de l'API (Swagger UI).
const openapiDocument = YAML.load(path.join(__dirname, '..', 'openapi.yaml'));
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapiDocument));

// Avec Express 5, une erreur levée dans un contrôleur async arrive
// automatiquement ici : pas besoin de try/catch dans chaque route.
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
