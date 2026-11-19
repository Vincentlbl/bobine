const AppError = require('../utils/AppError');
const { assertPlainObject } = require('./common');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 72; // bcrypt ignore ce qui dépasse 72 octets

// Utilisé par register ET login : renvoie { email, password } nettoyés,
// ou lève une erreur 400 INVALID_INPUT.
function validateCredentials(body) {
  assertPlainObject(body);
  const { email, password } = body;

  if (typeof email !== 'string' || !EMAIL_PATTERN.test(email.trim()) || email.length > 254) {
    throw AppError.invalidInput('Adresse email invalide.');
  }
  if (
    typeof password !== 'string' ||
    password.length < PASSWORD_MIN_LENGTH ||
    password.length > PASSWORD_MAX_LENGTH
  ) {
    throw AppError.invalidInput(
      `Le mot de passe doit contenir entre ${PASSWORD_MIN_LENGTH} et ${PASSWORD_MAX_LENGTH} caractères.`
    );
  }

  return { email: email.trim().toLowerCase(), password };
}

module.exports = { validateCredentials };
