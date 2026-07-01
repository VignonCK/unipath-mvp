// src/routes/history.routes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { checkRole } = require('../middleware/role.middleware');
const historyController = require('../controllers/history.controller');

const HISTORY_WRITE_ROLES = ['DGES', 'CONTROLEUR', 'ADMIN_ETABLISSEMENT', 'COMMISSION'];

// Routes statiques AVANT les routes dynamiques
router.get('/audit/rapport', protect, checkRole(['COMMISSION', 'DGES', 'CONTROLEUR']), historyController.genererRapportAudit);
router.get('/export/csv/:dossierInscriptionId', protect, checkRole(['COMMISSION', 'DGES', 'CONTROLEUR']), historyController.exporterCSV);
router.get('/export/csv', protect, checkRole(['COMMISSION', 'DGES', 'CONTROLEUR']), historyController.exporterCSV);
router.post(
  '/action',
  protect,
  checkRole(HISTORY_WRITE_ROLES),
  historyController.enregistrerAction,
);

router.get('/dossiers-inscription/:dossierInscriptionId', protect, historyController.getHistorique);

module.exports = router;
