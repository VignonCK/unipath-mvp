# Plan d'Implémentation : Suivi de Complétude des Dossiers

## Vue d'ensemble

Implémentation des fonctionnalités de suivi de complétude des dossiers et d'historique des actions selon l'architecture hybride PHP (logique métier) + Node.js (API) + React (UI). L'approche suit l'ordre de priorité défini : Backend PHP → Migration BDD → API Node.js → Frontend React → Tests.

## Tâches

- [x] 1. Créer la migration de base de données pour l'historique
  - Créer le fichier de migration SQL pour la table ActionHistory
  - Définir les index pour optimiser les performances
  - Tester la migration sur l'environnement de développement
  - _Exigences : 3.3, 8.4_

- [x] 2. Implémenter le module PHP Système_Completion
  - [x] 2.1 Créer la classe SystemeCompletion avec calcul de pourcentage
    - Implémenter la méthode calculerPourcentage() basée sur les 5 pièces justificatives
    - Implémenter la méthode obtenirPiecesManquantes() pour identifier les pièces manquantes
    - Implémenter la méthode verifierCompletude() pour validation binaire
    - _Exigences : 1.1, 1.2, 2.1_

  - [ ]* 2.2 Écrire les tests de propriété pour le calcul de complétude
    - **Propriété 1 : Calcul de Pourcentage de Complétude**
    - **Valide : Exigences 1.1, 1.2**

  - [ ]* 2.3 Écrire les tests de propriété pour les bornes du pourcentage
    - **Propriété 2 : Bornes du Pourcentage**
    - **Valide : Exigences 1.2**

  - [x] 2.4 Optimiser les requêtes de base de données
    - Éviter les requêtes N+1 pour les pièces justificatives
    - Implémenter la mise en cache pour les calculs fréquents
    - _Exigences : 5.1, 5.3, 5.5_

  - [ ]* 2.5 Écrire les tests unitaires pour les cas d'erreur
    - Tester les dossiers inexistants, données corrompues
    - Tester les timeouts et erreurs de base de données
    - _Exigences : 1.1, 1.2_

- [x] 3. Implémenter le module PHP Système_Historique
  - [x] 3.1 Créer la classe SystemeHistorique avec enregistrement des actions
    - Implémenter la méthode enregistrerAction() avec validation complète
    - Implémenter la méthode obtenirHistorique() avec filtrage
    - Implémenter la méthode verifierAcces() pour contrôle des rôles
    - _Exigences : 3.1, 3.2, 3.3, 4.1, 4.2_

  - [ ]* 3.2 Écrire les tests de propriété pour l'enregistrement des actions
    - **Propriété 5 : Enregistrement Complet des Actions**
    - **Valide : Exigences 3.1, 3.2, 3.3**

  - [ ]* 3.3 Écrire les tests de propriété pour le contrôle d'accès
    - **Propriété 6 : Contrôle d'Accès par Rôle**
    - **Valide : Exigences 4.1, 4.2, 4.3**

  - [x] 3.4 Implémenter la génération de rapports d'audit
    - Créer la méthode genererRapportAudit() avec filtres et statistiques
    - Implémenter l'export CSV pour l'interface commission
    - _Exigences : 8.1, 8.2, 8.3, 8.5_

  - [ ]* 3.5 Écrire les tests de propriété pour l'audit
    - **Propriété 7 : Audit des Tentatives Non Autorisées**
    - **Propriété 10 : Filtrage Correct de l'Historique**
    - **Propriété 11 : Statistiques Agrégées Correctes**
    - **Valide : Exigences 4.5, 8.1, 8.5**

- [ ] 4. Point de contrôle - Validation des modules PHP
  - S'assurer que tous les tests passent, demander à l'utilisateur si des questions se posent.

- [x] 5. Créer les endpoints Node.js pour l'API
  - [x] 5.1 Implémenter l'endpoint GET /api/completion/:candidatId
    - Créer le middleware d'authentification et validation des permissions
    - Intégrer l'appel au module PHP SystemeCompletion
    - Gérer les erreurs et retourner les données JSON formatées
    - _Exigences : 1.4, 6.3_

  - [x] 5.2 Implémenter l'endpoint GET /api/history/:dossierId
    - Créer le middleware d'autorisation pour rôles COMMISSION/DGES
    - Intégrer l'appel au module PHP SystemeHistorique
    - Implémenter la gestion des filtres de requête
    - _Exigences : 3.4, 4.3, 4.4_

  - [x] 5.3 Implémenter l'endpoint POST /api/history/action
    - Valider les données d'entrée (utilisateur, dossier, type d'action)
    - Intégrer l'appel au module PHP pour enregistrement
    - Gérer les erreurs d'autorisation et de validation
    - _Exigences : 3.1, 3.2_

  - [ ]* 5.4 Écrire les tests d'intégration pour les endpoints
    - Tester l'authentification et l'autorisation
    - Tester les performances (< 100ms complétude, < 200ms historique)
    - Tester la gestion d'erreurs et codes de retour
    - _Exigences : 5.1, 5.2_

- [ ] 6. Développer les composants React frontend
  - [ ] 6.1 Créer le composant ProgressBar pour l'affichage de complétude
    - Implémenter l'affichage du pourcentage avec barre de progression visuelle
    - Créer le sous-composant PiecesList pour les pièces manquantes
    - Intégrer les appels API vers /api/completion/:candidatId
    - _Exigences : 1.5, 2.2, 2.3_

  - [ ] 6.2 Créer le composant HistoryViewer pour l'historique des actions
    - Implémenter l'affichage chronologique des actions
    - Créer les filtres par période, utilisateur et type d'action
    - Intégrer le contrôle d'accès basé sur les rôles utilisateur
    - _Exigences : 3.5, 4.2, 8.1_

  - [ ] 6.3 Implémenter les notifications de complétude
    - Créer les notifications visuelles pour dossier complet (100%)
    - Implémenter le déclenchement automatique lors des transitions d'état
    - Ajouter le bouton de soumission officielle du dossier
    - _Exigences : 7.1, 7.2, 7.3, 7.4_

  - [ ]* 6.4 Écrire les tests de propriété pour les notifications
    - **Propriété 8 : Notification de Complétude**
    - **Propriété 9 : Enregistrement des Transitions d'État**
    - **Valide : Exigences 7.1, 7.3, 7.5**

  - [ ]* 6.5 Écrire les tests unitaires pour les composants React
    - Tester le rendu des composants avec différents états
    - Tester les interactions utilisateur et appels API
    - Tester la responsivité et l'accessibilité
    - _Exigences : 1.5, 2.2, 3.5_

- [ ] 7. Intégrer les composants dans les pages existantes
  - [ ] 7.1 Intégrer ProgressBar dans l'interface candidat
    - Ajouter le composant dans la page de dossier candidat
    - Connecter aux données de session utilisateur
    - Tester l'affichage et les interactions
    - _Exigences : 1.5, 6.4_

  - [ ] 7.2 Intégrer HistoryViewer dans l'interface commission
    - Ajouter le composant dans la page de gestion des dossiers
    - Implémenter les permissions d'accès par rôle
    - Tester l'export CSV et les filtres
    - _Exigences : 3.5, 4.2, 8.3_

- [ ] 8. Point de contrôle - Tests d'intégration complets
  - S'assurer que tous les tests passent, demander à l'utilisateur si des questions se posent.

- [ ] 9. Implémenter la gestion d'erreurs et la sécurité
  - [ ] 9.1 Ajouter la gestion d'erreurs robuste dans tous les modules PHP
    - Implémenter les try-catch avec logging approprié
    - Créer les codes d'erreur standardisés
    - Implémenter le retry avec backoff exponentiel pour la base de données
    - _Exigences : 4.5, 5.1, 5.2_

  - [ ] 9.2 Renforcer la sécurité des endpoints API
    - Valider tous les inputs utilisateur
    - Implémenter la limitation de taux (rate limiting)
    - Ajouter les headers de sécurité appropriés
    - _Exigences : 4.1, 4.4, 4.5_

  - [ ]* 9.3 Écrire les tests de sécurité
    - Tester les tentatives d'accès non autorisé
    - Tester la validation des inputs malveillants
    - Tester les limites de taux et timeouts
    - _Exigences : 4.1, 4.2, 4.5_

- [ ] 10. Optimisation des performances et finalisation
  - [ ] 10.1 Optimiser les requêtes de base de données
    - Analyser et optimiser les requêtes lentes
    - Implémenter la mise en cache Redis si nécessaire
    - Créer les index manquants pour les performances
    - _Exigences : 5.1, 5.2, 5.3_

  - [ ] 10.2 Valider les performances selon les critères
    - Mesurer les temps de réponse (< 100ms complétude, < 200ms historique)
    - Tester la charge simultanée de plusieurs utilisateurs
    - Optimiser si nécessaire pour respecter les SLA
    - _Exigences : 5.1, 5.2, 5.3_

  - [ ]* 10.3 Écrire les tests de performance
    - Tests de charge pour les endpoints critiques
    - Tests de stress pour la base de données
    - Validation des métriques de performance
    - _Exigences : 5.1, 5.2, 5.3_

- [ ] 11. Point de contrôle final - Validation complète
  - S'assurer que tous les tests passent, demander à l'utilisateur si des questions se posent.

## Notes

- Les tâches marquées avec `*` sont optionnelles et peuvent être ignorées pour un MVP plus rapide
- Chaque tâche référence les exigences spécifiques pour la traçabilité
- Les points de contrôle assurent une validation incrémentale
- Les tests de propriété valident les propriétés de correction universelles
- Les tests unitaires valident les exemples spécifiques et cas limites
- L'architecture PHP + Node.js + React doit être respectée strictement