# Architecture UniPath

## 📐 Vue d'ensemble

UniPath est une application full-stack composée de :
- **Backend** : API REST Node.js + Express + Prisma
- **Frontend** : Application React SPA avec Vite
- **Base de données** : PostgreSQL (hébergée sur Supabase)
- **Stockage** : Supabase Storage pour les fichiers

```
┌─────────────────┐
│   Navigateur    │
│   (React App)   │
└────────┬────────┘
         │ HTTP/REST
         ▼
┌─────────────────┐
│   API Express   │
│   (Node.js)     │
└────────┬────────┘
         │ Prisma ORM
         ▼
┌─────────────────┐
│   PostgreSQL    │
│   (Supabase)    │
└─────────────────┘
```

---

## 🗂️ Structure du Projet

```
unipath-mvp/
├── .github/                    # GitHub Actions & templates
│   ├── workflows/
│   │   └── ci.yml             # Pipeline CI/CD
│   ├── ISSUE_TEMPLATE/
│   └── pull_request_template.md
│
├── scripts/                    # Scripts utilitaires
│   └── health-check.sh        # Vérification santé projet
│
├── unipath-api/               # Backend
│   ├── prisma/
│   │   ├── schema.prisma      # Schéma de base de données
│   │   ├── migrations/        # Migrations SQL
│   │   └── seed.js            # Données de test
│   │
│   ├── src/
│   │   ├── config/            # Configuration centralisée
│   │   │   └── index.js
│   │   │
│   │   ├── controllers/       # Logique métier
│   │   │   ├── auth.controller.js
│   │   │   ├── candidat.controller.js
│   │   │   ├── commission.controller.js
│   │   │   ├── concours.controller.js
│   │   │   ├── dges.controller.js
│   │   │   ├── dossier.controller.js
│   │   │   └── ...
│   │   │
│   │   ├── middleware/        # Middlewares Express
│   │   │   ├── auth.middleware.js
│   │   │   ├── role.middleware.js
│   │   │   └── validation.middleware.js
│   │   │
│   │   ├── routes/            # Définition des routes
│   │   │   ├── auth.routes.js
│   │   │   ├── candidat.routes.js
│   │   │   └── ...
│   │   │
│   │   ├── services/          # Services métier
│   │   │   ├── email.service.js
│   │   │   └── pdf.service.js
│   │   │
│   │   ├── utils/             # Utilitaires
│   │   │   ├── asyncHandler.js
│   │   │   ├── errors.js
│   │   │   └── logger.js
│   │   │
│   │   ├── validators/        # Schémas Zod
│   │   │   ├── auth.validator.js
│   │   │   └── inscription.validator.js
│   │   │
│   │   ├── app.js             # Configuration Express
│   │   └── supabase.js        # Client Supabase
│   │
│   ├── server.js              # Point d'entrée
│   ├── package.json
│   └── .env.example
│
└── unipath-front/             # Frontend
    ├── src/
    │   ├── assets/            # Images, fonts, etc.
    │   │
    │   ├── components/        # Composants réutilisables
    │   │   ├── Navbar.jsx
    │   │   ├── ProtectedRoute.jsx
    │   │   ├── CandidatLayout.jsx
    │   │   └── ...
    │   │
    │   ├── pages/             # Pages de l'application
    │   │   ├── Home.jsx
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── DashboardCandidat.jsx
    │   │   ├── DashboardCommission.jsx
    │   │   └── DashboardDGES.jsx
    │   │
    │   ├── services/          # Appels API
    │   │   └── api.js
    │   │
    │   ├── App.jsx            # Composant racine
    │   ├── main.jsx           # Point d'entrée
    │   └── index.css          # Styles globaux
    │
    ├── index.html
    ├── package.json
    └── .env.example
```

---

## 🔄 Flux de Données

### 1. Authentification

```
User Input → Frontend (Login.jsx)
    ↓
authService.login(email, password)
    ↓
POST /api/auth/login
    ↓
auth.controller.js → Validation → Prisma
    ↓
JWT Token + User Data
    ↓
localStorage.setItem('token', token)
    ↓
Redirect to Dashboard
```

### 2. Inscription à un Concours

```
User Click → Frontend (PageConcours.jsx)
    ↓
inscriptionService.creer(concoursId)
    ↓
POST /api/inscriptions (+ JWT Header)
    ↓
auth.middleware → Vérification token
    ↓
inscription.controller.js → Validation Zod
    ↓
Prisma.inscription.create()
    ↓
Response 201 Created
    ↓
UI Update
```

### 3. Upload de Fichier

```
User Select File → Frontend (DossierCompletion.jsx)
    ↓
dossierService.uploadPiece(type, file)
    ↓
POST /api/dossier/upload (FormData + JWT)
    ↓
auth.middleware → multer → Validation
    ↓
Supabase Storage Upload
    ↓
Prisma.dossier.update({ [type]: url })
    ↓
Response { url }
    ↓
UI Update
```

---

## 🗄️ Modèle de Données

### Entités Principales

```prisma
Candidat
├── id (UUID)
├── matricule (unique)
├── nom, prenom, email
├── telephone, dateNaiss, lieuNaiss
├── role (CANDIDAT)
└── Relations:
    ├── inscriptions[] (1-n)
    └── dossier (1-1)

Concours
├── id (UUID)
├── libelle
├── dateDebut, dateFin
├── description
└── Relations:
    └── inscriptions[] (1-n)

Inscription (Table de jointure)
├── id (UUID)
├── candidatId → Candidat
├── concoursId → Concours
├── statut (EN_ATTENTE | VALIDE | REJETE)
└── Contrainte: unique(candidatId, concoursId)

Dossier
├── id (UUID)
├── candidatId → Candidat (unique)
├── acteNaissance (URL)
├── carteIdentite (URL)
├── photo (URL)
├── releve (URL)
└── quittance (URL)

MembreCommission
├── id (UUID)
├── nom, prenom, email
└── role (COMMISSION)

AdministrateurDGES
├── id (UUID)
├── nom, prenom, email
└── role (DGES)
```

---

## 🔐 Sécurité

### Authentification

- **JWT** stockés dans `localStorage` (⚠️ à améliorer avec httpOnly cookies)
- Token inclus dans header `Authorization: Bearer <token>`
- Middleware `auth.middleware.js` vérifie le token sur routes protégées

### Autorisation

- **Rôles** : CANDIDAT, COMMISSION, DGES
- Middleware `role.middleware.js` vérifie les permissions
- Exemple : seule la COMMISSION peut valider/rejeter des dossiers

### Validation

- **Zod** pour valider toutes les entrées utilisateur
- Middleware `validation.middleware.js` applique les schémas
- Erreurs 400 avec détails si validation échoue

### CORS

- Origines autorisées : localhost + Vercel
- Credentials activés pour les cookies (future implémentation)

---

## 🚀 Déploiement

### Backend (Render / Railway)

```bash
# Variables d'environnement requises
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_KEY=...
EMAIL_USER=...
EMAIL_PASS=...
NODE_ENV=production
```

**Build Command:** `npm install && npx prisma generate`  
**Start Command:** `npm start`

### Frontend (Vercel)

```bash
# Variables d'environnement requises
VITE_API_URL=https://your-api.onrender.com/api
```

**Build Command:** `npm run build`  
**Output Directory:** `dist`

---

## 🧪 Tests

### Backend

```bash
cd unipath-api
npm test                 # Tous les tests
npm run test:watch       # Mode watch
```

**Framework:** Jest + Supertest  
**Coverage:** Minimum 50% (configuré dans `jest.config.js`)

### Frontend

```bash
cd unipath-front
npm run lint             # ESLint
npm run build            # Vérifier le build
```

---

## 📊 Monitoring & Logs

### Logs

- **Logger personnalisé** : `src/utils/logger.js`
- Niveaux : INFO, SUCCESS, WARN, ERROR, DEBUG
- Couleurs en développement
- Format structuré en production (prêt pour Winston/Pino)

### Health Check

- Endpoint : `GET /health`
- Retourne : status, message, timestamp, environment

---

## 🔄 CI/CD

### GitHub Actions

**Workflow** : `.github/workflows/ci.yml`

**Jobs:**
1. **backend-test** : Tests backend + coverage
2. **frontend-test** : Lint + build frontend
3. **security-audit** : npm audit sur les deux projets

**Triggers:**
- Push sur `main` ou `develop`
- Pull requests vers `main` ou `develop`

---

## 📈 Évolutions Futures

### Court terme
- [ ] Implémenter httpOnly cookies pour JWT
- [ ] Ajouter rate limiting (express-rate-limit)
- [ ] Ajouter CSRF protection
- [ ] Améliorer les tests (couverture 80%+)

### Moyen terme
- [ ] Migration vers TypeScript
- [ ] Ajouter React Query pour le cache
- [ ] Implémenter WebSockets pour notifications temps réel
- [ ] Ajouter Swagger/OpenAPI

### Long terme
- [ ] Microservices (si nécessaire)
- [ ] Containerisation avec Docker
- [ ] Kubernetes pour orchestration
- [ ] Monitoring avec Sentry + Datadog

---

## 🤝 Contribution

Voir [CONTRIBUTING.md](./CONTRIBUTING.md) pour les guidelines.

## 📞 Support

Pour questions techniques : harrydedji@gmail.com
