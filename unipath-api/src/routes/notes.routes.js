const express = require('express');
const router = express.Router();
const notesController = require('../controllers/notes.controller');
const { protect } = require('../middleware/auth.middleware');
const { checkRole } = require('../middleware/role.middleware');

const NOTES_WRITE_ROLES = ['DGES', 'COMMISSION', 'CONTROLEUR', 'ADMIN_ETABLISSEMENT'];

router.post('/', protect, checkRole(NOTES_WRITE_ROLES), notesController.ajouterNote);
router.get('/inscription/:id', protect, notesController.getNotesByInscription);
router.put('/:id', protect, checkRole(NOTES_WRITE_ROLES), notesController.updateNote);

module.exports = router;
