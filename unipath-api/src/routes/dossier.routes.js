// src/routes/dossier.routes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { checkRole } = require('../middleware/role.middleware');
const dossierController = require('../controllers/dossier.controller');

// 🔒 Routes CANDIDAT uniquement - Gestion du dossier personnel
router.post('/upload', protect, checkRole(['CANDIDAT']), dossierController.uploadPiece);
router.get('/', protect, dossierController.getDossier);

module.exports = router;