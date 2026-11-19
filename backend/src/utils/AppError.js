// Erreur "prévue" par l'application : elle porte le code HTTP et le code
// d'erreur du contrat. Le middleware errorHandler la transforme en JSON.
class AppError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }

  static invalidInput(message) {
    return new AppError(400, 'INVALID_INPUT', message);
  }

  static unauthorized(message = 'Authentification requise.') {
    return new AppError(401, 'UNAUTHORIZED', message);
  }

  static notFound(message = 'Ressource introuvable.') {
    return new AppError(404, 'NOT_FOUND', message);
  }

  static conflict(code, message) {
    return new AppError(409, code, message);
  }
}

module.exports = AppError;
