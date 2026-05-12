# RAPPORT J1 - Configuration RLS du Module 2

## 1. Ce qui a été fait

Le Row Level Security a été activé dans Supabase sur les tables sensibles du Module 2 :

- `InscriptionAcademique`
- `Resultat`

Des politiques RLS ont été créées pour contrôler les opérations suivantes :

- lecture ;
- insertion ;
- modification ;
- suppression.

Ces politiques permettent à un établissement connecté de manipuler uniquement ses propres données académiques.

## 2. Choix techniques effectués et justification

La stratégie retenue est basée sur l'identifiant Supabase Auth de l'utilisateur connecté.

La règle principale appliquée est :

```sql
"etablissementId" = auth.uid()::text

Ce choix est conforme à la documentation du Module 2, qui prévoit un fonctionnement multi-tenancy par établissement.

Pour la table InscriptionAcademique, le contrôle est direct, car elle contient la colonne etablissementId.

Pour la table Resultat, le contrôle est indirect. Un résultat est lié à une inscription académique via inscriptionAcademiqueId. Les politiques RLS utilisent donc une requête EXISTS pour vérifier que l'inscription associée appartient bien à l'établissement connecté.

Les policies ont été séparées par opération (SELECT, INSERT, UPDATE, DELETE) afin de rendre le comportement plus lisible et plus facile à tester.

3. Fichiers concernés et modifications apportées
Aucun fichier source du projet n'a été modifié pendant cette étape.

Les modifications ont été appliquées directement dans Supabase SQL Editor.

Tables concernées :

InscriptionAcademique
Resultat
Politiques créées sur InscriptionAcademique :

etablissement_select_inscriptions
etablissement_insert_inscriptions
etablissement_update_inscriptions
etablissement_delete_inscriptions
Politiques créées sur Resultat :

etablissement_select_resultats
etablissement_insert_resultats
etablissement_update_resultats
etablissement_delete_resultats
4. Difficultés rencontrées et résolution
La difficulté principale était de choisir comment relier l'utilisateur Supabase connecté à un établissement.

L'approche retenue est l'option simple et conforme à la documentation : l'identifiant Etablissement.id doit correspondre à l'identifiant Supabase Auth du compte établissement.

Cette contrainte devra être respectée lors de la création des comptes établissements ou lors du seed Module 2.

Une autre difficulté concernait la table Resultat, qui ne possède pas directement de colonne etablissementId. La solution a été d'utiliser une sous-requête EXISTS pour retrouver l'établissement à travers la table InscriptionAcademique.

5. Apport de cette étape au projet
Cette étape ajoute une couche de sécurité essentielle au Module 2.

Elle garantit qu'un établissement ne peut accéder qu'aux inscriptions académiques et résultats qui lui appartiennent.

Elle prépare le développement sécurisé de l'espace établissement dans le frontend et des routes backend associées.

Elle contribue aussi au respect du principe de multi-tenancy, important pour une plateforme utilisée par plusieurs établissements publics et privés.