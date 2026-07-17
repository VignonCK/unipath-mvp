const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const { checkRole } = require('../middleware/role.middleware');
const centreCompositionController = require('../controllers/centreComposition.controller');

const centreRouter = express.Router();
const concoursCentresRouter = express.Router({ mergeParams: true });

centreRouter.post('/', protect, checkRole(['DEC']), centreCompositionController.creerCentre);
centreRouter.get('/', protect, checkRole(['DEC']), centreCompositionController.listerCentres);
centreRouter.put('/:id', protect, checkRole(['DEC']), centreCompositionController.modifierCentre);
centreRouter.patch('/:id/actif', protect, checkRole(['DEC']), centreCompositionController.toggleActifCentre);

concoursCentresRouter.get('/', protect, centreCompositionController.getCentresDuConcours);
concoursCentresRouter.put('/', protect, checkRole(['DEC']), centreCompositionController.setCentresDuConcours);
concoursCentresRouter.post('/', protect, checkRole(['DEC']), centreCompositionController.ajouterCentreAuConcours);
concoursCentresRouter.patch('/:concourscentreId', protect, checkRole(['DEC']), centreCompositionController.modifierConcoursCentre);
concoursCentresRouter.delete('/:concourscentreId', protect, checkRole(['DEC']), centreCompositionController.retirerCentreDuConcours);

module.exports = { centreRouter, concoursCentresRouter };
