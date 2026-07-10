const express = require('express');
const router = express.Router();
const { protect, verifierSousRoleEtablissement } = require('../middleware/auth.middleware');
const { checkRole } = require('../middleware/role.middleware');
const campagneController = require('../controllers/campagne.controller');

const adminOnly = [
  protect,
  checkRole(['ADMIN_ETABLISSEMENT']),
  verifierSousRoleEtablissement(['ADMIN']),
];

router.post('/', ...adminOnly, campagneController.creerCampagne);
router.get('/', ...adminOnly, campagneController.listerMesCampagnes);
router.get('/:id', ...adminOnly, campagneController.getCampagneById);
router.put('/:id', ...adminOnly, campagneController.modifierCampagne);
router.delete('/:id', ...adminOnly, campagneController.supprimerCampagne);
router.patch('/:id/publier', ...adminOnly, campagneController.publierCampagne);
router.patch('/:id/cloturer', ...adminOnly, campagneController.cloturerCampagne);

module.exports = router;
