const AppError = require('../utils/AppError');

// Un ObjectId MongoDB sérialisé = 24 caractères hexadécimaux.
function isObjectId(value) {
  return typeof value === 'string' && /^[0-9a-fA-F]{24}$/.test(value);
}

// Vrai objet JSON ({...}), pas un tableau, pas null, pas une chaîne.
function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// Date civile réelle au format YYYY-MM-DD ("2026-02-30" est refusée).
function isRealDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function assertPlainObject(body) {
  if (!isPlainObject(body)) {
    throw AppError.invalidInput('Le corps de la requête doit être un objet JSON.');
  }
}

module.exports = { isObjectId, isPlainObject, isRealDate, assertPlainObject };
