// src/routes/commission.routes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const commissionController = require('../controllers/commission.controller');

router.get('/dossiers', protect, commissionController.getDossiers);
router.patch('/dossiers/:inscriptionId', protect, commissionController.updateStatut);

module.exports = router;