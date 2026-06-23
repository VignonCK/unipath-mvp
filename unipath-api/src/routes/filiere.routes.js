const express = require('express');
const router = express.Router();
const filiereController = require('../controllers/filiere.controller');

router.get('/', filiereController.getAllFilieres);

module.exports = router;

