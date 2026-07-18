const express = require('express');
const router = express.Router();
const notesController = require('../controllers/notes.controller');
const { protect } = require('../middleware/auth.middleware');
const { checkRole } = require('../middleware/role.middleware');

// /api/notes = notes d'inscription académique (Module 2), PAS notes de concours
// (notes concours = PATCH /commission/notes/:inscriptionId, rôle COMMISSION)
// DGES retiré (Phase 2+) ; DEC non ajouté ici (hors scope M1). ADMIN_ETABLISSEMENT conserve M2.
const NOTES_WRITE_ROLES = ['COMMISSION', 'CONTROLEUR', 'ADMIN_ETABLISSEMENT'];

router.post('/', protect, checkRole(NOTES_WRITE_ROLES), notesController.ajouterNote);
router.get('/inscription/:id', protect, notesController.getNotesByInscription);
router.put('/:id', protect, checkRole(NOTES_WRITE_ROLES), notesController.updateNote);

module.exports = router;
