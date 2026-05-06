# Implementation Plan: Configuration des Pièces du Dossier Candidat

## Overview

Ce plan d'implémentation détaille les étapes nécessaires pour développer la fonctionnalité de configuration des pièces du dossier candidat lors de la création d'un concours. L'implémentation suit une approche incrémentale en commençant par la couche de données, puis le backend, et enfin le frontend, avec des points de validation réguliers.

## Tasks

- [ ] 1. Préparer la base de données et les migrations
  - [ ] 1.1 Créer la migration Prisma pour étendre le modèle Concours
    - Ajouter les champs: `piecesRequises` (JSONB), `dateDebutDepot`, `dateFinDepot`, `dateDebutComposition`, `dateFinComposition`
    - Ajouter les index sur `dateDebutDepot` et `dateFinDepot` pour optimiser les requêtes de filtrage
    - _Requirements: 1.1, 1.4, 6.1, 6.2, 6.5, 7.1, 7.2, 7.6_
  
  - [ ] 1.2 Exécuter la migration et vérifier la structure de la base de données
    - Exécuter `npx prisma migrate dev` pour appliquer la migration
    - Vérifier que les nouveaux champs sont présents dans la table Concours
    - _Requirements: 1.4, 6.5, 7.6_

- [ ] 2. Implémenter les constantes et utilitaires backend
  - [ ] 2.1 Créer le fichier de constantes pour les pièces prédéfinies et formats
    - Créer `unipath-api/src/constants/pieces.constants.js`
    - Définir `PIECES_PREDEFINIES` avec les 5 pièces prédéfinies (acte de naissance, carte d'identité, photo, relevé de notes, quittance)
    - Définir `FORMATS_DISPONIBLES` avec les formats acceptés (PDF, JPEG, PNG, DOC, DOCX)
    - Définir `SERIES_VALIDES` avec les séries scolaires (A, B, C, D, E, F1, F2, F3, F4, G)
    - _Requirements: 1.1, 1.2, 2.1, 3.2, 3.3, 5.2_
  
  - [ ] 2.2 Créer les fonctions utilitaires de validation
    - Créer `unipath-api/src/utils/concours.validation.js`
    - Implémenter `validateDatesDepot(dateDebut, dateFin)` pour valider les dates de dépôt
    - Implémenter `validateDatesComposition(dateDebut, dateFin)` pour valider les dates de composition
    - Implémenter `validateDatesCoherence(dateFinDepot, dateDebutComposition)` pour valider la cohérence entre dépôt et composition
    - Implémenter `validateSeries(seriesAcceptees)` pour valider les séries scolaires
    - Implémenter `validatePiecesRequises(piecesRequises)` pour valider la configuration des pièces
    - _Requirements: 3.1, 3.4, 5.2, 6.3, 6.4, 7.3, 7.4, 7.5, 8.1, 8.2, 8.3_
  
  - [ ]* 2.3 Écrire les tests unitaires pour les fonctions de validation
    - Créer `unipath-api/src/utils/__tests__/concours.validation.test.js`
    - Tester tous les cas de validation des dates (valides, invalides, cohérence)
    - Tester la validation des séries (valides, invalides, vides)
    - Tester la validation des pièces (présence quittance, formats valides, pièces vides)
    - _Requirements: 6.3, 6.4, 7.3, 7.4, 7.5, 8.2, 8.3_

- [ ] 3. Checkpoint - Vérifier les utilitaires backend
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Implémenter les endpoints API backend
  - [ ] 4.1 Modifier le contrôleur de création de concours
    - Modifier `unipath-api/src/controllers/concours.controller.js` - fonction `createConcours`
    - Ajouter la validation de tous les champs obligatoires (libellé, établissement, dates, frais, séries)
    - Intégrer les fonctions de validation des dates et de cohérence
    - Valider la présence et la structure de `piecesRequises`
    - Vérifier la présence obligatoire de la quittance dans les pièces
    - Valider les formats de fichiers pour chaque pièce
    - Créer le concours avec tous les nouveaux champs
    - Retourner les erreurs de validation appropriées avec codes HTTP 400
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 8.1, 8.2, 8.3, 8.4, 8.5_
  
  - [ ] 4.2 Modifier le contrôleur de modification de concours
    - Modifier `unipath-api/src/controllers/concours.controller.js` - fonction `updateConcours`
    - Récupérer le concours existant avec ses inscriptions
    - Appliquer les mêmes validations que pour la création
    - Si des inscriptions existent et que les pièces sont modifiées, ajouter un champ `warning` dans la réponse
    - Mettre à jour le concours avec les nouvelles données
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_
  
  - [ ] 4.3 Modifier le contrôleur de récupération des concours
    - Modifier `unipath-api/src/controllers/concours.controller.js` - fonction `getAllConcours`
    - Si l'utilisateur est un candidat authentifié, récupérer sa série scolaire
    - Filtrer les concours pour ne retourner que ceux dont `seriesAcceptees` inclut la série du candidat (ou tous si `seriesAcceptees` est vide)
    - Inclure les champs `piecesRequises`, `dateDebutDepot`, `dateFinDepot`, `dateDebutComposition`, `dateFinComposition` dans la réponse
    - _Requirements: 5.5, 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [ ] 4.4 Modifier le contrôleur de récupération d'un concours spécifique
    - Modifier `unipath-api/src/controllers/concours.controller.js` - fonction `getConcoursById`
    - Inclure tous les détails de configuration des pièces dans la réponse
    - Inclure toutes les dates (dépôt et composition)
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [ ]* 4.5 Écrire les tests d'intégration pour les endpoints API
    - Créer `unipath-api/src/controllers/__tests__/concours.controller.test.js`
    - Tester la création d'un concours avec configuration valide
    - Tester les erreurs de validation (champs manquants, dates invalides, quittance absente)
    - Tester la modification d'un concours sans inscriptions
    - Tester la modification d'un concours avec inscriptions (vérifier le warning)
    - Tester le filtrage des concours par série candidat
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 9.5, 9.6, 5.5_

- [ ] 5. Checkpoint - Vérifier les endpoints API
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implémenter les composants React de configuration
  - [ ] 6.1 Créer le composant de sélection des pièces prédéfinies
    - Créer `unipath-front/src/components/PiecesPredefines.jsx`
    - Afficher la liste des pièces prédéfinies avec des checkboxes
    - Marquer la quittance comme obligatoire et non désélectionnable
    - Permettre la sélection/désélection des autres pièces
    - Pour chaque pièce sélectionnée, afficher un sélecteur de formats
    - Émettre les changements vers le composant parent via `onChange`
    - _Requirements: 1.1, 1.2, 1.3, 3.1, 3.2, 3.3, 3.5_
  
  - [ ] 6.2 Créer le composant modal d'ajout de pièce personnalisée
    - Créer `unipath-front/src/components/CustomPieceModal.jsx`
    - Afficher un formulaire avec champs: nom de la pièce, description (optionnel), formats acceptés
    - Valider que le nom n'est pas vide
    - Valider qu'au moins un format est sélectionné
    - Permettre la sélection multiple de formats via checkboxes
    - Émettre la nouvelle pièce vers le composant parent via `onSubmit`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.4_
  
  - [ ] 6.3 Créer le composant de liste des pièces personnalisées
    - Créer `unipath-front/src/components/PiecesPersonnalisees.jsx`
    - Afficher la liste des pièces personnalisées ajoutées
    - Pour chaque pièce, afficher: nom, formats acceptés, bouton de suppression
    - Permettre la suppression d'une pièce personnalisée
    - Émettre les changements vers le composant parent
    - _Requirements: 2.5, 2.6, 3.5_
  
  - [ ] 6.4 Créer le composant principal de configuration des pièces
    - Créer `unipath-front/src/components/PiecesConfiguration.jsx`
    - Intégrer `PiecesPredefines`, `PiecesPersonnalisees`, et le bouton d'ajout
    - Gérer l'état local des pièces sélectionnées (prédéfinies + personnalisées)
    - Afficher le bouton "+" ou "Ajouter une pièce" pour ouvrir le modal
    - Gérer l'ouverture/fermeture du modal `CustomPieceModal`
    - Consolider toutes les pièces et émettre vers le composant parent
    - _Requirements: 1.1, 1.3, 1.4, 2.1, 2.5, 2.6, 3.5_
  
  - [ ]* 6.5 Écrire les tests unitaires pour les composants de configuration
    - Créer les fichiers de test pour chaque composant
    - Tester l'affichage des pièces prédéfinies
    - Tester la sélection/désélection des pièces
    - Tester l'ajout d'une pièce personnalisée
    - Tester la suppression d'une pièce personnalisée
    - Tester la validation du formulaire de pièce personnalisée
    - _Requirements: 1.1, 1.3, 2.1, 2.2, 2.5, 2.6_

- [ ] 7. Implémenter le formulaire de création/modification de concours
  - [ ] 7.1 Modifier le composant GestionConcours pour intégrer la configuration des pièces
    - Modifier `unipath-front/src/pages/GestionConcours.jsx`
    - Ajouter les champs de dates: `dateDebutDepot`, `dateFinDepot`, `dateDebutComposition`, `dateFinComposition`
    - Ajouter le champ de sélection multiple pour `seriesAcceptees`
    - Intégrer le composant `PiecesConfiguration`
    - Initialiser l'état du formulaire avec tous les nouveaux champs
    - _Requirements: 1.1, 4.1, 4.2, 5.1, 5.2, 6.1, 6.2, 7.1, 7.2_
  
  - [ ] 7.2 Implémenter la validation côté client du formulaire
    - Dans `GestionConcours.jsx`, créer la fonction `validateForm`
    - Valider tous les champs obligatoires (libellé, établissement, dates, frais, séries)
    - Valider les dates de dépôt (fin > début)
    - Valider les dates de composition (fin > début)
    - Valider la cohérence (début composition > fin dépôt)
    - Valider qu'au moins une série est sélectionnée
    - Valider qu'au moins une pièce est configurée
    - Valider la présence de la quittance
    - Afficher les messages d'erreur appropriés pour chaque champ
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 5.2, 6.3, 6.4, 7.3, 7.4, 7.5, 8.1, 8.2, 8.3_
  
  - [ ] 7.3 Implémenter la soumission du formulaire de création
    - Dans `GestionConcours.jsx`, créer la fonction `handleSubmit` pour la création
    - Appeler `validateForm` avant la soumission
    - Si validation réussie, envoyer une requête POST à `/api/concours` avec toutes les données
    - Gérer les erreurs de validation retournées par le backend (afficher les messages)
    - En cas de succès, afficher un message de confirmation et rediriger vers la liste des concours
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_
  
  - [ ] 7.4 Implémenter la soumission du formulaire de modification
    - Dans `GestionConcours.jsx`, créer la fonction `handleUpdate` pour la modification
    - Appliquer les mêmes validations que pour la création
    - Envoyer une requête PUT à `/api/concours/:id` avec les données modifiées
    - Si un warning est retourné (inscriptions existantes), afficher un message d'avertissement à l'utilisateur
    - En cas de succès, afficher un message de confirmation et rediriger vers la liste
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_
  
  - [ ]* 7.5 Écrire les tests unitaires pour le formulaire GestionConcours
    - Créer `unipath-front/src/pages/__tests__/GestionConcours.test.jsx`
    - Tester l'affichage du formulaire de création
    - Tester la validation des champs obligatoires
    - Tester la validation des dates
    - Tester la soumission avec données valides
    - Tester la gestion des erreurs de validation backend
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 8.1, 8.2, 8.3, 8.4_

- [ ] 8. Checkpoint - Vérifier le formulaire de création/modification
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Implémenter l'affichage pour les candidats
  - [ ] 9.1 Modifier le composant PageConcours pour afficher les pièces requises
    - Modifier `unipath-front/src/pages/PageConcours.jsx`
    - Dans la liste des concours, afficher un indicateur du nombre de pièces requises
    - Lors du clic sur un concours, afficher les détails incluant la liste complète des pièces
    - Pour chaque pièce, afficher: nom, formats acceptés, description (si présente)
    - Mettre en évidence la quittance comme obligatoire
    - Afficher les dates de dépôt et de composition
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [ ] 9.2 Créer le composant d'affichage des pièces requises pour candidats
    - Créer `unipath-front/src/components/PiecesRequisesCandidats.jsx`
    - Afficher la liste des pièces de manière claire et lisible
    - Pour chaque pièce, afficher une icône représentant le type de document
    - Afficher les formats acceptés avec des badges visuels (ex: badge "PDF", badge "JPEG")
    - Afficher la description si présente
    - Utiliser un design responsive pour mobile
    - _Requirements: 10.1, 10.2, 10.3, 10.5_
  
  - [ ] 9.3 Implémenter le filtrage des concours par série candidat
    - Dans `PageConcours.jsx`, récupérer la série du candidat depuis son profil
    - Lors de l'appel à l'API `/api/concours`, le filtrage est automatique côté backend
    - Afficher un message si aucun concours n'est disponible pour la série du candidat
    - Permettre au candidat de voir tous les concours (option "Voir tous les concours")
    - _Requirements: 5.5_
  
  - [ ]* 9.4 Écrire les tests unitaires pour l'affichage candidat
    - Créer les fichiers de test pour les composants d'affichage
    - Tester l'affichage de la liste des pièces requises
    - Tester l'affichage des formats acceptés
    - Tester le filtrage par série
    - Tester l'affichage des dates de dépôt et composition
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 5.5_

- [ ] 10. Intégration et tests end-to-end
  - [ ] 10.1 Intégrer tous les composants et vérifier le flux complet DGES
    - Tester le flux complet: connexion DGES → création concours → configuration pièces → sauvegarde
    - Vérifier que toutes les validations fonctionnent correctement
    - Vérifier que les données sont correctement sauvegardées en base
    - Tester le flux de modification d'un concours existant
    - Vérifier l'affichage de l'avertissement lors de la modification avec inscriptions
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_
  
  - [ ] 10.2 Intégrer et vérifier le flux complet candidat
    - Tester le flux complet: connexion candidat → consultation concours → affichage pièces requises
    - Vérifier le filtrage automatique par série
    - Vérifier l'affichage correct des pièces et formats
    - Vérifier l'affichage des dates de dépôt et composition
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 5.5_
  
  - [ ]* 10.3 Écrire les tests d'intégration end-to-end
    - Créer les tests E2E avec Playwright ou Cypress (optionnel)
    - Tester le flux complet de création de concours
    - Tester le flux complet de modification de concours
    - Tester le flux complet de consultation candidat
    - Tester les cas d'erreur et la gestion des erreurs
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 9.5, 9.6, 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 11. Finalisation et documentation
  - [ ] 11.1 Ajouter la documentation technique
    - Documenter les nouveaux endpoints API dans un fichier README ou Swagger
    - Documenter la structure JSON de `piecesRequises`
    - Documenter les constantes et utilitaires créés
    - Ajouter des commentaires JSDoc dans le code backend
    - _Requirements: Toutes_
  
  - [ ] 11.2 Vérifier la sécurité et les performances
    - Vérifier que toutes les routes DGES sont protégées par authentification
    - Vérifier que les validations côté serveur sont robustes
    - Tester les performances avec un grand nombre de pièces configurées
    - Vérifier l'indexation des champs de dates pour les requêtes de filtrage
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
  
  - [ ] 11.3 Effectuer les tests de régression
    - Vérifier que les fonctionnalités existantes ne sont pas affectées
    - Tester la création de concours sans les nouveaux champs (rétrocompatibilité)
    - Vérifier que les inscriptions existantes fonctionnent toujours
    - Tester l'affichage des anciens concours sans configuration de pièces
    - _Requirements: Toutes_

- [ ] 12. Checkpoint final - Vérification complète
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Les tâches marquées avec `*` sont optionnelles et peuvent être sautées pour un MVP plus rapide
- Chaque tâche référence les exigences spécifiques pour assurer la traçabilité
- Les checkpoints permettent de valider le travail de manière incrémentale
- Les tests unitaires et d'intégration sont fortement recommandés pour garantir la qualité
- L'implémentation suit une approche bottom-up: données → backend → frontend → intégration
- La validation est implémentée à la fois côté client (UX) et côté serveur (sécurité)
- Le filtrage par série candidat est automatique côté backend pour simplifier le frontend
- La quittance est toujours obligatoire et ne peut pas être désélectionnée
- Les dates doivent respecter la logique métier: dépôt avant composition
