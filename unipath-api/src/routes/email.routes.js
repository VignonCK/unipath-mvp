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

// 🔒 Protected routes - Reserved for DGES and CONTROLEUR roles
router.get('/health', protect, checkRole(['DGES', 'CONTROLEUR']), emailController.getEmailHealth);
router.get('/stats', protect, checkRole(['DGES', 'CONTROLEUR']), emailController.getEmailStats);

module.exports = router;
