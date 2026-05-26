const express = require('express');
const router = express.Router();
const notesController = require('../controllers/notes.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/', protect, notesController.ajouterNote);
router.get('/inscription/:id', protect, notesController.getNotesByInscription);
router.put('/:id', protect, notesController.updateNote);

module.exports = router;

