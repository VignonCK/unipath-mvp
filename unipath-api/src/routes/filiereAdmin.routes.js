const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { checkRole } = require('../middleware/role.middleware');
const filiereController = require('../controllers/filiere.controller');

router.post(
  '/',
  protect,
  checkRole(['ADMIN_ETABLISSEMENT']),
  filiereController.creerFiliereAdmin
);

router.put(
  '/:id',
  protect,
  checkRole(['ADMIN_ETABLISSEMENT']),
  filiereController.modifierFiliereAdmin
);

router.delete(
  '/:id',
  protect,
  checkRole(['ADMIN_ETABLISSEMENT']),
  filiereController.supprimerFiliereAdmin
);

module.exports = router;
