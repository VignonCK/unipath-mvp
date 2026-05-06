# Changements Système d'Authentification

## 📋 Résumé des Modifications

Les modifications suivantes ont été apportées au système d'authentification pour sécuriser l'accès aux comptes administrateurs.

---

## ✅ Changements Effectués

### 1. Page d'Inscription (Frontend)

**Avant :**
- Sélection du rôle (CANDIDAT, COMMISSION, DGES)
- Inscription publique pour tous les rôles

**Après :**
- ✅ Inscription uniquement pour le rôle **CANDIDAT**
- ❌ Suppression du sélecteur de rôle
- ℹ️ Message informatif : "Vous vous inscrivez en tant que candidat"

**Fichier modifié :** `unipath-front/src/pages/Register.jsx`

---

### 2. Routes API (Backend)

**Avant :**
```javascript
router.post('/register/commission', ...);
router.post('/register/dges', ...);
```

**Après :**
```javascript
// Routes désactivées (commentées)
// router.post('/register/commission', ...);
// router.post('/register/dges', ...);
```

**Fichier modifié :** `unipath-api/src/routes/auth.routes.js`

---

### 3. Service API (Frontend)

**Avant :**
```javascript
registerCommission: (userData) => ...
registerDGES: (userData) => ...
```

**Après :**
- Fonctions supprimées (non utilisées)

**Fichier modifié :** `unipath-front/src/services/api.js`

---

### 4. Permissions Statistiques

**Modification :**
- ✅ La **Commission** a maintenant accès aux statistiques DGES
- Routes `/api/dges/statistiques` accessibles par `['DGES', 'COMMISSION']`

**Fichier :** `unipath-api/src/routes/dges.routes.js` (déjà configuré)

---

### 5. Script de Création des Comptes Administrateurs

**Nouveau fichier :** `unipath-api/scripts/create-admin-accounts.js`

**Fonctionnalité :**
- Crée automatiquement les comptes Commission et DGES
- Credentials pré-définis :
  - **Commission** : `commission@epac.bj` / `Commission2026!`
  - **DGES** : `dges@mesrs.bj` / `DGES2026!`

**Usage :**
```bash
cd unipath-api
npm run create-admins
```

---

### 6. Documentation

**Nouveau fichier :** `unipath-api/ADMIN_ACCOUNTS.md`

**Contenu :**
- Politique d'accès
- Guide de création des comptes
- Bonnes pratiques de sécurité
- Procédures de test
- Dépannage

---

## 🔐 Credentials par Défaut

### ⚠️ DÉVELOPPEMENT UNIQUEMENT

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Commission | `commission@epac.bj` | `Commission2026!` |
| DGES | `dges@mesrs.bj` | `DGES2026!` |

**🚨 IMPORTANT :** Ces credentials doivent être changés en production !

---

## 🚀 Utilisation

### Pour les Développeurs

1. **Créer les comptes administrateurs**
   ```bash
   cd unipath-api
   npm run create-admins
   ```

2. **Tester la connexion Commission**
   - URL : http://localhost:5173/login
   - Email : `commission@epac.bj`
   - Password : `Commission2026!`

3. **Vérifier l'accès aux statistiques**
   - Après connexion, aller sur le dashboard Commission
   - Les statistiques DGES doivent être visibles

### Pour les Utilisateurs Finaux

**Candidats :**
- ✅ Peuvent s'inscrire via `/register`
- ✅ Rôle automatiquement défini à CANDIDAT

**Commission / DGES :**
- ❌ Ne peuvent PAS s'inscrire publiquement
- ✅ Comptes créés par les administrateurs système
- ✅ Credentials fournis de manière sécurisée

---

## 📊 Matrice des Permissions

| Action | CANDIDAT | COMMISSION | DGES |
|--------|----------|------------|------|
| **Inscription publique** | ✅ | ❌ | ❌ |
| **Connexion** | ✅ | ✅ | ✅ |
| **S'inscrire aux concours** | ✅ | ❌ | ❌ |
| **Soumettre dossier** | ✅ | ❌ | ❌ |
| **Valider/Rejeter dossiers** | ❌ | ✅ | ❌ |
| **Voir statistiques** | ❌ | ✅ | ✅ |
| **Gérer concours** | ❌ | ❌ | ✅ |

---

## 🔄 Migration

### Si vous avez déjà des comptes Commission/DGES créés via l'ancienne méthode

**Option 1 : Les conserver**
- Aucune action requise
- Les comptes existants continuent de fonctionner

**Option 2 : Les recréer**
1. Supprimer les anciens comptes dans Supabase Auth
2. Supprimer les entrées dans les tables Prisma
3. Exécuter `npm run create-admins`

---

## 🧪 Tests

### Test 1 : Inscription Candidat

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Test",
    "prenom": "Candidat",
    "email": "test@candidat.bj",
    "password": "Test123!",
    "telephone": "+22997123456",
    "dateNaiss": "2000-01-01",
    "lieuNaiss": "Cotonou"
  }'
```

**Résultat attendu :** ✅ Compte créé avec rôle CANDIDAT

---

### Test 2 : Connexion Commission

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "commission@epac.bj",
    "password": "Commission2026!"
  }'
```

**Résultat attendu :** ✅ Token JWT + user avec role COMMISSION

---

### Test 3 : Accès Statistiques Commission

```bash
TOKEN="<token_commission>"

curl http://localhost:3001/api/dges/statistiques \
  -H "Authorization: Bearer $TOKEN"
```

**Résultat attendu :** ✅ Statistiques retournées

---

### Test 4 : Tentative d'inscription Commission (doit échouer)

```bash
curl -X POST http://localhost:3001/api/auth/register/commission \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Test",
    "prenom": "Commission",
    "email": "test@commission.bj",
    "password": "Test123!"
  }'
```

**Résultat attendu :** ❌ 404 Not Found (route désactivée)

---

## 📝 Checklist de Déploiement

Avant de déployer en production :

- [ ] Exécuter `npm run create-admins` sur le serveur
- [ ] Changer les mots de passe par défaut
- [ ] Stocker les nouveaux credentials dans un gestionnaire sécurisé
- [ ] Vérifier que les routes `/register/commission` et `/register/dges` sont commentées
- [ ] Tester la connexion avec les nouveaux credentials
- [ ] Vérifier l'accès aux statistiques pour la Commission
- [ ] Configurer les notifications email pour les connexions
- [ ] Activer le rate limiting sur `/login`
- [ ] Configurer les logs d'audit

---

## 🆘 Dépannage

### Problème : "Cannot POST /api/auth/register/commission"

**Cause :** Routes désactivées (comportement normal)

**Solution :** Utiliser `npm run create-admins`

---

### Problème : "Accès refusé" pour les statistiques

**Cause :** Rôle non autorisé

**Solution :** Vérifier que :
1. L'utilisateur a le rôle COMMISSION ou DGES
2. Les routes utilisent `checkRole(['DGES', 'COMMISSION'])`

---

### Problème : "User already registered"

**Cause :** Compte déjà existant

**Solution :** 
1. Utiliser la réinitialisation de mot de passe
2. Ou supprimer et recréer le compte

---

## 📞 Support

Pour toute question sur ces changements :
- Email : harrydedji@gmail.com
- Discord : @the_hvrris17
- Documentation : `unipath-api/ADMIN_ACCOUNTS.md`

---

**Date des modifications :** 29 avril 2026  
**Version :** 1.1.0
