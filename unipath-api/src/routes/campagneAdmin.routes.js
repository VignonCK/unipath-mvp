const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { checkRole } = require('../middleware/role.middleware');
const campagneController = require('../controllers/campagne.controller');

router.post(
  '/',
  protect,
  checkRole(['ADMIN_ETABLISSEMENT']),
  campagneController.creerCampagne
);

router.get(
  '/',
  protect,
  checkRole(['ADMIN_ETABLISSEMENT']),
  campagneController.listerMesCampagnes
);

router.get(
  '/:id',
  protect,
  checkRole(['ADMIN_ETABLISSEMENT']),
  campagneController.getCampagneById
);

router.put(
  '/:id',
  protect,
  checkRole(['ADMIN_ETABLISSEMENT']),
  campagneController.modifierCampagne
);

router.delete(
  '/:id',
  protect,
  checkRole(['ADMIN_ETABLISSEMENT']),
  campagneController.supprimerCampagne
);

router.patch(
  '/:id/publier',
  protect,
  checkRole(['ADMIN_ETABLISSEMENT']),
  campagneController.publierCampagne
);

router.patch(
  '/:id/cloturer',
  protect,
  checkRole(['ADMIN_ETABLISSEMENT']),
  campagneController.cloturerCampagne
);

module.exports = router;
