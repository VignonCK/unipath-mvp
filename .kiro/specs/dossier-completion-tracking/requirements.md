# Document d'Exigences - Suivi de Complétude des Dossiers

## Introduction

Cette fonctionnalité ajoute deux capacités essentielles à la plateforme UniPath :
1. **Indicateur de complétude du dossier** - Permet aux candidats de visualiser le pourcentage de completion de leur dossier d'inscription
2. **Historique des actions** - Assure la traçabilité des décisions prises sur les dossiers par les membres de la commission et la DGES

Ces fonctionnalités s'intègrent dans l'architecture existante avec PHP au cœur de la logique métier, Node.js pour l'API backend, et React pour l'interface utilisateur.

## Glossaire

- **Système_Completion** : Module PHP responsable du calcul de complétude des dossiers
- **Système_Historique** : Module PHP responsable de la traçabilité des actions
- **API_Backend** : API Node.js existante qui expose les endpoints
- **Interface_Candidat** : Interface React pour les candidats
- **Interface_Commission** : Interface React pour les membres de la commission
- **Pièce_Justificative** : Document requis (acteNaissance, carteIdentite, photo, releve, quittance)
- **Action_Dossier** : Opération effectuée sur un dossier (validation, rejet, modification)
- **Pourcentage_Completion** : Ratio des pièces déposées sur le total requis (5 pièces)

## Exigences

### Exigence 1 : Calcul de Complétude des Dossiers

**User Story :** En tant que candidat, je veux voir le pourcentage de complétude de mon dossier, afin de savoir quelles pièces il me reste à déposer.

#### Critères d'Acceptation

1. WHEN un candidat consulte son dossier, THE Système_Completion SHALL calculer le pourcentage basé sur les 5 pièces justificatives
2. THE Système_Completion SHALL retourner un pourcentage entre 0% et 100% (0/5 = 0%, 5/5 = 100%)
3. WHEN une pièce justificative est ajoutée ou supprimée, THE Système_Completion SHALL recalculer automatiquement le pourcentage
4. THE API_Backend SHALL exposer le pourcentage via un endpoint PHP dédié
5. THE Interface_Candidat SHALL afficher le pourcentage avec une barre de progression visuelle

### Exigence 2 : Affichage Détaillé des Pièces Manquantes

**User Story :** En tant que candidat, je veux voir la liste détaillée des pièces déposées et manquantes, afin de compléter efficacement mon dossier.

#### Critères d'Acceptation

1. THE Système_Completion SHALL identifier chaque pièce comme "déposée" ou "manquante"
2. WHEN le candidat consulte son dossier, THE Interface_Candidat SHALL afficher la liste des 5 pièces avec leur statut
3. THE Interface_Candidat SHALL utiliser des indicateurs visuels (icônes, couleurs) pour distinguer les pièces déposées des manquantes
4. WHEN une pièce est manquante, THE Interface_Candidat SHALL afficher un lien direct pour la déposer

### Exigence 3 : Traçabilité des Actions sur les Dossiers

**User Story :** En tant qu'administrateur DGES, je veux consulter l'historique complet des actions effectuées sur chaque dossier, afin d'assurer la traçabilité et la transparence du processus.

#### Critères d'Acceptation

1. WHEN un membre de la commission valide ou rejette un dossier, THE Système_Historique SHALL enregistrer l'action avec l'utilisateur, la date et l'heure
2. WHEN un candidat modifie son dossier, THE Système_Historique SHALL enregistrer la modification avec les détails
3. THE Système_Historique SHALL stocker pour chaque action : utilisateur_id, type_action, dossier_id, timestamp, détails_optionnels
4. THE API_Backend SHALL exposer l'historique via un endpoint PHP sécurisé
5. THE Interface_Commission SHALL permettre de consulter l'historique d'un dossier spécifique

### Exigence 4 : Sécurité et Contrôle d'Accès pour l'Historique

**User Story :** En tant que membre de la commission, je veux que seuls les utilisateurs autorisés puissent consulter l'historique des actions, afin de protéger la confidentialité des données.

#### Critères d'Acceptation

1. THE Système_Historique SHALL vérifier les permissions avant d'exposer les données d'historique
2. WHEN un utilisateur avec le rôle CANDIDAT tente d'accéder à l'historique, THE Système_Historique SHALL refuser l'accès
3. WHEN un utilisateur avec le rôle COMMISSION ou DGES accède à l'historique, THE Système_Historique SHALL autoriser la consultation
4. THE API_Backend SHALL authentifier et autoriser chaque requête d'historique
5. IF une tentative d'accès non autorisé est détectée, THEN THE Système_Historique SHALL enregistrer l'incident

### Exigence 5 : Performance et Optimisation des Calculs

**User Story :** En tant qu'utilisateur de la plateforme, je veux que les calculs de complétude et l'affichage de l'historique soient rapides, afin d'avoir une expérience fluide.

#### Critères d'Acceptation

1. THE Système_Completion SHALL calculer le pourcentage de complétude en moins de 100ms
2. THE Système_Historique SHALL retourner l'historique d'un dossier en moins de 200ms
3. WHEN plusieurs candidats consultent simultanément leur complétude, THE Système_Completion SHALL maintenir des performances acceptables
4. THE API_Backend SHALL implémenter une mise en cache appropriée pour les calculs fréquents
5. THE Système_Completion SHALL optimiser les requêtes de base de données pour éviter les N+1 queries

### Exigence 6 : Intégration avec l'Architecture Existante

**User Story :** En tant que développeur, je veux que les nouvelles fonctionnalités s'intègrent harmonieusement avec l'architecture existante, afin de maintenir la cohérence du système.

#### Critères d'Acceptation

1. THE Système_Completion SHALL utiliser PHP pour toute la logique métier de calcul
2. THE Système_Historique SHALL utiliser PHP pour la gestion des données de traçabilité
3. THE API_Backend SHALL exposer les endpoints via Node.js en appelant les modules PHP
4. THE Interface_Candidat SHALL utiliser JavaScript/React uniquement pour l'affichage et l'interaction utilisateur
5. THE Système_Completion SHALL s'appuyer sur le schéma Prisma existant (table Dossier) sans modifications structurelles

### Exigence 7 : Notifications de Complétude

**User Story :** En tant que candidat, je veux être informé quand mon dossier est complet, afin de savoir que ma candidature peut être évaluée.

#### Critères d'Acceptation

1. WHEN le pourcentage de complétude atteint 100%, THE Interface_Candidat SHALL afficher une notification de succès
2. THE Interface_Candidat SHALL indiquer clairement que le dossier est prêt pour évaluation
3. WHEN le dossier passe de incomplet à complet, THE Système_Completion SHALL déclencher une notification visuelle
4. THE Interface_Candidat SHALL permettre au candidat de soumettre officiellement son dossier complet
5. WHEN le dossier est soumis, THE Système_Historique SHALL enregistrer l'action de soumission

### Exigence 8 : Audit et Rapports d'Historique

**User Story :** En tant qu'administrateur DGES, je veux générer des rapports d'audit sur les actions effectuées, afin de superviser le processus d'évaluation.

#### Critères d'Acceptation

1. THE Système_Historique SHALL permettre de filtrer les actions par période, utilisateur, ou type d'action
2. THE API_Backend SHALL exposer un endpoint pour générer des rapports d'audit au format JSON
3. THE Interface_Commission SHALL permettre d'exporter l'historique au format CSV
4. THE Système_Historique SHALL conserver l'historique pendant au moins 5 ans pour conformité
5. WHEN un rapport est généré, THE Système_Historique SHALL inclure des statistiques agrégées (nombre d'actions par type, par utilisateur)