const express = require('express');
const router = express.Router();
const parcoursController = require('../controllers/parcours.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/mon-parcours', protect, parcoursController.getMonParcours);
router.get('/mon-releve', protect, parcoursController.getMonReleve);
router.get('/mon-releve/pdf', protect, parcoursController.telechargerMonRelevePdf);

module.exports = router;

