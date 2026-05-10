const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { checkRole } = require('../middleware/role.middleware');
const inscriptionController = require('../controllers/inscription.controller');
const { upload } = require('../middleware/upload.middleware');

// 🔒 Routes CANDIDAT uniquement - Actions d'inscription
router.post('/', protect, checkRole(['CANDIDAT']), inscriptionController.creerInscription);
router.put('/:inscriptionId/pieces-extras', protect, checkRole(['CANDIDAT']), inscriptionController.updatePiecesExtras);
router.post('/:inscriptionId/quittance', protect, checkRole(['CANDIDAT']), upload.single('quittance'), inscriptionController.uploadQuittanceInscription);
router.delete('/:inscriptionId', protect, checkRole(['CANDIDAT']), inscriptionController.annulerInscription);

// Routes de consultation - Tous les rôles authentifiés
router.get('/mes-inscriptions', protect, inscriptionController.getMesInscriptions);
router.get('/:id', protect, inscriptionController.getInscriptionById);

module.exports = router;