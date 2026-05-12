# RAPPORT J1 - Création et exécution du seed Module 2

## 1. Ce qui a été fait

Un fichier `seed_m2.js` a été créé afin d'insérer des données de démonstration pour le Module 2.

Le seed insère :

- 2 établissements ;
- 3 filières ;
- 5 étudiants ;
- plusieurs inscriptions académiques ;
- des résultats annuels ;
- un diplôme de Licence vérifié pour tester l'accès au Master.

Le seed a ensuite été exécuté avec succès avec la commande :

```bash
node prisma/seed_m2.js

Ce fichier permet d'insérer :

2 établissements ;
3 filières ;
5 étudiants ;
des inscriptions académiques ;
des résultats ;
un diplôme de Licence vérifié ;
un parcours permettant de tester la passerelle Licence vers Master.
2.1. Données établissements créées
Deux établissements ont été ajoutés :

Code	Nom	Type	Ville
EPAC	Ecole Polytechnique d Abomey-Calavi	PUBLIC	Abomey-Calavi
ESATIC	Ecole Superieure Africaine des TIC	PRIVE	Cotonou
Des identifiants fixes ont été utilisés pour ces établissements afin de faciliter les futurs tests RLS.

2.2. Données filières créées
Trois filières ont été créées :

Filière	Etablissement	Durée
Genie Informatique	EPAC	5 ans
Genie Civil	EPAC	5 ans
Developpement Logiciel	ESATIC	3 ans
Ces filières permettent de tester plusieurs cas :

plusieurs filières dans un même établissement ;
une filière dans un établissement privé ;
des parcours Licence et Licence-Master.
2.3. Données étudiants créées
Cinq étudiants de démonstration ont été préparés à partir du modèle existant Candidat.

Etudiant	Email	Parcours utilisé
Kofi MENSAH	kofi.mensah@test.bj	L1 validé puis L2
Ama KONE	ama.kone@test.bj	L1 validé, L2 validé puis L3
Seun ADEYEMI	seun.adeyemi@test.bj	L1 non validé
Fatou DIALLO	fatou.diallo@test.bj	L1 validé
Joel AHOUANSOU	joel.ahouansou@test.bj	L1, L2, L3 validés puis M1
Le modèle Candidat a été réutilisé afin de conserver la continuité avec le Module 1.

2.4. Parcours académiques créés
Les parcours ont été construits pour respecter les règles métier définies par les triggers.

Exemples :

Kofi peut passer en L2 car son résultat L1 est validé.
Ama peut passer en L3 car ses résultats L1 et L2 sont validés.
Seun reste en L1 car son résultat n'est pas validé.
Joel peut accéder au M1 car il a validé L1, L2 et L3, puis possède un diplôme de Licence vérifié.
2.5. Respect des triggers métier
Le seed respecte les deux triggers créés précédemment :

Trigger trg_controle_progression
Ce trigger interdit une inscription en niveau supérieur si le niveau précédent n'a pas été validé.

Le seed crée donc toujours les résultats validés avant d'inscrire un étudiant au niveau suivant.

Trigger trg_passerelle_master
Ce trigger interdit une inscription en M1 si l'étudiant ne possède pas de diplôme de Licence vérifié.

Le seed crée donc un DiplomeLicence vérifié pour Joel avant son inscription en M1.

3. Choix techniques effectués
Le seed Module 2 a été placé dans un fichier séparé :

prisma/seed_m2.js
Ce choix permet de séparer les données du Module 1 et celles du Module 2.

La configuration Prisma dans package.json a été mise à jour pour permettre un seed complet :

"prisma": {
  "seed": "node prisma/seed.js && node prisma/seed_m2.js"
}
Cependant, pendant les tests du Module 2, seule la commande suivante a été exécutée :

node prisma/seed_m2.js
Cela évite de relancer le seed complet du Module 1 et de réinitialiser inutilement toutes les données existantes.

4. Fichiers concernés
Les fichiers concernés sont :

unipath-api/prisma/seed_m2.js
unipath-api/package.json
unipath-api/.env
Modifications réalisées :

création du fichier seed_m2.js ;
ajout de la commande seed Module 2 dans package.json ;
ajustement de DATABASE_URL pour permettre la connexion Prisma à Supabase via le pooler.
5. Difficultés rencontrées
La première exécution du seed a échoué avec l'erreur suivante :

Can't reach database server at aws-0-eu-west-1.pooler.supabase.com:5432
Un test réseau a été effectué avec PowerShell :

Test-NetConnection aws-0-eu-west-1.pooler.supabase.com -Port 5432
Le résultat obtenu était :

TcpTestSucceeded : True
Cela a confirmé que le réseau fonctionnait correctement.

La cause venait donc de la configuration de DATABASE_URL.

6. Résolution du problème
La variable DATABASE_URL a été ajustée en ajoutant les paramètres nécessaires au fonctionnement de Prisma avec Supabase Pooler :

?pgbouncer=true&connection_limit=1
Après cette correction, le seed a été relancé avec succès.

7. Résultat obtenu
La commande exécutée est :

node prisma/seed_m2.js
Résultat obtenu :

Seed Module 2 en cours...
Anciennes donnees Module 2 supprimees
Etablissements et filieres crees
Candidats de demonstration prets
Parcours academiques crees
Seed Module 2 termine avec succes
Le seed Module 2 est donc fonctionnel.

8. Apport de cette étape au projet
Cette étape apporte un jeu de données complet pour tester le Module 2.

Elle permet de vérifier :

la création des établissements ;
la création des filières ;
les inscriptions académiques ;
les résultats ;
le contrôle de progression ;
la passerelle Licence vers Master ;
la cohérence entre Prisma et Supabase.
Elle prépare également le travail des autres membres du groupe, notamment :

le backend, pour tester les futures routes API ;
le frontend, pour afficher des données réelles dans les interfaces Module 2 ;
la DGES, pour exploiter plus tard les statistiques académiques.
9. Conclusion
La mise en place du seed Module 2 finalise la première base de données exploitable pour le suivi académique.

Les données insérées permettent de tester les règles principales du Module 2 et de poursuivre le développement des routes backend et des interfaces frontend sur une base réaliste.


