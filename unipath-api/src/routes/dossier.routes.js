// src/routes/dossier.routes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { checkRole } = require('../middleware/role.middleware');
const dossierController = require('../controllers/dossier.controller');

// 🔒 Routes CANDIDAT uniquement - Gestion du dossier personnel
router.post('/upload', protect, checkRole(['CANDIDAT']), dossierController.uploadPiece);
router.get('/', protect, dossierController.getDossier);

// 🔒 Routes pour Dossier Personnel - Accessible par CANDIDAT (self only), COMMISSION, CONTROLEUR, DGES
router.get('/candidats/:candidatId/dossier-personnel', protect, checkRole(['CANDIDAT', 'COMMISSION', 'CONTROLEUR', 'DGES']), dossierController.getDossierPersonnel);
router.put('/candidats/:candidatId/dossier-personnel/pieces', protect, checkRole(['CANDIDAT', 'COMMISSION', 'CONTROLEUR', 'DGES']), dossierController.uploadPiece);

module.exports = router;