// src/routes/dges.routes.js
const express = require('express');
const multer = require('multer');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { checkRole } = require('../middleware/role.middleware');
const dgesController = require('../controllers/dges.controller');
const adminEtablissementRoutes = require('./adminEtablissement.routes');
const commissionEtablissementRoutes = require('./commissionEtablissement.routes');
const commissionConcoursRoutes = require('./commissionConcours.routes');

const csvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const name = String(file.originalname || '').toLowerCase();
    const ok = name.endsWith('.csv')
      || file.mimetype === 'text/csv'
      || file.mimetype === 'application/vnd.ms-excel'
      || file.mimetype === 'text/plain'
      || file.mimetype === 'application/octet-stream';
    if (!ok) {
      return cb(new Error('Seuls les fichiers CSV sont acceptés'));
    }
    return cb(null, true);
  },
});

// Ancienne route désactivée (403) — ne pas réactiver
router.use('/etablissements/:etablissementId/commission', commissionEtablissementRoutes);
router.use('/concours/:concoursId/commission', commissionConcoursRoutes);
router.use('/etablissements', adminEtablissementRoutes);

// Routes protégées - Module 2 (établissements privés) — DGES uniquement
router.get('/statistiques', protect, checkRole(['DGES']), dgesController.getStatistiques);
router.get(
  '/candidats/lookup',
  protect,
  checkRole(['DGES']),
  dgesController.lookupCandidatParMatricule,
);

// Module 1 (concours) — réservé DEC (Phase 2/6 séparation DEC/DGES)
router.post(
  '/concours/:concoursId/cloturer-etude',
  protect,
  checkRole(['DEC']),
  dgesController.cloturerEtudeConcours,
);
router.post(
  '/concours/:concoursId/rouvrir-etude',
  protect,
  checkRole(['DEC']),
  dgesController.rouvrirEtudeConcours,
);
router.post(
  '/concours/:concoursId/generer-numeros-table',
  protect,
  checkRole(['DEC']),
  dgesController.genererNumerosTableConcours,
);
router.post(
  '/concours/:concoursId/importer-numeros-table',
  protect,
  checkRole(['DEC']),
  (req, res, next) => {
    csvUpload.single('file')(req, res, (err) => {
      if (err) {
        return res.status(400).json({ error: err.message || 'Erreur upload CSV' });
      }
      return next();
    });
  },
  dgesController.importerNumerosTableConcours,
);

module.exports = router;