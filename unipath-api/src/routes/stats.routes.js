const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { checkRole } = require('../middleware/role.middleware');
const statsExportController = require('../controllers/statsExport.controller');

router.get(
  '/export',
  protect,
  checkRole(['DEC', 'DGES', 'COMMISSION', 'CONTROLEUR']),
  statsExportController.exportStats,
);

module.exports = router;
