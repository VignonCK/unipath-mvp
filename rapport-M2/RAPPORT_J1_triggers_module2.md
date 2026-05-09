# RAPPORT J1 - Création des triggers métier du Module 2

## 1. Ce qui a été fait

Deux triggers PostgreSQL ont été créés dans Supabase afin d'appliquer les règles métier principales du Module 2.

Les triggers créés sont :

- `trg_controle_progression`
- `trg_passerelle_master`

Le trigger `trg_controle_progression` utilise la fonction `check_progression_niveau()`.

Le trigger `trg_passerelle_master` utilise la fonction `check_passerelle_master()`.

## 2. Choix techniques effectués et justification

Les règles métier critiques ont été implémentées directement au niveau de la base de données avec PL/pgSQL.

Ce choix permet de garantir que les règles sont appliquées même si les données sont insérées depuis un autre canal que l'API Node.js, par exemple depuis Supabase SQL Editor, un script seed ou un outil d'administration.

Le trigger de progression bloque automatiquement l'inscription à un niveau supérieur si le niveau précédent n'a pas été validé.

La progression contrôlée est la suivante :

- `L2` nécessite `L1` validé ;
- `L3` nécessite `L2` validé ;
- `M1` nécessite `L3` validé ;
- `M2` nécessite `M1` validé.

Le trigger de passerelle Master ajoute une vérification spécifique pour l'accès au niveau `M1`. Même si l'étudiant a validé `L3`, il doit aussi posséder un diplôme de Licence vérifié dans la table `DiplomeLicence`.

## 3. Fichiers concernés et modifications apportées

Aucun fichier source du projet n'a été modifié pendant cette étape.

Les modifications ont été appliquées directement dans Supabase SQL Editor.

Objets créés en base :

- fonction PostgreSQL `check_progression_niveau()`
- trigger PostgreSQL `trg_controle_progression`
- fonction PostgreSQL `check_passerelle_master()`
- trigger PostgreSQL `trg_passerelle_master`

Table concernée par les triggers :

- `InscriptionAcademique`

Tables consultées par les fonctions :

- `Resultat`
- `DiplomeLicence`

## 4. Difficultés rencontrées et résolution

La principale attention technique concernait l'ordre logique des vérifications.

Pour une inscription en `M1`, deux conditions doivent être respectées :

- le niveau `L3` doit être validé ;
- un diplôme de Licence vérifié doit exister.

La résolution a consisté à séparer ces deux responsabilités dans deux triggers différents. Cela rend la logique plus lisible et facilite les tests séparés.

Une autre précaution a été d'ajouter `DROP TRIGGER IF EXISTS` avant la création de chaque trigger. Cela permet de rejouer le script sans provoquer d'erreur si le trigger existe déjà.

## 5. Apport de cette étape au projet

Cette étape sécurise les règles académiques fondamentales du Module 2 directement au niveau de la base de données.

Elle empêche :

- l'inscription à un niveau supérieur sans validation du niveau précédent ;
- l'accès au Master sans diplôme de Licence vérifié.

Le projet gagne ainsi en cohérence, car les règles de progression ne dépendent pas uniquement du frontend ou de l'API.

Cette étape prépare aussi les tests métier du Module 2 et les futures routes backend d'inscription académique.
