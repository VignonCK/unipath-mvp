# Implémentation du système de rôles - UniPath

## 📋 Vue d'ensemble

Le système de rôles a été implémenté pour sécuriser l'accès aux différentes parties de la plateforme selon le type d'utilisateur.

## 🎭 Rôles disponibles

### 1. **CANDIDAT** (par défaut)
- Accès au dashboard candidat
- Inscription aux concours
- Upload de pièces justificatives
- Téléchargement de convocation

### 2. **COMMISSION**
- Accès au dashboard commission
- Consultation des dossiers
- Validation/Rejet des dossiers
- Accès aux statistiques

### 3. **DGES**
- Accès au dashboard DGES
- Consultation des statistiques nationales
- Vue d'ensemble de tous les concours

## 🗄️ Structure de la base de données

### Tables créées
```sql
-- Table Candidat (modifiée)
ALTER TABLE "Candidat" ADD COLUMN "role" "Role" DEFAULT 'CANDIDAT';

-- Nouvelle table MembreCommission
CREATE TABLE "MembreCommission" (
  id UUID PRIMARY KEY,
  nom VARCHAR,
  prenom VARCHAR,
  email VARCHAR UNIQUE,
  telephone VARCHAR,
  role "Role" DEFAULT 'COMMISSION',
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP
);

-- Nouvelle table AdministrateurDGES
CREATE TABLE "AdministrateurDGES" (
  id UUID PRIMARY KEY,
  nom VARCHAR,
  prenom VARCHAR,
  email VARCHAR UNIQUE,
  telephone VARCHAR,
  role "Role" DEFAULT 'DGES',
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP
);

-- Enum Role
CREATE TYPE "Role" AS ENUM ('CANDIDAT', 'COMMISSION', 'DGES');
```

## 🔐 Endpoints API

### Authentification

#### Inscription Candidat
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "candidat@example.com",
  "password": "motdepasse123",
  "nom": "DUPONT",
  "prenom": "Jean",
  "telephone": "+22997123456"
}
```

#### Inscription Commission
```http
POST /api/auth/register/commission
Content-Type: application/json

{
  "email": "commission@example.com",
  "password": "motdepasse123",
  "nom": "KOUASSI",
  "prenom": "Marie",
  "telephone": "+22997654321"
}
```

#### Inscription DGES
```http
POST /api/auth/register/dges
Content-Type: application/json

{
  "email": "dges@example.com",
  "password": "motdepasse123",
  "nom": "AGBODJAN",
  "prenom": "Paul",
  "telephone": "+22997111222"
}
```

#### Connexion (tous les rôles)
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "motdepasse123"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "email": "user@example.com",
    "role": "CANDIDAT",
    "nom": "DUPONT",
    "prenom": "Jean",
    "matricule": "UAC-2025-001" // Seulement pour CANDIDAT
  }
}
```

### Routes protégées

#### Candidat (role: CANDIDAT)
```http
GET /api/candidat/profil
Authorization: Bearer {token}

GET /api/candidat/convocation/:inscriptionId
Authorization: Bearer {token}
```

#### Commission (role: COMMISSION)
```http
GET /api/commission/dossiers?statut=EN_ATTENTE
Authorization: Bearer {token}

PATCH /api/commission/dossiers/:inscriptionId
Authorization: Bearer {token}
Content-Type: application/json

{
  "statut": "VALIDE"
}
```

#### DGES (role: DGES ou COMMISSION)
```http
GET /api/dges/statistiques
Authorization: Bearer {token}

GET /api/dges/statistiques/:concoursId
Authorization: Bearer {token}
```

## 🛡️ Middleware de protection

### 1. `auth.middleware.js`
Vérifie que l'utilisateur est authentifié (token JWT valide)

### 2. `role.middleware.js`
Vérifie que l'utilisateur a le bon rôle pour accéder à la ressource

Exemple d'utilisation :
```javascript
const { protect } = require('../middleware/auth.middleware');
const { checkRole } = require('../middleware/role.middleware');

// Route accessible uniquement par CANDIDAT
router.get('/profil', protect, checkRole(['CANDIDAT']), controller.getProfil);

// Route accessible par COMMISSION et DGES
router.get('/stats', protect, checkRole(['COMMISSION', 'DGES']), controller.getStats);
```

## 🧪 Comptes de test

Après avoir exécuté le seed, vous aurez :

```javascript
// Candidat
Email: candidat@test.com
Password: password123
Role: CANDIDAT

// Commission
Email: commission@test.com
Password: password123
Role: COMMISSION

// DGES
Email: dges@test.com
Password: password123
Role: DGES
```

## 🚀 Migration

Pour appliquer les changements à la base de données :

```bash
cd unipath-api
npx prisma migrate dev --name add_roles_and_user_tables
npx prisma generate
```

## 📝 Notes importantes

1. **Sécurité** : Les routes `/api/auth/register/commission` et `/api/auth/register/dges` devraient être protégées en production (accessible uniquement par un super-admin)

2. **Token JWT** : Le token contient maintenant le rôle de l'utilisateur

3. **Frontend** : Le frontend doit :
   - Stocker le rôle après login
   - Rediriger vers le bon dashboard selon le rôle
   - Bloquer l'accès aux routes non autorisées

4. **Backward compatibility** : Tous les candidats existants auront automatiquement le rôle `CANDIDAT`

## 🔄 Prochaines étapes (Frontend)

1. Modifier le service API pour récupérer le rôle
2. Créer un système de redirection basé sur le rôle
3. Protéger les routes frontend avec `ProtectedRoute`
4. Afficher/masquer les éléments UI selon le rôle
