// src/routes/candidat.routes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const candidatController = require('../controllers/candidat.controller');

router.get('/profil', protect, candidatController.getProfil);
router.put('/profil', protect, candidatController.updateProfil);

module.exports = router;