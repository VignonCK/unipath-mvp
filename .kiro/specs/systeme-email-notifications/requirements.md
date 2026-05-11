# Requirements Document - Système Email Notifications Performant

## Introduction

Le système d'email notifications performant est une refonte complète du service d'envoi d'emails actuel (`email.service.js`) pour offrir une solution fiable, traçable, et performante de communication par email avec les utilisateurs de la plateforme UniPath.

Le système actuel utilise Nodemailer avec SMTP Gmail et envoie des emails de manière synchrone, ce qui peut bloquer les actions métier en cas de problème réseau ou SMTP. De plus, il n'y a pas de traçabilité des emails envoyés, pas de système de retry en cas d'échec, et des redondances dans les méthodes d'envoi.

Cette refonte vise à :
- **Fiabiliser** l'envoi d'emails avec un système de retry automatique et de gestion des échecs
- **Tracer** tous les emails envoyés dans la table `EmailDelivery` avec statut, tentatives, et codes d'erreur
- **Optimiser** les performances avec un système de queue asynchrone qui ne bloque jamais les actions métier
- **Sécuriser** les communications avec expiration de tokens et rate limiting
- **Simplifier** le code en éliminant les redondances et en standardisant les signatures de méthodes

Le système doit être compatible avec l'infrastructure existante (Nodemailer, SMTP Gmail, Prisma) et préserver la compatibilité avec les appels actuels des contrôleurs pendant la migration.

## Glossary

- **Email_Service**: Le service responsable de l'envoi d'emails via SMTP (Nodemailer)
- **Email_Queue**: La file d'attente des emails à envoyer, implémentée via la table `EmailDelivery` avec statut `QUEUED`
- **Email_Worker**: Le processus qui traite la file d'attente et envoie les emails
- **Retry_Handler**: Le gestionnaire de tentatives automatiques en cas d'échec d'envoi
- **Delivery_Tracker**: Le système de suivi des statuts de livraison dans la table `EmailDelivery`
- **Rate_Limiter**: Le système de limitation du nombre d'emails par utilisateur et globalement
- **Email_Template**: Un modèle d'email avec variables dynamiques (nom, prénom, concours, etc.)
- **Confirmation_Token**: Un token unique et sécurisé pour confirmer un compte candidat
- **Email_Type**: Le type d'email (CONFIRMATION, PRE_INSCRIPTION, CONVOCATION, REJET, SOUS_RESERVE)
- **Delivery_Status**: Le statut de livraison d'un email (PENDING, QUEUED, PROCESSING, SENT, DELIVERED, FAILED, BOUNCED, EXPIRED)
- **SMTP_Server**: Le serveur SMTP Gmail utilisé pour l'envoi d'emails
- **Message_ID**: L'identifiant unique retourné par le serveur SMTP après envoi
- **Bounce**: Un email rejeté par le serveur destinataire (adresse invalide, boîte pleine, etc.)
- **Exponential_Backoff**: Stratégie de retry avec délais croissants (1min, 5min, 15min, 1h, 4h)
- **Business_Action**: Une action métier (inscription, validation, etc.) qui ne doit jamais être bloquée par l'envoi d'email
- **Candidat**: Un utilisateur candidat aux concours
- **Commission**: Un membre de la commission d'évaluation
- **Controleur**: Un contrôleur qui valide les décisions de la commission
- **PDF_Attachment**: Une pièce jointe PDF (fiche de pré-inscription, convocation)

## Requirements

### Requirement 1: Envoi Asynchrone Non-Bloquant

**User Story:** En tant que système, je veux envoyer les emails de manière asynchrone, afin de ne jamais bloquer les actions métier en cas de problème réseau ou SMTP.

#### Acceptance Criteria

1. WHEN une action métier nécessite l'envoi d'un email, THE Email_Service SHALL créer une entrée dans la table `EmailDelivery` avec le statut `QUEUED`
2. WHEN une entrée est créée dans `EmailDelivery`, THE Email_Service SHALL retourner immédiatement le contrôle au contrôleur appelant sans attendre l'envoi effectif
3. THE Email_Worker SHALL traiter la file d'attente en arrière-plan de manière continue
4. THE Email_Worker SHALL traiter les emails par ordre chronologique (FIFO - First In First Out)
5. WHEN un email est en cours de traitement, THE Email_Worker SHALL mettre à jour le statut à `PROCESSING`
6. WHEN un email est envoyé avec succès, THE Email_Worker SHALL mettre à jour le statut à `SENT` et enregistrer le `messageId` retourné par le serveur SMTP
7. THE Email_Service SHALL garantir qu'aucune action métier (inscription, validation, rejet) ne peut échouer à cause d'un problème d'envoi d'email

### Requirement 2: Traçabilité Complète des Emails

**User Story:** En tant qu'Administrateur, je veux tracer tous les emails envoyés, afin de diagnostiquer les problèmes de délivrabilité et d'assurer la conformité.

#### Acceptance Criteria

1. THE Email_Service SHALL enregistrer chaque email dans la table `EmailDelivery` avec les champs suivants : `id`, `notificationId`, `userId`, `recipient`, `subject`, `status`, `messageId`, `attempts`, `lastAttemptAt`, `sentAt`, `deliveredAt`, `bouncedAt`, `errorMessage`, `smtpCode`, `createdAt`, `updatedAt`
2. WHEN un email est créé, THE Email_Service SHALL enregistrer le `userId` du destinataire, le `recipient` (adresse email), et le `subject`
3. WHEN un email est envoyé avec succès, THE Email_Service SHALL enregistrer le `messageId` retourné par le serveur SMTP et la date `sentAt`
4. WHEN un email échoue à l'envoi, THE Email_Service SHALL enregistrer le `errorMessage` et le `smtpCode` si disponible
5. WHEN un email est rejeté (bounce), THE Email_Service SHALL enregistrer la date `bouncedAt` et le statut `BOUNCED`
6. THE Email_Service SHALL incrémenter le compteur `attempts` à chaque tentative d'envoi
7. THE Email_Service SHALL enregistrer la date `lastAttemptAt` à chaque tentative d'envoi

### Requirement 3: Retry Automatique avec Exponential Backoff

**User Story:** En tant que système, je veux réessayer automatiquement l'envoi des emails échoués, afin d'assurer la fiabilité de la communication même en cas de problème temporaire.

#### Acceptance Criteria

1. WHEN un email échoue à l'envoi, THE Retry_Handler SHALL programmer une nouvelle tentative selon la stratégie suivante : 1 minute, 5 minutes, 15 minutes, 1 heure, 4 heures
2. THE Retry_Handler SHALL effectuer un maximum de 5 tentatives pour chaque email
3. WHEN toutes les tentatives échouent, THE Retry_Handler SHALL marquer l'email comme `FAILED` définitivement
4. WHEN un email échoue définitivement, THE Email_Service SHALL créer une alerte dans la table `SystemAlert` avec le type `DELIVERY_ISSUE` et la sévérité `ERROR`
5. THE Retry_Handler SHALL enregistrer chaque tentative avec l'horodatage dans le champ `lastAttemptAt` et incrémenter le compteur `attempts`
6. WHEN un email réussit après une ou plusieurs tentatives, THE Retry_Handler SHALL mettre à jour le statut à `SENT` et arrêter les tentatives suivantes
7. THE Retry_Handler SHALL respecter les limites de taux du serveur SMTP (maximum 100 emails par heure)

### Requirement 4: Rate Limiting pour Prévenir les Abus

**User Story:** En tant que système, je veux limiter le nombre d'emails envoyés par utilisateur et globalement, afin de prévenir les abus et de respecter les limites du serveur SMTP.

#### Acceptance Criteria

1. THE Rate_Limiter SHALL limiter l'envoi à maximum 10 emails par candidat par heure
2. THE Rate_Limiter SHALL limiter l'envoi à maximum 100 emails globalement par heure pour respecter les limites SMTP de Gmail
3. WHEN un candidat dépasse la limite de 10 emails par heure, THE Email_Service SHALL rejeter la création d'un nouvel email avec le statut `EXPIRED` et le message d'erreur "Rate limit exceeded"
4. WHEN le système dépasse la limite de 100 emails par heure, THE Email_Worker SHALL mettre en pause le traitement de la file d'attente jusqu'à la prochaine heure
5. THE Rate_Limiter SHALL compter uniquement les emails avec statut `SENT` ou `PROCESSING` dans le calcul des limites
6. THE Rate_Limiter SHALL réinitialiser les compteurs toutes les heures (fenêtre glissante de 60 minutes)
7. WHEN la file d'attente contient plus de 500 emails en attente, THE Email_Service SHALL créer une alerte dans la table `SystemAlert` avec le type `QUEUE_OVERLOAD` et la sévérité `WARNING`

### Requirement 5: Email de Confirmation de Compte

**User Story:** En tant que Candidat, je veux recevoir un email de confirmation lors de la création de mon compte, afin de valider mon adresse email et activer mon compte.

#### Acceptance Criteria

1. WHEN un candidat crée un compte, THE Email_Service SHALL envoyer un email de confirmation avec un lien contenant un token unique
2. THE Email_Service SHALL générer un token de confirmation sécurisé (UUID v4) et le stocker dans Supabase Auth
3. THE Email_Service SHALL configurer le token avec une expiration de 24 heures
4. THE Email_Service SHALL inclure dans l'email le nom et prénom du candidat, et le lien de confirmation avec le token
5. WHEN le candidat clique sur le lien de confirmation, THE Auth_Controller SHALL valider le token et marquer le champ `emailConfirme` à `true`
6. WHEN le token est expiré, THE Auth_Controller SHALL retourner une erreur et permettre au candidat de demander un nouveau lien
7. WHEN un candidat confirme son email, THE Email_Service SHALL envoyer un email de bienvenue distinct avec son matricule, ses identifiants de connexion, et un lien vers la plateforme. THE Email_Service SHALL conserver la méthode `envoyerEmailBienvenue` appelée uniquement après confirmation du compte, et non à la création du compte

### Requirement 6: Email de Pré-Inscription avec PDF

**User Story:** En tant que Candidat, je veux recevoir un email de pré-inscription avec ma fiche en PDF, afin de conserver une preuve de mon inscription.

#### Acceptance Criteria

1. WHEN un candidat s'inscrit à un concours, THE Email_Service SHALL envoyer un email de pré-inscription avec la fiche de pré-inscription en pièce jointe PDF
2. THE Email_Service SHALL supporter les pièces jointes PDF jusqu'à 5 MB
3. THE Email_Service SHALL inclure dans l'email le nom et prénom du candidat, le libellé du concours, le numéro de dossier, et les instructions pour compléter le dossier
4. WHEN la génération du PDF échoue, THE Email_Service SHALL envoyer l'email sans pièce jointe et enregistrer une erreur dans les logs
5. THE Email_Service SHALL supprimer le fichier PDF temporaire après l'envoi de l'email
6. THE Email_Service SHALL utiliser la méthode `envoyerEmailPreInscription` avec la signature standardisée : `envoyerEmailPreInscription({ candidatEmail, candidatNom, candidatPrenom, concours, numeroDossier }, pdfPath)`
7. WHEN l'email est envoyé avec succès, THE Email_Service SHALL enregistrer le type d'email `PRE_INSCRIPTION` dans la table `EmailDelivery`

### Requirement 7: Email de Convocation avec PDF

**User Story:** En tant que Candidat validé, je veux recevoir un email de convocation avec ma convocation en PDF, afin de me présenter à l'examen.

#### Acceptance Criteria

1. WHEN un contrôleur valide un dossier, THE Email_Service SHALL envoyer un email de convocation avec la convocation en pièce jointe PDF
2. THE Email_Service SHALL inclure dans l'email le nom et prénom du candidat, le libellé du concours, le numéro de dossier, la date d'examen, et le lieu d'examen
3. WHEN la génération du PDF échoue, THE Email_Service SHALL envoyer l'email sans pièce jointe et enregistrer une erreur dans les logs
4. THE Email_Service SHALL supprimer le fichier PDF temporaire après l'envoi de l'email
5. THE Email_Service SHALL utiliser la méthode `envoyerEmailConvocation` avec la signature standardisée : `envoyerEmailConvocation({ candidatEmail, candidatNom, candidatPrenom, concours, numeroDossier, dateExamen, lieuExamen }, pdfPath)`
6. WHEN l'email est envoyé avec succès, THE Email_Service SHALL enregistrer le type d'email `CONVOCATION` dans la table `EmailDelivery`
7. THE Email_Service SHALL fusionner les méthodes `envoyerEmailValidation` et `envoyerEmailConvocation` en une seule méthode `envoyerEmailConvocation`

### Requirement 8: Email de Rejet

**User Story:** En tant que Candidat rejeté, je veux recevoir un email de notification avec le motif du rejet, afin de comprendre les raisons de la décision.

#### Acceptance Criteria

1. WHEN un contrôleur rejette un dossier, THE Email_Service SHALL envoyer un email de notification de rejet
2. THE Email_Service SHALL inclure dans l'email le nom et prénom du candidat, le libellé du concours, et le motif du rejet
3. THE Email_Service SHALL utiliser la méthode `envoyerEmailRejet` avec la signature standardisée : `envoyerEmailRejet({ candidatEmail, candidatNom, candidatPrenom, concours, motif })`
4. WHEN l'email est envoyé avec succès, THE Email_Service SHALL enregistrer le type d'email `REJET` dans la table `EmailDelivery`
5. THE Email_Service SHALL formater le motif du rejet de manière claire et professionnelle dans l'email
6. THE Email_Service SHALL inclure dans l'email les coordonnées de contact pour toute réclamation
7. WHEN le motif du rejet n'est pas fourni, THE Email_Service SHALL utiliser un motif par défaut : "Votre dossier ne répond pas aux critères d'admission"

### Requirement 9: Email de Validation Sous Réserve

**User Story:** En tant que Candidat validé sous réserve, je veux recevoir un email avec les conditions à remplir, afin de finaliser ma validation.

#### Acceptance Criteria

1. WHEN un contrôleur valide un dossier sous réserve, THE Email_Service SHALL envoyer un email de notification de validation sous réserve
2. THE Email_Service SHALL inclure dans l'email le nom et prénom du candidat, le libellé du concours, le numéro de dossier, et les conditions à remplir
3. THE Email_Service SHALL utiliser la méthode `envoyerEmailSousReserve` avec la signature standardisée : `envoyerEmailSousReserve({ candidatEmail, candidatNom, candidatPrenom, concours, numeroDossier, motif })`
4. WHEN l'email est envoyé avec succès, THE Email_Service SHALL enregistrer le type d'email `SOUS_RESERVE` dans la table `EmailDelivery`
5. THE Email_Service SHALL formater les conditions de manière claire avec une liste à puces dans l'email
6. THE Email_Service SHALL inclure dans l'email la date limite pour remplir les conditions (48 heures après la décision)
7. WHEN les conditions ne sont pas fournies, THE Email_Service SHALL utiliser un message par défaut : "Veuillez compléter votre dossier selon les instructions de la commission"

### Requirement 10: Standardisation des Signatures de Méthodes

**User Story:** En tant que développeur, je veux des signatures de méthodes standardisées, afin de faciliter l'utilisation et la maintenance du service d'email.

#### Acceptance Criteria

1. THE Email_Service SHALL utiliser un objet de paramètres pour toutes les méthodes d'envoi d'email au lieu de paramètres positionnels
2. THE Email_Service SHALL accepter un paramètre optionnel `pdfPath` pour les méthodes nécessitant une pièce jointe
3. THE Email_Service SHALL retourner une Promise qui se résout avec l'ID de l'entrée `EmailDelivery` créée
4. THE Email_Service SHALL valider les paramètres obligatoires (email, nom, prénom) et rejeter la Promise avec une erreur si un paramètre est manquant
5. THE Email_Service SHALL valider le format de l'adresse email avec une regex et rejeter la Promise si le format est invalide
6. THE Email_Service SHALL utiliser des noms de méthodes cohérents : `envoyerEmailConfirmation`, `envoyerEmailPreInscription`, `envoyerEmailConvocation`, `envoyerEmailRejet`, `envoyerEmailSousReserve`
7. THE Email_Service SHALL documenter chaque méthode avec JSDoc incluant les paramètres, le type de retour, et des exemples d'utilisation

### Requirement 11: Gestion des Erreurs et Logging

**User Story:** En tant que développeur, je veux des logs détaillés des erreurs d'envoi d'email, afin de diagnostiquer rapidement les problèmes.

#### Acceptance Criteria

1. WHEN une erreur se produit lors de l'envoi d'un email, THE Email_Service SHALL enregistrer l'erreur dans les logs avec le niveau `error` et les détails suivants : `emailId`, `recipient`, `errorMessage`, `smtpCode`, `attempts`
2. WHEN un email est envoyé avec succès, THE Email_Service SHALL enregistrer un log avec le niveau `info` et les détails suivants : `emailId`, `recipient`, `messageId`, `attempts`
3. WHEN un email échoue définitivement après 5 tentatives, THE Email_Service SHALL enregistrer un log avec le niveau `error` et créer une alerte dans la table `SystemAlert`
4. THE Email_Service SHALL capturer les erreurs SMTP spécifiques (authentification, quota dépassé, destinataire invalide) et les enregistrer dans le champ `smtpCode`
5. THE Email_Service SHALL utiliser un logger structuré (Winston ou Pino) pour faciliter l'analyse des logs
6. THE Email_Service SHALL masquer les informations sensibles dans les logs (tokens, mots de passe) en affichant uniquement les 4 premiers caractères
7. WHEN le taux d'échec dépasse 20% sur une période de 1 heure, THE Email_Service SHALL créer une alerte dans la table `SystemAlert` avec le type `HIGH_FAILURE_RATE` et la sévérité `CRITICAL`

### Requirement 12: Configuration via Variables d'Environnement

**User Story:** En tant que développeur, je veux configurer le service d'email via des variables d'environnement, afin de faciliter le déploiement dans différents environnements.

#### Acceptance Criteria

1. THE Email_Service SHALL lire la configuration SMTP depuis les variables d'environnement : `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM_EMAIL`, `SMTP_FROM_NAME`
2. THE Email_Service SHALL lire l'URL de base de l'application depuis la variable d'environnement `APP_URL` pour générer les liens de confirmation
3. THE Email_Service SHALL lire l'année académique depuis la variable d'environnement `ACADEMIC_YEAR` pour l'inclure dans les emails
4. THE Email_Service SHALL lire le délai de retry depuis les variables d'environnement : `EMAIL_RETRY_DELAYS` (format : "1,5,15,60,240" en minutes)
5. THE Email_Service SHALL lire les limites de rate limiting depuis les variables d'environnement : `EMAIL_RATE_LIMIT_PER_USER` (défaut : 10), `EMAIL_RATE_LIMIT_GLOBAL` (défaut : 100)
6. THE Email_Service SHALL valider la présence des variables d'environnement obligatoires au démarrage et lever une erreur si une variable est manquante
7. THE Email_Service SHALL fournir des valeurs par défaut pour les variables optionnelles : `SMTP_PORT=587`, `EMAIL_RETRY_DELAYS="1,5,15,60,240"`, `EMAIL_RATE_LIMIT_PER_USER=10`, `EMAIL_RATE_LIMIT_GLOBAL=100`

### Requirement 13: Migration Progressive depuis le Système Actuel

**User Story:** En tant que développeur, je veux migrer progressivement depuis le système actuel, afin de ne pas casser les fonctionnalités existantes pendant la transition.

#### Acceptance Criteria

1. THE Email_Service SHALL fournir une interface compatible avec les appels actuels des contrôleurs (auth.controller.js, candidat.controller.js, controleur.controller.js)
2. THE Email_Service SHALL permettre l'activation du nouveau système via une variable d'environnement `EMAIL_QUEUE_ENABLED` (défaut : `true`)
3. WHEN `EMAIL_QUEUE_ENABLED=false`, THE Email_Service SHALL envoyer les emails de manière synchrone comme le système actuel
4. WHEN `EMAIL_QUEUE_ENABLED=true`, THE Email_Service SHALL utiliser le système de queue asynchrone
5. THE Email_Service SHALL enregistrer tous les emails dans la table `EmailDelivery` même en mode synchrone pour assurer la traçabilité
6. THE Email_Service SHALL permettre le rollback vers le système synchrone en cas de problème critique en changeant la variable d'environnement
7. THE Email_Service SHALL fournir un script de migration pour créer les index nécessaires sur la table `EmailDelivery` : index sur `status`, `userId`, `createdAt`

### Requirement 14: Traitement de la File d'Attente via Cron Job Intégré

**User Story:** En tant que système, je veux un cron job intégré à l'API pour traiter la file d'attente d'emails, afin de simplifier le déploiement sans infrastructure supplémentaire.

#### Acceptance Criteria

1. THE Email_Worker SHALL être implémenté comme un cron job intégré au processus Express principal en utilisant la librairie `node-cron`
2. THE Email_Worker SHALL s'exécuter toutes les 10 secondes pour récupérer les emails avec statut `QUEUED` ou `FAILED` dont la prochaine tentative est programmée dans le passé
3. THE Email_Worker SHALL traiter jusqu'à 5 emails par cycle pour éviter de surcharger le serveur SMTP
4. THE Email_Worker SHALL mettre à jour le statut à `PROCESSING` avant de commencer l'envoi d'un email
5. WHEN un email est envoyé avec succès, THE Email_Worker SHALL mettre à jour le statut à `SENT`, enregistrer le `messageId` et la date `sentAt`
6. WHEN un email échoue à l'envoi, THE Email_Worker SHALL mettre à jour le statut à `FAILED`, enregistrer l'erreur, et programmer la prochaine tentative selon la stratégie de retry
7. THE Email_Worker SHALL démarrer automatiquement au lancement de l'API Express et s'arrêter proprement lors de l'arrêt du serveur (SIGTERM, SIGINT)

### Requirement 15: Monitoring et Alertes

**User Story:** En tant qu'Administrateur, je veux être alerté des problèmes d'envoi d'emails, afin de réagir rapidement en cas de dysfonctionnement.

#### Acceptance Criteria

1. WHEN le taux d'échec dépasse 20% sur une période de 1 heure, THE Email_Service SHALL créer une alerte dans la table `SystemAlert` avec le type `HIGH_FAILURE_RATE` et la sévérité `CRITICAL`
2. WHEN la file d'attente contient plus de 500 emails en attente, THE Email_Service SHALL créer une alerte dans la table `SystemAlert` avec le type `QUEUE_OVERLOAD` et la sévérité `WARNING`
3. WHEN le serveur SMTP retourne une erreur d'authentification, THE Email_Service SHALL créer une alerte dans la table `SystemAlert` avec le type `SMTP_ERROR` et la sévérité `CRITICAL`
4. WHEN un email échoue définitivement après 5 tentatives, THE Email_Service SHALL créer une alerte dans la table `SystemAlert` avec le type `DELIVERY_ISSUE` et la sévérité `ERROR`
5. THE Email_Service SHALL exposer des métriques Prometheus pour le monitoring : `email_sent_total`, `email_failed_total`, `email_queue_size`, `email_processing_duration_seconds`
6. THE Email_Service SHALL fournir un endpoint `/api/email/health` qui retourne le statut du service (nombre d'emails en queue, taux d'échec, dernière tentative)
7. THE Email_Service SHALL enregistrer dans les logs le nombre d'emails traités toutes les heures avec le niveau `info`

### Requirement 16: Tests et Qualité du Code

**User Story:** En tant que développeur, je veux des tests automatisés pour le service d'email, afin de garantir la fiabilité du système.

#### Acceptance Criteria

1. THE Email_Service SHALL avoir une couverture de tests unitaires d'au moins 80%
2. THE Email_Service SHALL avoir des tests d'intégration pour chaque méthode d'envoi d'email (confirmation, pré-inscription, convocation, rejet, sous réserve)
3. THE Email_Service SHALL avoir des tests pour le système de retry avec des mocks du serveur SMTP
4. THE Email_Service SHALL avoir des tests pour le rate limiting avec différents scénarios (limite par utilisateur, limite globale)
5. THE Email_Service SHALL avoir des tests pour la gestion des erreurs SMTP (authentification, quota, destinataire invalide)
6. THE Email_Service SHALL utiliser des mocks pour le serveur SMTP dans les tests pour éviter l'envoi d'emails réels
7. THE Email_Service SHALL avoir des tests end-to-end qui vérifient le flux complet : création d'email → queue → traitement → mise à jour du statut

---

**Note sur l'Architecture:**

Ce système d'email notifications est conçu pour s'intégrer avec le système de notifications intégré existant (spec `systeme-notifications-integre`). La table `EmailDelivery` peut être liée à la table `Notification` via le champ `notificationId` pour assurer la cohérence entre les notifications in-app et les emails.

Le système utilise une architecture simple et pragmatique :
- **Email Service** : Couche métier qui crée les entrées dans `EmailDelivery`
- **Email Worker** : Cron job intégré au processus Express principal via `node-cron` qui traite la queue et envoie les emails toutes les 10 secondes
- **Retry Handler** : Logique de retry intégrée dans le worker
- **Rate Limiter** : Middleware qui vérifie les limites avant la création d'emails

Cette architecture permet une migration progressive, une scalabilité horizontale (plusieurs workers), et une maintenance simplifiée.
