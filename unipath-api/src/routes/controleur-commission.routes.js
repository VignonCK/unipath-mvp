// src/routes/controleur-commission.routes.js
const express = require('express');
const router = express.Router();
const {
  protect,
  verifierMembreCommission,
  verifierAffectationDossier,
} = require('../middleware/auth.middleware');
const controleurCommissionController = require('../controllers/controleur-commission.controller');

// Tout membre de la commission peut accéder ; l'accès effectif est résolu
// par concours via les affectations (CONTROLEUR).
const verifierAffectationControleur = verifierAffectationDossier('CONTROLEUR');

router.get('/tableau-de-bord', protect, verifierMembreCommission, controleurCommissionController.getTableauDeBord);
router.get('/dossiers', protect, verifierMembreCommission, controleurCommissionController.getDossiers);
router.get('/dossiers/divergents', protect, verifierMembreCommission, controleurCommissionController.getDossiersDivergents);
router.get('/dossiers/sans-verdict', protect, verifierMembreCommission, controleurCommissionController.getDossiersSansVerdict);
router.get(
  '/dossiers/:dossierInscriptionId',
  protect,
  verifierMembreCommission,
  verifierAffectationControleur,
  controleurCommissionController.getDetailDossier
);
router.put(
  '/dossiers/:dossierInscriptionId/verdict-examinateur',
  protect,
  verifierMembreCommission,
  verifierAffectationControleur,
  controleurCommissionController.modifierVerdictExaminateur
);
router.post(
  '/dossiers/:dossierInscriptionId/decision',
  protect,
  verifierMembreCommission,
  verifierAffectationControleur,
  controleurCommissionController.rendreDecision
);
router.put(
  '/dossiers/:dossierInscriptionId/decision',
  protect,
  verifierMembreCommission,
  verifierAffectationControleur,
  controleurCommissionController.modifierDecision
);

module.exports = router;
