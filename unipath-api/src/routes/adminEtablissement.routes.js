const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/auth.middleware');
const { checkRole } = require('../middleware/role.middleware');
const adminEtablissementController = require('../controllers/adminEtablissement.controller');

router.post(
  '/:etablissementId/admins',
  protect,
  checkRole(['DGES']),
  adminEtablissementController.creerAdmin
);

router.get(
  '/:etablissementId/admins',
  protect,
  checkRole(['DGES']),
  adminEtablissementController.listerAdmins
);

router.delete(
  '/:etablissementId/admins/:adminId',
  protect,
  checkRole(['DGES']),
  adminEtablissementController.supprimerAdmin
);

module.exports = router;
