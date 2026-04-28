# TESTS.md — Rapport de tests UniPath

## Module : Base de données (Vignon)

### Test DB-01 : Trigger matricule
- **Objectif** : Vérifier la génération automatique du matricule
- **Procédure** : Insertion directe SQL d'un candidat avec matricule='TEMP'
- **Résultat attendu** : matricule = 'UAC-2026-XXXXXX'
- **Résultat obtenu** : 

matricule       | nom       | prenom
UAC-2026-000021 | Dupont    | Marie

- **Statut** : PASS 

### Test DB-02 : Unicité des matricules
- **Objectif** : Vérifier l'unicité du matricule
- **Procédure** : Insertion de deux candidats avec matricule='TEMP'
- **Résultat attendu** : deux matricules distincts consécutifs
- **Résultat obtenu** :

matricule       | nom       
UAC-2026-000023 | KONE   
UAC-2026-000024 | SOW

### Test DB-03 : Format du matricule
- **Objectif** : Vérifier le format du matricule
- **Procédure** : Insertion directe SQL d'un candidat avec matricule='TEMP'
- **Résultat attendu** : matricule = 'UAC-2026-XXXXXX'
- **Résultat obtenu** : 

matricule       | nom       | prenom
UAC-2026-000025 | Bernard   | Paul

- **Statut** : PASS 


### Test DB-03 : Trigger conflit de dates
- **Objectif** : Vérifier le blocage lors d'une inscription conflictuelle
- **Procédure** : Inscription candidat1 au concours3 (conflit avec concours1)
- **Résultat attendu** : ERREUR PostgreSQL 'Conflit de dates'
- **Résultat obtenu** : [à remplir]
- **Statut** : PASS / FAIL
### Test DB-03 : Contrainte double inscription
- **Objectif** : Vérifier l'unicité (candidatId, concoursId)
- **Procédure** : Insertion d'une inscription déjà existante
- **Résultat attendu** : ERREUR contrainte unique
- **Résultat obtenu** : [à remplir]
- **Statut** : PASS / FAIL
### Test DB-04 : Vue statistique
- **Objectif** : Vérifier la cohérence des calculs de la vue
- **Procédure** : Comparaison vue vs comptage manuel
- **Résultat attendu** : Valeurs identiques
- **Résultat obtenu** : [à remplir]
- **Statut** : PASS / FAIL