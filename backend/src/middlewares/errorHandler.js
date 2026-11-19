const AppError = require('../utils/AppError');
const env = require('../config/env');

// Aucune route ne correspond à l'URL demandée.
function notFoundHandler(req, res, next) {
  next(AppError.notFound(`Route introuvable : ${req.method} ${req.originalUrl}`));
}

// Point de sortie unique de TOUTES les erreurs de l'API.
// Format du contrat : { "error": { "code": "...", "message": "..." } }
// (Express reconnaît un gestionnaire d'erreurs à ses 4 paramètres : il faut garder "next".)
function errorHandler(error, req, res, next) {
  // JSON illisible ou corps trop volumineux envoyé par le client.
  if (error.type === 'entity.parse.failed' || error.type === 'entity.too.large') {
    error = AppError.invalidInput('Le corps de la requête doit être un JSON valide.');
  }

  if (error instanceof AppError) {
    return res.status(error.status).json({
      error: { code: error.code, message: error.message },
    });
  }

  // Erreur imprévue : on la journalise côté serveur, mais on ne renvoie
  // jamais de détail technique (trace, requête, secret) au client.
  if (!env.isTest) console.error(error);
  return res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Une erreur interne est survenue.' },
  });
}

module.exports = { notFoundHandler, errorHandler };
