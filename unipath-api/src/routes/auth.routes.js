// src/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/register', authController.register);
router.post('/register-etablissement', authController.registerEtablissement);
router.post('/login', authController.login);
router.post('/reset-password', authController.resetPassword);
router.post('/reset-password/confirm', authController.confirmResetPassword);
router.post('/change-password', protect, authController.changePassword);
router.post('/change-initial-password', protect, authController.changeInitialPassword);
router.post('/finalize-password-reset', protect, authController.finalizePasswordReset);

router.get('/confirm-email', authController.confirmEmail);
router.post('/resend-confirmation', authController.resendConfirmationEmail);

module.exports = router;
