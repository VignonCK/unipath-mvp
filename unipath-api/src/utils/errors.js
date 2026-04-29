/**
 * Classes d'erreurs personnalisées pour une meilleure gestion des erreurs
 */

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class BadRequestError extends AppError {
  constructor(message = 'Requête invalide') {
    super(message, 400);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Non autorisé') {
    super(message, 401);
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Accès interdit') {
    super(message, 403);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Ressource non trouvée') {
    super(message, 404);
  }
}

class ConflictError extends AppError {
  constructor(message = 'Conflit de ressource') {
    super(message, 409);
  }
}

class ValidationError extends AppError {
  constructor(message = 'Erreur de validation', details = []) {
    super(message, 422);
    this.details = details;
  }
}

module.exports = {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
};
