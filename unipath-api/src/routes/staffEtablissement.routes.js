const express = require('express');
const router = express.Router();
const { protect, verifierSousRoleEtablissement } = require('../middleware/auth.middleware');
const { checkRole } = require('../middleware/role.middleware');
const controller = require('../controllers/staffEtablissement.controller');

const staffGuard = [
  protect,
  checkRole(['ADMIN_ETABLISSEMENT']),
  verifierSousRoleEtablissement(['ADMIN', 'SUPERVISEUR']),
];

router.get('/', ...staffGuard, controller.listerStaff);
router.post('/', ...staffGuard, controller.creerStaff);
router.delete('/:staffId', ...staffGuard, controller.supprimerStaff);

module.exports = router;
