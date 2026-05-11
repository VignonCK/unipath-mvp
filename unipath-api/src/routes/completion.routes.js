// src/routes/completion.routes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { checkRole } = require('../middleware/role.middleware');
const completionController = require('../controllers/completion.controller');

// Route statique AVANT la route dynamique
// ✅ CONTROLEUR ajouté - Besoin des stats pour prendre des décisions
router.get('/stats/global', protect, checkRole(['COMMISSION', 'DGES', 'CONTROLEUR']), completionController.getStatistiquesGlobales);

router.get('/:candidatId', protect, completionController.getCompletion);
router.get('/:candidatId/pieces', protect, completionController.getPiecesManquantes);

// 🔒 Route pour Dossier Complet - Accessible par CANDIDAT (owner only), COMMISSION, CONTROLEUR, DGES
router.get('/inscriptions/:inscriptionId/dossier-complet', protect, checkRole(['CANDIDAT', 'COMMISSION', 'CONTROLEUR', 'DGES']), completionController.getDossierComplet);

module.exports = router;