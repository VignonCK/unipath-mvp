const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const { checkRole } = require('../middleware/role.middleware');
const centreCompositionController = require('../controllers/centreComposition.controller');

const centreRouter = express.Router();
const concoursCentresRouter = express.Router({ mergeParams: true });

centreRouter.post('/', protect, checkRole(['DGES']), centreCompositionController.creerCentre);
centreRouter.get('/', protect, checkRole(['DGES']), centreCompositionController.listerCentres);
centreRouter.put('/:id', protect, checkRole(['DGES']), centreCompositionController.modifierCentre);
centreRouter.patch('/:id/actif', protect, checkRole(['DGES']), centreCompositionController.toggleActifCentre);

concoursCentresRouter.get('/', protect, centreCompositionController.getCentresDuConcours);
concoursCentresRouter.post('/', protect, checkRole(['DGES']), centreCompositionController.ajouterCentreAuConcours);
concoursCentresRouter.patch('/:concourscentreId', protect, checkRole(['DGES']), centreCompositionController.modifierConcoursCentre);
concoursCentresRouter.delete('/:concourscentreId', protect, checkRole(['DGES']), centreCompositionController.retirerCentreDuConcours);

module.exports = { centreRouter, concoursCentresRouter };
