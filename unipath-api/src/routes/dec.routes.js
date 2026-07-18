// src/routes/dec.routes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { checkRole } = require('../middleware/role.middleware');
const dgesController = require('../controllers/dges.controller');

// Module 1 — statistiques concours (DEC ; COMMISSION en lecture)
router.get(
  '/statistiques',
  protect,
  checkRole(['DEC', 'COMMISSION']),
  dgesController.getStatistiquesDec,
);
router.get(
  '/statistiques/:concoursId',
  protect,
  checkRole(['DEC', 'COMMISSION']),
  dgesController.getStatistiquesConcours,
);

module.exports = router;
