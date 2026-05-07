/**
 * EXEMPLE de controller utilisant les bonnes pratiques
 * - asyncHandler pour gérer les erreurs async
 * - Classes d'erreurs personnalisées
 * - Validation avec Zod
 */

const asyncHandler = require('../utils/asyncHandler');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const prisma = require('../prisma');

/**
 * Récupérer tous les concours
 * GET /api/concours
 */
const getAllConcours = asyncHandler(async (req, res) => {
  const concours = await prisma.concours.findMany({
    orderBy: { dateDebut: 'desc' },
  });

  res.json({
    success: true,
    count: concours.length,
    data: concours,
  });
});

/**
 * Récupérer un concours par ID
 * GET /api/concours/:id
 */
const getConcoursById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const concours = await prisma.concours.findUnique({
    where: { id },
    include: {
      inscriptions: {
        include: {
          candidat: {
            select: {
              id: true,
              nom: true,
              prenom: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!concours) {
    throw new NotFoundError(`Concours avec l'ID ${id} introuvable`);
  }

  res.json({
    success: true,
    data: concours,
  });
});

/**
 * Créer un nouveau concours
 * POST /api/concours
 */
const createConcours = asyncHandler(async (req, res) => {
  const { libelle, dateDebut, dateFin, description } = req.body;

  // Vérifier que la date de fin est après la date de début
  if (new Date(dateFin) <= new Date(dateDebut)) {
    throw new BadRequestError('La date de fin doit être après la date de début');
  }

  const concours = await prisma.concours.create({
    data: {
      libelle,
      dateDebut: new Date(dateDebut),
      dateFin: new Date(dateFin),
      description,
    },
  });

  res.status(201).json({
    success: true,
    message: 'Concours créé avec succès',
    data: concours,
  });
});

module.exports = {
  getAllConcours,
  getConcoursById,
  createConcours,
};
