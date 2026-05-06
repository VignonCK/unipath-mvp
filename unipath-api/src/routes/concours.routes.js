// src/routes/concours.routes.js
const express = require('express');
const router = express.Router();
const concoursController = require('../controllers/concours.controller');
const { protect } = require('../middleware/auth.middleware');
const { checkRole } = require('../middleware/role.middleware');

router.get('/', concoursController.getAllConcours);
router.get('/:id', concoursController.getConcoursById);
router.get('/:id/classement', concoursController.getClassement);

// Routes protégées DGES uniquement
router.post('/', protect, checkRole(['DGES']), concoursController.createConcours);
router.put('/:id', protect, checkRole(['DGES']), concoursController.updateConcours);
router.delete('/:id', protect, checkRole(['DGES']), concoursController.deleteConcours);

module.exports = router;