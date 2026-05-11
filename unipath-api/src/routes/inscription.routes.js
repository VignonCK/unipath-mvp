const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { checkRole } = require('../middleware/role.middleware');
const inscriptionController = require('../controllers/inscription.controller');
const dossierController = require('../controllers/dossier.controller');
const { upload } = require('../middleware/upload.middleware');

// 🔒 Routes CANDIDAT uniquement - Actions d'inscription
router.post('/', protect, checkRole(['CANDIDAT']), inscriptionController.creerInscription);
router.put('/:inscriptionId/pieces-extras', protect, checkRole(['CANDIDAT']), inscriptionController.updatePiecesExtras);
router.post('/:inscriptionId/quittance', protect, checkRole(['CANDIDAT']), upload.single('quittance'), inscriptionController.uploadQuittanceInscription);
router.delete('/:inscriptionId', protect, checkRole(['CANDIDAT']), inscriptionController.annulerInscription);

// Routes de consultation - Tous les rôles authentifiés
router.get('/mes-inscriptions', protect, inscriptionController.getMesInscriptions);
router.get('/:id', protect, inscriptionController.getInscriptionById);

// 🔒 Routes pour Dossier Concours - Accessible par CANDIDAT (owner only), COMMISSION, CONTROLEUR, DGES
router.post('/:inscriptionId/dossier-concours/quittance', protect, checkRole(['CANDIDAT', 'COMMISSION', 'CONTROLEUR', 'DGES']), upload.single('quittance'), dossierController.uploadPiece);
router.post('/:inscriptionId/dossier-concours/pieces-extras', protect, checkRole(['CANDIDAT', 'COMMISSION', 'CONTROLEUR', 'DGES']), dossierController.uploadPiece);

module.exports = router;