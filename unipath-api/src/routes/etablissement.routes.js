const express = require('express');
const router = express.Router();
const etablissementController = require('../controllers/etablissement.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/', etablissementController.getAllEtablissements);
router.get('/:id', etablissementController.getEtablissementById);
router.get('/:id/etudiants', protect, etablissementController.getEtudiantsEtablissement);
router.get('/:id/statistiques', protect, etablissementController.getStatistiquesEtablissement);

module.exports = router;

