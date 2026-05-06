// src/routes/commission.routes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { checkRole } = require('../middleware/role.middleware');
const commissionController = require('../controllers/commission.controller');

// Routes protégées - COMMISSION uniquement
router.get('/dossiers', protect, checkRole(['COMMISSION']), commissionController.getDossiers);
router.patch('/dossiers/:inscriptionId', protect, checkRole(['COMMISSION']), commissionController.updateStatut);

// Nouvelles routes pour la gestion des notes
router.get('/concours', protect, checkRole(['COMMISSION']), commissionController.getCandidatsParConcours);
router.patch('/notes/:inscriptionId', protect, checkRole(['COMMISSION']), commissionController.updateNote);

module.exports = router;