// src/routes/dossier.routes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const dossierController = require('../controllers/dossier.controller');

router.post('/upload', protect, dossierController.uploadPiece);
router.get('/', protect, dossierController.getDossier);

module.exports = router;