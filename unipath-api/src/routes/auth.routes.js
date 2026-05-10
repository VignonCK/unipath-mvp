// src/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
// ✅ Import supprimé - Routes commentées, import inutilisé
// const commissionAuthController = require('../controllers/commission.auth.controller');

// Routes publiques
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/reset-password', authController.resetPassword);

// Routes de confirmation d'email
router.get('/confirm-email', authController.confirmEmail);
router.post('/resend-confirmation', authController.resendConfirmationEmail);

// Routes d'inscription pour Commission et DGES
// ⚠️ DÉSACTIVÉES EN PRODUCTION - Utiliser le script create-admin-accounts.js
// router.post('/register/commission', commissionAuthController.registerCommission);
// router.post('/register/dges', commissionAuthController.registerDGES);

module.exports = router;