// src/routes/history.routes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { checkRole } = require('../middleware/role.middleware');
const historyController = require('../controllers/history.controller');

// Routes statiques AVANT les routes dynamiques
// ✅ CONTROLEUR ajouté - Besoin de consulter l'historique pour prendre des décisions
router.get('/audit/rapport', protect, checkRole(['COMMISSION', 'DGES', 'CONTROLEUR']), historyController.genererRapportAudit);
router.get('/export/csv/:dossierId', protect, checkRole(['COMMISSION', 'DGES', 'CONTROLEUR']), historyController.exporterCSV);
router.get('/export/csv', protect, checkRole(['COMMISSION', 'DGES', 'CONTROLEUR']), historyController.exporterCSV);
router.post('/action', protect, historyController.enregistrerAction);

// Route dynamique EN DERNIER
router.get('/:dossierId', protect, checkRole(['COMMISSION', 'DGES', 'CONTROLEUR']), historyController.getHistorique);

module.exports = router;