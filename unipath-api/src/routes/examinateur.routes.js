// src/routes/examinateur.routes.js
const express = require('express');
const router = express.Router();
const { protect, verifierSousRole } = require('../middleware/auth.middleware');
const examinateurController = require('../controllers/examinateur.controller');

// Middleware pour vérifier que l'utilisateur est un examinateur
const verifierExaminateur = verifierSousRole(['EXAMINATEUR']);

// Routes examinateur
router.get('/dossiers-a-evaluer', protect, verifierExaminateur, examinateurController.getDossiersAEvaluer);
router.get('/dossiers/:dossierInscriptionId', protect, verifierExaminateur, examinateurController.getDetailDossier);
router.post('/dossiers/:dossierInscriptionId/verdict', protect, verifierExaminateur, examinateurController.rendreVerdict);
router.put('/dossiers/:dossierInscriptionId/verdict', protect, verifierExaminateur, examinateurController.modifierVerdict);

module.exports = router;
