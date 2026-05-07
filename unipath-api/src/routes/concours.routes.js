// src/routes/concours.routes.js
const express = require('express');
const router = express.Router();
const concoursController = require('../controllers/concours.controller');
const { protect, protectOptional } = require('../middleware/auth.middleware');
const { checkRole } = require('../middleware/role.middleware');

router.get('/', concoursController.getAllConcours);
router.get('/:id/classement', concoursController.getClassement);
router.get('/:id', protectOptional, concoursController.getConcoursById); // ✅ protectOptional pour dossierCandidat

router.post('/', protect, checkRole(['DGES']), concoursController.createConcours);
router.put('/:id', protect, checkRole(['DGES']), concoursController.updateConcours);
router.delete('/:id', protect, checkRole(['DGES']), concoursController.deleteConcours);

module.exports = router;