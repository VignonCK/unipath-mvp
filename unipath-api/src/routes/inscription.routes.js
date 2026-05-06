// src/routes/inscription.routes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const inscriptionController = require('../controllers/inscription.controller');
const { upload } = require('../middleware/upload.middleware');

router.post('/', protect, inscriptionController.creerInscription);
router.get('/mes-inscriptions', protect, inscriptionController.getMesInscriptions);
router.get('/verifier-dossier', protect, inscriptionController.verifierDossier);
router.post('/:inscriptionId/quittance', protect, upload.single('quittance'), inscriptionController.uploadQuittanceInscription);

module.exports = router;