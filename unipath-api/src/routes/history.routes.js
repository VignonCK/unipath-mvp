// src/routes/history.routes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { checkRole } = require('../middleware/role.middleware');
const historyController = require('../controllers/history.controller');

// Routes pour l'historique des actions

// GET /api/history/:dossierId - Obtenir l'historique d'un dossier
// Accessible uniquement à la commission et DGES
router.get('/:dossierId', protect, checkRole(['COMMISSION', 'DGES']), historyController.getHistorique);

// POST /api/history/action - Enregistrer une nouvelle action
// Accessible à tous les utilisateurs authentifiés
router.post('/action', protect, historyController.enregistrerAction);

// GET /api/history/audit/rapport - Générer un rapport d'audit
// Accessible uniquement à la commission et DGES
router.get('/audit/rapport', protect, checkRole(['COMMISSION', 'DGES']), historyController.genererRapportAudit);

// GET /api/history/export/csv/:dossierId? - Exporter l'historique en CSV
// Accessible uniquement à la commission et DGES
router.get('/export/csv/:dossierId?', protect, checkRole(['COMMISSION', 'DGES']), historyController.exporterCSV);

module.exports = router;