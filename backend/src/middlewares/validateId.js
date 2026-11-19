const AppError = require('../utils/AppError');
const { isObjectId } = require('../validators/common');

// Un identifiant malformé dans l'URL (/api/entries/abc) => 400, avant
// même d'interroger MongoDB.
function validateId(req, res, next) {
  if (!isObjectId(req.params.id)) {
    throw AppError.invalidInput("L'identifiant dans l'URL est malformé.");
  }
  next();
}

module.exports = validateId;
