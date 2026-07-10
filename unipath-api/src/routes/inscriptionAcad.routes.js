const express = require('express');
const multer = require('multer');
const router = express.Router();
const inscriptionAcadController = require('../controllers/inscriptionAcad.controller');
const { protect, verifierSousRoleEtablissement } = require('../middleware/auth.middleware');
const { checkRole } = require('../middleware/role.middleware');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'image/png', 'image/jpeg'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
      return;
    }
    cb(new Error('Type de fichier non autorise'));
  },
});

const staffDecision = [
  protect,
  checkRole(['ADMIN_ETABLISSEMENT']),
  verifierSousRoleEtablissement(['ADMIN', 'SUPERVISEUR', 'CONTROLEUR']),
];

router.post('/', protect, inscriptionAcadController.creerInscriptionAcad);
router.get('/mes-inscriptions', protect, inscriptionAcadController.getMesInscriptions);
router.get('/:id', protect, inscriptionAcadController.getInscriptionById);
router.patch('/:id/statut', ...staffDecision, inscriptionAcadController.updateStatut);
router.post(
  '/:id/quittance',
  protect,
  checkRole(['CANDIDAT']),
  upload.single('fichier'),
  inscriptionAcadController.soumettreQuittance,
);
router.patch('/:id/valider-quittance', ...staffDecision, inscriptionAcadController.validerQuittance);
router.patch('/:id/rejeter-quittance', ...staffDecision, inscriptionAcadController.rejeterQuittance);

module.exports = router;
