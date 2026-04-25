// src/routes/completion.routes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { checkRole } = require('../middleware/role.middleware');
const completionController = require('../controllers/completion.controller');

// Routes pour la complétude des dossiers

// GET /api/completion/:candidatId - Obtenir le pourcentage de complétude
// Accessible aux candidats (pour leur propre dossier) et à la commission/DGES
router.get('/:candidatId', protect, completionController.getCompletion);

// GET /api/completion/:candidatId/pieces - Obtenir les pièces manquantes
// Accessible aux candidats (pour leur propre dossier) et à la commission/DGES
router.get('/:candidatId/pieces', protect, completionController.getPiecesManquantes);

// GET /api/completion/stats/global - Obtenir les statistiques globales de complétude
// Accessible uniquement à la commission et DGES
router.get('/stats/global', protect, checkRole(['COMMISSION', 'DGES']), completionController.getStatistiquesGlobales);

module.exports = router;