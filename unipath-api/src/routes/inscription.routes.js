const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { checkRole } = require('../middleware/role.middleware');
const inscriptionController = require('../controllers/inscription.controller');
const dossierController = require('../controllers/dossier.controller');
const { upload, handleDossierUpload, handleSoumissionUpload } = require('../middleware/upload.middleware');

// 🔒 Routes CANDIDAT uniquement - Actions d'inscription
router.get('/mes-inscriptions', protect, inscriptionController.getMesInscriptions);
router.get('/', protect, checkRole(['CANDIDAT']), inscriptionController.getInscriptionByConcours);

router.post('/soumettre', protect, checkRole(['CANDIDAT']), handleSoumissionUpload(), inscriptionController.soumettreDossierComplet);
router.post('/', protect, checkRole(['CANDIDAT']), inscriptionController.creerInscription);
router.post('/:inscriptionId/soumettre', protect, checkRole(['CANDIDAT']), inscriptionController.soumettreDossier);
router.post(
  '/:inscriptionId/documents-complementaires',
  protect,
  checkRole(['CANDIDAT']),
  handleDossierUpload('fichier'),
  inscriptionController.ajouterDocumentComplementaireConcours,
);
router.post(
  '/:inscriptionId/resoumettre',
  protect,
  checkRole(['CANDIDAT']),
  inscriptionController.resoumettreDossierConcours,
);
router.get(
  '/:inscriptionId/corrections-sous-reserve',
  protect,
  checkRole(['CANDIDAT']),
  inscriptionController.getStatutCorrectionsSousReserve,
);
router.patch(
  '/:inscriptionId/centre-composition',
  protect,
  checkRole(['CANDIDAT']),
  inscriptionController.choisirCentreComposition,
);
router.post(
  '/:inscriptionId/centre-composition',
  protect,
  checkRole(['CANDIDAT']),
  inscriptionController.choisirCentreComposition,
);
router.post(
  '/:inscriptionId/centre',
  protect,
  checkRole(['CANDIDAT']),
  inscriptionController.choisirCentreComposition,
);
router.put('/:inscriptionId/pieces-extras', protect, checkRole(['CANDIDAT']), inscriptionController.updatePiecesExtras);
router.post('/:inscriptionId/quittance', protect, checkRole(['CANDIDAT']), upload.single('quittance'), inscriptionController.uploadQuittanceInscription);
router.delete('/:inscriptionId', protect, checkRole(['CANDIDAT']), inscriptionController.annulerInscription);
router.post('/:id/renvoyer-fiche', protect, checkRole(['CANDIDAT']), inscriptionController.renvoyerFichePreInscription);
router.get('/:id/fiche', protect, checkRole(['CANDIDAT']), inscriptionController.telechargerFichePreInscriptionPdf);

// Routes de consultation - Tous les rôles authentifiés
router.get('/:id', protect, inscriptionController.getInscriptionById);

// 🔒 Routes pour Dossier Concours - Accessible par CANDIDAT (owner only), COMMISSION, CONTROLEUR, DGES
router.post('/:inscriptionId/dossier-concours/quittance', protect, checkRole(['CANDIDAT', 'COMMISSION', 'CONTROLEUR', 'DEC']), handleDossierUpload('quittance'), dossierController.uploadPiece);
router.post('/:inscriptionId/dossier-concours/pieces-extras', protect, checkRole(['CANDIDAT', 'COMMISSION', 'CONTROLEUR', 'DEC']), handleDossierUpload('fichier'), dossierController.uploadPiece);

module.exports = router;