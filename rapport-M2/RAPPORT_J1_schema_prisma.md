# RAPPORT J1 - Extension du schema Prisma Module 2

## 1. Ce qui a été fait

Le fichier `unipath-api/prisma/schema.prisma` a été étendu afin d'intégrer les fondations de la base de données du Module 2 de UniPath.

Les nouvelles structures ajoutées sont :

- `Etablissement`
- `Filiere`
- `InscriptionAcademique`
- `Resultat`
- `DiplomeLicence`
- `NiveauEtude`
- `TypeEtablissement`
- `Mention`

Le modèle existant `Candidat` du Module 1 a aussi été relié aux nouvelles tables du Module 2 grâce aux relations :

- `inscriptionsAcademiques`
- `diplomeLicence`

## 2. Choix techniques effectués et justification

Le modèle `Candidat` existant a été réutilisé comme base de l'étudiant au lieu de créer une nouvelle table `Etudiant`.

Ce choix permet de conserver la continuité avec le Module 1, où les candidats possèdent déjà un matricule, une identité, un email et des inscriptions aux concours.

Les niveaux d'étude ont été représentés par un enum Prisma `NiveauEtude` avec les valeurs :

- `L1`
- `L2`
- `L3`
- `M1`
- `M2`

Ce choix garantit que les inscriptions académiques ne peuvent utiliser que des niveaux valides.

Les mentions ont également été centralisées dans l'enum `Mention`, afin d'éviter les incohérences dans les résultats et diplômes.

Des index ont été ajoutés sur les colonnes fréquemment utilisées :

- `candidatId`
- `etablissementId`
- `filiereId`
- `niveau`
- `anneeAcademique`

Ces index faciliteront les recherches par étudiant, établissement, filière et année académique.

## 3. Fichiers concernés et modifications apportées

Fichier concerné :

- `unipath-api/prisma/schema.prisma`

Modifications apportées :

- Ajout des enums `NiveauEtude`, `TypeEtablissement` et `Mention`.
- Ajout du modèle `Etablissement`.
- Ajout du modèle `Filiere`.
- Ajout du modèle `InscriptionAcademique`.
- Ajout du modèle `Resultat`.
- Ajout du modèle `DiplomeLicence`.
- Ajout des relations Module 2 dans le modèle existant `Candidat`.

## 4. Difficultés rencontrées et résolution

La principale difficulté était de déterminer s'il fallait créer une nouvelle table `Etudiant` ou réutiliser le modèle `Candidat` déjà présent dans le Module 1.

La solution retenue a été de réutiliser `Candidat`, car le Module 1 contient déjà les informations nécessaires pour identifier un étudiant, notamment le matricule national.

Une autre attention importante concerne Supabase : certaines fonctionnalités comme les triggers PL/pgSQL et les politiques RLS ne sont pas représentées directement dans le schéma Prisma. Elles seront donc ajoutées séparément via Supabase SQL Editor, comme cela avait déjà été fait pour certaines requêtes SQL du Module 1.

## 5. Apport de cette étape au projet

Cette étape pose la base structurelle du Module 2.

Elle permet désormais de représenter dans la base de données :

- les établissements publics et privés ;
- les filières disponibles ;
- les inscriptions académiques annuelles ;
- les résultats des étudiants ;
- les diplômes de Licence nécessaires pour accéder au Master.

Elle prépare aussi les prochaines étapes du Module 2, notamment :

- les triggers de contrôle de progression ;
- la passerelle Licence vers Master ;
- la sécurité multi-établissement avec Supabase RLS ;
- les données de test avec `seed_m2.js`.
