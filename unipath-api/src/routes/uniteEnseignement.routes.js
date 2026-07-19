const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { checkRole } = require('../middleware/role.middleware');
const controller = require('../controllers/unite-enseignement.controller');

const roles = ['ADMIN_ETABLISSEMENT', 'ETABLISSEMENT'];

router.get('/meta/semestres', protect, checkRole(roles), controller.getSemestresMeta);
router.get('/', protect, checkRole(roles), controller.listerUnites);
router.post('/', protect, checkRole(roles), controller.creerUnite);
router.put('/:id', protect, checkRole(roles), controller.modifierUnite);
router.delete('/:id', protect, checkRole(roles), controller.supprimerUnite);

module.exports = router;
