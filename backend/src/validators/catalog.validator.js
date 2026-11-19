const AppError = require('../utils/AppError');

const SORT_OPTIONS = ['popular', 'rating', 'recent', 'title'];
const DEFAULT_LIMIT = 24;
const MAX_LIMIT = 50;

// Lit un paramètre entier de l'URL ("?page=2") et vérifie ses bornes.
function readInteger(value, { name, min, max, fallback }) {
  if (value === undefined) return fallback;
  const number = Number(value);
  if (!Number.isInteger(number) || number < min || number > max) {
    throw AppError.invalidInput(`${name} doit être un entier entre ${min} et ${max}.`);
  }
  return number;
}

function readText(value, { name, maxLength }) {
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || value.length > maxLength) {
    throw AppError.invalidInput(`${name} doit être un texte de ${maxLength} caractères maximum.`);
  }
  return value.trim() || undefined;
}

// GET /api/movies?q=&genre=&year=&sort=&page=&limit=
function validateMovieQuery(query) {
  const sort = query.sort === undefined ? 'popular' : query.sort;
  if (!SORT_OPTIONS.includes(sort)) {
    throw AppError.invalidInput(`sort doit valoir ${SORT_OPTIONS.join(', ')}.`);
  }

  return {
    q: readText(query.q, { name: 'q', maxLength: 100 }),
    genre: readText(query.genre, { name: 'genre', maxLength: 40 }),
    year: readInteger(query.year, { name: 'year', min: 1880, max: 2100 }),
    sort,
    page: readInteger(query.page, { name: 'page', min: 1, max: 100000, fallback: 1 }),
    limit: readInteger(query.limit, { name: 'limit', min: 1, max: MAX_LIMIT, fallback: DEFAULT_LIMIT }),
  };
}

module.exports = { validateMovieQuery, readInteger, SORT_OPTIONS };
