# DATABASE.md

## Documentation de la base de données UniPath

Ce document décrit la structure, les triggers et les vues principales de la base de données utilisée dans le projet UniPath.

### 1. Modèles principaux (tables)
- **Candidat** : Représente un bachelier qui s’inscrit à un concours.
- **Concours** : Un concours d’entrée à l’université.
- **Inscription** : Liaison entre un Candidat et un Concours.
- **Dossier** : Pièces justificatives d’un candidat.

### 2. Triggers
- **Génération automatique du matricule** : Attribue un matricule unique à chaque nouveau candidat.
- **Contrôle des conflits de dates** : Empêche un candidat de s’inscrire à deux concours dont les dates se chevauchent.

### 3. Vue statistique
- **v_statistiques_dges** : Vue pour obtenir les statistiques en temps réel sur les concours (nombre d’inscrits, dossiers validés, rejetés, en attente, taux de validation, etc.).

### 4. Requêtes utiles
- Pour consulter les statistiques :
  ```sql
  SELECT * FROM v_statistiques_dges;
  ```

---

# Documentation de la Base de Données — UniPath
## Schéma général
La base de données est hébergée sur Supabase (PostgreSQL 15).
Elle est gérée via Prisma ORM.
## Tables
### Candidat
Stocke les informations personnelles des bacheliers.
- `id` : identifiant unique (UUID généré automatiquement)
- `matricule` : généré automatiquement par le trigger `trg_matricule`
- `email` : unique, sert d'identifiant de connexion

### Concours
Représente un concours d'entrée à l'université.
- `dateDebut` / `dateFin` : utilisées par le trigger anti-conflit

### Inscription
Table de liaison entre Candidat et Concours.
- Contrainte `@@unique([candidatId, concoursId])` : empêche la double inscription
- `statut` : EN_ATTENTE → VALIDE ou REJETE (géré par la commission)

### Dossier
Stocke les URLs des pièces justificatives (hébergées sur Supabase Storage).

## Triggers
| Nom               | Table       | Déclencheur   | Rôle                                |
|-----              |-------      |-------------  |------                               |
| trg_matricule     | Candidat    | BEFORE INSERT | Génère le matricule UAC-YYYY-XXXXXX |
| trg_conflit_dates | Inscription | BEFORE INSERT | Bloque si conflit de dates          |

## Vues
| Nom                   | Description |
|-----                  |-------------|
| v_statistiques_dges   | Statistiques agrégées par concours pour le tableau de bord DGES
|

## Choix techniques justifiés
- **UUID** comme clé primaire : évite les attaques par énumération
- **Triggers** plutôt que logique applicative : garantit l'intégrité même
si plusieurs applications accèdent à la DB
- **Supabase** : PostgreSQL managé, évite la configuration d'un serveur dédié

Pour plus de détails sur chaque table, trigger ou vue, se référer au schéma Prisma (prisma/schema.prisma) et aux scripts SQL dans Supabase.

## Seeds de test
Fichier : prisma/seed.js
Commande : npx prisma db seed
Données insérées :
| Table       | Nombre | Description |
|-------      |--------|-------------|
| Concours    | 3      | Dont 1 paire avec dates en conflit (test trigger) |
| Candidat    | 5      | Candidats fictifs avec données complètes          |
| Inscription | 3      | Avec statuts variés pour tests commission         |

## Supabase Storage
Bucket : dossiers-candidats (privé)
Contenu : Pièces justificatives des candidats
Politiques : Upload et lecture réservés aux utilisateurs authentifiés

## Mise à jour Jours 6-7

### Vue v_statistiques_dges (enrichie)
La vue a été mise à jour pour inclure :
- concours_id : UUID du concours (pour les requêtes frontend)
- description : Description du concours
- dateDebut / dateFin : Dates du concours

### Nouvelle route API
GET /api/dges/statistiques — interroge v_statistiques_dges via $queryRaw Prisma
GET /api/dges/statistiques/:id — statistiques d'un concours spécifique

### Note sur $queryRaw
Prisma ne supporte pas nativement les vues SQL comme models.
On utilise prisma.$queryRaw pour interroger directement les vues PostgreSQL.
Cette approche est documentée : https://www.prisma.io/docs/concepts/components/prisma-client/raw-database-access

