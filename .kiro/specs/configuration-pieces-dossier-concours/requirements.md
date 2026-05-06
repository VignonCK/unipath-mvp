# Requirements Document

## Introduction

Ce document définit les exigences pour la fonctionnalité de configuration des pièces du dossier candidat lors de la création d'un concours par un membre de la DGES. Cette fonctionnalité permet aux administrateurs DGES de personnaliser les documents requis pour chaque concours, d'ajouter des pièces supplémentaires avec leurs formats acceptés, de définir les séries acceptées pour le tri des candidats, et de rendre obligatoires tous les champs de création de concours incluant les dates importantes (dépôt de dossier et composition).

## Glossary

- **DGES_Admin**: Administrateur de la Direction Générale de l'Enseignement Supérieur qui crée et configure les concours
- **Concours**: Concours d'entrée à l'université organisé par un établissement
- **Piece_Dossier**: Document requis dans le dossier de candidature (ex: acte de naissance, carte d'identité, quittance, etc.)
- **Quittance**: Reçu de paiement des frais de participation au concours, soumis au format PDF
- **Serie_Scolaire**: Série du parcours scolaire du candidat (A, B, C, D, E, F1, F2, F3, F4, G) utilisée pour le tri et la sélection
- **Format_Fichier**: Type de fichier accepté pour une pièce (ex: PDF, JPEG, PNG)
- **Date_Depot**: Période pendant laquelle les candidats peuvent soumettre leur dossier (date de début et date de fin)
- **Date_Composition**: Période pendant laquelle se déroulent les épreuves du concours (date de début et date de fin)
- **Configuration_Concours**: Ensemble des paramètres définis lors de la création d'un concours

## Requirements

### Requirement 1: Configuration des pièces du dossier candidat

**User Story:** En tant qu'administrateur DGES, je veux configurer les pièces requises dans le dossier candidat lors de la création d'un concours, afin que chaque concours puisse avoir des exigences documentaires spécifiques.

#### Acceptance Criteria

1. WHEN THE DGES_Admin crée un nouveau Concours, THE Configuration_Concours SHALL afficher une liste de Piece_Dossier prédéfinies sélectionnables
2. THE Configuration_Concours SHALL inclure la Quittance comme Piece_Dossier obligatoire avec le format PDF
3. THE DGES_Admin SHALL pouvoir sélectionner ou désélectionner chaque Piece_Dossier prédéfinie pour le Concours
4. THE Configuration_Concours SHALL sauvegarder la liste des Piece_Dossier sélectionnées pour le Concours

### Requirement 2: Ajout de pièces supplémentaires personnalisées

**User Story:** En tant qu'administrateur DGES, je veux ajouter des pièces supplémentaires non prédéfinies au dossier candidat, afin de pouvoir demander des documents spécifiques à certains concours.

#### Acceptance Criteria

1. THE Configuration_Concours SHALL afficher un bouton "+" ou "Autres" pour ajouter des Piece_Dossier supplémentaires
2. WHEN THE DGES_Admin clique sur le bouton d'ajout, THE Configuration_Concours SHALL afficher un formulaire de création de Piece_Dossier
3. THE formulaire de création SHALL demander le nom de la Piece_Dossier et les Format_Fichier acceptés
4. THE DGES_Admin SHALL pouvoir spécifier un ou plusieurs Format_Fichier acceptés pour chaque Piece_Dossier ajoutée
5. WHEN THE DGES_Admin valide l'ajout, THE Configuration_Concours SHALL ajouter la nouvelle Piece_Dossier à la liste des pièces requises pour le Concours
6. THE DGES_Admin SHALL pouvoir supprimer une Piece_Dossier personnalisée ajoutée avant la sauvegarde du Concours

### Requirement 3: Spécification des formats de fichiers acceptés

**User Story:** En tant qu'administrateur DGES, je veux spécifier les formats de fichiers acceptés pour chaque pièce du dossier, afin de garantir que les candidats soumettent des documents dans les formats appropriés.

#### Acceptance Criteria

1. FOR ALL Piece_Dossier dans la Configuration_Concours, THE DGES_Admin SHALL pouvoir définir les Format_Fichier acceptés
2. THE Configuration_Concours SHALL proposer une liste de Format_Fichier standards (PDF, JPEG, PNG, DOC, DOCX)
3. THE Quittance SHALL accepter uniquement le format PDF
4. WHEN THE DGES_Admin sélectionne les Format_Fichier, THE Configuration_Concours SHALL sauvegarder cette information pour chaque Piece_Dossier
5. THE Configuration_Concours SHALL afficher les Format_Fichier acceptés à côté de chaque Piece_Dossier dans l'interface

### Requirement 4: Champs obligatoires de création de concours

**User Story:** En tant qu'administrateur DGES, je veux que tous les champs de création de concours soient obligatoires, afin de garantir que chaque concours est complètement configuré avant sa publication.

#### Acceptance Criteria

1. THE Configuration_Concours SHALL marquer tous les champs de création comme obligatoires
2. THE Configuration_Concours SHALL inclure comme champs obligatoires: libellé, établissement, dates de dépôt, dates de composition, description, frais de participation, et séries acceptées
3. WHEN THE DGES_Admin tente de sauvegarder un Concours avec des champs manquants, THE Configuration_Concours SHALL afficher un message d'erreur indiquant les champs manquants
4. THE Configuration_Concours SHALL empêcher la création du Concours tant que tous les champs obligatoires ne sont pas remplis

### Requirement 5: Configuration des séries scolaires acceptées

**User Story:** En tant qu'administrateur DGES, je veux définir les séries scolaires acceptées pour un concours, afin que le système puisse trier et filtrer les candidats en fonction de leur parcours scolaire.

#### Acceptance Criteria

1. THE Configuration_Concours SHALL afficher un champ "Séries demandées" lors de la création du Concours
2. THE DGES_Admin SHALL pouvoir sélectionner une ou plusieurs Serie_Scolaire parmi les options disponibles (A, B, C, D, E, F1, F2, F3, F4, G)
3. THE Configuration_Concours SHALL sauvegarder les Serie_Scolaire sélectionnées pour le Concours
4. WHEN aucune Serie_Scolaire n'est sélectionnée, THE Configuration_Concours SHALL accepter toutes les séries par défaut
5. THE système de tri des candidats SHALL utiliser la Serie_Scolaire du candidat pour filtrer les Concours affichés

### Requirement 6: Configuration des dates de dépôt de dossier

**User Story:** En tant qu'administrateur DGES, je veux définir les dates de début et de fin de dépôt de dossier, afin de contrôler la période pendant laquelle les candidats peuvent soumettre leur candidature.

#### Acceptance Criteria

1. THE Configuration_Concours SHALL afficher deux champs obligatoires: "Date de début de dépôt" et "Date de fin de dépôt"
2. THE DGES_Admin SHALL renseigner obligatoirement la date de début de dépôt et la date de fin de dépôt
3. WHEN THE DGES_Admin saisit les dates, THE Configuration_Concours SHALL valider que la date de fin de dépôt est postérieure à la date de début de dépôt
4. IF la date de fin de dépôt est antérieure ou égale à la date de début de dépôt, THEN THE Configuration_Concours SHALL afficher un message d'erreur et empêcher la sauvegarde
5. THE Configuration_Concours SHALL sauvegarder les Date_Depot pour le Concours

### Requirement 7: Configuration des dates de composition

**User Story:** En tant qu'administrateur DGES, je veux définir les dates de début et de fin de composition, afin de planifier la période des épreuves du concours.

#### Acceptance Criteria

1. THE Configuration_Concours SHALL afficher deux champs obligatoires: "Date de début de composition" et "Date de fin de composition"
2. THE DGES_Admin SHALL renseigner obligatoirement la date de début de composition et la date de fin de composition
3. WHEN THE DGES_Admin saisit les dates, THE Configuration_Concours SHALL valider que la date de fin de composition est postérieure à la date de début de composition
4. THE Configuration_Concours SHALL valider que la date de début de composition est postérieure à la date de fin de dépôt de dossier
5. IF les dates de composition ne respectent pas ces contraintes, THEN THE Configuration_Concours SHALL afficher un message d'erreur et empêcher la sauvegarde
6. THE Configuration_Concours SHALL sauvegarder les Date_Composition pour le Concours

### Requirement 8: Validation et sauvegarde de la configuration

**User Story:** En tant qu'administrateur DGES, je veux que le système valide toute la configuration avant la création du concours, afin de garantir la cohérence et la complétude des informations.

#### Acceptance Criteria

1. WHEN THE DGES_Admin clique sur le bouton de création du Concours, THE Configuration_Concours SHALL valider tous les champs obligatoires
2. THE Configuration_Concours SHALL valider que au moins une Piece_Dossier est sélectionnée (incluant la Quittance obligatoire)
3. THE Configuration_Concours SHALL valider la cohérence des dates (dépôt avant composition)
4. IF la validation échoue, THEN THE Configuration_Concours SHALL afficher un message d'erreur détaillé indiquant les problèmes à corriger
5. IF la validation réussit, THEN THE Configuration_Concours SHALL créer le Concours avec toutes les configurations définies
6. WHEN le Concours est créé, THE Configuration_Concours SHALL afficher un message de confirmation et rediriger vers la liste des concours

### Requirement 9: Modification de la configuration d'un concours existant

**User Story:** En tant qu'administrateur DGES, je veux pouvoir modifier la configuration des pièces et des dates d'un concours existant, afin de corriger ou ajuster les exigences si nécessaire.

#### Acceptance Criteria

1. WHEN THE DGES_Admin édite un Concours existant, THE Configuration_Concours SHALL afficher la configuration actuelle des Piece_Dossier et des dates
2. THE DGES_Admin SHALL pouvoir ajouter ou retirer des Piece_Dossier de la configuration
3. THE DGES_Admin SHALL pouvoir modifier les Format_Fichier acceptés pour chaque Piece_Dossier
4. THE DGES_Admin SHALL pouvoir modifier les Date_Depot et Date_Composition en respectant les contraintes de validation
5. WHEN THE DGES_Admin sauvegarde les modifications, THE Configuration_Concours SHALL appliquer les mêmes validations que lors de la création
6. IF le Concours a déjà des inscriptions, THEN THE Configuration_Concours SHALL afficher un avertissement avant de permettre la modification des Piece_Dossier requises

### Requirement 10: Affichage de la configuration pour les candidats

**User Story:** En tant que candidat, je veux voir clairement les pièces requises et leurs formats acceptés pour un concours, afin de préparer mon dossier correctement.

#### Acceptance Criteria

1. WHEN un candidat consulte les détails d'un Concours, THE système SHALL afficher la liste complète des Piece_Dossier requises
2. FOR ALL Piece_Dossier affichée, THE système SHALL indiquer les Format_Fichier acceptés
3. THE système SHALL indiquer clairement que la Quittance est obligatoire et doit être au format PDF
4. THE système SHALL afficher les Date_Depot pour informer le candidat de la période de soumission
5. THE système SHALL afficher les Date_Composition pour informer le candidat de la période des épreuves
