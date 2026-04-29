// Middleware de validation avec Zod
const { z } = require('zod');

/**
 * Middleware générique de validation Zod
 * @param {z.ZodSchema} schema - Schéma Zod à valider
 * @param {string} source - Source des données ('body', 'query', 'params')
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const data = req[source];
      const validated = schema.parse(data);
      req[source] = validated; // Remplace par les données validées
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation échouée',
          details: error.errors.map(err => ({
            champ: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
};

module.exports = { validate };
