/**
 * Email Routes
 * 
 * Monitoring and statistics endpoints for the email system
 */

const express = require('express');
const router = express.Router();
const emailController = require('../controllers/email.controller');
const { protect } = require('../middleware/auth.middleware');
const { checkRole } = require('../middleware/role.middleware');

// 🔒 Ops technique — DEC + DGES + CONTROLEUR (pas de scope métier M1/M2)
router.get('/health', protect, checkRole(['DEC', 'DGES', 'CONTROLEUR']), emailController.getEmailHealth);
router.get('/stats', protect, checkRole(['DEC', 'DGES', 'CONTROLEUR']), emailController.getEmailStats);

module.exports = router;
