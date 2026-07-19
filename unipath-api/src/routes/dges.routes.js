// src/routes/dges.routes.js — Module 2 (établissements privés)
const express = require('express');
const router = express.Router();
const adminEtablissementRoutes = require('./adminEtablissement.routes');
const anneeAcademiqueController = require('../controllers/annee-academique.controller');
const { protect, protectOptional } = require('../middleware/auth.middleware');
const { checkRole } = require('../middleware/role.middleware');

function setAnneeScopeDges(req, _res, next) {
  req.anneeScope = 'DGES';
  next();
}

// Année en cours Module 2 (étudiants / admins établissement)
router.get(
  '/annee-en-cours',
  protectOptional,
  setAnneeScopeDges,
  anneeAcademiqueController.getEnCours
);

// Liste des années (DGES + admins établissements — lecture seule pour les admins)
router.get(
  '/annees-academiques',
  protect,
  checkRole(['DGES', 'ADMIN_ETABLISSEMENT']),
  setAnneeScopeDges,
  anneeAcademiqueController.lister
);

// Gestion des années académiques (DGES only)
router.post(
  '/annees-academiques',
  protect,
  checkRole(['DGES']),
  setAnneeScopeDges,
  anneeAcademiqueController.creer
);
router.put(
  '/annees-academiques/:id/en-cours',
  protect,
  checkRole(['DGES']),
  setAnneeScopeDges,
  anneeAcademiqueController.definirEnCours
);

// Gestion des établissements privés et de leurs administrateurs (DGES only)
router.use('/etablissements', adminEtablissementRoutes);

const demandeFiliereController = require('../controllers/demande-filiere.controller');
const filiereReferenceController = require('../controllers/filiere-reference.controller');
const tableauDeBordController = require('../controllers/dges-tableau-de-bord.controller');

// Tableau de bord national Module 2
router.get(
  '/tableau-de-bord',
  protect,
  checkRole(['DGES']),
  tableauDeBordController.getTableauDeBord
);
router.get(
  '/tableau-de-bord/csv',
  protect,
  checkRole(['DGES']),
  tableauDeBordController.exportTableauDeBordCsv
);
router.get(
  '/tableau-de-bord/pdf',
  protect,
  checkRole(['DGES']),
  tableauDeBordController.exportTableauDeBordPdf
);

// Catalogue de filières DGES (lecture : DGES + admins ; écriture : DGES)
router.get(
  '/filieres-reference',
  protect,
  checkRole(['DGES', 'ADMIN_ETABLISSEMENT']),
  filiereReferenceController.lister
);
router.post(
  '/filieres-reference',
  protect,
  checkRole(['DGES']),
  filiereReferenceController.creer
);
router.put(
  '/filieres-reference/:id',
  protect,
  checkRole(['DGES']),
  filiereReferenceController.modifier
);
router.delete(
  '/filieres-reference/:id',
  protect,
  checkRole(['DGES']),
  filiereReferenceController.desactiver
);

router.get(
  '/demandes-filieres',
  protect,
  checkRole(['DGES']),
  demandeFiliereController.listerDemandesDges
);
router.post(
  '/demandes-filieres/:id/valider',
  protect,
  checkRole(['DGES']),
  demandeFiliereController.validerDemande
);
router.post(
  '/demandes-filieres/:id/rejeter',
  protect,
  checkRole(['DGES']),
  demandeFiliereController.rejeterDemande
);

module.exports = router;
