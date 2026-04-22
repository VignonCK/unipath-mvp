# TESTS.md — Rapport de tests UniPath

## Module : API Backend (Harry)

### Test API-01 : Register valide
- **Objectif** : Vérifier la création d'un compte candidat
- **Procédure** : POST /api/auth/register avec données valides
- **Résultat attendu** : 201 avec matricule généré
- **Résultat obtenu** : 201 — { message: 'Compte créé avec succès', matricule: 'UAC-2026-XXXXXX' }
- **Statut** : ✅ PASS

### Test API-02 : Register email dupliqué
- **Objectif** : Vérifier le rejet d'un email déjà utilisé
- **Procédure** : POST /api/auth/register avec le même email qu'API-01
- **Résultat attendu** : 400 Bad Request
- **Résultat obtenu** : 400 — { error: 'User already registered' }
- **Statut** : ✅ PASS

### Test API-03 : Login valide
- **Objectif** : Vérifier la connexion et la génération du token JWT
- **Procédure** : POST /api/auth/login avec credentials valides
- **Résultat attendu** : 200 avec token JWT
- **Résultat obtenu** : 200 — { token: 'eyJhbG...' }
- **Statut** : ✅ PASS

### Test API-04 : Login mauvais mot de passe
- **Objectif** : Vérifier le rejet d'un mauvais mot de passe
- **Procédure** : POST /api/auth/login avec mauvais password
- **Résultat attendu** : 401 Unauthorized
- **Résultat obtenu** : 401 — { error: 'Email ou mot de passe incorrect' }
- **Statut** : ✅ PASS

### Test API-05 : Profil avec token valide
- **Objectif** : Vérifier l'accès au profil avec un token valide
- **Procédure** : GET /api/candidats/profil avec token JWT
- **Résultat attendu** : 200 avec données candidat
- **Résultat obtenu** : 200 — données candidat complètes
- **Statut** : ✅ PASS

### Test API-06 : Profil sans token
- **Objectif** : Vérifier le blocage sans token
- **Procédure** : GET /api/candidats/profil sans header Authorization
- **Résultat attendu** : 401 Unauthorized
- **Résultat obtenu** : 401 — { error: 'Accès refusé. Token manquant.' }
- **Statut** : ✅ PASS

### Test API-07 : Liste des concours
- **Objectif** : Vérifier la récupération de tous les concours
- **Procédure** : GET /api/concours avec token JWT
- **Résultat attendu** : 200 avec liste des concours
- **Résultat obtenu** : 200 — liste de 3 concours avec dates
- **Statut** : ✅ PASS

### Test API-08 : Inscription valide
- **Objectif** : Vérifier l'inscription à un concours
- **Procédure** : POST /api/inscriptions avec concoursId valide
- **Résultat attendu** : 201 Created
- **Résultat obtenu** : 201 — { message: 'Inscription créée avec succès' }
- **Statut** : ✅ PASS

### Test API-09 : Double inscription
- **Objectif** : Vérifier le blocage d'une double inscription
- **Procédure** : POST /api/inscriptions avec le même concoursId
- **Résultat attendu** : 409 Conflict
- **Résultat obtenu** : 409 — { error: 'Vous êtes déjà inscrit à ce concours.' }
- **Statut** : ✅ PASS

### Test API-10 : Conflit de dates
- **Objectif** : Vérifier le trigger anti-conflit de dates
- **Procédure** : POST /api/inscriptions avec concours dont les dates chevauchent
- **Résultat attendu** : 409 Conflict via trigger PostgreSQL
- **Résultat obtenu** : 409 — { error: 'Conflit de dates' }
- **Statut** : ✅ PASS

### Test API-11 : Upload fichier
- **Objectif** : Vérifier l'upload d'une pièce justificative
- **Procédure** : POST /api/dossier/upload avec fichier JPG
- **Résultat attendu** : 200 avec URL Supabase Storage
- **Résultat obtenu** : 200 — { message: 'photo uploadé avec succès', url: 'https://...supabase.co/...' }
- **Statut** : ✅ PASS

### Test API-12 : Validation dossier
- **Objectif** : Vérifier la validation d'un dossier par la commission
- **Procédure** : PATCH /api/commission/dossiers/:id avec statut VALIDE
- **Résultat attendu** : 200 avec email envoyé
- **Résultat obtenu** : 200 — { message: 'Dossier validé avec succès. Email de notification envoyé.' }
- **Statut** : ✅ PASS

### Test API-13 : Téléchargement PDF
- **Objectif** : Vérifier la génération de la convocation PDF en PHP
- **Procédure** : GET /api/candidats/convocation/:id avec inscription VALIDE
- **Résultat attendu** : 200 avec fichier PDF
- **Résultat obtenu** : 200 — fichier PDF généré avec couleurs du Bénin
- **Statut** : ✅ PASS

### Test API-14 : Dashboard DGES
- **Objectif** : Vérifier les statistiques via la vue SQL
- **Procédure** : GET /api/dges/statistiques avec token JWT
- **Résultat attendu** : 200 avec totaux et statistiques par concours
- **Résultat obtenu** : 200 — { totaux: {...}, statistiques: [...] }
- **Statut** : ✅ PASS