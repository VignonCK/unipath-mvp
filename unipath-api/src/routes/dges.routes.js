// src/routes/dges.routes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { checkRole } = require('../middleware/role.middleware');
const dgesController = require('../controllers/dges.controller');
const adminEtablissementRoutes = require('./adminEtablissement.routes');
const commissionEtablissementRoutes = require('./commissionEtablissement.routes');
const commissionConcoursRoutes = require('./commissionConcours.routes');

// Ancienne route désactivée (403) — ne pas réactiver
router.use('/etablissements/:etablissementId/commission', commissionEtablissementRoutes);
router.use('/concours/:concoursId/commission', commissionConcoursRoutes);
router.use('/etablissements', adminEtablissementRoutes);

// Routes protégées - Module 2 (établissements privés) — DGES uniquement
router.get('/statistiques', protect, checkRole(['DGES']), dgesController.getStatistiques);

// Module 1 (concours) — réservé DEC (Phase 2/6 séparation DEC/DGES)
router.post(
  '/concours/:concoursId/cloturer-etude',
  protect,
  checkRole(['DEC']),
  dgesController.cloturerEtudeConcours,
);
router.post(
  '/concours/:concoursId/rouvrir-etude',
  protect,
  checkRole(['DEC']),
  dgesController.rouvrirEtudeConcours,
);
router.post(
  '/concours/:concoursId/generer-numeros-table',
  protect,
  checkRole(['DEC']),
  dgesController.genererNumerosTableConcours,
);

module.exports = router;