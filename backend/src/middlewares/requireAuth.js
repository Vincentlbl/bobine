const authService = require('../services/auth.service');
const AppError = require('../utils/AppError');

// Protège une route : exige l'en-tête "Authorization: Bearer <jwt>".
// Si le jeton est valide, l'identifiant du compte est placé dans req.user.id ;
// c'est la SEULE source utilisée ensuite pour savoir "qui fait la requête".
function requireAuth(req, res, next) {
  const header = req.get('Authorization') || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw AppError.unauthorized('Jeton manquant : connectez-vous.');
  }

  try {
    req.user = { id: authService.verifyToken(token) };
  } catch {
    // Signature invalide, jeton malformé ou expiré : même réponse.
    throw AppError.unauthorized('Jeton invalide ou expiré : reconnectez-vous.');
  }
  next();
}

module.exports = requireAuth;
