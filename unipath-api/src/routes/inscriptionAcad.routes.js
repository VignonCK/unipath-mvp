const express = require('express');
const router = express.Router();
const inscriptionAcadController = require('../controllers/inscriptionAcad.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/', protect, inscriptionAcadController.creerInscriptionAcad);
router.get('/mes-inscriptions', protect, inscriptionAcadController.getMesInscriptions);
router.get('/:id', protect, inscriptionAcadController.getInscriptionById);
router.patch('/:id/statut', protect, inscriptionAcadController.updateStatut);

module.exports = router;

