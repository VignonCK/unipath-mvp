const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { checkRole } = require('../middleware/role.middleware');
const controller = require('../controllers/validation-ue.controller');

const roles = ['ADMIN_ETABLISSEMENT', 'ETABLISSEMENT'];

router.get('/ues', protect, checkRole(roles), controller.listerUesPourAnnee);
router.get('/etudiants', protect, checkRole(roles), controller.listerPourValidation);
router.get('/bilan', protect, checkRole(roles), controller.listerBilan);
router.get('/bilan-annee', protect, checkRole(roles), controller.listerBilanAnnee);
router.post('/marquer', protect, checkRole(roles), controller.marquerValidation);
router.post('/decision-passage', protect, checkRole(roles), controller.deciderPassage);

module.exports = router;
