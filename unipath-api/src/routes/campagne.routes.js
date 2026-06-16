const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { checkRole } = require('../middleware/role.middleware');
const campagneController = require('../controllers/campagne.controller');

router.get(
  '/',
  protect,
  checkRole(['CANDIDAT']),
  campagneController.listerCampagnesPubliees
);

router.get(
  '/:id',
  protect,
  checkRole(['CANDIDAT']),
  campagneController.getCampagnePubliqueById
);

module.exports = router;
