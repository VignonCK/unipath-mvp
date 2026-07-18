// src/routes/dossier.routes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { checkRole } = require('../middleware/role.middleware');
const dossierController = require('../controllers/dossier.controller');
const { handleDossierUpload } = require('../middleware/upload.middleware');

router.get(
  '/signed-url',
  protect,
  checkRole(['COMMISSION', 'CONTROLEUR', 'DEC', 'DGES', 'CANDIDAT', 'ETUDIANT', 'ADMIN_ETABLISSEMENT']),
  dossierController.getSignedUrl
);

// 🔒 Routes CANDIDAT — dossier personnel (multer une seule fois, mémoire → Supabase)
router.post(
  '/upload',
  protect,
  checkRole(['CANDIDAT']),
  handleDossierUpload('fichier'),
  dossierController.uploadPiece
);
router.get('/', protect, dossierController.getDossier);

// 🔒 Dossier personnel — CANDIDAT (self), COMMISSION, CONTROLEUR, DEC
router.get(
  '/candidats/:candidatId/dossier-personnel',
  protect,
  checkRole(['CANDIDAT', 'COMMISSION', 'CONTROLEUR', 'DEC']),
  dossierController.getDossierPersonnel
);
router.put(
  '/candidats/:candidatId/dossier-personnel/pieces',
  protect,
  checkRole(['CANDIDAT', 'COMMISSION', 'CONTROLEUR', 'DEC']),
  handleDossierUpload('fichier'),
  dossierController.uploadPiece
);

module.exports = router;
