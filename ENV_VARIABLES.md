# Variables d'Environnement

Ce document liste toutes les variables d'environnement utilisées dans le projet.

---

## 🔧 Backend (unipath-api)

Fichier : `unipath-api/.env`

### Base de données

| Variable | Description | Exemple | Requis |
|----------|-------------|---------|--------|
| `DATABASE_URL` | URL de connexion PostgreSQL | `postgresql://user:pass@host:5432/db` | ✅ |

### Supabase

| Variable | Description | Exemple | Requis |
|----------|-------------|---------|--------|
| `SUPABASE_URL` | URL du projet Supabase | `https://xxx.supabase.co` | ✅ |
| `SUPABASE_ANON_KEY` | Clé publique Supabase | `eyJhbGciOiJIUzI1NiIsInR5cCI6...` | ✅ |
| `SUPABASE_SERVICE_KEY` | Clé service (admin) Supabase | `eyJhbGciOiJIUzI1NiIsInR5cCI6...` | ✅ |

### Serveur

| Variable | Description | Exemple | Requis |
|----------|-------------|---------|--------|
| `PORT` | Port du serveur | `3001` | ❌ (défaut: 3001) |
| `APP_URL` | URL de l'application | `http://localhost:3001` | ❌ |
| `NODE_ENV` | Environnement | `development` / `production` / `test` | ❌ |

### Email (Gmail SMTP)

| Variable | Description | Exemple | Requis |
|----------|-------------|---------|--------|
| `EMAIL_HOST` | Serveur SMTP | `smtp.gmail.com` | ✅ |
| `EMAIL_PORT` | Port SMTP | `587` | ✅ |
| `EMAIL_USER` | Adresse email | `votre-email@gmail.com` | ✅ |
| `EMAIL_PASS` | Mot de passe d'application Gmail | `abcd efgh ijkl mnop` | ✅ |
| `EMAIL_FROM` | Email expéditeur | `votre-email@gmail.com` | ✅ |

> **Note** : Pour Gmail, utilisez un [mot de passe d'application](https://support.google.com/accounts/answer/185833), pas votre mot de passe principal.

### Email (Alternative : Resend)

| Variable | Description | Exemple | Requis |
|----------|-------------|---------|--------|
| `RESEND_API_KEY` | Clé API Resend | `re_xxxxxxxxxxxxx` | ❌ |

---

## 🎨 Frontend (unipath-front)

Fichier : `unipath-front/.env.local`

| Variable | Description | Exemple | Requis |
|----------|-------------|---------|--------|
| `VITE_API_URL` | URL de l'API backend | `http://localhost:3001/api` | ✅ |

> **Note** : Les variables Vite doivent commencer par `VITE_` pour être accessibles dans le code.

### Vercel (généré automatiquement)

| Variable | Description | Requis |
|----------|-------------|--------|
| `VERCEL_OIDC_TOKEN` | Token d'authentification Vercel | ❌ |

---

## 🔒 Sécurité

### ⚠️ Ne JAMAIS commiter

- Fichiers `.env`
- Fichiers `.env.local`
- Fichiers `.env.production`
- Tout fichier contenant des secrets

### ✅ À commiter

- Fichiers `.env.example` (avec valeurs factices)

### 🛡️ Bonnes pratiques

1. **Utiliser des mots de passe forts**
   - Minimum 16 caractères
   - Mélange de lettres, chiffres, symboles

2. **Rotation des secrets**
   - Changer les clés API régulièrement
   - Révoquer les tokens compromis immédiatement

3. **Accès limité**
   - Ne partager les secrets qu'avec les personnes autorisées
   - Utiliser des gestionnaires de secrets (1Password, Bitwarden)

4. **Environnements séparés**
   - Secrets différents pour dev/staging/prod
   - Ne jamais utiliser les secrets de prod en dev

---

## 📝 Configuration par Environnement

### Développement Local

```bash
# Backend
cd unipath-api
cp .env.example .env
# Éditer .env avec vos valeurs

# Frontend
cd unipath-front
cp .env.example .env.local
# Éditer .env.local avec vos valeurs
```

### Staging / Production

**Backend (Render / Railway)**
- Configurer les variables dans le dashboard
- Activer `NODE_ENV=production`

**Frontend (Vercel)**
- Configurer `VITE_API_URL` dans les settings
- Séparer les valeurs par environnement (Preview / Production)

---

## 🔍 Vérification

### Vérifier que toutes les variables sont définies

```bash
# Backend
cd unipath-api
node -e "require('dotenv').config(); console.log(process.env.DATABASE_URL ? '✅ DATABASE_URL' : '❌ DATABASE_URL manquant')"

# Frontend
cd unipath-front
node -e "require('dotenv').config({ path: '.env.local' }); console.log(process.env.VITE_API_URL ? '✅ VITE_API_URL' : '❌ VITE_API_URL manquant')"
```

### Script de validation

Le fichier `unipath-api/src/config/index.js` valide automatiquement les variables requises au démarrage.

---

## 🆘 Dépannage

### Erreur : "Variables d'environnement manquantes"

1. Vérifier que le fichier `.env` existe
2. Vérifier que toutes les variables requises sont définies
3. Redémarrer le serveur après modification

### Erreur : "Cannot connect to database"

1. Vérifier `DATABASE_URL`
2. Tester la connexion : `npx prisma db pull`
3. Vérifier les credentials Supabase

### Erreur : "Email not sent"

1. Vérifier `EMAIL_USER` et `EMAIL_PASS`
2. Activer l'accès "Applications moins sécurisées" sur Gmail
3. Ou utiliser un mot de passe d'application

### Erreur : "CORS error" en frontend

1. Vérifier `VITE_API_URL` dans `.env.local`
2. Vérifier que l'API est démarrée
3. Vérifier la configuration CORS dans `unipath-api/src/app.js`

---

## 📚 Ressources

- [Dotenv Documentation](https://github.com/motdotla/dotenv)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)
- [Supabase Documentation](https://supabase.com/docs)
