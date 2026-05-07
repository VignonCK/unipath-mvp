const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const inscriptionController = require('../controllers/inscription.controller');
const { upload } = require('../middleware/upload.middleware');

// Créer une nouvelle inscription
router.post('/', protect, inscriptionController.creerInscription);

// Récupérer toutes les inscriptions du candidat
router.get('/mes-inscriptions', protect, inscriptionController.getMesInscriptions);

// Récupérer une inscription spécifique
router.get('/:id', protect, inscriptionController.getInscriptionById);

// Mettre à jour les pièces extras d'une inscription
router.put('/:inscriptionId/pieces-extras', protect, inscriptionController.updatePiecesExtras);

// Upload de la quittance
router.post('/:inscriptionId/quittance', protect, upload.single('quittance'), inscriptionController.uploadQuittanceInscription);

// Annuler une inscription
router.delete('/:inscriptionId', protect, inscriptionController.annulerInscription);

module.exports = router;