# Plan d'Implémentation - Commission à Double Verdict

## Vue d'ensemble

Ce document décompose l'implémentation du système de **commission à double verdict** en tâches concrètes et actionnables. Le système permet une double évaluation indépendante par 2 examinateurs, suivie d'une validation ou modification par un contrôleur.

**Architecture** : Node.js/Express + Prisma ORM + PostgreSQL (Supabase) + React (Vite)

**Modules existants réutilisés** :
- Système de notifications (table `Notification`)
- Service d'emails (`email.service.js`)
- Historique d'actions (`ActionHistory`)
- Middlewares d'authentification (`auth.middleware.js`)

## Tâches

### 1. Extension du Schéma Prisma et Migration

- [x] 1.1 Étendre le modèle `MembreCommission` avec le champ `sousRole`
  - Ajouter le champ `sousRole` de type `SousRoleCommission` (enum EXAMINATEUR, CONTROLEUR)
  - Créer l'enum `SousRoleCommission` avec les valeurs EXAMINATEUR et CONTROLEUR
  - Ajouter un index sur le champ `sousRole` pour optimiser les requêtes
  - _Exigences: 2.1, 2.2_

- [x] 1.2 Étendre le modèle `DossierInscription` avec les champs de double verdict
  - Ajouter les champs pour le verdict de l'examinateur 1 : `verdict1Par`, `verdict1`, `verdict1Motif`, `verdict1Date`, `verdict1ModifieCount`
  - Ajouter les champs pour le verdict de l'examinateur 2 : `verdict2Par`, `verdict2`, `verdict2Motif`, `verdict2Date`, `verdict2ModifieCount`
  - Ajouter les champs pour la décision du contrôleur : `decisionControleurPar`, `decisionControleur`, `decisionControleurMotif`, `decisionControleurDate`
  - Créer l'enum `Verdict` avec les valeurs VALIDE, REJETE, SOUS_RESERVE
  - Ajouter les index sur `verdict1Par`, `verdict2Par`, `decisionControleurPar`
  - _Exigences: 1.1, 1.3, 1.4, 1.5, 1.6_

- [ ] 1.3 Créer et appliquer la migration Prisma
  - Générer la migration avec `npx prisma migrate dev --name add_double_verdict_fields`
  - Vérifier que la migration préserve les données existantes
  - Appliquer la migration en local et tester
  - Générer le client Prisma avec `npx prisma generate`
  - _Exigences: 24.1, 24.2, 24.3_

- [ ] 1.4 Créer un script de seed pour les membres commission
  - Ajouter des examinateurs et contrôleurs de test dans `prisma/seed.js`
  - Assigner les sous-rôles EXAMINATEUR et CONTROLEUR
  - Tester le script avec `npx prisma db seed`
  - _Exigences: 2.2_

### 2. Checkpoint - Vérifier la migration et le schéma
  - Ensure all tests pass, ask the user if questions arise.

### 3. Backend - Middlewares de Sécurité

- [ ] 3.1 Créer le middleware `verifierSousRole` dans `auth.middleware.js`
  - Implémenter la fonction `verifierSousRole(sousRolesAutorises)` qui vérifie le sous-rôle du membre commission
  - Retourner une erreur 403 si le sous-rôle ne correspond pas
  - Inclure un message d'erreur explicite selon le sous-rôle requis
  - _Exigences: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

- [ ] 3.2 Créer les fonctions de validation dans `utils/validation.js`
  - Implémenter `validateVerdict(verdict)` pour valider les valeurs de l'enum Verdict
  - Implémenter `validateMotif(verdict, motif)` pour valider que le motif est obligatoire et >= 10 caractères pour REJETE et SOUS_RESERVE
  - Implémenter `sanitizeMotif(motif)` pour échapper les caractères HTML et prévenir XSS
  - Implémenter `validateUUID(id)` pour valider les identifiants UUID
  - _Exigences: 8.1, 8.2, 8.3, 8.4, 8.5, 22.1, 22.2, 22.3, 22.4_

### 4. Backend - Contrôleur Examinateur

- [ ] 4.1 Créer `examinateur.controller.js` avec la fonction `getDossiersAEvaluer`
  - Implémenter la logique pour récupérer uniquement les dossiers où l'examinateur n'a pas encore rendu son verdict
  - Exclure les dossiers où `verdict1Par` ou `verdict2Par` correspond à l'examinateur connecté
  - Inclure les informations candidat, concours, date de création
  - Indiquer si l'autre examinateur a déjà rendu son verdict (booléen, sans révéler le verdict)
  - Supporter les filtres par `concoursId`, pagination avec `limite` et `offset`
  - _Exigences: 7.1, 7.2, 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ] 4.2 Créer la fonction `getDetailDossier` dans `examinateur.controller.js`
  - Récupérer le dossier complet avec toutes les pièces (base + spécifiques)
  - Inclure les informations candidat et concours
  - Masquer les verdicts des autres examinateurs
  - Indiquer si l'examinateur connecté a déjà rendu son verdict et le nombre de modifications possibles
  - Retourner une erreur 403 si l'examinateur a déjà rendu son verdict et tente d'accéder au formulaire
  - _Exigences: 7.3, 7.4, 7.5, 16.1, 16.2, 16.3, 16.4_

- [ ] 4.3 Créer la fonction `rendreVerdict` dans `examinateur.controller.js`
  - Valider le verdict avec `validateVerdict()` et le motif avec `validateMotif()`
  - Vérifier que l'examinateur n'a pas déjà rendu son verdict (erreur 403 si déjà rendu)
  - Vérifier qu'il reste une place disponible (erreur 403 si les 2 verdicts sont rendus)
  - Assigner automatiquement au premier champ disponible (verdict1 ou verdict2)
  - Initialiser `verdict1ModifieCount` ou `verdict2ModifieCount` à 0
  - Enregistrer l'action dans `ActionHistory` avec `typeAction=VERDICT_EXAMINATEUR_RENDU`
  - Créer une notification pour le contrôleur avec type `NOUVEAU_DOSSIER`
  - Si les 2 verdicts sont rendus et divergents, créer une alerte HIGH pour le contrôleur
  - Retirer automatiquement le dossier de la liste de l'examinateur (géré par la requête)
  - _Exigences: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 6.1, 6.2, 6.3, 7.1, 10.1, 12.2, 12.3_

- [ ] 4.4 Créer la fonction `modifierVerdict` dans `examinateur.controller.js`
  - Valider le verdict et le motif
  - Vérifier que l'examinateur a bien rendu un verdict (erreur 403 sinon)
  - Vérifier que le compteur de modifications est < 1 (erreur 403 si >= 1)
  - Mettre à jour le verdict et incrémenter le compteur de modifications
  - Enregistrer l'action dans `ActionHistory` avec `typeAction=VERDICT_EXAMINATEUR_MODIFIE`
  - _Exigences: 3.7_

### 5. Backend - Contrôleur Contrôleur (Commission)

- [ ] 5.1 Créer `controleur.controller.js` avec la fonction `getTableauDeBord`
  - Calculer le nombre de dossiers avec 1 verdict, 2 verdicts, décision finale
  - Calculer le nombre de dossiers avec verdicts divergents
  - Calculer le taux de divergence : (divergents / dossiers avec 2 verdicts) * 100
  - Calculer la répartition des verdicts (VALIDE, REJETE, SOUS_RESERVE) pour verdict1 et verdict2
  - _Exigences: 17.1, 17.2, 17.3, 17.4, 6.5_

- [ ] 5.2 Créer la fonction `getDossiers` dans `controleur.controller.js`
  - Récupérer les dossiers avec au moins 1 verdict rendu
  - Supporter les filtres : `1_verdict`, `2_verdicts`, `divergents`, `sans_decision`
  - Inclure les informations candidat, concours, verdict1 et verdict2 complets (avec nom des examinateurs)
  - Indiquer le statut des verdicts (1/2 ou 2/2) et si les verdicts sont divergents
  - Marquer les dossiers divergents avec priorité HIGH
  - Supporter la pagination avec `limite` et `offset`
  - _Exigences: 4.1, 4.2, 4.3, 4.5, 6.2_

- [ ] 5.3 Créer la fonction `getDossiersDivergents` dans `controleur.controller.js`
  - Récupérer uniquement les dossiers où `verdict1 !== verdict2` et les 2 verdicts sont rendus
  - Inclure les mêmes informations que `getDossiers`
  - _Exigences: 6.2_

- [ ] 5.4 Créer la fonction `getDetailDossier` dans `controleur.controller.js`
  - Récupérer le dossier complet avec toutes les pièces
  - Inclure les informations candidat et concours
  - Inclure verdict1 et verdict2 complets (verdict, motif, date, nom examinateur)
  - Inclure l'historique des actions lié aux verdicts
  - Afficher un indicateur si les verdicts sont divergents
  - _Exigences: 4.4, 18.1, 18.2, 18.3_

- [ ] 5.5 Créer la fonction `rendreDecision` dans `controleur.controller.js`
  - Valider la décision avec `validateVerdict()` et le motif avec `validateMotif()`
  - Accepter les décisions même si un seul verdict est rendu (intervention précoce)
  - Mettre à jour les champs `decisionControleurPar`, `decisionControleur`, `decisionControleurMotif`, `decisionControleurDate`
  - Mettre à jour le champ `statut` de `DossierInscription` selon la décision (VALIDE, REJETE, SOUS_RESERVE)
  - Copier le motif vers `commentaireRejet` ou `commentaireSousReserve` pour compatibilité
  - Enregistrer l'action dans `ActionHistory` avec `typeAction=DECISION_CONTROLEUR_RENDUE`
  - Créer une notification pour le candidat avec type VALIDATION, REJET ou ALERTE selon la décision
  - Envoyer un email au candidat via `email.service.js` (envoyerEmailValidation, envoyerEmailRejet, envoyerEmailSousReserve)
  - Gérer les erreurs d'envoi d'email sans bloquer la décision (logging uniquement)
  - _Exigences: 5.1, 5.2, 5.3, 12.4, 13.1, 13.2, 13.3, 13.4, 13.5, 14.1, 14.2, 14.3, 14.4, 14.5, 10.2_

- [ ] 5.6 Créer la fonction `modifierDecision` dans `controleur.controller.js`
  - Valider la décision et le motif
  - Permettre les modifications multiples (pas de limite)
  - Mettre à jour les champs de décision et le statut
  - Enregistrer l'action dans `ActionHistory` avec `typeAction=DECISION_CONTROLEUR_MODIFIEE`
  - Créer des notifications pour les 2 examinateurs (si leurs verdicts sont rendus) avec type ALERTE
  - Envoyer des emails aux examinateurs si leurs préférences l'autorisent
  - _Exigences: 5.4, 5.5, 5.6, 10.3, 11.1, 11.2, 11.3, 11.4, 11.5_

### 6. Checkpoint - Vérifier les contrôleurs backend
  - Ensure all tests pass, ask the user if questions arise.

### 7. Backend - Routes API

- [ ] 7.1 Créer `examinateur.routes.js` avec les routes examinateur
  - Route GET `/api/examinateur/dossiers-a-evaluer` → `getDossiersAEvaluer`
  - Route GET `/api/examinateur/dossiers/:dossierInscriptionId` → `getDetailDossier`
  - Route POST `/api/examinateur/dossiers/:dossierInscriptionId/verdict` → `rendreVerdict`
  - Route PUT `/api/examinateur/dossiers/:dossierInscriptionId/verdict` → `modifierVerdict`
  - Appliquer les middlewares `protect` et `verifierSousRole(['EXAMINATEUR'])`
  - _Exigences: 9.2, 15.1, 16.1_

- [ ] 7.2 Créer `controleur.routes.js` (ou étendre l'existant) avec les routes contrôleur
  - Route GET `/api/controleur/tableau-de-bord` → `getTableauDeBord`
  - Route GET `/api/controleur/dossiers` → `getDossiers`
  - Route GET `/api/controleur/dossiers/divergents` → `getDossiersDivergents`
  - Route GET `/api/controleur/dossiers/:dossierInscriptionId` → `getDetailDossier`
  - Route POST `/api/controleur/dossiers/:dossierInscriptionId/decision` → `rendreDecision`
  - Route PUT `/api/controleur/dossiers/:dossierInscriptionId/decision` → `modifierDecision`
  - Appliquer les middlewares `protect` et `verifierSousRole(['CONTROLEUR'])`
  - _Exigences: 9.3, 9.4, 17.1, 18.1_

- [ ] 7.3 Enregistrer les routes dans `server.js`
  - Importer et monter `/api/examinateur` avec `examinateur.routes.js`
  - Importer et monter `/api/controleur` avec `controleur.routes.js` (si nouveau fichier)
  - _Exigences: 9.2, 9.3_

### 8. Backend - Job Planifié pour Dossiers Sans Verdict

- [ ] 8.1 Créer `jobs/dossiers-sans-verdict.job.js` avec un cron job quotidien
  - Configurer un cron job qui s'exécute tous les jours à 8h00
  - Détecter les dossiers sans aucun verdict depuis plus de 2 jours
  - Créer une notification pour le contrôleur avec type ALERTE et priorité HIGH
  - Créer des notifications pour tous les examinateurs les invitant à évaluer le dossier
  - _Exigences: 19.1, 19.2, 19.3, 19.4_

- [ ] 8.2 Créer l'endpoint GET `/api/controleur/dossiers-sans-verdict`
  - Récupérer les dossiers sans verdict depuis plus de 2 jours
  - Inclure le nombre de jours écoulés depuis la création
  - _Exigences: 19.5_

- [ ] 8.3 Intégrer le job dans `server.js`
  - Importer et démarrer le cron job au démarrage du serveur
  - Arrêter le cron job lors de l'arrêt du serveur (graceful shutdown)
  - _Exigences: 19.1_

### 9. Backend - Historique et Traçabilité

- [ ] 9.1 Créer l'endpoint GET `/api/dossiers-inscription/:id/historique-verdicts`
  - Récupérer uniquement les actions liées aux verdicts et décisions (typeAction contenant VERDICT ou DECISION)
  - Ordonner par timestamp décroissant
  - Inclure les informations complètes de l'utilisateur (nom, prénom, sousRole)
  - _Exigences: 10.4, 10.5_

- [ ] 9.2 Ajouter l'enregistrement des tentatives d'accès non autorisé
  - Dans les middlewares de sécurité, enregistrer les tentatives d'accès refusées dans `ActionHistory` avec `typeAction=ACCES_REFUSE`
  - Inclure l'IP et le User Agent
  - _Exigences: 22.5_

### 10. Checkpoint - Vérifier le backend complet
  - Ensure all tests pass, ask the user if questions arise.

### 11. Frontend - Interface Examinateur

- [ ] 11.1 Créer la page `ListeDossiersExaminateur.jsx`
  - Afficher la liste des dossiers à évaluer (appel à GET `/api/examinateur/dossiers-a-evaluer`)
  - Afficher pour chaque dossier : nom candidat, concours, date de création, indicateur si l'autre examinateur a rendu son verdict
  - Implémenter les filtres par concours et la pagination
  - Ajouter un bouton "Évaluer" qui redirige vers le détail du dossier
  - _Exigences: 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ] 11.2 Créer la page `DetailDossierExaminateur.jsx`
  - Afficher le détail complet du dossier (appel à GET `/api/examinateur/dossiers/:id`)
  - Afficher toutes les pièces du dossier avec prévisualisation
  - Afficher les informations candidat et concours
  - Afficher un formulaire de verdict avec radio buttons (VALIDE, REJETE, SOUS_RESERVE) et champ texte motif
  - Valider côté client que le motif est obligatoire pour REJETE et SOUS_RESERVE
  - Afficher le verdict déjà rendu si l'examinateur a déjà évalué (avec possibilité de modification si < 1 modification)
  - Soumettre le verdict via POST `/api/examinateur/dossiers/:id/verdict`
  - Afficher un message de succès et rediriger vers la liste après soumission
  - _Exigences: 16.1, 16.2, 16.3, 16.4, 16.5_

### 12. Frontend - Interface Contrôleur

- [ ] 12.1 Créer la page `TableauDeBordControleur.jsx`
  - Afficher les indicateurs clés (appel à GET `/api/controleur/tableau-de-bord`)
  - Afficher sous forme de cartes : nombre de dossiers avec 1 verdict, 2 verdicts, verdicts divergents, décision finale, taux de divergence
  - Afficher des graphiques (barres ou camemberts) pour la répartition des verdicts
  - _Exigences: 17.1, 17.2, 17.3, 17.4, 17.5_

- [ ] 12.2 Créer la page `ListeDossiersControleur.jsx`
  - Afficher la liste des dossiers avec au moins 1 verdict (appel à GET `/api/controleur/dossiers`)
  - Afficher pour chaque dossier : nom candidat, concours, statut des verdicts (1/2 ou 2/2), verdicts rendus, badge "⚠️ Verdicts divergents" si applicable
  - Implémenter les filtres : 1 verdict, 2 verdicts, divergents, sans décision
  - Implémenter la pagination
  - Ajouter un bouton "Examiner" qui redirige vers le détail du dossier
  - _Exigences: 4.1, 4.2, 4.3, 4.5, 6.2_

- [ ] 12.3 Créer la page `DetailDossierControleur.jsx`
  - Afficher le détail complet du dossier (appel à GET `/api/controleur/dossiers/:id`)
  - Afficher toutes les pièces du dossier avec prévisualisation
  - Afficher les informations candidat et concours
  - Afficher les 2 verdicts côte à côte avec code couleur (vert=VALIDE, rouge=REJETE, orange=SOUS_RESERVE)
  - Afficher un badge "⚠️ Verdicts divergents" en haut de page si applicable
  - Afficher un formulaire de décision avec radio buttons et champ texte motif
  - Valider côté client que le motif est obligatoire pour REJETE et SOUS_RESERVE
  - Afficher la décision actuelle si déjà rendue (avec possibilité de modification)
  - Soumettre la décision via POST `/api/controleur/dossiers/:id/decision`
  - Afficher un message de succès après soumission
  - _Exigences: 18.1, 18.2, 18.3, 18.4, 18.5_

- [ ] 12.4 Créer la page `DossiersSansVerdictControleur.jsx`
  - Afficher la liste des dossiers sans verdict depuis plus de 2 jours (appel à GET `/api/controleur/dossiers-sans-verdict`)
  - Afficher le nombre de jours écoulés pour chaque dossier
  - _Exigences: 19.5_

### 13. Frontend - Intégration et Navigation

- [ ] 13.1 Ajouter les routes dans `App.jsx`
  - Route `/examinateur/dossiers` → `ListeDossiersExaminateur`
  - Route `/examinateur/dossiers/:id` → `DetailDossierExaminateur`
  - Route `/controleur/tableau-de-bord` → `TableauDeBordControleur`
  - Route `/controleur/dossiers` → `ListeDossiersControleur`
  - Route `/controleur/dossiers/:id` → `DetailDossierControleur`
  - Route `/controleur/dossiers-sans-verdict` → `DossiersSansVerdictControleur`
  - Protéger les routes avec les rôles appropriés

- [ ] 13.2 Ajouter les liens de navigation dans le menu principal
  - Ajouter un lien "Mes dossiers à évaluer" pour les examinateurs
  - Ajouter un lien "Tableau de bord" pour les contrôleurs
  - Ajouter un lien "Dossiers à examiner" pour les contrôleurs
  - Ajouter un lien "Dossiers sans verdict" pour les contrôleurs

### 14. Checkpoint - Vérifier l'intégration frontend/backend
  - Ensure all tests pass, ask the user if questions arise.

### 15. Tests et Validation

- [ ]* 15.1 Créer les tests unitaires pour `examinateur.controller.js`
  - Tester `getDossiersAEvaluer` avec différents scénarios (aucun verdict, 1 verdict, 2 verdicts)
  - Tester `rendreVerdict` avec validation des motifs obligatoires
  - Tester `modifierVerdict` avec limite de 1 modification
  - Tester les erreurs 403 pour accès non autorisé

- [ ]* 15.2 Créer les tests unitaires pour `controleur.controller.js`
  - Tester `getTableauDeBord` avec calcul des indicateurs
  - Tester `getDossiers` avec différents filtres
  - Tester `rendreDecision` avec mise à jour du statut et envoi d'email
  - Tester `modifierDecision` avec notifications aux examinateurs

- [ ]* 15.3 Créer les tests d'intégration end-to-end
  - Tester le flux complet : candidat soumet dossier → examinateur 1 rend verdict → examinateur 2 rend verdict → contrôleur prend décision → candidat notifié
  - Tester le flux avec intervention précoce du contrôleur (décision après 1 seul verdict)
  - Tester le flux avec verdicts divergents et alerte HIGH

- [ ]* 15.4 Créer les tests de non-régression
  - Vérifier que les endpoints existants de `commission.controller.js` continuent de fonctionner
  - Vérifier que le système de notifications existant continue de fonctionner
  - Vérifier que les emails existants continuent d'être envoyés
  - _Exigences: 20.1, 20.2, 20.3, 20.4, 20.5_

### 16. Documentation et Déploiement

- [ ] 16.1 Créer la documentation du workflow avec diagrammes
  - Créer un diagramme de séquence pour le flux standard (2 verdicts → décision)
  - Créer un diagramme de séquence pour l'intervention précoce (1 verdict → décision)
  - Documenter tous les nouveaux endpoints API avec exemples de requêtes/réponses
  - Créer une matrice de permissions (examinateur vs contrôleur)
  - Inclure des exemples de code pour les cas d'usage principaux
  - _Exigences: 21.1, 21.2, 21.3, 21.4, 21.5_

- [ ] 16.2 Créer le script de rollback de migration
  - Créer une migration de rollback qui supprime les nouveaux champs
  - Préserver les données existantes dans les anciens champs
  - Tester le rollback en local
  - _Exigences: 24.2, 24.3_

- [ ] 16.3 Créer le script de vérification de l'intégrité des données
  - Vérifier que tous les verdicts ont un motif si REJETE ou SOUS_RESERVE
  - Vérifier que les compteurs de modifications sont cohérents
  - Vérifier que les index sont créés correctement
  - _Exigences: 24.5_

- [ ] 16.4 Déployer en staging et tester
  - Créer une sauvegarde complète de la base de données
  - Appliquer la migration en staging
  - Tester tous les flux avec des données réelles
  - Vérifier les performances avec un grand nombre de dossiers
  - _Exigences: 23.3, 23.4, 24.4_

- [ ] 16.5 Déployer en production
  - Créer une sauvegarde complète de la base de données
  - Appliquer la migration en production
  - Monitorer les logs et les performances
  - Vérifier que les notifications et emails sont envoyés correctement

### 17. Checkpoint final - Vérifier le déploiement complet
  - Ensure all tests pass, ask the user if questions arise.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3", "1.4"] },
    { "id": 2, "tasks": ["3.1", "3.2"] },
    { "id": 3, "tasks": ["4.1", "4.2"] },
    { "id": 4, "tasks": ["4.3", "4.4", "5.1", "5.2", "5.3", "5.4"] },
    { "id": 5, "tasks": ["5.5", "5.6"] },
    { "id": 6, "tasks": ["7.1", "7.2", "8.1", "8.2", "9.1", "9.2"] },
    { "id": 7, "tasks": ["7.3", "8.3"] },
    { "id": 8, "tasks": ["11.1", "12.1", "12.2"] },
    { "id": 9, "tasks": ["11.2", "12.3", "12.4"] },
    { "id": 10, "tasks": ["13.1", "13.2"] },
    { "id": 11, "tasks": ["15.1", "15.2", "15.3", "15.4"] },
    { "id": 12, "tasks": ["16.1", "16.2", "16.3"] },
    { "id": 13, "tasks": ["16.4"] },
    { "id": 14, "tasks": ["16.5"] }
  ]
}
```

## Notes

- Les tâches marquées avec `*` sont optionnelles et peuvent être sautées pour un MVP rapide
- Chaque tâche référence les exigences spécifiques du document requirements.md
- Les checkpoints permettent de valider l'avancement à des étapes clés
- Le système réutilise au maximum les modules existants (notifications, emails, historique)
- La migration Prisma doit être testée en local avant le déploiement en staging
- Les tests de non-régression garantissent la compatibilité avec les modules existants
- Le déploiement doit être progressif : local → staging → production
