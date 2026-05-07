# Requirements Document - Système de Notifications Intégré

## Introduction

Le système de notifications intégré remplace progressivement le système d'email actuel basé sur Nodemailer pour offrir une solution complète de communication avec les utilisateurs de la plateforme UniPath. Le système gère l'envoi d'emails transactionnels, les notifications in-app en temps réel, l'historique des communications, et fournit des outils de monitoring et d'audit pour les administrateurs.

Ce système doit assurer une migration transparente depuis le système actuel tout en ajoutant des fonctionnalités de traçabilité, de gestion de files d'attente, de retry automatique, et de personnalisation des templates.

## Glossary

- **Notification_System**: Le système complet de gestion des notifications (emails et in-app)
- **Email_Service**: Le service responsable de l'envoi d'emails via SMTP
- **Notification_Service**: Le service responsable des notifications in-app
- **Queue_Manager**: Le gestionnaire de files d'attente pour les notifications
- **Template_Engine**: Le moteur de rendu des templates de notifications
- **Notification_Center**: L'interface utilisateur affichant les notifications in-app
- **Audit_Logger**: Le système d'enregistrement des logs d'audit
- **Delivery_Tracker**: Le système de suivi des statuts de livraison
- **Retry_Handler**: Le gestionnaire de tentatives automatiques en cas d'échec
- **Preference_Manager**: Le gestionnaire des préférences utilisateur
- **Admin_Dashboard**: Le tableau de bord de monitoring pour les administrateurs
- **Candidat**: Un utilisateur candidat aux concours
- **Commission**: Un membre de la commission d'évaluation
- **DGES**: Direction Générale de l'Enseignement Supérieur
- **Administrateur**: Un utilisateur avec droits d'administration du système
- **Template**: Un modèle de notification personnalisable
- **Notification_Event**: Un événement déclenchant une notification (inscription, validation, rejet, etc.)
- **Delivery_Status**: Le statut de livraison d'une notification (pending, sent, delivered, failed, bounced)
- **Notification_Type**: Le type de notification (email, in-app, ou les deux)
- **Priority_Level**: Le niveau de priorité d'une notification (low, normal, high, urgent)

## Requirements

### Requirement 1: Envoi d'Emails Transactionnels

**User Story:** En tant que Candidat, je veux recevoir des emails pour les événements importants (pré-inscription, validation, rejet), afin d'être informé de l'évolution de mon dossier.

#### Acceptance Criteria

1. WHEN une pré-inscription est créée, THE Email_Service SHALL envoyer un email de confirmation avec la fiche de pré-inscription en pièce jointe PDF
2. WHEN un dossier est validé par la Commission, THE Email_Service SHALL envoyer un email de convocation avec la convocation en pièce jointe PDF
3. WHEN un dossier est rejeté par la Commission, THE Email_Service SHALL envoyer un email de notification avec le motif du rejet
4. THE Email_Service SHALL supporter les pièces jointes PDF jusqu'à 5 MB
5. WHEN un email échoue à l'envoi, THE Retry_Handler SHALL réessayer l'envoi selon une stratégie exponentielle (1 min, 5 min, 15 min, 1 heure, 4 heures)
6. THE Email_Service SHALL enregistrer le statut de chaque email envoyé dans le Delivery_Tracker
7. WHEN un email est envoyé, THE Audit_Logger SHALL enregistrer l'événement avec l'horodatage, le destinataire, le type d'email, et le statut

### Requirement 2: Templates d'Emails Personnalisables

**User Story:** En tant qu'Administrateur, je veux gérer des templates d'emails personnalisables, afin d'adapter le contenu des communications sans modifier le code.

#### Acceptance Criteria

1. THE Template_Engine SHALL supporter les variables dynamiques dans les templates (nom, prénom, concours, numéro de dossier, date, lieu)
2. THE Template_Engine SHALL supporter le formatage HTML pour les emails
3. THE Template_Engine SHALL valider la syntaxe des templates avant leur sauvegarde
4. THE Admin_Dashboard SHALL permettre la création de nouveaux templates d'emails
5. THE Admin_Dashboard SHALL permettre la modification des templates existants
6. THE Admin_Dashboard SHALL permettre la prévisualisation des templates avec des données de test
7. THE Notification_System SHALL utiliser un template par défaut si le template personnalisé est invalide ou manquant

### Requirement 3: Notifications In-App en Temps Réel

**User Story:** En tant que Candidat, je veux voir mes notifications dans l'application, afin de consulter l'historique de mes communications sans chercher dans mes emails.

#### Acceptance Criteria

1. WHEN un événement de notification se produit, THE Notification_Service SHALL créer une notification in-app pour l'utilisateur concerné
2. THE Notification_Center SHALL afficher les notifications non lues avec un badge de compteur
3. THE Notification_Center SHALL permettre de marquer une notification comme lue
4. THE Notification_Center SHALL permettre de marquer toutes les notifications comme lues
5. THE Notification_Center SHALL afficher les notifications par ordre chronologique décroissant
6. THE Notification_Center SHALL permettre de filtrer les notifications par type (inscription, validation, rejet, système)
7. WHEN une nouvelle notification est créée, THE Notification_Service SHALL envoyer une mise à jour en temps réel via WebSocket au client connecté

### Requirement 4: Historique des Notifications

**User Story:** En tant que Candidat, je veux consulter l'historique complet de mes notifications, afin de retrouver des informations passées.

#### Acceptance Criteria

1. THE Notification_System SHALL conserver l'historique de toutes les notifications pendant au moins 2 ans
2. THE Notification_Center SHALL permettre de consulter les notifications archivées
3. THE Notification_Center SHALL afficher pour chaque notification la date d'envoi, le type, le contenu, et le statut de lecture
4. THE Notification_Center SHALL permettre la recherche dans l'historique par mot-clé
5. THE Notification_Center SHALL permettre la pagination de l'historique avec 20 notifications par page
6. WHEN un Candidat consulte une notification, THE Notification_Service SHALL enregistrer la date et l'heure de consultation

### Requirement 5: Gestion des Préférences Utilisateur

**User Story:** En tant que Candidat, je veux configurer mes préférences de notification, afin de choisir comment je souhaite être notifié.

#### Acceptance Criteria

1. THE Preference_Manager SHALL permettre à chaque utilisateur de configurer ses préférences de notification par type d'événement
2. THE Preference_Manager SHALL supporter les options suivantes pour chaque type d'événement : email uniquement, in-app uniquement, les deux, aucune
3. THE Preference_Manager SHALL appliquer les préférences utilisateur avant l'envoi de chaque notification
4. THE Notification_System SHALL toujours envoyer les notifications critiques (validation, rejet) indépendamment des préférences utilisateur
5. THE Preference_Manager SHALL sauvegarder les préférences utilisateur de manière persistante
6. THE Preference_Manager SHALL fournir des préférences par défaut pour les nouveaux utilisateurs (email et in-app activés pour tous les types)

### Requirement 6: File d'Attente et Traitement Asynchrone

**User Story:** En tant que système, je veux traiter les notifications de manière asynchrone, afin de ne pas bloquer les requêtes principales et d'assurer la scalabilité.

#### Acceptance Criteria

1. THE Queue_Manager SHALL placer chaque notification dans une file d'attente avant traitement
2. THE Queue_Manager SHALL traiter les notifications par ordre de priorité puis par ordre chronologique
3. THE Queue_Manager SHALL supporter les niveaux de priorité suivants : low, normal, high, urgent
4. THE Queue_Manager SHALL traiter les notifications urgentes dans un délai maximum de 30 secondes
5. THE Queue_Manager SHALL traiter les notifications normales dans un délai maximum de 5 minutes
6. THE Queue_Manager SHALL permettre le traitement parallèle de jusqu'à 10 notifications simultanément
7. WHEN la file d'attente contient plus de 1000 notifications en attente, THE Queue_Manager SHALL enregistrer une alerte dans les logs

### Requirement 7: Retry Automatique et Gestion des Échecs

**User Story:** En tant que système, je veux réessayer automatiquement l'envoi des notifications échouées, afin d'assurer la fiabilité de la communication.

#### Acceptance Criteria

1. WHEN une notification échoue à l'envoi, THE Retry_Handler SHALL programmer une nouvelle tentative selon une stratégie exponentielle
2. THE Retry_Handler SHALL effectuer un maximum de 5 tentatives pour chaque notification
3. WHEN toutes les tentatives échouent, THE Retry_Handler SHALL marquer la notification comme définitivement échouée
4. WHEN une notification échoue définitivement, THE Notification_System SHALL créer une alerte pour les Administrateurs
5. THE Retry_Handler SHALL enregistrer chaque tentative avec l'horodatage et le message d'erreur
6. THE Admin_Dashboard SHALL permettre de réessayer manuellement l'envoi d'une notification échouée
7. THE Retry_Handler SHALL respecter les limites de taux du serveur SMTP (maximum 100 emails par heure)

### Requirement 8: Suivi des Statuts de Livraison

**User Story:** En tant qu'Administrateur, je veux suivre les statuts de livraison des emails, afin d'identifier les problèmes de délivrabilité.

#### Acceptance Criteria

1. THE Delivery_Tracker SHALL enregistrer le statut de chaque email avec les valeurs possibles : pending, sent, delivered, failed, bounced
2. THE Delivery_Tracker SHALL mettre à jour le statut lorsque le serveur SMTP confirme la livraison
3. THE Delivery_Tracker SHALL enregistrer les bounces (emails rejetés) avec le code d'erreur SMTP
4. THE Admin_Dashboard SHALL afficher les statistiques de livraison par période (jour, semaine, mois)
5. THE Admin_Dashboard SHALL afficher le taux de livraison, le taux d'échec, et le taux de bounce
6. THE Admin_Dashboard SHALL permettre de filtrer les notifications par statut de livraison
7. WHEN le taux d'échec dépasse 10% sur une période de 24 heures, THE Notification_System SHALL créer une alerte pour les Administrateurs

### Requirement 9: Notifications pour la Commission

**User Story:** En tant que membre de la Commission, je veux être notifié des nouveaux dossiers à traiter, afin de traiter les candidatures rapidement.

#### Acceptance Criteria

1. WHEN un nouveau dossier est soumis, THE Notification_Service SHALL créer une notification in-app pour tous les membres de la Commission
2. WHEN un nouveau dossier est soumis, THE Email_Service SHALL envoyer un email récapitulatif quotidien à la Commission avec le nombre de nouveaux dossiers
3. THE Notification_System SHALL regrouper les notifications de nouveaux dossiers par concours
4. THE Notification_Center SHALL afficher le nombre de dossiers en attente de traitement pour chaque concours
5. WHEN un membre de la Commission consulte un dossier, THE Notification_Service SHALL marquer la notification correspondante comme traitée

### Requirement 10: Notifications pour la DGES

**User Story:** En tant que DGES, je veux recevoir des notifications statistiques, afin de suivre l'activité de la plateforme.

#### Acceptance Criteria

1. THE Notification_System SHALL envoyer un rapport hebdomadaire par email à la DGES avec les statistiques d'inscriptions
2. THE Notification_System SHALL envoyer un rapport mensuel par email à la DGES avec les statistiques globales de la plateforme
3. THE Notification_System SHALL inclure dans les rapports le nombre d'inscriptions, le nombre de validations, le nombre de rejets, et le taux de complétion des dossiers
4. THE Notification_System SHALL permettre à la DGES de configurer la fréquence des rapports (quotidien, hebdomadaire, mensuel)
5. THE Notification_System SHALL générer les rapports au format PDF en pièce jointe

### Requirement 11: Dashboard de Monitoring pour Administrateurs

**User Story:** En tant qu'Administrateur, je veux un dashboard de monitoring, afin de surveiller le bon fonctionnement du système de notifications.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL afficher le nombre total de notifications envoyées dans les dernières 24 heures
2. THE Admin_Dashboard SHALL afficher le nombre de notifications en file d'attente
3. THE Admin_Dashboard SHALL afficher le nombre de notifications échouées dans les dernières 24 heures
4. THE Admin_Dashboard SHALL afficher le temps moyen de traitement des notifications
5. THE Admin_Dashboard SHALL afficher un graphique de l'évolution du volume de notifications sur les 7 derniers jours
6. THE Admin_Dashboard SHALL afficher les alertes actives avec leur niveau de sévérité
7. THE Admin_Dashboard SHALL permettre de consulter les logs détaillés de chaque notification
8. THE Admin_Dashboard SHALL se rafraîchir automatiquement toutes les 30 secondes

### Requirement 12: Logs d'Audit et Conformité

**User Story:** En tant qu'Administrateur, je veux des logs d'audit complets, afin d'assurer la conformité et la traçabilité des communications.

#### Acceptance Criteria

1. THE Audit_Logger SHALL enregistrer chaque notification envoyée avec l'horodatage, l'expéditeur, le destinataire, le type, le contenu, et le statut
2. THE Audit_Logger SHALL enregistrer chaque accès aux données de notification avec l'utilisateur et l'horodatage
3. THE Audit_Logger SHALL enregistrer chaque modification de template avec l'utilisateur, l'horodatage, et les changements effectués
4. THE Audit_Logger SHALL enregistrer chaque modification de préférences utilisateur avec l'horodatage
5. THE Audit_Logger SHALL conserver les logs d'audit pendant au moins 3 ans
6. THE Admin_Dashboard SHALL permettre de rechercher dans les logs d'audit par utilisateur, date, type d'événement, ou mot-clé
7. THE Admin_Dashboard SHALL permettre d'exporter les logs d'audit au format CSV pour analyse externe

### Requirement 13: Migration Progressive depuis le Système Actuel

**User Story:** En tant que développeur, je veux migrer progressivement depuis le système actuel, afin de ne pas casser les fonctionnalités existantes pendant la transition.

#### Acceptance Criteria

1. THE Notification_System SHALL fournir une interface compatible avec les fonctions actuelles du Email_Service (envoyerEmailPreInscription, envoyerEmailConvocation, envoyerEmailRejet)
2. WHERE le nouveau système est activé, THE Notification_System SHALL utiliser le Queue_Manager et le Delivery_Tracker
3. WHERE le nouveau système est désactivé, THE Notification_System SHALL utiliser l'ancien système Nodemailer directement
4. THE Notification_System SHALL permettre l'activation progressive par type de notification (pré-inscription, validation, rejet)
5. THE Notification_System SHALL enregistrer les notifications envoyées par l'ancien système dans l'historique pour assurer la continuité
6. THE Notification_System SHALL permettre le rollback vers l'ancien système en cas de problème critique

### Requirement 14: Sécurité et Protection des Données

**User Story:** En tant qu'utilisateur, je veux que mes données de notification soient protégées, afin de garantir la confidentialité de mes informations.

#### Acceptance Criteria

1. THE Notification_System SHALL chiffrer les données sensibles dans les notifications (numéros de dossier, informations personnelles) au repos
2. THE Notification_System SHALL utiliser HTTPS pour toutes les communications réseau
3. THE Notification_System SHALL utiliser TLS pour les connexions SMTP
4. THE Notification_System SHALL masquer les adresses email dans les logs (afficher seulement les 3 premiers caractères et le domaine)
5. THE Notification_System SHALL permettre aux utilisateurs de supprimer leurs notifications après consultation
6. THE Notification_System SHALL supprimer automatiquement les notifications après 2 ans conformément au RGPD
7. THE Notification_System SHALL valider et assainir tous les contenus de notification pour prévenir les injections XSS

### Requirement 15: Performance et Scalabilité

**User Story:** En tant que système, je veux traiter efficacement un grand volume de notifications, afin de supporter la croissance de la plateforme.

#### Acceptance Criteria

1. THE Notification_System SHALL traiter au minimum 100 notifications par minute
2. THE Queue_Manager SHALL supporter une file d'attente de jusqu'à 10000 notifications
3. THE Notification_Center SHALL charger les notifications en moins de 500 millisecondes
4. THE Notification_Center SHALL utiliser la pagination pour limiter le nombre de notifications chargées simultanément
5. THE Notification_System SHALL utiliser un cache pour les templates fréquemment utilisés
6. THE Notification_System SHALL utiliser des index de base de données pour optimiser les requêtes de recherche dans l'historique
7. WHEN le volume de notifications dépasse 80% de la capacité maximale, THE Notification_System SHALL enregistrer une alerte dans les logs

---

**Note importante sur les parsers et serializers:**

Ce système n'inclut pas de parser ou serializer personnalisé. Les templates utilisent un moteur de template standard (comme Handlebars ou EJS) qui possède déjà ses propres mécanismes de parsing et de rendu. Les données JSON sont sérialisées et désérialisées par les bibliothèques standard de Node.js.
