// src/routes/completion.routes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { checkRole } = require('../middleware/role.middleware');
const completionController = require('../controllers/completion.controller');

// Route statique AVANT la route dynamique
router.get('/stats/global', protect, checkRole(['COMMISSION', 'DGES']), completionController.getStatistiquesGlobales);

router.get('/:candidatId', protect, completionController.getCompletion);
router.get('/:candidatId/pieces', protect, completionController.getPiecesManquantes);

module.exports = router;