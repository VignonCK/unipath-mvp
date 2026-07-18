const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/auth.middleware');
const { checkRole } = require('../middleware/role.middleware');
const commissionConcoursController = require('../controllers/commissionConcours.controller');

router.get('/', protect, checkRole(['DEC']), commissionConcoursController.getCommission);
router.post('/assigner', protect, checkRole(['DEC']), commissionConcoursController.assignerMembre);
router.post('/', protect, checkRole(['DEC']), commissionConcoursController.creerMembreObsolete);
router.delete('/:membreId', protect, checkRole(['DEC']), commissionConcoursController.desassignerMembre);

module.exports = router;
