const express = require('express');
const router = express.Router();
const controller = require('../controllers/demande-filiere.controller');
const { protect } = require('../middleware/auth.middleware');
const { checkRole } = require('../middleware/role.middleware');

router.post(
  '/',
  protect,
  checkRole(['ADMIN_ETABLISSEMENT']),
  controller.creerDemande
);
router.get(
  '/',
  protect,
  checkRole(['ADMIN_ETABLISSEMENT']),
  controller.listerMesDemandes
);

module.exports = router;
