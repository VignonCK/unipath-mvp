const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/auth.middleware');
const { checkRole } = require('../middleware/role.middleware');
const commissionConcoursController = require('../controllers/commissionConcours.controller');

router.get('/', protect, checkRole(['DEC']), commissionConcoursController.getCommission);
router.post('/', protect, checkRole(['DEC']), commissionConcoursController.creerMembre);
router.delete('/:membreId', protect, checkRole(['DEC']), commissionConcoursController.supprimerMembre);

module.exports = router;
