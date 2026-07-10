const express = require('express');
const multer = require('multer');
const router = express.Router();
const controller = require('../controllers/preinscriptionEtablissement.controller');
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

const DIRECT_PREINSCRIPTION_DISABLED_MESSAGE =
  'La création directe de pré-inscription est désactivée. Passez par le dépôt de dossier via /api/applications.';

const staffDecision = [
  protect,
  checkRole(['ADMIN_ETABLISSEMENT']),
  verifierSousRoleEtablissement(['ADMIN', 'SUPERVISEUR', 'CONTROLEUR']),
];

router.post('/', protect, checkRole(['CANDIDAT']), (_req, res) => {
  return res.status(410).json({ error: DIRECT_PREINSCRIPTION_DISABLED_MESSAGE });
});
router.get('/mes-preinscriptions', protect, checkRole(['CANDIDAT']), controller.getMesPreinscriptionsEtablissement);
router.get('/:id/pdf', protect, controller.telechargerFichePreinscriptionEtablissement);

router.get('/etablissement/demandes', ...staffDecision, controller.getDemandesEtablissement);
router.patch('/:id/decision', ...staffDecision, controller.deciderPreinscriptionEtablissement);
router.post(
  '/:id/documents-complementaires',
  protect,
  checkRole(['CANDIDAT']),
  upload.single('fichier'),
  controller.ajouterDocumentComplementaire,
);
router.post('/:id/resoumettre', protect, checkRole(['CANDIDAT']), controller.resoumettrePreinscription);

module.exports = router;
