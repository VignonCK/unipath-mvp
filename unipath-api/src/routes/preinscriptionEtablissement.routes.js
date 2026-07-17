const express = require('express');
const router = express.Router();
const controller = require('../controllers/preinscriptionEtablissement.controller');
const { protect } = require('../middleware/auth.middleware');
const { checkRole } = require('../middleware/role.middleware');

router.post('/', protect, checkRole(['CANDIDAT']), controller.creerPreinscriptionEtablissement);
router.get('/mes-preinscriptions', protect, checkRole(['CANDIDAT']), controller.getMesPreinscriptionsEtablissement);
router.get('/:id/pdf', protect, controller.telechargerFichePreinscriptionEtablissement);

router.get('/etablissement/demandes', protect, checkRole(['ETABLISSEMENT']), controller.getDemandesEtablissement);
router.patch('/:id/decision', protect, checkRole(['ETABLISSEMENT']), controller.deciderPreinscriptionEtablissement);

module.exports = router;
