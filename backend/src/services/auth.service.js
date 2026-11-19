const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/user.model');
const AppError = require('../utils/AppError');

const BCRYPT_ROUNDS = 10;
const DUPLICATE_KEY_ERROR = 11000;

// Le jeton ne contient que l'identifiant du compte ("sub") et une date
// d'expiration. Il est signé avec JWT_SECRET : impossible à falsifier sans la clé.
function signToken(user) {
  return jwt.sign({ sub: user.id }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

// Renvoie l'identifiant du compte si le jeton est valide, sinon lève une erreur.
function verifyToken(token) {
  const payload = jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] });
  return payload.sub;
}

function buildAuthResponse(user) {
  return { user: user.toJSON(), token: signToken(user) };
}

async function register({ email, password }) {
  const emailAlreadyUsed = () =>
    AppError.conflict('EMAIL_ALREADY_USED', 'Un compte existe déjà avec cette adresse email.');

  if (await User.exists({ email })) {
    throw emailAlreadyUsed();
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  try {
    const user = await User.create({ email, passwordHash });
    return buildAuthResponse(user);
  } catch (error) {
    // Deux inscriptions simultanées avec le même email : l'index unique tranche.
    if (error.code === DUPLICATE_KEY_ERROR) throw emailAlreadyUsed();
    throw error;
  }
}

async function login({ email, password }) {
  // Même message dans les deux cas : on ne révèle pas si l'email existe.
  const invalidCredentials = AppError.unauthorized('Email ou mot de passe incorrect.');

  const user = await User.findOne({ email });
  if (!user) throw invalidCredentials;

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) throw invalidCredentials;

  return buildAuthResponse(user);
}

module.exports = { register, login, verifyToken };
