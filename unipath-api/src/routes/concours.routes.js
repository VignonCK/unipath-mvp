// src/routes/concours.routes.js
const express = require('express');
const router = express.Router();
const concoursController = require('../controllers/concours.controller');
const { protect, protectOptional } = require('../middleware/auth.middleware');
const { checkRole } = require('../middleware/role.middleware');

const anneeAcademiqueController = require('../controllers/annee-academique.controller');

// Année en cours (lecture pour tous les comptes authentifiés ou candidats)
router.get('/annee-en-cours', protectOptional, anneeAcademiqueController.getEnCours);

// Routes publiques avec authentification optionnelle
router.get('/', protectOptional, concoursController.getAllConcours); // ✅ protectOptional pour filtre par série
router.get('/:id', protectOptional, concoursController.getConcoursById); // ✅ protectOptional pour dossierCandidat

// 🔒 Route classement protégée - Données sensibles (notes, emails)
router.get('/:id/classement', protect, checkRole(['COMMISSION', 'DEC', 'CONTROLEUR']), concoursController.getClassement);

router.post('/', protect, checkRole(['DEC']), concoursController.createConcours);
router.put('/:id', protect, checkRole(['DEC']), concoursController.updateConcours);
router.delete('/:id', protect, checkRole(['DEC']), concoursController.deleteConcours);

module.exports = router;