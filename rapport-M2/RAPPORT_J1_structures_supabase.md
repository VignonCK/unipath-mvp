# RAPPORT J1 - Création des structures Supabase du Module 2

## 1. Ce qui a été fait

Les structures principales de la base de données du Module 2 ont été créées directement dans Supabase via le SQL Editor.

Les éléments créés sont :

- l'enum `NiveauEtude`
- l'enum `TypeEtablissement`
- l'enum `Mention`
- la table `Etablissement`
- la table `Filiere`
- la table `InscriptionAcademique`
- la table `Resultat`
- la table `DiplomeLicence`

Des contraintes de clés primaires, clés étrangères, contraintes uniques et index ont également été ajoutés.

## 2. Choix techniques effectués et justification

La création des structures a été faite via Supabase SQL Editor au lieu d'utiliser directement `prisma migrate dev`.

Ce choix a été fait parce que Prisma a détecté un écart entre l'historique local des migrations et l'état réel de la base Supabase. La commande Prisma proposait un reset du schéma public, ce qui aurait supprimé les données existantes.

L'utilisation de Supabase SQL Editor permet donc d'ajouter les tables du Module 2 sans risquer de perdre les données ou les objets déjà créés lors du Module 1.

Les identifiants ont été définis en `TEXT` avec une valeur par défaut `gen_random_uuid()::text`, afin de rester compatibles avec le type `String` utilisé dans Prisma.

## 3. Fichiers concernés et modifications apportées

Aucun fichier source du projet n'a été modifié lors de cette étape.

Les modifications ont été appliquées directement dans la base Supabase :

- création des enums PostgreSQL ;
- création des tables Module 2 ;
- ajout des contraintes relationnelles ;
- ajout des index nécessaires aux futures requêtes.

Le fichier Prisma concerné conceptuellement reste :

- `unipath-api/prisma/schema.prisma`

Il sert de référence applicative pour Prisma Client, tandis que Supabase contient maintenant les structures physiques correspondantes.

## 4. Difficultés rencontrées et résolution

La difficulté principale a été le blocage de Prisma causé par un drift entre la base Supabase et les migrations locales.

Prisma a détecté qu'une migration déjà appliquée en base, `20260507095359_add_pieces_extras`, était absente du dossier local `prisma/migrations`.

Pour éviter tout reset destructif, la solution retenue a été de créer les structures Module 2 directement dans Supabase SQL Editor, conformément à l'approche déjà utilisée dans le Module 1 pour certaines requêtes SQL spécifiques.

Supabase a également affiché un avertissement indiquant que les nouvelles tables n'avaient pas encore le Row Level Security activé. Cet avertissement a été accepté car la configuration RLS est prévue dans une étape dédiée juste après les triggers.

## 5. Apport de cette étape au projet

Cette étape rend la base Supabase prête à stocker les données principales du parcours académique.

Elle permet maintenant de représenter :

- les établissements universitaires ;
- les filières de formation ;
- les inscriptions académiques par année ;
- les résultats des étudiants ;
- les diplômes de Licence nécessaires pour l'accès au Master.

Elle prépare les prochaines étapes du Module 2 :

- ajout des triggers de contrôle de progression ;
- ajout du trigger de passerelle Licence vers Master ;
- activation du RLS multi-établissement ;
- insertion des données de test avec `seed_m2.js`.
