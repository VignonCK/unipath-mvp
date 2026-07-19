const express = require('express');
const router = express.Router();
const etablissementController = require('../controllers/etablissement.controller');
const { protect } = require('../middleware/auth.middleware');
const { checkRole } = require('../middleware/role.middleware');
const { upload } = require('../middleware/upload.middleware');

router.get('/', etablissementController.getAllEtablissements);
router.get('/prives', etablissementController.getEtablissementsPrives);
router.get('/publics', etablissementController.getEtablissementsPublics);
router.post(
  '/recherche-filieres',
  protect,
  checkRole(['CANDIDAT']),
  etablissementController.rechercherParFilieres
);
router.get('/mon/profil', protect, checkRole(['ADMIN_ETABLISSEMENT', 'ETABLISSEMENT']), etablissementController.getMonProfilEtablissement);
router.put('/mon/profil', protect, checkRole(['ADMIN_ETABLISSEMENT', 'ETABLISSEMENT']), etablissementController.updateMonProfilEtablissement);
router.post('/mon/logo', protect, checkRole(['ADMIN_ETABLISSEMENT', 'ETABLISSEMENT']), upload.single('logo'), etablissementController.uploadMonLogoEtablissement);
router.get('/:id', etablissementController.getEtablissementById);
router.get('/:id/etudiants', protect, etablissementController.getEtudiantsEtablissement);
router.get('/:id/statistiques', protect, etablissementController.getStatistiquesEtablissement);

module.exports = router;

