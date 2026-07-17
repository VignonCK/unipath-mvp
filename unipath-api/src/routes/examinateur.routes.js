// src/routes/examinateur.routes.js
const express = require('express');
const router = express.Router();
const {
  protect,
  verifierMembreCommission,
  verifierAffectationDossier,
} = require('../middleware/auth.middleware');
const examinateurController = require('../controllers/examinateur.controller');

// Tout membre de la commission peut accéder ; l'accès effectif est résolu
// par concours via les affectations (EXAMINATEUR).
const verifierAffectationExaminateur = verifierAffectationDossier('EXAMINATEUR');

router.get(
  '/dossiers-a-evaluer',
  protect,
  verifierMembreCommission,
  examinateurController.getDossiersAEvaluer
);
router.get(
  '/dossiers/:dossierInscriptionId',
  protect,
  verifierMembreCommission,
  verifierAffectationExaminateur,
  examinateurController.getDetailDossier
);
router.post(
  '/dossiers/:dossierInscriptionId/verdict',
  protect,
  verifierMembreCommission,
  verifierAffectationExaminateur,
  examinateurController.rendreVerdict
);
router.put(
  '/dossiers/:dossierInscriptionId/verdict',
  protect,
  verifierMembreCommission,
  verifierAffectationExaminateur,
  examinateurController.modifierVerdict
);

module.exports = router;
