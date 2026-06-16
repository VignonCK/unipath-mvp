const express = require('express');
const router = express.Router();
const etablissementController = require('../controllers/etablissement.controller');
const { protect } = require('../middleware/auth.middleware');
const { checkRole } = require('../middleware/role.middleware');
const { upload } = require('../middleware/upload.middleware');

router.get('/', etablissementController.getAllEtablissements);
router.post(
  '/recherche-filieres',
  protect,
  checkRole(['CANDIDAT']),
  etablissementController.rechercherParFilieres
);
router.get('/mon/profil', protect, checkRole(['ETABLISSEMENT']), etablissementController.getMonProfilEtablissement);
router.put('/mon/profil', protect, checkRole(['ETABLISSEMENT']), etablissementController.updateMonProfilEtablissement);
router.post('/mon/logo', protect, checkRole(['ETABLISSEMENT']), upload.single('logo'), etablissementController.uploadMonLogoEtablissement);
router.get('/:id', etablissementController.getEtablissementById);
router.get('/:id/etudiants', protect, etablissementController.getEtudiantsEtablissement);
router.get('/:id/statistiques', protect, etablissementController.getStatistiquesEtablissement);

module.exports = router;

