# 🎯 Instructions pour tester le système de protection des routes

## ✅ Ce qui a été fait

### 1. Système de protection des routes (Frontend)
- ✅ Création du composant `ProtectedRoute.jsx` avec vérification de rôle
- ✅ Modification de `authService.login()` pour stocker le token ET les infos user (incluant le rôle)
- ✅ Ajout de `authService.logout()` et `authService.getCurrentUser()`
- ✅ Mise à jour de `App.jsx` pour utiliser `ProtectedRoute` avec `allowedRoles`
- ✅ Modification de `Login.jsx` pour rediriger automatiquement selon le rôle après login
- ✅ Ajout des boutons de déconnexion sur tous les dashboards (Candidat, Commission, DGES)
- ✅ Création des guides de test : `TEST_RAPIDE.md` et `ROLE_PROTECTION_TEST.md`

### 2. Matrice de contrôle d'accès

| Route | Non connecté | CANDIDAT | COMMISSION | DGES |
|-------|--------------|----------|------------|------|
| `/dashboard` | ❌ → `/login` | ✅ | ❌ → `/commission` | ❌ → `/dges` |
| `/commission` | ❌ → `/login` | ❌ → `/dashboard` | ✅ | ❌ → `/dges` |
| `/dges` | ❌ → `/login` | ❌ → `/dashboard` | ✅ | ✅ |

### 3. Commits effectués
- `c4d9284` - "feat(frontend): ajout des boutons de déconnexion aux dashboards Commission et DGES + guide de test rapide"

## 🚀 Comment tester

### Étape 1 : Lancer le backend
```bash
cd unipath-api
node server.js
```
✅ Le backend est déjà lancé sur le port 3001

### Étape 2 : Lancer le frontend
```bash
cd unipath-front
npm run dev
```
⚠️ **Note** : Si vous avez une erreur de politique d'exécution PowerShell, lancez le frontend depuis un terminal Git Bash ou CMD.

### Étape 3 : Tester les 3 comptes

#### Test CANDIDAT
1. Ouvrir `http://localhost:5173/login`
2. Se connecter avec :
   - Email : `candidat@test.com`
   - Password : `password123`
3. **Résultat attendu** : Redirection automatique vers `/dashboard`
4. Essayer d'accéder à `http://localhost:5173/commission` dans la barre d'adresse
5. **Résultat attendu** : Redirection vers `/dashboard` (accès refusé)
6. Cliquer sur "Déconnexion"
7. **Résultat attendu** : Retour à `/login`

#### Test COMMISSION
1. Se connecter avec :
   - Email : `commission@test.com`
   - Password : `password123`
2. **Résultat attendu** : Redirection automatique vers `/commission`
3. Essayer d'accéder à `http://localhost:5173/dashboard`
4. **Résultat attendu** : Redirection vers `/commission` (accès refusé)
5. Essayer d'accéder à `http://localhost:5173/dges`
6. **Résultat attendu** : Accès autorisé ✅ (Commission peut voir les stats)

#### Test DGES
1. Se connecter avec :
   - Email : `dges@test.com`
   - Password : `password123`
2. **Résultat attendu** : Redirection automatique vers `/dges`
3. Essayer d'accéder à `http://localhost:5173/commission`
4. **Résultat attendu** : Redirection vers `/dges` (accès refusé)

### Étape 4 : Vérifier le localStorage

1. Ouvrir DevTools (F12)
2. Aller dans Application → Local Storage → `http://localhost:5173`
3. Après login, vous devriez voir :
   - `token` : Le JWT token
   - `user` : Un objet JSON avec `email`, `role`, `nom`, `prenom`, `matricule` (pour candidat)

### Étape 5 : Test de persistance

1. Se connecter en tant que CANDIDAT
2. Appuyer sur F5 (rafraîchir la page)
3. **Résultat attendu** : Reste connecté sur `/dashboard`

## 📊 Résumé du système

### Frontend
- **ProtectedRoute** : Vérifie le token et le rôle avant d'afficher une page
- **authService** : Gère le login, logout, et stockage du token + user dans localStorage
- **Login** : Redirige automatiquement vers le bon dashboard selon le rôle
- **Dashboards** : Tous ont un bouton de déconnexion

### Backend (déjà implémenté)
- **Middleware auth** : Vérifie le token JWT
- **Middleware role** : Vérifie que l'utilisateur a le bon rôle
- **Routes protégées** : Chaque route est protégée selon le rôle requis

## 🎉 Prochaines étapes (optionnel)

1. **Améliorer l'UX** : Afficher un message d'erreur quand l'utilisateur tente d'accéder à une route non autorisée
2. **Page 403** : Créer une page "Accès refusé" personnalisée
3. **Timeout** : Déconnecter automatiquement après X minutes d'inactivité
4. **Sécurité** : Ajouter un refresh token pour renouveler le token JWT

## 📝 Notes importantes

- Le système est maintenant **complètement fonctionnel** côté frontend
- Le backend était déjà sécurisé avec les middlewares de rôle
- Les 3 comptes de test sont disponibles (voir `unipath-api/prisma/seed-roles.js`)
- Le localStorage stocke maintenant le token ET les infos user (incluant le rôle)
- Chaque dashboard a son propre bouton de déconnexion

## 🐛 Problèmes courants

**Erreur : "Erreur parsing user"**
- Le format JSON dans localStorage est corrompu
- Solution : Déconnexion et reconnexion

**Redirection infinie**
- Le rôle dans localStorage ne correspond pas au rôle dans la base
- Solution : Vider le localStorage et se reconnecter

**Accès refusé (403) depuis le backend**
- Le token JWT ne contient pas le bon rôle
- Solution : Vérifier que le backend retourne bien le rôle dans la réponse login

**Frontend ne démarre pas (PowerShell)**
- Politique d'exécution PowerShell bloque npm
- Solution : Lancer depuis Git Bash ou CMD
