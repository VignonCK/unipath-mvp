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

// Routes protégées - DGES et COMMISSION peuvent voir les statistiques
router.get('/statistiques', protect, checkRole(['DGES', 'COMMISSION']), dgesController.getStatistiques);
router.get('/statistiques/:concoursId', protect, checkRole(['DGES', 'COMMISSION']), dgesController.getStatistiquesConcours);

router.post(
  '/concours/:concoursId/cloturer-etude',
  protect,
  checkRole(['DGES']),
  dgesController.cloturerEtudeConcours,
);
router.post(
  '/concours/:concoursId/rouvrir-etude',
  protect,
  checkRole(['DGES']),
  dgesController.rouvrirEtudeConcours,
);
router.post(
  '/concours/:concoursId/generer-numeros-table',
  protect,
  checkRole(['DGES']),
  dgesController.genererNumerosTableConcours,
);

module.exports = router;