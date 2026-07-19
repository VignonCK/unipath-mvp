const express = require('express');
const multer = require('multer');
const router = express.Router();
const controller = require('../controllers/preinscriptionEtablissement.controller');
const { protect } = require('../middleware/auth.middleware');
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

router.post('/', protect, checkRole(['CANDIDAT']), controller.creerPreinscriptionEtablissement);
router.get('/mes-preinscriptions', protect, checkRole(['CANDIDAT']), controller.getMesPreinscriptionsEtablissement);

router.get(
  '/etablissement/demandes',
  protect,
  checkRole(['ADMIN_ETABLISSEMENT', 'ETABLISSEMENT']),
  controller.getDemandesEtablissement
);

router.get('/:id/pdf', protect, controller.telechargerFichePreinscriptionEtablissement);
router.get('/:id/correction', protect, checkRole(['CANDIDAT']), controller.getContexteCorrectionSousReserve);
router.post(
  '/:id/pieces',
  protect,
  checkRole(['CANDIDAT']),
  upload.single('fichier'),
  controller.remplacerPieceSousReserve
);
router.patch('/:id/niveau', protect, checkRole(['CANDIDAT']), controller.modifierNiveauSousReserve);
router.post('/:id/resoumettre', protect, checkRole(['CANDIDAT']), controller.resoumettreSousReserve);
router.patch(
  '/:id/decision',
  protect,
  checkRole(['ADMIN_ETABLISSEMENT', 'ETABLISSEMENT']),
  controller.deciderPreinscriptionEtablissement
);

module.exports = router;
