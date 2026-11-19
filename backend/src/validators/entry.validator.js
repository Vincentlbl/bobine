const AppError = require('../utils/AppError');
const { ENTRY_STATUSES } = require('../models/entry.model');
const { isObjectId, isRealDate, assertPlainObject } = require('./common');

const REVIEW_MAX_LENGTH = 2000;

// Dernière date acceptée pour watchedAt : aujourd'hui, avec un jour de marge
// pour les fuseaux horaires en avance sur l'heure UTC du serveur.
function latestAllowedDate() {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return tomorrow.toISOString().slice(0, 10);
}

// Une règle par champ modifiable. Chaque fonction renvoie un message
// d'erreur, ou rien si la valeur est valide.
const fieldRules = {
  status(value) {
    if (!ENTRY_STATUSES.includes(value)) {
      return `status doit valoir ${ENTRY_STATUSES.join(' ou ')}.`;
    }
  },
  rating(value) {
    const isValidRating = Number.isInteger(value) && value >= 1 && value <= 10;
    if (value !== null && !isValidRating) {
      return 'rating doit être un entier de 1 à 10, ou null.';
    }
  },
  watchedAt(value) {
    if (value === null) return;
    if (!isRealDate(value)) {
      return 'watchedAt doit être une date réelle au format YYYY-MM-DD, ou null.';
    }
    if (value > latestAllowedDate()) {
      return 'watchedAt ne peut pas être dans le futur.';
    }
  },
  review(value) {
    if (typeof value !== 'string' || value.trim().length > REVIEW_MAX_LENGTH) {
      return `review doit être un texte de ${REVIEW_MAX_LENGTH} caractères maximum.`;
    }
  },
  favorite(value) {
    if (typeof value !== 'boolean') {
      return 'favorite doit être true ou false.';
    }
  },
};

const UPDATABLE_FIELDS = Object.keys(fieldRules);

// Vérifie les champs présents et renvoie un objet propre.
// Tout champ non listé (id, ownerId, champ inconnu...) est refusé.
function validateFields(body, allowedFields) {
  const data = {};
  for (const [field, value] of Object.entries(body)) {
    if (!allowedFields.includes(field)) {
      throw AppError.invalidInput(`Le champ "${field}" n'est pas accepté.`);
    }
    if (fieldRules[field]) {
      const problem = fieldRules[field](value);
      if (problem) throw AppError.invalidInput(problem);
    }
    data[field] = field === 'review' ? value.trim() : value;
  }
  return data;
}

// POST /api/entries : movieId et status obligatoires.
function validateEntryCreation(body) {
  assertPlainObject(body);
  const data = validateFields(body, ['movieId', ...UPDATABLE_FIELDS]);

  if (!isObjectId(data.movieId)) {
    throw AppError.invalidInput('movieId est obligatoire et doit être un identifiant de film valide.');
  }
  if (data.status === undefined) {
    throw AppError.invalidInput('status est obligatoire.');
  }
  return data;
}

// PATCH /api/entries/:id : partiel mais non vide ; movieId n'est pas modifiable.
function validateEntryUpdate(body) {
  assertPlainObject(body);
  if (Object.keys(body).length === 0) {
    throw AppError.invalidInput('Le corps de la modification ne peut pas être vide.');
  }
  return validateFields(body, UPDATABLE_FIELDS);
}

// GET /api/entries?status=&favorite=&movieId= : filtres facultatifs.
function validateEntryFilters(query) {
  const filters = {};

  if (query.status !== undefined) {
    if (!ENTRY_STATUSES.includes(query.status)) {
      throw AppError.invalidInput(`Le filtre status doit valoir ${ENTRY_STATUSES.join(' ou ')}.`);
    }
    filters.status = query.status;
  }
  if (query.favorite !== undefined) {
    if (query.favorite !== 'true' && query.favorite !== 'false') {
      throw AppError.invalidInput('Le filtre favorite doit valoir true ou false.');
    }
    filters.favorite = query.favorite === 'true';
  }
  if (query.movieId !== undefined) {
    if (!isObjectId(query.movieId)) {
      throw AppError.invalidInput('Le filtre movieId doit être un identifiant valide.');
    }
    filters.movieId = query.movieId;
  }
  return filters;
}

module.exports = { validateEntryCreation, validateEntryUpdate, validateEntryFilters };
