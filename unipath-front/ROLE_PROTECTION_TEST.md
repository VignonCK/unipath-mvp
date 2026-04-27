# 🔒 Test de protection des routes par rôle

## 📋 Checklist de test

### 1. Test sans connexion (utilisateur non authentifié)

- [ ] Accéder à `http://localhost:5173/` → ✅ Page d'accueil visible
- [ ] Accéder à `http://localhost:5173/login` → ✅ Page de login visible
- [ ] Accéder à `http://localhost:5173/register` → ✅ Page d'inscription visible
- [ ] Accéder à `http://localhost:5173/dashboard` → ❌ Redirection vers `/login`
- [ ] Accéder à `http://localhost:5173/commission` → ❌ Redirection vers `/login`
- [ ] Accéder à `http://localhost:5173/dges` → ❌ Redirection vers `/login`

### 2. Test avec compte CANDIDAT

**Connexion :**
- Email: `candidat@test.com`
- Password: `password123`

**Tests :**
- [ ] Login → ✅ Redirection automatique vers `/dashboard`
- [ ] Accéder à `/dashboard` → ✅ Dashboard candidat visible
- [ ] Accéder à `/commission` → ❌ Redirection vers `/dashboard`
- [ ] Accéder à `/dges` → ❌ Redirection vers `/dashboard`
- [ ] Déconnexion → ✅ Retour à `/login` et token supprimé

### 3. Test avec compte COMMISSION

**Connexion :**
- Email: `commission@test.com`
- Password: `password123`

**Tests :**
- [ ] Login → ✅ Redirection automatique vers `/commission`
- [ ] Accéder à `/commission` → ✅ Dashboard commission visible
- [ ] Accéder à `/dges` → ✅ Dashboard DGES visible (Commission peut voir les stats)
- [ ] Accéder à `/dashboard` → ❌ Redirection vers `/commission`
- [ ] Déconnexion → ✅ Retour à `/login` et token supprimé

### 4. Test avec compte DGES

**Connexion :**
- Email: `dges@test.com`
- Password: `password123`

**Tests :**
- [ ] Login → ✅ Redirection automatique vers `/dges`
- [ ] Accéder à `/dges` → ✅ Dashboard DGES visible
- [ ] Accéder à `/dashboard` → ❌ Redirection vers `/dges`
- [ ] Accéder à `/commission` → ❌ Redirection vers `/dges`
- [ ] Déconnexion → ✅ Retour à `/login` et token supprimé

### 5. Test de persistance

- [ ] Se connecter en tant que CANDIDAT
- [ ] Rafraîchir la page (F5) → ✅ Reste connecté sur `/dashboard`
- [ ] Fermer l'onglet et rouvrir → ✅ Toujours connecté
- [ ] Ouvrir DevTools → Application → Local Storage → Vérifier `token` et `user`

### 6. Test de sécurité

- [ ] Se connecter en tant que CANDIDAT
- [ ] Ouvrir DevTools → Application → Local Storage
- [ ] Modifier manuellement `user.role` de `CANDIDAT` à `COMMISSION`
- [ ] Essayer d'accéder à `/commission` → ❌ Devrait être bloqué par le backend (erreur 403)

## 🐛 Débogage

### Vérifier le localStorage

Ouvrir DevTools (F12) → Application → Local Storage → `http://localhost:5173`

**Après login, vous devriez voir :**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": "{\"email\":\"candidat@test.com\",\"role\":\"CANDIDAT\",\"nom\":\"TEST\",\"prenom\":\"Candidat\",\"matricule\":\"UAC-2025-001\"}"
}
```

### Erreurs courantes

**Erreur : "Erreur parsing user"**
- Le format JSON dans localStorage est corrompu
- Solution : Déconnexion et reconnexion

**Erreur : Redirection infinie**
- Le rôle dans localStorage ne correspond pas au rôle dans la base
- Solution : Vider le localStorage et se reconnecter

**Erreur : Accès refusé (403) depuis le backend**
- Le token JWT ne contient pas le bon rôle
- Solution : Vérifier que le backend retourne bien le rôle dans la réponse login

## 📊 Matrice de contrôle d'accès (Frontend)

| Route | Non connecté | CANDIDAT | COMMISSION | DGES |
|-------|--------------|----------|------------|------|
| `/` | ✅ | ✅ | ✅ | ✅ |
| `/login` | ✅ | ✅ | ✅ | ✅ |
| `/register` | ✅ | ✅ | ✅ | ✅ |
| `/dashboard` | ❌ → `/login` | ✅ | ❌ → `/commission` | ❌ → `/dges` |
| `/commission` | ❌ → `/login` | ❌ → `/dashboard` | ✅ | ❌ → `/dges` |
| `/dges` | ❌ → `/login` | ❌ → `/dashboard` | ✅ | ✅ |

## ✅ Validation finale

Une fois tous les tests passés :
- [ ] Impossible d'accéder aux dashboards sans être connecté
- [ ] Chaque rôle est redirigé vers son propre dashboard après login
- [ ] Impossible d'accéder au dashboard d'un autre rôle
- [ ] La déconnexion supprime bien le token et les infos user
- [ ] Le rafraîchissement de page ne déconnecte pas l'utilisateur

## 🚀 Prochaines améliorations possibles

1. **Afficher un message d'erreur** quand l'utilisateur tente d'accéder à une route non autorisée
2. **Ajouter un loader** pendant la vérification du rôle
3. **Créer une page 403 Forbidden** personnalisée
4. **Ajouter un timeout** pour déconnecter automatiquement après X minutes d'inactivité
5. **Vérifier le token côté backend** à chaque requête (déjà fait ✅)
