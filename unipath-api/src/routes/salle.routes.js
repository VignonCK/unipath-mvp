const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const { checkRole } = require('../middleware/role.middleware');
const salleController = require('../controllers/salle.controller');

const router = express.Router();

router.post(
  '/centres/:centreId/salles',
  protect,
  checkRole(['DEC']),
  salleController.creerSalle,
);

router.get(
  '/centres/:centreId/salles',
  protect,
  checkRole(['DEC']),
  salleController.listerSalles,
);

router.put(
  '/salles/:salleId',
  protect,
  checkRole(['DEC']),
  salleController.modifierSalle,
);

router.delete(
  '/salles/:salleId',
  protect,
  checkRole(['DEC']),
  salleController.supprimerSalle,
);

router.post(
  '/concours/:concoursId/centres/:centreId/repartir-salles',
  protect,
  checkRole(['DEC']),
  salleController.repartirSalles,
);

module.exports = router;
