# Document d'Exigences - Commission à Double Verdict

## Introduction

Ce module implémente un système de **commission à double verdict** pour l'évaluation des dossiers d'inscription aux concours universitaires dans UniPath. Le principe fondamental repose sur une **double évaluation indépendante** par deux examinateurs, suivie d'une **validation ou modification par un contrôleur**.

**Principe fondamental :** Chaque dossier candidat est examiné indépendamment par **2 examinateurs** qui rendent chacun un verdict (VALIDE, REJETE, SOUS_RESERVE). Un **contrôleur** peut intervenir dès qu'au moins 1 examinateur a rendu son verdict pour confirmer ou modifier la décision. Les verdicts des examinateurs sont **modifiables une seule fois par leur auteur** (un examinateur ne peut jamais modifier le verdict d'un autre), mais le contrôleur peut modifier sa propre décision plusieurs fois.

Ce système garantit l'équité, la traçabilité et la qualité des décisions d'admission tout en permettant une flexibilité opérationnelle.

## Glossaire

- **Examinateur**: Membre de la commission avec sous-rôle EXAMINATEUR - évalue les dossiers candidats et rend un verdict indépendant
- **Controleur_Commission**: Membre de la commission avec sous-rôle CONTROLEUR - valide ou modifie les verdicts des examinateurs
- **Verdict**: Décision rendue par un examinateur sur un dossier candidat - valeurs possibles: VALIDE, REJETE, SOUS_RESERVE
- **Verdict_Modifiable_Une_Fois**: Principe permettant à un examinateur de modifier son propre verdict une seule fois après soumission initiale. Toute tentative de seconde modification est refusée par le système.
- **Double_Evaluation**: Processus où 2 examinateurs évaluent indépendamment le même dossier
- **Verdict_Divergent**: Situation où les 2 examinateurs rendent des verdicts différents pour le même dossier
- **Dossier_Retire**: Dossier qui disparaît automatiquement de la liste de travail d'un examinateur dès lors que celui-ci a soumis son verdict, garantissant qu'aucun examinateur ne peut intervenir sur le verdict d'un autre.
- **Motif_Obligatoire**: Justification textuelle requise pour les verdicts REJETE ou SOUS_RESERVE
- **Decision_Finale**: Décision du contrôleur qui détermine le statut définitif du dossier
- **DossierInscription**: Entité représentant le dossier spécifique d'une inscription à un concours
- **ActionHistory**: Table de traçabilité enregistrant toutes les actions effectuées sur les dossiers
- **Systeme_Notification**: Module de notifications et d'emails existant dans UniPath
- **API_Backend**: API Node.js/Express exposant les endpoints du module

## Exigences

### Exigence 1: Extension du Modèle de Données pour Double Verdict

**User Story:** En tant que développeur, je veux étendre le modèle DossierInscription pour stocker les verdicts des 2 examinateurs et du contrôleur, afin de tracer toutes les décisions prises.

#### Critères d'Acceptation

1. THE DossierInscription SHALL inclure les champs: verdict1Par (ID examinateur 1), verdict1 (enum Verdict), verdict1Motif (texte), verdict1Date (timestamp)
2. THE DossierInscription SHALL inclure les champs: verdict2Par (ID examinateur 2), verdict2 (enum Verdict), verdict2Motif (texte), verdict2Date (timestamp)
3. THE DossierInscription SHALL inclure les champs: decisionControleurPar (ID contrôleur), decisionControleur (enum Verdict), decisionControleurMotif (texte), decisionControleurDate (timestamp)
4. THE Systeme SHALL créer un enum Verdict avec les valeurs: VALIDE, REJETE, SOUS_RESERVE
5. THE DossierInscription SHALL maintenir le champ statut existant (StatutDossier) pour la compatibilité avec les modules existants
6. THE Systeme SHALL créer des index sur verdict1Par, verdict2Par, decisionControleurPar pour optimiser les requêtes

### Exigence 2: Gestion des Rôles et Sous-Rôles Commission

**User Story:** En tant qu'administrateur, je veux distinguer les examinateurs des contrôleurs au sein de la commission, afin de séparer les responsabilités d'évaluation et de validation.

#### Critères d'Acceptation

1. THE MembreCommission SHALL inclure un champ sousRole avec les valeurs: EXAMINATEUR, CONTROLEUR
2. WHEN un membre commission est créé, THE Systeme SHALL exiger la spécification du sousRole
3. THE API_Backend SHALL créer un endpoint GET /api/commission/membres pour lister les membres par sousRole
4. THE Systeme SHALL valider que seuls les membres avec sousRole=EXAMINATEUR peuvent rendre des verdicts d'examinateur
5. THE Systeme SHALL valider que seuls les membres avec sousRole=CONTROLEUR peuvent rendre des décisions de contrôleur

### Exigence 3: Rendu de Verdict par Examinateur avec Immutabilité

**User Story:** En tant qu'examinateur, je veux rendre mon verdict sur un dossier candidat de manière indépendante, sans pouvoir modifier le verdict de mon collègue, afin de garantir l'intégrité de l'évaluation.

#### Critères d'Acceptation

1. THE API_Backend SHALL créer un endpoint POST /api/commission/dossiers/:dossierInscriptionId/verdict pour soumettre un verdict
2. WHEN un examinateur soumet un verdict, THE Systeme SHALL vérifier que le champ verdict1Par ou verdict2Par est null (place disponible)
3. THE Systeme SHALL assigner automatiquement le verdict au premier champ disponible (verdict1 si verdict1Par est null, sinon verdict2)
4. WHEN le verdict est REJETE ou SOUS_RESERVE, THE Systeme SHALL valider que le motif est fourni et non vide
5. THE Systeme SHALL refuser la soumission si les 2 verdicts sont déjà rendus (retourner erreur 403)
6. THE Systeme SHALL enregistrer une action dans ActionHistory avec typeAction=VERDICT_EXAMINATEUR_RENDU
7. THE Systeme SHALL permettre à un examinateur de modifier son propre verdict une seule fois après soumission. WHEN l'examinateur a déjà modifié son verdict une fois, THE Systeme SHALL refuser toute modification supplémentaire et retourner une erreur 403 avec message "Vous avez déjà modifié votre verdict. Aucune modification supplémentaire n'est autorisée."

### Exigence 4: Consultation des Verdicts par le Contrôleur

**User Story:** En tant que contrôleur, je veux consulter les verdicts rendus par les examinateurs (même si un seul a rendu son verdict), afin de prendre ma décision de validation ou modification.

#### Critères d'Acceptation

1. THE API_Backend SHALL créer un endpoint GET /api/controleur/dossiers pour lister les dossiers avec au moins 1 verdict rendu
2. THE endpoint SHALL retourner pour chaque dossier: informations candidat, informations concours, verdict1 (si présent), verdict2 (si présent), statut des verdicts (1/2 ou 2/2)
3. THE API_Backend SHALL créer un endpoint GET /api/controleur/dossiers/:dossierInscriptionId pour consulter le détail d'un dossier
4. THE endpoint de détail SHALL inclure: toutes les pièces du dossier, verdict1 complet (verdict, motif, date, examinateur), verdict2 complet (si présent), historique des actions
5. THE Systeme SHALL permettre au contrôleur de filtrer les dossiers par: nombre de verdicts rendus (1 ou 2), type de verdict (VALIDE, REJETE, SOUS_RESERVE), concordance des verdicts (concordants/divergents)

### Exigence 5: Décision du Contrôleur avec Modification Possible

**User Story:** En tant que contrôleur, je veux confirmer ou modifier les verdicts des examinateurs, et pouvoir changer ma décision plusieurs fois si nécessaire, afin d'assurer la qualité finale des décisions.

#### Critères d'Acceptation

1. THE API_Backend SHALL créer un endpoint POST /api/controleur/dossiers/:dossierInscriptionId/decision pour soumettre une décision
2. THE Systeme SHALL accepter les décisions même si un seul verdict examinateur est rendu (Intervention_Precoce)
3. WHEN la décision est REJETE ou SOUS_RESERVE, THE Systeme SHALL valider que le motif est fourni et non vide
4. THE Systeme SHALL permettre au contrôleur de modifier sa décision plusieurs fois (écraser decisionControleur, decisionControleurMotif, decisionControleurDate)
5. THE Systeme SHALL enregistrer chaque modification dans ActionHistory avec typeAction=DECISION_CONTROLEUR_MODIFIEE
6. WHEN le contrôleur modifie sa décision, THE Systeme SHALL notifier les 2 examinateurs (si leurs verdicts sont rendus) via le Systeme_Notification

### Exigence 6: Gestion des Verdicts Divergents

**User Story:** En tant que contrôleur, je veux être alerté lorsque les 2 examinateurs rendent des verdicts différents, afin de prendre une décision éclairée en cas de désaccord.

#### Critères d'Acceptation

1. WHEN les 2 verdicts sont rendus et sont différents, THE Systeme SHALL marquer le dossier comme ayant des Verdict_Divergent
2. THE API_Backend SHALL créer un endpoint GET /api/controleur/dossiers/divergents pour lister uniquement les dossiers avec verdicts divergents
3. THE Systeme SHALL créer une notification pour le contrôleur avec priorité HIGH et type ALERTE indiquant les verdicts divergents
4. THE interface contrôleur SHALL afficher un badge visuel "⚠️ Verdicts divergents" sur les dossiers concernés
5. THE Systeme SHALL calculer un indicateur de divergence: (nombre de dossiers divergents / nombre de dossiers avec 2 verdicts) * 100

### Exigence 7: Gestion de la Disponibilité des Dossiers par Examinateur

**User Story:** En tant qu'examinateur, je veux que les dossiers sur lesquels j'ai déjà rendu un verdict disparaissent automatiquement de ma liste de travail, afin de ne traiter que les dossiers qui m'attendent réellement.

#### Critères d'Acceptation

1. WHEN un examinateur soumet son verdict sur un dossier, THE Systeme SHALL retirer immédiatement ce dossier de la liste des dossiers à évaluer de cet examinateur
2. THE endpoint GET /api/examinateur/dossiers-a-evaluer SHALL retourner uniquement les dossiers sur lesquels l'examinateur connecté n'a pas encore rendu de verdict
3. THE Systeme SHALL empêcher un examinateur d'accéder au formulaire de verdict d'un dossier sur lequel il a déjà rendu son verdict
4. THE Systeme SHALL garantir qu'un examinateur ne peut jamais voir ni modifier le verdict d'un autre examinateur
5. WHEN un examinateur tente d'accéder à un dossier déjà traité par lui, THE API_Backend SHALL retourner une erreur 403 avec message "Vous avez déjà rendu votre verdict sur ce dossier"

### Exigence 8: Validation Backend des Motifs Obligatoires

**User Story:** En tant que développeur, je veux valider côté backend que les motifs sont obligatoires pour les verdicts REJETE et SOUS_RESERVE, afin de garantir la traçabilité des décisions négatives.

#### Critères d'Acceptation

1. WHEN un examinateur soumet un verdict REJETE sans motif, THE API_Backend SHALL retourner une erreur 400 avec message "Le motif est obligatoire pour un rejet"
2. WHEN un examinateur soumet un verdict SOUS_RESERVE sans motif, THE API_Backend SHALL retourner une erreur 400 avec message "Le motif est obligatoire pour une validation sous réserve"
3. WHEN un contrôleur soumet une décision REJETE sans motif, THE API_Backend SHALL retourner une erreur 400 avec message "Le motif est obligatoire pour un rejet"
4. WHEN un contrôleur soumet une décision SOUS_RESERVE sans motif, THE API_Backend SHALL retourner une erreur 400 avec message "Le motif est obligatoire pour une validation sous réserve"
5. THE Systeme SHALL valider que le motif contient au moins 10 caractères pour éviter les justifications vides

### Exigence 9: Séparation Stricte des Permissions Examinateur/Contrôleur

**User Story:** En tant qu'administrateur système, je veux garantir que les examinateurs ne peuvent pas accéder aux fonctions de contrôleur et vice-versa, afin de maintenir la séparation des responsabilités.

#### Critères d'Acceptation

1. THE API_Backend SHALL créer un middleware auth.verifierSousRole pour valider le sous-rôle commission
2. THE endpoint POST /api/commission/dossiers/:id/verdict SHALL être accessible uniquement aux membres avec sousRole=EXAMINATEUR
3. THE endpoint POST /api/controleur/dossiers/:id/decision SHALL être accessible uniquement aux membres avec sousRole=CONTROLEUR
4. THE endpoint GET /api/controleur/dossiers SHALL être accessible uniquement aux membres avec sousRole=CONTROLEUR
5. WHEN un examinateur tente d'accéder à un endpoint contrôleur, THE API_Backend SHALL retourner une erreur 403 avec message "Accès réservé aux contrôleurs"
6. WHEN un contrôleur tente de rendre un verdict examinateur, THE API_Backend SHALL retourner une erreur 403 avec message "Accès réservé aux examinateurs"

### Exigence 10: Traçabilité Complète via ActionHistory

**User Story:** En tant qu'auditeur, je veux consulter l'historique complet de toutes les actions effectuées sur un dossier (verdicts, décisions, modifications), afin d'assurer la transparence du processus.

#### Critères d'Acceptation

1. WHEN un examinateur rend un verdict, THE Systeme SHALL enregistrer dans ActionHistory: typeAction=VERDICT_EXAMINATEUR_RENDU, utilisateurId, dossierInscriptionId, details={verdict, motif, numeroExaminateur}
2. WHEN un contrôleur rend une décision, THE Systeme SHALL enregistrer dans ActionHistory: typeAction=DECISION_CONTROLEUR_RENDUE, utilisateurId, dossierInscriptionId, details={decision, motif, nombreVerdictsPresents}
3. WHEN un contrôleur modifie sa décision, THE Systeme SHALL enregistrer dans ActionHistory: typeAction=DECISION_CONTROLEUR_MODIFIEE, utilisateurId, dossierInscriptionId, details={ancienneDecision, nouvelleDecision, motif}
4. THE API_Backend SHALL créer un endpoint GET /api/dossiers-inscription/:id/historique-verdicts pour récupérer uniquement les actions liées aux verdicts et décisions
5. THE historique SHALL être ordonné par timestamp décroissant et inclure les informations complètes de l'utilisateur (nom, prénom, sousRole)

### Exigence 11: Notifications aux Examinateurs lors de Modification par Contrôleur

**User Story:** En tant qu'examinateur, je veux être notifié lorsque le contrôleur modifie une décision sur un dossier que j'ai évalué, afin de suivre l'évolution des dossiers.

#### Critères d'Acceptation

1. WHEN un contrôleur modifie sa décision, THE Systeme SHALL créer une notification pour chaque examinateur ayant rendu un verdict
2. THE notification SHALL inclure: titre="Décision modifiée par le contrôleur", message avec nom du candidat, concours, ancienne et nouvelle décision
3. THE notification SHALL avoir le type ALERTE et la priorité NORMAL
4. THE Systeme SHALL envoyer un email aux examinateurs si leurs préférences l'autorisent
5. THE email SHALL utiliser le service email.service.js existant et inclure un lien vers le dossier

### Exigence 12: Intégration avec le Système de Notifications Existant

**User Story:** En tant que développeur, je veux utiliser le système de notifications existant (table Notification) pour tous les événements du module, afin de maintenir la cohérence avec les autres modules.

#### Critères d'Acceptation

1. THE Systeme SHALL utiliser la table Notification existante pour créer les notifications
2. WHEN un verdict est rendu, THE Systeme SHALL créer une notification pour le contrôleur avec type=NOUVEAU_DOSSIER
3. WHEN les 2 verdicts sont divergents, THE Systeme SHALL créer une notification avec type=ALERTE et priorité=HIGH
4. WHEN une décision finale est prise, THE Systeme SHALL créer une notification pour le candidat avec type=VALIDATION ou REJET selon la décision
5. THE Systeme SHALL respecter les préférences de notification des utilisateurs (table UserPreferences)

### Exigence 13: Envoi d'Emails via le Service Existant

**User Story:** En tant que candidat, je veux recevoir un email lorsque la décision finale est prise sur mon dossier, afin d'être informé rapidement du résultat.

#### Critères d'Acceptation

1. WHEN la décision finale du contrôleur est VALIDE, THE Systeme SHALL appeler email.service.envoyerEmailValidation avec les données du candidat et du concours
2. WHEN la décision finale du contrôleur est REJETE, THE Systeme SHALL appeler email.service.envoyerEmailRejet avec le motif du rejet
3. WHEN la décision finale du contrôleur est SOUS_RESERVE, THE Systeme SHALL appeler email.service.envoyerEmailSousReserve avec le motif de la réserve
4. THE Systeme SHALL enregistrer l'envoi d'email dans la table EmailDelivery pour le suivi
5. THE Systeme SHALL gérer les erreurs d'envoi d'email sans bloquer la décision (logging uniquement)

### Exigence 14: Mise à Jour du Statut DossierInscription selon Décision Finale

**User Story:** En tant que développeur, je veux synchroniser le champ statut de DossierInscription avec la décision finale du contrôleur, afin de maintenir la compatibilité avec les modules existants.

#### Critères d'Acceptation

1. WHEN le contrôleur rend une décision VALIDE, THE Systeme SHALL mettre à jour statut=VALIDE
2. WHEN le contrôleur rend une décision REJETE, THE Systeme SHALL mettre à jour statut=REJETE
3. WHEN le contrôleur rend une décision SOUS_RESERVE, THE Systeme SHALL mettre à jour statut=SOUS_RESERVE
4. THE Systeme SHALL conserver les anciens champs decisionCommissionPar et decisionCommissionDate pour la compatibilité
5. THE Systeme SHALL copier decisionControleurMotif vers commentaireRejet ou commentaireSousReserve selon le cas

### Exigence 15: Interface Examinateur - Liste des Dossiers à Évaluer

**User Story:** En tant qu'examinateur, je veux consulter la liste des dossiers qui attendent mon évaluation, afin de prioriser mon travail.

#### Critères d'Acceptation

1. THE API_Backend SHALL créer un endpoint GET /api/examinateur/dossiers-a-evaluer pour lister les dossiers sans verdict de l'examinateur connecté
2. THE endpoint SHALL retourner uniquement les dossiers où: (verdict1Par != examinateurId ET verdict2Par != examinateurId) OU (verdict1Par IS NULL OU verdict2Par IS NULL)
3. THE endpoint SHALL inclure pour chaque dossier: informations candidat, informations concours, pourcentage de complétude, date de création
4. THE endpoint SHALL permettre de filtrer par concours et de trier par date de création ou complétude
5. THE endpoint SHALL indiquer si l'autre examinateur a déjà rendu son verdict (sans révéler le verdict lui-même)

### Exigence 16: Interface Examinateur - Détail du Dossier et Rendu de Verdict

**User Story:** En tant qu'examinateur, je veux consulter le détail complet d'un dossier candidat et rendre mon verdict, sans voir le verdict de mon collègue, afin de garantir l'indépendance de mon évaluation.

#### Critères d'Acceptation

1. THE API_Backend SHALL créer un endpoint GET /api/examinateur/dossiers/:dossierInscriptionId pour consulter le détail d'un dossier
2. THE endpoint SHALL retourner: toutes les pièces du dossier (base + spécifiques), informations candidat complètes, informations concours, historique des actions (hors verdicts)
3. THE endpoint SHALL masquer les verdicts des autres examinateurs (ne pas inclure verdict1, verdict2 dans la réponse)
4. THE endpoint SHALL indiquer uniquement si l'examinateur connecté a déjà rendu son verdict (booléen monVerdictRendu)
5. THE interface SHALL afficher un formulaire de verdict avec: radio buttons (VALIDE, REJETE, SOUS_RESERVE), champ texte motif (obligatoire si REJETE ou SOUS_RESERVE), bouton "Soumettre mon verdict"

### Exigence 17: Interface Contrôleur - Tableau de Bord avec Indicateurs

**User Story:** En tant que contrôleur, je veux consulter un tableau de bord avec des indicateurs clés (nombre de dossiers en attente, taux de divergence, etc.), afin de piloter efficacement mon activité.

#### Critères d'Acceptation

1. THE API_Backend SHALL créer un endpoint GET /api/controleur/tableau-de-bord pour récupérer les indicateurs
2. THE endpoint SHALL retourner: nombre de dossiers avec 1 verdict, nombre de dossiers avec 2 verdicts, nombre de dossiers avec verdicts divergents, nombre de dossiers avec décision finale, taux de divergence
3. THE endpoint SHALL calculer la répartition des verdicts: nombre de VALIDE, REJETE, SOUS_RESERVE pour verdict1 et verdict2
4. THE endpoint SHALL calculer le délai moyen entre verdict1 et verdict2, et entre verdict2 et décision finale
5. THE interface SHALL afficher ces indicateurs sous forme de cartes et graphiques (barres, camemberts)

### Exigence 18: Interface Contrôleur - Détail du Dossier avec Tous les Verdicts

**User Story:** En tant que contrôleur, je veux consulter le détail complet d'un dossier avec les verdicts des 2 examinateurs, afin de prendre une décision éclairée.

#### Critères d'Acceptation

1. THE endpoint GET /api/controleur/dossiers/:dossierInscriptionId SHALL retourner: toutes les pièces du dossier, informations candidat, informations concours, verdict1 complet (verdict, motif, date, nom examinateur), verdict2 complet (si présent)
2. THE interface SHALL afficher les 2 verdicts côte à côte avec un code couleur: vert (VALIDE), rouge (REJETE), orange (SOUS_RESERVE)
3. WHEN les verdicts sont divergents, THE interface SHALL afficher un badge "⚠️ Verdicts divergents" en haut de page
4. THE interface SHALL afficher un formulaire de décision avec: radio buttons (VALIDE, REJETE, SOUS_RESERVE), champ texte motif (obligatoire si REJETE ou SOUS_RESERVE), bouton "Confirmer la décision"
5. WHEN le contrôleur a déjà rendu une décision, THE interface SHALL afficher la décision actuelle et permettre de la modifier

### Exigence 19: Gestion des Cas Limites - Aucun Verdict Rendu

**User Story:** En tant que contrôleur, je veux être alerté lorsqu'un dossier n'a reçu aucun verdict après un délai raisonnable, afin de relancer les examinateurs.

#### Critères d'Acceptation

1. THE Systeme SHALL créer un job planifié (cron) qui s'exécute quotidiennement pour détecter les dossiers sans verdict depuis plus de 2 jours
2. WHEN un dossier n'a aucun verdict après 2 jours, THE Systeme SHALL créer une notification pour le contrôleur avec type=ALERTE et priorité=HIGH
3. THE notification SHALL inclure: nom du candidat, concours, date de création du dossier, nombre de jours écoulés
4. THE Systeme SHALL créer une notification pour tous les examinateurs les invitant à évaluer le dossier
5. THE API_Backend SHALL créer un endpoint GET /api/controleur/dossiers-sans-verdict pour lister ces dossiers

### Exigence 20: Tests de Non-Régression avec Modules Existants

**User Story:** En tant que développeur, je veux garantir que le nouveau module ne casse pas les fonctionnalités existantes de UniPath, afin de maintenir la stabilité de la plateforme.

#### Critères d'Acceptation

1. THE Systeme SHALL maintenir la compatibilité avec les endpoints existants de commission.controller.js
2. THE Systeme SHALL garantir que les modules de complétude (completion.controller.js) continuent de fonctionner
3. THE Systeme SHALL garantir que le système de notifications existant continue de fonctionner pour les autres modules
4. THE Systeme SHALL garantir que les emails existants (pré-inscription, validation, rejet) continuent d'être envoyés
5. THE Systeme SHALL fournir un script de test vérifiant que les anciennes routes API retournent toujours les bonnes données

### Exigence 21: Documentation du Workflow Double Verdict

**User Story:** En tant que développeur, je veux une documentation claire du workflow double verdict avec diagrammes, afin de comprendre le flux complet du processus.

#### Critères d'Acceptation

1. THE documentation SHALL inclure un diagramme de séquence illustrant: candidat soumet dossier → examinateur 1 rend verdict → examinateur 2 rend verdict → contrôleur prend décision → candidat notifié
2. THE documentation SHALL inclure un diagramme de séquence pour le cas d'intervention précoce du contrôleur : candidat soumet dossier → examinateur 1 rend verdict → contrôleur prend décision avant le second verdict → examinateur 2 rend son verdict indépendamment
3. THE documentation SHALL documenter tous les nouveaux endpoints API avec exemples de requêtes/réponses
4. THE documentation SHALL inclure une matrice de permissions: qui peut accéder à quoi (examinateur vs contrôleur)
5. THE documentation SHALL inclure des exemples de code pour les cas d'usage principaux

### Exigence 22: Sécurité et Validation des Données

**User Story:** En tant qu'administrateur système, je veux garantir que toutes les données soumises sont validées et sécurisées, afin de protéger l'intégrité du système.

#### Critères d'Acceptation

1. THE API_Backend SHALL valider que dossierInscriptionId est un UUID valide avant toute opération
2. THE API_Backend SHALL valider que le verdict est une valeur de l'enum Verdict (VALIDE, REJETE, SOUS_RESERVE)
3. THE API_Backend SHALL sanitiser les motifs pour éviter les injections XSS (échapper les caractères HTML)
4. THE API_Backend SHALL limiter la longueur des motifs à 1000 caractères maximum
5. THE API_Backend SHALL enregistrer toutes les tentatives d'accès non autorisé dans ActionHistory avec typeAction=ACCES_REFUSE

### Exigence 23: Performance et Optimisation

**User Story:** En tant qu'utilisateur de la plateforme, je veux que les requêtes sur les dossiers restent rapides même avec un grand nombre de dossiers, afin de maintenir une expérience fluide.

#### Critères d'Acceptation

1. THE Systeme SHALL créer des index sur DossierInscription.verdict1Par, verdict2Par, decisionControleurPar pour optimiser les requêtes
2. THE API_Backend SHALL utiliser des requêtes Prisma optimisées avec include pour éviter les N+1 queries
3. THE endpoint GET /api/examinateur/dossiers-a-evaluer SHALL retourner les résultats en moins de 500ms même avec 10000 dossiers
4. THE endpoint GET /api/controleur/tableau-de-bord SHALL calculer les indicateurs en moins de 1 seconde
5. THE Systeme SHALL implémenter une pagination pour les listes de dossiers (limite de 50 dossiers par page)

### Exigence 24: Rollback et Récupération

**User Story:** En tant qu'administrateur système, je veux pouvoir annuler les modifications du schéma en cas de problème, afin de revenir à l'état précédent sans perte de données.

#### Critères d'Acceptation

1. THE Systeme SHALL créer une migration Prisma pour ajouter les nouveaux champs à DossierInscription et MembreCommission
2. THE Systeme SHALL fournir une migration de rollback qui supprime les nouveaux champs
3. THE migration de rollback SHALL préserver les données existantes dans les anciens champs (decisionCommissionPar, decisionCommissionDate)
4. THE Systeme SHALL créer une sauvegarde complète de la base de données avant d'exécuter la migration
5. THE Systeme SHALL fournir un script de vérification de l'intégrité des données après migration
