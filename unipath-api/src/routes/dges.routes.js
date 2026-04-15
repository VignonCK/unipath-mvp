// src/routes/dges.routes.js

const express = require('express');
const router = express.Router(); // router = mini-serveur qui gère les URLs de ce fichier

const { protect } = require('../middleware/auth.middleware'); 
// "protect" = middleware qui vérifie que l'utilisateur est connecté (a un token JWT)
// Sans ça, n'importe qui pourrait accéder aux stats DGES sans se connecter

const dgesController = require('../controllers/dges.controller');
// On importe le controller qu'on va créer à l'étape 3.2
// C'est lui qui contient la vraie logique (lire la base de données)

// Route 1 : GET /api/dges/statistiques
// → Quand le frontend appelle cette URL, on passe par "protect" d'abord (vérif token)
// → Puis on exécute la fonction getStatistiques du controller
router.get('/statistiques', protect, dgesController.getStatistiques);

// Route 2 : GET /api/dges/statistiques/:concoursId
// → ":concoursId" est une variable dans l'URL
// → Ex: /api/dges/statistiques/abc-123 → concoursId = "abc-123"
router.get('/statistiques/:concoursId', protect, dgesController.getStatistiquesConcours);

module.exports = router; 
// On exporte le router pour que app.js puisse l'utiliser