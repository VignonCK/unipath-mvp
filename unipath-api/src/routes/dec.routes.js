// src/routes/dec.routes.js — Module 1 (concours / établissements publics)
const express = require('express');
const multer = require('multer');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { checkRole } = require('../middleware/role.middleware');
const dgesController = require('../controllers/dges.controller');
const etablissementController = require('../controllers/etablissement.controller');
const decEtudeDossiersController = require('../controllers/dec-etude-dossiers.controller');
const anneeAcademiqueController = require('../controllers/annee-academique.controller');
const numeroTableController = require('../controllers/numero-table.controller');
const affectationCommissionController = require('../controllers/affectation-commission.controller');
const postEtudeController = require('../controllers/post-etude.controller');
const decTableauDeBordController = require('../controllers/dec-tableau-de-bord.controller');
const decParametresController = require('../controllers/dec-parametres.controller');

const csvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const name = String(file.originalname || '').toLowerCase();
    const ok = name.endsWith('.csv')
      || name.endsWith('.txt')
      || (file.mimetype || '').includes('csv')
      || (file.mimetype || '').includes('text');
    cb(ok ? null : new Error('Fichier CSV ou TXT requis'), ok);
  },
});

const enTetePdfUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = ['image/jpeg', 'image/jpg', 'image/png'].includes(file.mimetype);
    cb(ok ? null : new Error('Image JPG ou PNG requise'), ok);
  },
});

router.get('/statistiques', protect, checkRole(['DEC', 'COMMISSION']), dgesController.getStatistiques);
router.get('/tableau-de-bord', protect, checkRole(['DEC']), decTableauDeBordController.getTableauDeBord);
router.get('/tableau-de-bord/pdf', protect, checkRole(['DEC']), decTableauDeBordController.exportTableauDeBordPdf);
router.get('/tableau-de-bord/csv', protect, checkRole(['DEC']), decTableauDeBordController.exportTableauDeBordCsv);

router.get('/parametres/en-tete-pdf', protect, checkRole(['DEC']), decParametresController.getEnTetePdf);
router.get('/parametres/en-tete-pdf/image', protect, checkRole(['DEC']), decParametresController.getEnTetePdfImage);
router.post(
  '/parametres/en-tete-pdf',
  protect,
  checkRole(['DEC']),
  (req, res, next) => {
    enTetePdfUpload.single('fichier')(req, res, (err) => {
      if (err) {
        return res.status(400).json({ error: err.message || 'Fichier invalide' });
      }
      return next();
    });
  },
  decParametresController.uploadEnTetePdf
);
router.delete('/parametres/en-tete-pdf', protect, checkRole(['DEC']), decParametresController.restoreEnTetePdf);

router.get('/communes', protect, checkRole(['DEC']), numeroTableController.listerCommunes);
router.get('/concours/:concoursId/numeros-table', protect, checkRole(['DEC']), numeroTableController.listerNumerosTable);
router.post('/concours/:concoursId/generer-numeros-table', protect, checkRole(['DEC']), numeroTableController.genererNumerosTable);

router.get('/membres-commission', protect, checkRole(['DEC']), affectationCommissionController.listerMembresCommission);
router.post('/membres-commission', protect, checkRole(['DEC']), affectationCommissionController.creerMembreCommission);
router.post(
  '/membres-commission/:membreId/reinitialiser-mot-de-passe',
  protect,
  checkRole(['DEC']),
  affectationCommissionController.reinitialiserMotDePasseMembre
);
router.get(
  '/commission/stats-dossiers',
  protect,
  checkRole(['DEC']),
  affectationCommissionController.getStatsDossiersCommission
);
router.get('/concours/:concoursId/affectations', protect, checkRole(['DEC']), affectationCommissionController.getAffectationsConcours);
router.put('/concours/:concoursId/affectations', protect, checkRole(['DEC']), affectationCommissionController.setAffectationsConcours);

router.get('/concours/:concoursId/liste-retenus', protect, checkRole(['DEC']), postEtudeController.getListeRetenus);
router.get('/concours/:concoursId/liste-retenus/pdf', protect, checkRole(['DEC']), postEtudeController.exportListeRetenusPdf);
router.get('/concours/:concoursId/liste-retenus/excel', protect, checkRole(['DEC']), postEtudeController.exportListeRetenusExcel);
router.post('/concours/:concoursId/preparer-liste-retenus', protect, checkRole(['DEC']), postEtudeController.preparerListeRetenus);
router.post('/concours/:concoursId/envoyer-convocations', protect, checkRole(['DEC']), postEtudeController.envoyerConvocationsRetenus);
router.get('/concours/:concoursId/resultats-selection', protect, checkRole(['DEC']), postEtudeController.getResultatsSelection);
router.patch(
  '/concours/:concoursId/resultats-selection/:inscriptionId',
  protect,
  checkRole(['DEC']),
  postEtudeController.deciderResultatComposition
);
router.post(
  '/concours/:concoursId/resultats-selection/import-admis',
  protect,
  checkRole(['DEC']),
  (req, res, next) => {
    csvUpload.single('fichier')(req, res, (err) => {
      if (err) {
        return res.status(400).json({ error: err.message || 'Fichier invalide' });
      }
      return next();
    });
  },
  postEtudeController.importerAdmisCsv
);
router.post(
  '/concours/:concoursId/resultats-selection/marquer-autres-refuses',
  protect,
  checkRole(['DEC']),
  postEtudeController.marquerAutresRefuses
);
router.post(
  '/concours/:concoursId/resultats-selection/annuler-toutes-decisions',
  protect,
  checkRole(['DEC']),
  postEtudeController.annulerToutesDecisions
);
router.get(
  '/concours/:concoursId/resultats-selection/pdf',
  protect,
  checkRole(['DEC']),
  postEtudeController.exportResultatsSelectionPdf
);
router.get(
  '/concours/:concoursId/resultats-selection/csv',
  protect,
  checkRole(['DEC']),
  postEtudeController.exportResultatsSelectionCsv
);

router.get('/annees-academiques', protect, checkRole(['DEC']), anneeAcademiqueController.lister);
router.post('/annees-academiques', protect, checkRole(['DEC']), anneeAcademiqueController.creer);
router.put('/annees-academiques/:id/en-cours', protect, checkRole(['DEC']), anneeAcademiqueController.definirEnCours);
router.get('/statistiques/:concoursId', protect, checkRole(['DEC', 'COMMISSION']), dgesController.getStatistiquesConcours);

router.get('/concours/etude-dossiers', protect, checkRole(['DEC']), decEtudeDossiersController.getEtudeStatuses);
router.get('/concours/:concoursId/etude-dossiers', protect, checkRole(['DEC']), decEtudeDossiersController.getEtudeStatus);
router.post('/concours/:concoursId/lancer-etude', protect, checkRole(['DEC']), decEtudeDossiersController.lancerEtude);
router.put('/concours/:concoursId/periode-etude', protect, checkRole(['DEC']), decEtudeDossiersController.lancerEtude);
router.post('/concours/:concoursId/cloturer-etude', protect, checkRole(['DEC']), decEtudeDossiersController.cloturerEtude);
/** TEMP — bouton de test : clôturer les inscriptions avant la date prévue */
router.post('/concours/:concoursId/cloturer-inscriptions-test', protect, checkRole(['DEC']), decEtudeDossiersController.cloturerInscriptionsTest);
router.post('/concours/:concoursId/restaurer-date-fin-depot', protect, checkRole(['DEC']), decEtudeDossiersController.restaurerDateFinDepot);

router.post('/etablissements', protect, checkRole(['DEC']), etablissementController.createEtablissementDges);
router.delete('/etablissements/:etablissementId', protect, checkRole(['DEC']), etablissementController.deleteEtablissementDges);

module.exports = router;
