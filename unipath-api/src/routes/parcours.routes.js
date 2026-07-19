const express = require('express');
const router = express.Router();
const parcoursController = require('../controllers/parcours.controller');
const { protect } = require('../middleware/auth.middleware');
const { checkRole } = require('../middleware/role.middleware');

router.get('/mon-parcours', protect, parcoursController.getMonParcours);
router.get('/mon-releve', protect, parcoursController.getMonReleve);
router.get('/mon-releve/pdf', protect, parcoursController.telechargerMonRelevePdf);
router.get(
  '/par-matricule',
  protect,
  checkRole(['DGES', 'ADMIN_ETABLISSEMENT', 'ETABLISSEMENT']),
  parcoursController.getParcoursByMatricule
);

module.exports = router;

