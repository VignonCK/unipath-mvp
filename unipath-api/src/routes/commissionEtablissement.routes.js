const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/auth.middleware');
const { checkRole } = require('../middleware/role.middleware');
const commissionEtablissementController = require('../controllers/commissionEtablissement.controller');

const COMMISSION_ETABLISSEMENT_DISABLED_MESSAGE =
  'La gestion de commission par établissement public n\'est plus disponible.';

function blockCommissionEtablissementModule(req, res) {
  return res.status(403).json({
    error: COMMISSION_ETABLISSEMENT_DISABLED_MESSAGE,
    code: 'COMMISSION_ETABLISSEMENT_DISABLED',
  });
}

router.use(blockCommissionEtablissementModule);

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
