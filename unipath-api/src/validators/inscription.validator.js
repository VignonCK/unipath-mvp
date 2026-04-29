// Schémas de validation pour les inscriptions
const { z } = require('zod');

const createInscriptionSchema = z.object({
  concoursId: z.string().uuid('ID de concours invalide'),
});

const updateStatutSchema = z.object({
  statut: z.enum(['EN_ATTENTE', 'VALIDE', 'REJETE'], {
    errorMap: () => ({ message: 'Statut invalide' }),
  }),
});

module.exports = {
  createInscriptionSchema,
  updateStatutSchema,
};
