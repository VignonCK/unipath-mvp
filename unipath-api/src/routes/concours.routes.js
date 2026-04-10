// src/routes/concours.routes.js
const express = require('express');
const router = express.Router();
const concoursController = require('../controllers/concours.controller');

router.get('/', concoursController.getAllConcours);
router.get('/:id', concoursController.getConcoursById);

module.exports = router;