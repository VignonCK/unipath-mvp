// src/routes/dges.routes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const dgesController = require('../controllers/dges.controller');

router.get('/statistiques', protect, dgesController.getStatistiques);
router.get('/statistiques/:concoursId', protect, dgesController.getStatistiquesConcours);

module.exports = router;