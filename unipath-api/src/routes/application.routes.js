const express = require('express');
const multer = require('multer');
const controller = require('../controllers/application.controller');
const { protect } = require('../middleware/auth.middleware');
const { checkRole } = require('../middleware/role.middleware');

const router = express.Router();

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

router.post('/', protect, checkRole(['CANDIDAT']), controller.createApplication);
router.get('/mine', protect, checkRole(['CANDIDAT']), controller.getMyApplications);
router.get(
  '/niveau-autorise',
  protect,
  checkRole(['CANDIDAT']),
  controller.getNiveauAutoriseTransfert
);

router.get('/etablissement/applications', protect, checkRole(['ADMIN_ETABLISSEMENT', 'ETABLISSEMENT']), controller.getApplicationsForEtablissement);
router.get('/etablissement/export/readiness', protect, checkRole(['ADMIN_ETABLISSEMENT', 'ETABLISSEMENT']), controller.getCandidaturesExportReadiness);
router.get('/etablissement/export/pdf', protect, checkRole(['ADMIN_ETABLISSEMENT', 'ETABLISSEMENT']), controller.exportCandidaturesPdf);
router.get('/etablissement/export/excel', protect, checkRole(['ADMIN_ETABLISSEMENT', 'ETABLISSEMENT']), controller.exportCandidaturesExcel);
router.get('/etablissement/requirements', protect, checkRole(['ADMIN_ETABLISSEMENT', 'ETABLISSEMENT']), controller.getMySchoolRequirements);
router.post('/etablissement/requirements', protect, checkRole(['ADMIN_ETABLISSEMENT', 'ETABLISSEMENT']), controller.upsertSchoolRequirement);
router.delete('/etablissement/requirements/:id', protect, checkRole(['ADMIN_ETABLISSEMENT', 'ETABLISSEMENT']), controller.deleteSchoolRequirement);

router.get('/requirements/etablissement/:etablissementId', protect, controller.getSchoolRequirements);
router.get('/:id', protect, controller.getApplicationById);
router.get('/:id/requirements', protect, checkRole(['CANDIDAT']), controller.getApplicationRequirements);
router.post('/:id/payments/dossier-fees/mock-confirm', protect, checkRole(['CANDIDAT']), controller.payDossierFeesMock);
router.post(
  '/:id/payments/dossier-fees/quittance',
  protect,
  checkRole(['CANDIDAT']),
  upload.single('fichier'),
  controller.uploadQuittanceFraisDossier
);
router.post(
  '/:id/payments/droits-inscription/receipt',
  protect,
  checkRole(['CANDIDAT']),
  upload.single('fichier'),
  controller.uploadDroitsInscriptionReceipt
);
router.post(
  '/:id/documents',
  protect,
  checkRole(['CANDIDAT']),
  upload.single('fichier'),
  controller.uploadApplicationDocument
);
router.post('/:id/finalize', protect, checkRole(['CANDIDAT']), controller.finalizeApplication);
router.get('/:id/fiche-preinscription', protect, controller.downloadPreinscriptionFiche);

module.exports = router;
