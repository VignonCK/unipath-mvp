const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/auth.middleware');
const { checkRole } = require('../middleware/role.middleware');
const adminEtablissementController = require('../controllers/adminEtablissement.controller');
const etablissementController = require('../controllers/etablissement.controller');

router.post(
  '/',
  protect,
  checkRole(['DGES']),
  etablissementController.createEtablissementDges
);

router.delete(
  '/:etablissementId',
  protect,
  checkRole(['DGES']),
  etablissementController.deleteEtablissementDges
);

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

router.post(
  '/:etablissementId/admins/:adminId/reinitialiser-mot-de-passe',
  protect,
  checkRole(['DGES']),
  adminEtablissementController.reinitialiserMotDePasse
);

module.exports = router;
