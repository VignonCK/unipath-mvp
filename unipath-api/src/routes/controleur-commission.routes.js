// src/routes/controleur-commission.routes.js
const express = require('express');
const router = express.Router();
const { protect, verifierSousRole } = require('../middleware/auth.middleware');
const controleurCommissionController = require('../controllers/controleur-commission.controller');

// Middleware pour vérifier que l'utilisateur est un contrôleur
const verifierControleur = verifierSousRole(['CONTROLEUR']);

// Routes contrôleur commission
router.get('/tableau-de-bord', protect, verifierControleur, controleurCommissionController.getTableauDeBord);
router.get('/dossiers', protect, verifierControleur, controleurCommissionController.getDossiers);
router.get('/dossiers/divergents', protect, verifierControleur, controleurCommissionController.getDossiersDivergents);
router.get('/dossiers/sans-verdict', protect, verifierControleur, controleurCommissionController.getDossiersSansVerdict);
router.get('/dossiers/:dossierInscriptionId', protect, verifierControleur, controleurCommissionController.getDetailDossier);
router.put(
  '/dossiers/:dossierInscriptionId/verdict-examinateur',
  protect,
  verifierControleur,
  controleurCommissionController.modifierVerdictExaminateur
);
router.post('/dossiers/:dossierInscriptionId/decision', protect, verifierControleur, controleurCommissionController.rendreDecision);
router.put('/dossiers/:dossierInscriptionId/decision', protect, verifierControleur, controleurCommissionController.modifierDecision);

module.exports = router;
