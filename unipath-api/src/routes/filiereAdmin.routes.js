const express = require('express');
const router = express.Router();
const { protect, verifierSousRoleEtablissement } = require('../middleware/auth.middleware');
const { checkRole } = require('../middleware/role.middleware');
const filiereController = require('../controllers/filiere.controller');

const adminOnly = [
  protect,
  checkRole(['ADMIN_ETABLISSEMENT']),
  verifierSousRoleEtablissement(['ADMIN']),
];

router.post('/', ...adminOnly, filiereController.creerFiliereAdmin);
router.put('/:id', ...adminOnly, filiereController.modifierFiliereAdmin);
router.delete('/:id', ...adminOnly, filiereController.supprimerFiliereAdmin);

module.exports = router;
