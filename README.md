# UniPath MVP

Plateforme de gestion du parcours universitaire — EPAC 2025

## 📋 Description

UniPath est une plateforme numérique permettant aux bacheliers de s'inscrire aux concours d'entrée universitaire, de soumettre leurs dossiers et de suivre leur statut. Elle facilite également le travail des commissions d'évaluation et de la DGES.

## 👥 Équipe

- **Étudiant A** — DB Architect
- **Harry DEDJI** — Backend/API (harrydedji@gmail.com | Discord: @the_hvrris17)
- **Étudiant C** — Frontend

## 🏗️ Architecture

```
unipath-mvp/
├── unipath-api/          # Backend Node.js + Express + Prisma
│   ├── src/
│   │   ├── controllers/  # Logique métier
│   │   ├── routes/       # Définition des endpoints
│   │   ├── middleware/   # Auth, validation, etc.
│   │   ├── services/     # Services (email, PDF)
│   │   └── validators/   # Schémas Zod
│   ├── prisma/           # Schéma DB + migrations
│   └── server.js         # Point d'entrée
│
└── unipath-front/        # Frontend React + Vite + TailwindCSS
    ├── src/
    │   ├── components/   # Composants réutilisables
    │   ├── pages/        # Pages de l'application
    │   └── services/     # Appels API
    └── index.html
```

## 🚀 Installation

### Prérequis

- Node.js 18+ et npm
- PostgreSQL (ou compte Supabase)
- Git

### 1. Cloner le projet

```bash
git clone https://github.com/votre-org/unipath-mvp.git
cd unipath-mvp
```

### 2. Configuration Backend

```bash
cd unipath-api
npm install
```

Créer un fichier `.env` à partir de `.env.example` :

```bash
cp .env.example .env
```

Remplir les variables d'environnement :

```env
DATABASE_URL=postgresql://user:password@host:port/database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key
PORT=3001
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=your_email@gmail.com
```

Initialiser la base de données :

```bash
npx prisma migrate dev
npx prisma db seed
```

Démarrer le serveur :

```bash
npm start
```

L'API sera accessible sur `http://localhost:3001`

### 3. Configuration Frontend

```bash
cd ../unipath-front
npm install
```

Créer un fichier `.env.local` :

```bash
cp .env.example .env.local
```

Configurer l'URL de l'API :

```env
VITE_API_URL=http://localhost:3001/api
```

Démarrer le serveur de développement :

```bash
npm run dev
```

L'application sera accessible sur `http://localhost:5173`

## 📡 API Endpoints

### Authentification

- `POST /api/auth/login` — Connexion
- `POST /api/auth/register` — Inscription candidat
- `POST /api/auth/register/commission` — Inscription commission
- `POST /api/auth/register/dges` — Inscription DGES
- `POST /api/auth/reset-password` — Réinitialisation mot de passe

### Candidats

- `GET /api/candidats/profil` — Récupérer profil
- `PUT /api/candidats/profil` — Mettre à jour profil
- `GET /api/candidats/convocation/:id` — Télécharger convocation PDF

### Concours

- `GET /api/concours` — Liste des concours
- `GET /api/concours/:id` — Détails d'un concours

### Inscriptions

- `POST /api/inscriptions` — Créer une inscription
- `GET /api/inscriptions/mes-inscriptions` — Mes inscriptions

### Dossiers

- `POST /api/dossier/upload` — Upload pièce justificative
- `GET /api/dossier` — Récupérer mon dossier

### Commission

- `GET /api/commission/dossiers` — Liste des dossiers
- `PATCH /api/commission/dossiers/:id` — Mettre à jour statut

### DGES

- `GET /api/dges/statistiques` — Statistiques globales
- `GET /api/dges/statistiques/:id` — Statistiques par concours

## 🧪 Tests

```bash
# Backend
cd unipath-api
npm test

# Frontend
cd unipath-front
npm test
```

## 🔒 Sécurité

- **Ne jamais commiter les fichiers `.env`** — Ils contiennent des secrets
- Utiliser des mots de passe d'application Gmail (pas le mot de passe principal)
- Les tokens JWT sont stockés dans `localStorage` (à améliorer avec httpOnly cookies)
- Validation des inputs avec Zod côté backend

## 📦 Déploiement

### Backend (Render / Railway)

1. Créer un service PostgreSQL
2. Configurer les variables d'environnement
3. Déployer depuis GitHub
4. Exécuter les migrations : `npx prisma migrate deploy`

### Frontend (Vercel)

1. Connecter le repo GitHub
2. Configurer `VITE_API_URL` avec l'URL de production
3. Build command : `npm run build`
4. Output directory : `dist`

## 🛠️ Technologies

### Backend

- Node.js + Express
- Prisma ORM
- PostgreSQL (Supabase)
- Nodemailer (emails)
- PDFKit (génération PDF)
- Zod (validation)

### Frontend

- React 19
- Vite
- TailwindCSS 4
- React Router
- React Hook Form
- Recharts (graphiques)

## 📚 Documentation

Toute la documentation du projet a été organisée dans le dossier [`docs/documentation-projet/`](docs/documentation-projet/).

### 🚀 Démarrage Rapide

- **Point d'entrée** : [`docs/documentation-projet/README.md`](docs/documentation-projet/README.md)
- **Organisation** : [`docs/ORGANISATION_DOCUMENTATION.md`](docs/ORGANISATION_DOCUMENTATION.md)

### 📖 Documentation par Thématique

- 📝 **Guides** : [`docs/documentation-projet/guides/`](docs/documentation-projet/guides/)
- 🏗️ **Architecture** : [`docs/documentation-projet/ARCHITECTURE.md`](docs/documentation-projet/ARCHITECTURE.md)
- 🧪 **Tests** : [`docs/documentation-projet/tests/`](docs/documentation-projet/tests/)
- 🔒 **Sécurité** : [`docs/documentation-projet/securite/`](docs/documentation-projet/securite/)
- ⚙️ **Configuration** : [`docs/documentation-projet/configuration/`](docs/documentation-projet/configuration/)
- 👥 **Commission** : [`docs/documentation-projet/commission/`](docs/documentation-projet/commission/)
- 🔔 **Notifications** : [`docs/documentation-projet/notifications/`](docs/documentation-projet/notifications/)
- 📊 **Flux Candidat** : [`docs/documentation-projet/flux-candidat/`](docs/documentation-projet/flux-candidat/)
- 🎨 **Responsive** : [`docs/documentation-projet/responsive/`](docs/documentation-projet/responsive/)
- 🔄 **Migrations** : [`docs/documentation-projet/migrations/`](docs/documentation-projet/migrations/)

### 🆔 Intégration ANIP

L'identifiant ANIP (Numéro Personnel d'Identification) est un code unique à **12 chiffres** obligatoire pour tous les candidats.

**Documentation ANIP :**
- 🚀 [`docs/documentation-projet/guides/START_HERE_ANIP.md`](docs/documentation-projet/guides/START_HERE_ANIP.md)
- ⚡ [`docs/documentation-projet/ANIP_TL_DR.md`](docs/documentation-projet/ANIP_TL_DR.md)
- 📖 [`docs/documentation-projet/guides/README_ANIP.md`](docs/documentation-projet/guides/README_ANIP.md)

---

## 📝 Licence

ISC

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/ma-feature`)
3. Commit (`git commit -m 'Ajout de ma feature'`)
4. Push (`git push origin feature/ma-feature`)
5. Ouvrir une Pull Request

## 📞 Support

Pour toute question, contacter Harry DEDJI : harrydedji@gmail.com
