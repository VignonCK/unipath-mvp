const express = require('express');
const router = express.Router();
const etablissementController = require('../controllers/etablissement.controller');
const { protect, verifierSousRoleEtablissement } = require('../middleware/auth.middleware');
const { checkRole } = require('../middleware/role.middleware');
const { upload } = require('../middleware/upload.middleware');

const adminOnly = [
  protect,
  checkRole(['ADMIN_ETABLISSEMENT']),
  verifierSousRoleEtablissement(['ADMIN']),
];

const staffStats = [
  protect,
  checkRole(['ADMIN_ETABLISSEMENT']),
  verifierSousRoleEtablissement(['ADMIN', 'SUPERVISEUR']),
];

const staffView = [
  protect,
  checkRole(['ADMIN_ETABLISSEMENT']),
  verifierSousRoleEtablissement(['ADMIN', 'SUPERVISEUR', 'CONTROLEUR']),
];

router.get('/', etablissementController.getAllEtablissements);
router.get('/prives', etablissementController.getEtablissementsPrives);
router.get('/publics', etablissementController.getEtablissementsPublics);
router.post(
  '/recherche-filieres',
  protect,
  checkRole(['CANDIDAT']),
  etablissementController.rechercherParFilieres
);
router.get('/mon/profil', ...adminOnly, etablissementController.getMonProfilEtablissement);
router.put('/mon/profil', ...adminOnly, etablissementController.updateMonProfilEtablissement);
router.post('/mon/logo', ...adminOnly, upload.single('logo'), etablissementController.uploadMonLogoEtablissement);
router.get('/:id', etablissementController.getEtablissementById);
router.get('/:id/etudiants', ...staffView, etablissementController.getEtudiantsEtablissement);
router.get('/:id/statistiques', ...staffStats, etablissementController.getStatistiquesEtablissement);

module.exports = router;
