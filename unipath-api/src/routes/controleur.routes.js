const express = require('express');
const router = express.Router();
const controleurController = require('../controllers/controleur.controller');
const { protect } = require('../middleware/auth.middleware');
const { checkRole } = require('../middleware/role.middleware');

router.use(protect, checkRole(['CONTROLEUR']));

router.get('/dossiers', controleurController.getDossiersEnAttente);
router.get('/statistiques', controleurController.getStatistiques);
// ✅ PATCH au lieu de PUT - Mise à jour partielle (statut uniquement)
router.patch('/dossiers/:inscriptionId/valider', controleurController.validerDecision);

module.exports = router;