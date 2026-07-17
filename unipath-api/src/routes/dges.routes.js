// src/routes/dges.routes.js — Module 2 (établissements privés)
const express = require('express');
const router = express.Router();
const adminEtablissementRoutes = require('./adminEtablissement.routes');

// Gestion des établissements privés et de leurs administrateurs (DGES only)
router.use('/etablissements', adminEtablissementRoutes);

module.exports = router;
