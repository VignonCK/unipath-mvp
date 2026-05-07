// src/routes/inscription.routes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const inscriptionController = require('../controllers/inscription.controller');

router.post('/', protect, inscriptionController.creerInscription);
router.get('/mes-inscriptions', protect, inscriptionController.getMesInscriptions);
router.get('/verifier-dossier', protect, inscriptionController.verifierDossier);

module.exports = router;