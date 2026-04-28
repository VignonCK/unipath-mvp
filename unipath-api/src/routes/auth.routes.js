// src/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const commissionAuthController = require('../controllers/commission.auth.controller');

// Routes publiques
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/reset-password', authController.resetPassword);

// Routes d'inscription pour Commission et DGES (à protéger en production)
router.post('/register/commission', commissionAuthController.registerCommission);
router.post('/register/dges', commissionAuthController.registerDGES);

module.exports = router;