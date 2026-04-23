// src/routes/candidat.routes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { checkRole } = require('../middleware/role.middleware');
const candidatController = require('../controllers/candidat.controller');
const pdfController = require('../controllers/pdf.controller');

// Routes protégées - CANDIDAT uniquement
router.get('/profil', protect, checkRole(['CANDIDAT']), candidatController.getProfil);
router.put('/profil', protect, checkRole(['CANDIDAT']), candidatController.updateProfil);
router.get('/convocation/:inscriptionId', protect, checkRole(['CANDIDAT']), pdfController.telechargerConvocation);

module.exports = router;