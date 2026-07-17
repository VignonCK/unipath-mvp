// src/routes/dec.routes.js — Module 1 (concours / établissements publics)
const express = require('express');
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

router.get('/statistiques', protect, checkRole(['DEC', 'COMMISSION']), dgesController.getStatistiques);

router.get('/communes', protect, checkRole(['DEC', 'COMMISSION']), numeroTableController.listerCommunes);
router.get('/concours/:concoursId/numeros-table', protect, checkRole(['DEC', 'COMMISSION']), numeroTableController.listerNumerosTable);
router.post('/concours/:concoursId/generer-numeros-table', protect, checkRole(['DEC']), numeroTableController.genererNumerosTable);

router.get('/membres-commission', protect, checkRole(['DEC']), affectationCommissionController.listerMembresCommission);
router.get('/concours/:concoursId/affectations', protect, checkRole(['DEC']), affectationCommissionController.getAffectationsConcours);
router.put('/concours/:concoursId/affectations', protect, checkRole(['DEC']), affectationCommissionController.setAffectationsConcours);

router.get('/concours/:concoursId/liste-retenus', protect, checkRole(['DEC']), postEtudeController.getListeRetenus);
router.get('/concours/:concoursId/liste-retenus/pdf', protect, checkRole(['DEC']), postEtudeController.exportListeRetenusPdf);
router.get('/concours/:concoursId/liste-retenus/excel', protect, checkRole(['DEC']), postEtudeController.exportListeRetenusExcel);
router.post('/concours/:concoursId/preparer-liste-retenus', protect, checkRole(['DEC']), postEtudeController.preparerListeRetenus);
router.post('/concours/:concoursId/envoyer-convocations', protect, checkRole(['DEC']), postEtudeController.envoyerConvocationsRetenus);

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

router.post('/etablissements', protect, checkRole(['DEC']), etablissementController.createEtablissementDges);
router.delete('/etablissements/:etablissementId', protect, checkRole(['DEC']), etablissementController.deleteEtablissementDges);

module.exports = router;
