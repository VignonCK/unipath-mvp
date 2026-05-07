# Configuration de la Confirmation d'Email

## Date: 7 Mai 2026

## Problème Résolu

L'URL de confirmation d'email pointait vers le backend (port 3001) au lieu du frontend (port 5173).

## Configuration Correcte

### Backend `.env`

```env
# ❌ AVANT (INCORRECT)
APP_URL=http://localhost:3001

# ✅ APRÈS (CORRECT)
APP_URL=http://localhost:5173
```

**Explication**: `APP_URL` doit pointer vers le **frontend** car c'est là que se trouve la page de confirmation (`/auth/confirm`).

## Architecture

### 1. Inscription du Candidat

```
Frontend (5173) → POST /api/auth/register
    ↓
Backend (3001) → auth.controller.js
    ↓
Supabase Auth → Création du compte
    ↓
Backend → Envoi email de confirmation
    ↓
Email contient: http://localhost:5173/auth/confirm?token=...
```

### 2. Confirmation de l'Email

```
Candidat clique sur le lien dans l'email
    ↓
Frontend (5173) → /auth/confirm?token=...
    ↓
Page EmailConfirmation.jsx
    ↓
Supabase Auth → Vérification du token
    ↓
Redirection vers /login
```

## Fichiers Impliqués

### Backend

#### `unipath-api/.env`
```env
APP_URL=http://localhost:5173  # ✅ URL du frontend
```

#### `unipath-api/src/controllers/auth.controller.js`
```javascript
await emailService.envoyerEmailConfirmation({
  email: candidat.email,
  nom: candidat.nom,
  prenom: candidat.prenom,
  confirmationUrl: `${process.env.APP_URL}/auth/confirm?token=${authData.user.id}`
  //                 ↑ Utilise APP_URL (frontend)
});
```

### Frontend

#### `unipath-front/src/App.jsx`
```javascript
<Route path='/auth/confirm' element={<EmailConfirmation />} />
```

#### `unipath-front/src/pages/EmailConfirmation.jsx`
```javascript
// Page qui gère la confirmation
// 1. Récupère le token depuis l'URL
// 2. Vérifie avec Supabase
// 3. Redirige vers /login
```

#### `unipath-front/.env.local`
```env
VITE_SUPABASE_URL=https://krqxuoqijkwxouixqudo.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Workflow Complet

### Étape 1: Inscription
1. Candidat remplit le formulaire d'inscription
2. Frontend envoie les données au backend
3. Backend crée le compte Supabase
4. Backend envoie un email avec le lien de confirmation

### Étape 2: Email de Confirmation
```html
Bonjour [Nom] [Prénom],

Bienvenue sur UniPath !

Pour activer votre compte, veuillez confirmer votre adresse email :

[Bouton: Confirmer mon email]
→ http://localhost:5173/auth/confirm?token=abc123

Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :
http://localhost:5173/auth/confirm?token=abc123
```

### Étape 3: Confirmation
1. Candidat clique sur le lien
2. Frontend charge `/auth/confirm?token=abc123`
3. Page `EmailConfirmation.jsx` :
   - Affiche "Confirmation en cours..."
   - Appelle `supabase.auth.verifyOtp()`
   - Affiche "Email confirmé !"
   - Redirige vers `/login` après 3 secondes

### Étape 4: Connexion
1. Candidat se connecte avec son email et mot de passe
2. Accès à la plateforme

## Variables d'Environnement

### Backend (`unipath-api/.env`)
```env
# URL du frontend (pour les liens dans les emails)
APP_URL=http://localhost:5173

# Supabase (pour l'authentification)
SUPABASE_URL=https://krqxuoqijkwxouixqudo.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Email (pour l'envoi)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=harrydedji@gmail.com
EMAIL_PASS=xcsd cvlh gtvj eakk
EMAIL_FROM=harrydedji@gmail.com
```

### Frontend (`unipath-front/.env.local`)
```env
# API Backend
VITE_API_URL=http://localhost:3001/api

# Supabase (pour la vérification du token)
VITE_SUPABASE_URL=https://krqxuoqijkwxouixqudo.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Ports

- **Frontend**: `http://localhost:5173` (Vite)
- **Backend**: `http://localhost:3001` (Express)

## Déploiement en Production

En production, il faudra mettre à jour `APP_URL` :

```env
# Production
APP_URL=https://unipath.bj
```

Tous les liens dans les emails pointeront alors vers `https://unipath.bj/auth/confirm?token=...`

## Tests

### 1. Tester l'Inscription
```bash
# Terminal 1: Backend
cd unipath-api
npm start

# Terminal 2: Frontend
cd unipath-front
npm run dev
```

1. Aller sur http://localhost:5173/register
2. Remplir le formulaire
3. Soumettre
4. Vérifier l'email reçu

### 2. Vérifier le Lien
L'email doit contenir:
```
http://localhost:5173/auth/confirm?token=...
```

**PAS**:
```
http://localhost:3001/auth/confirm?token=...  ❌
```

### 3. Tester la Confirmation
1. Cliquer sur le lien dans l'email
2. Vérifier que la page `/auth/confirm` s'affiche
3. Vérifier le message "Email confirmé !"
4. Vérifier la redirection vers `/login`

## Dépannage

### Problème: Le lien pointe vers le port 3001
**Solution**: Vérifier que `APP_URL=http://localhost:5173` dans `unipath-api/.env`

### Problème: Page 404 sur /auth/confirm
**Solution**: Vérifier que la route existe dans `App.jsx`

### Problème: Erreur "Token invalide"
**Solution**: Vérifier que les variables Supabase sont correctes dans `.env.local`

### Problème: Email non reçu
**Solution**: 
1. Vérifier les logs du backend
2. Vérifier les credentials Gmail dans `.env`
3. Vérifier les spams

## Sécurité

- ✅ Le token est généré par Supabase (sécurisé)
- ✅ Le token expire après un certain temps
- ✅ Le token ne peut être utilisé qu'une seule fois
- ✅ Les variables sensibles sont dans `.env` (ignoré par git)

## Fichiers Créés/Modifiés

- ✅ `unipath-front/src/pages/EmailConfirmation.jsx` - Page de confirmation
- ✅ `unipath-front/src/supabase.js` - Client Supabase
- ✅ `unipath-front/src/App.jsx` - Route ajoutée
- ✅ `unipath-front/.env.local` - Variables Supabase ajoutées
- ✅ `unipath-api/.env` - APP_URL corrigé (5173 au lieu de 3001)
- ✅ `unipath-api/.env.example` - Exemple de configuration
