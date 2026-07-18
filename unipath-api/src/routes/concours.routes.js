// src/routes/concours.routes.js
const express = require('express');
const router = express.Router();
const concoursController = require('../controllers/concours.controller');
const { protect, protectOptional } = require('../middleware/auth.middleware');
const { checkRole } = require('../middleware/role.middleware');

// Routes publiques avec authentification optionnelle
router.get('/', protectOptional, concoursController.getAllConcours); // ✅ protectOptional pour filtre par série
router.get('/:id', protectOptional, concoursController.getConcoursById); // ✅ protectOptional pour dossierCandidat

// 🔒 Route classement protégée - Données sensibles (notes, emails)
router.get('/:id/classement', protect, checkRole(['COMMISSION', 'DEC', 'CONTROLEUR']), concoursController.getClassement);

router.post('/', protect, checkRole(['DEC']), concoursController.createConcours);
router.put('/:id', protect, checkRole(['DEC']), concoursController.updateConcours);
router.delete('/:id', protect, checkRole(['DEC']), concoursController.deleteConcours);

module.exports = router;