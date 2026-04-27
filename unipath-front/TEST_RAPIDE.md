# 🚀 Test rapide du système de protection des routes

## Prérequis
- Backend lancé sur port 3001 : `cd unipath-api && node server.js`
- Frontend lancé sur port 5173 : `cd unipath-front && npm run dev`
- Comptes de test créés (voir `unipath-api/prisma/seed-roles.js`)

## Test en 5 minutes

### 1. Test sans connexion ✅
1. Ouvrir `http://localhost:5173/dashboard`
2. **Résultat attendu** : Redirection vers `/login`

### 2. Test CANDIDAT ✅
1. Se connecter avec `candidat@test.com` / `password123`
2. **Résultat attendu** : Redirection automatique vers `/dashboard`
3. Essayer d'accéder à `http://localhost:5173/commission`
4. **Résultat attendu** : Redirection vers `/dashboard`
5. Cliquer sur "Déconnexion"
6. **Résultat attendu** : Retour à `/login`

### 3. Test COMMISSION ✅
1. Se connecter avec `commission@test.com` / `password123`
2. **Résultat attendu** : Redirection automatique vers `/commission`
3. Essayer d'accéder à `http://localhost:5173/dashboard`
4. **Résultat attendu** : Redirection vers `/commission`
5. Essayer d'accéder à `http://localhost:5173/dges`
6. **Résultat attendu** : Accès autorisé (Commission peut voir les stats)

### 4. Test DGES ✅
1. Se connecter avec `dges@test.com` / `password123`
2. **Résultat attendu** : Redirection automatique vers `/dges`
3. Essayer d'accéder à `http://localhost:5173/commission`
4. **Résultat attendu** : Redirection vers `/dges`

### 5. Test de persistance ✅
1. Se connecter en tant que CANDIDAT
2. Appuyer sur F5 (rafraîchir la page)
3. **Résultat attendu** : Reste connecté sur `/dashboard`

## Vérification localStorage

Ouvrir DevTools (F12) → Application → Local Storage → `http://localhost:5173`

Après login, vous devriez voir :
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": "{\"email\":\"candidat@test.com\",\"role\":\"CANDIDAT\",\"nom\":\"TEST\",\"prenom\":\"Candidat\",\"matricule\":\"UAC-2025-001\"}"
}
```

## Matrice de contrôle d'accès

| Route | Non connecté | CANDIDAT | COMMISSION | DGES |
|-------|--------------|----------|------------|------|
| `/dashboard` | ❌ → `/login` | ✅ | ❌ → `/commission` | ❌ → `/dges` |
| `/commission` | ❌ → `/login` | ❌ → `/dashboard` | ✅ | ❌ → `/dges` |
| `/dges` | ❌ → `/login` | ❌ → `/dashboard` | ✅ | ✅ |

## Problèmes courants

**Erreur : "Erreur parsing user"**
- Solution : Déconnexion et reconnexion

**Redirection infinie**
- Solution : Vider le localStorage et se reconnecter

**Accès refusé (403) depuis le backend**
- Solution : Vérifier que le backend retourne bien le rôle dans la réponse login
