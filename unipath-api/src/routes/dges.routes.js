// src/routes/dges.routes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { checkRole } = require('../middleware/role.middleware');
const dgesController = require('../controllers/dges.controller');
const adminEtablissementRoutes = require('./adminEtablissement.routes');

// Gestion des administrateurs d'établissement (DGES only)
router.use('/etablissements', adminEtablissementRoutes);

// Routes protégées - DGES et COMMISSION peuvent voir les statistiques
router.get('/statistiques', protect, checkRole(['DGES', 'COMMISSION']), dgesController.getStatistiques);
router.get('/statistiques/:concoursId', protect, checkRole(['DGES', 'COMMISSION']), dgesController.getStatistiquesConcours);

module.exports = router;