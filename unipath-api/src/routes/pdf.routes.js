// src/routes/pdf.routes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const pdfController = require('../controllers/pdf.controller');

router.get('/convocation/:inscriptionId', protect, pdfController.telechargerConvocation);

module.exports = router;