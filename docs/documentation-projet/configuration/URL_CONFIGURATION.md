# Configuration des URLs - UniPath

## 📋 Vue d'ensemble

Ce document explique comment configurer correctement les URLs pour le système UniPath, en particulier pour les liens dans les emails de confirmation.

## 🔧 Variables d'Environnement

### Backend (`unipath-api/.env`)

```env
# Port du serveur API
PORT=3001

# URL du frontend (IMPORTANT pour les emails)
FRONTEND_URL=http://localhost:5173
# Alias pour compatibilité
APP_URL=http://localhost:5173

# Configuration Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=votre-email@gmail.com
EMAIL_PASS=votre-mot-de-passe-app
EMAIL_FROM=votre-email@gmail.com
```

### Frontend (`unipath-front/.env.local`)

```env
# URL de l'API Backend
VITE_API_URL=http://localhost:3001/api

# Supabase Configuration
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-cle-anon
```

## 🌐 Environnements

### Développement Local

**Backend:**
```env
FRONTEND_URL=http://localhost:5173
PORT=3001
```

**Frontend:**
```env
VITE_API_URL=http://localhost:3001/api
```

### Production

**Backend:**
```env
FRONTEND_URL=https://unipath.vercel.app
PORT=3001
```

**Frontend:**
```env
VITE_API_URL=https://api.unipath.com/api
```

## 🔗 Utilisation des URLs

### Dans le Backend

Le système utilise un helper `url.helper.js` pour gérer les URLs de manière cohérente :

```javascript
const { getFrontendUrl, buildFrontendUrl } = require('../utils/url.helper');

// Obtenir l'URL du frontend
const frontendUrl = getFrontendUrl();
// Résultat: http://localhost:5173

// Construire une URL avec paramètres
const confirmUrl = buildFrontendUrl('/auth/confirm', {
  token: 'abc123',
  type: 'signup'
});
// Résultat: http://localhost:5173/auth/confirm?token=abc123&type=signup
```

### Priorité des Variables

Le helper utilise la priorité suivante :
1. `FRONTEND_URL` (recommandé)
2. `APP_URL` (fallback)
3. `http://localhost:5173` (défaut)

## 📧 URLs dans les Emails

### Email de Confirmation

```javascript
const confirmationUrl = buildFrontendUrl('/auth/confirm', {
  token: userId,
  type: 'signup'
});
```

**Résultat:** `http://localhost:5173/auth/confirm?token=xxx&type=signup`

### Email de Réinitialisation

```javascript
const resetUrl = buildFrontendUrl('/reset-password');
```

**Résultat:** `http://localhost:5173/reset-password`

### Email de Bienvenue

```javascript
const loginUrl = buildFrontendUrl('/login');
```

**Résultat:** `http://localhost:5173/login`

## 🐛 Dépannage

### Problème : Les liens dans les emails pointent vers le mauvais port

**Symptôme :** Les liens pointent vers `http://localhost:3001` au lieu de `http://localhost:5173`

**Solution :**
1. Vérifier que `FRONTEND_URL` ou `APP_URL` est défini dans `.env`
2. Redémarrer le serveur backend
3. Vérifier les logs au démarrage :
   ```
   ✅ Serveur SMTP prêt à envoyer des emails
   🌐 Frontend URL: http://localhost:5173
   ```

### Problème : Les emails ne sont pas envoyés

**Symptôme :** Erreur SMTP lors de l'envoi

**Solution :**
1. Vérifier les credentials SMTP dans `.env`
2. Pour Gmail, utiliser un "App Password" :
   - Activer la validation en 2 étapes
   - Générer un mot de passe d'application
   - Utiliser ce mot de passe dans `EMAIL_PASS`

### Problème : Le lien de confirmation ne fonctionne pas

**Symptôme :** Erreur 404 ou "Token invalide"

**Solution :**
1. Vérifier que la route `/auth/confirm` existe dans le frontend
2. Vérifier que le token est bien passé dans l'URL
3. Vérifier les logs backend pour voir l'URL générée

## 📊 Logs de Débogage

Le système affiche des logs détaillés pour faciliter le débogage :

```bash
# Au démarrage du serveur
✅ Serveur SMTP prêt à envoyer des emails
🌐 Frontend URL: http://localhost:5173

# Lors de l'inscription
📧 Envoi email de confirmation à user@example.com
🔗 URL de confirmation: http://localhost:5173/auth/confirm?token=xxx&type=signup
✅ Email envoyé: <message-id>

# Lors du renvoi
📧 Renvoi email de confirmation à user@example.com
🔗 URL de confirmation: http://localhost:5173/auth/confirm?token=xxx&type=signup

# Lors de la réinitialisation
🔑 URL de réinitialisation: http://localhost:5173/reset-password
```

## ✅ Checklist de Configuration

- [ ] `FRONTEND_URL` défini dans `unipath-api/.env`
- [ ] `VITE_API_URL` défini dans `unipath-front/.env.local`
- [ ] Credentials SMTP configurés
- [ ] Serveur backend redémarré après modification `.env`
- [ ] Logs vérifiés au démarrage
- [ ] Test d'inscription effectué
- [ ] Email de confirmation reçu
- [ ] Lien de confirmation fonctionnel

## 🚀 Déploiement

### Vercel (Frontend)

Ajouter les variables d'environnement dans le dashboard Vercel :
```
VITE_API_URL=https://api.unipath.com/api
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-cle
```

### Backend (Serveur)

Mettre à jour `.env` en production :
```env
FRONTEND_URL=https://unipath.vercel.app
PORT=3001
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=production@unipath.com
EMAIL_PASS=production-app-password
EMAIL_FROM=noreply@unipath.com
```

## 📚 Fichiers Concernés

- `unipath-api/src/utils/url.helper.js` - Helper pour gérer les URLs
- `unipath-api/src/controllers/auth.controller.js` - Utilise le helper
- `unipath-api/src/services/email.service.js` - Génère les emails avec URLs
- `unipath-api/.env` - Configuration backend
- `unipath-front/.env.local` - Configuration frontend

---

**Date de mise à jour :** 7 Mai 2026  
**Version :** 1.0  
**Auteur :** Système UniPath
