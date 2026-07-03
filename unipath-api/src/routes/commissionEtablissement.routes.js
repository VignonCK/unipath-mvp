const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/auth.middleware');
const { checkRole } = require('../middleware/role.middleware');
const commissionEtablissementController = require('../controllers/commissionEtablissement.controller');

router.get(
  '/',
  protect,
  checkRole(['DGES']),
  commissionEtablissementController.getCommission
);

router.post(
  '/',
  protect,
  checkRole(['DGES']),
  commissionEtablissementController.creerMembre
);

router.delete(
  '/:membreId',
  protect,
  checkRole(['DGES']),
  commissionEtablissementController.supprimerMembre
);

module.exports = router;
