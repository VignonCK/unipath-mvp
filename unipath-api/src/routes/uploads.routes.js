const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const uploadsController = require('../controllers/uploads.controller');

const router = express.Router();

router.get('/public/etablissements/:filename', uploadsController.servePublicUpload);

router.get('/uploads/:folder/:filename', protect, uploadsController.servePrivateUpload);
router.get('/uploads/:filename', protect, uploadsController.servePrivateUpload);

module.exports = router;
