# 🧪 Guide de test du système de rôles

## 📦 Installation et migration

### 1. Appliquer les migrations
```bash
cd unipath-api
npx prisma migrate dev --name add_roles_and_user_tables
npx prisma generate
```

### 2. Créer les comptes de test
```bash
node prisma/seed-roles.js
```

Cela créera 3 comptes :
- **candidat@test.com** / password123 (CANDIDAT)
- **commission@test.com** / password123 (COMMISSION)
- **dges@test.com** / password123 (DGES)

## 🔍 Tests avec Postman/Thunder Client

### Test 1 : Login et récupération du rôle

#### Candidat
```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "candidat@test.com",
  "password": "password123"
}
```

**Réponse attendue :**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "email": "candidat@test.com",
    "role": "CANDIDAT",
    "nom": "TEST",
    "prenom": "Candidat",
    "matricule": "UAC-2025-XXX"
  }
}
```

#### Commission
```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "commission@test.com",
  "password": "password123"
}
```

**Réponse attendue :**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "email": "commission@test.com",
    "role": "COMMISSION",
    "nom": "TEST",
    "prenom": "Commission"
  }
}
```

### Test 2 : Accès aux routes protégées

#### ✅ Test réussi : Candidat accède à son profil
```http
GET http://localhost:3000/api/candidat/profil
Authorization: Bearer {TOKEN_CANDIDAT}
```

**Réponse attendue :** 200 OK avec les données du profil

#### ❌ Test échec : Candidat tente d'accéder aux dossiers commission
```http
GET http://localhost:3000/api/commission/dossiers
Authorization: Bearer {TOKEN_CANDIDAT}
```

**Réponse attendue :** 403 Forbidden
```json
{
  "error": "Accès refusé. Rôle requis: COMMISSION",
  "roleActuel": "CANDIDAT"
}
```

#### ✅ Test réussi : Commission accède aux dossiers
```http
GET http://localhost:3000/api/commission/dossiers
Authorization: Bearer {TOKEN_COMMISSION}
```

**Réponse attendue :** 200 OK avec la liste des dossiers

#### ✅ Test réussi : DGES accède aux statistiques
```http
GET http://localhost:3000/api/dges/statistiques
Authorization: Bearer {TOKEN_DGES}
```

**Réponse attendue :** 200 OK avec les statistiques

#### ✅ Test réussi : Commission accède aussi aux statistiques
```http
GET http://localhost:3000/api/dges/statistiques
Authorization: Bearer {TOKEN_COMMISSION}
```

**Réponse attendue :** 200 OK (Commission peut voir les stats)

### Test 3 : Création de nouveaux comptes

#### Créer un nouveau candidat
```http
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "email": "nouveau.candidat@test.com",
  "password": "password123",
  "nom": "NOUVEAU",
  "prenom": "Candidat",
  "telephone": "+22997111111"
}
```

#### Créer un nouveau membre commission
```http
POST http://localhost:3000/api/auth/register/commission
Content-Type: application/json

{
  "email": "nouveau.commission@test.com",
  "password": "password123",
  "nom": "NOUVEAU",
  "prenom": "Commission",
  "telephone": "+22997222222"
}
```

#### Créer un nouvel admin DGES
```http
POST http://localhost:3000/api/auth/register/dges
Content-Type: application/json

{
  "email": "nouveau.dges@test.com",
  "password": "password123",
  "nom": "NOUVEAU",
  "prenom": "DGES",
  "telephone": "+22997333333"
}
```

## 📊 Matrice de contrôle d'accès

| Route | CANDIDAT | COMMISSION | DGES |
|-------|----------|------------|------|
| `/api/candidat/profil` | ✅ | ❌ | ❌ |
| `/api/candidat/convocation/:id` | ✅ | ❌ | ❌ |
| `/api/commission/dossiers` | ❌ | ✅ | ❌ |
| `/api/commission/dossiers/:id` | ❌ | ✅ | ❌ |
| `/api/dges/statistiques` | ❌ | ✅ | ✅ |
| `/api/concours` (GET) | ✅ | ✅ | ✅ |
| `/api/inscription` (POST) | ✅ | ❌ | ❌ |
| `/api/dossier/upload` | ✅ | ❌ | ❌ |

## 🐛 Débogage

### Vérifier le rôle dans la base de données
```sql
-- Voir tous les candidats avec leur rôle
SELECT id, email, nom, prenom, role FROM "Candidat";

-- Voir tous les membres commission
SELECT id, email, nom, prenom, role FROM "MembreCommission";

-- Voir tous les admins DGES
SELECT id, email, nom, prenom, role FROM "AdministrateurDGES";
```

### Logs utiles
Le middleware `role.middleware.js` affiche des logs en cas d'erreur. Vérifiez la console du serveur.

### Erreurs courantes

**Erreur : "Utilisateur non trouvé ou rôle non défini"**
- L'utilisateur n'existe dans aucune des 3 tables
- Solution : Vérifier que l'inscription s'est bien passée

**Erreur : "Accès refusé. Rôle requis: X"**
- L'utilisateur a un rôle différent de celui requis
- C'est normal ! Le système fonctionne correctement

**Erreur : "Token invalide ou expiré"**
- Le token JWT n'est plus valide
- Solution : Se reconnecter pour obtenir un nouveau token

## 🎯 Checklist de validation

- [ ] Migration Prisma appliquée
- [ ] Comptes de test créés
- [ ] Login candidat retourne `role: "CANDIDAT"`
- [ ] Login commission retourne `role: "COMMISSION"`
- [ ] Login DGES retourne `role: "DGES"`
- [ ] Candidat peut accéder à `/api/candidat/profil`
- [ ] Candidat ne peut PAS accéder à `/api/commission/dossiers`
- [ ] Commission peut accéder à `/api/commission/dossiers`
- [ ] Commission ne peut PAS accéder à `/api/candidat/profil`
- [ ] DGES peut accéder à `/api/dges/statistiques`
- [ ] Commission peut aussi accéder à `/api/dges/statistiques`
- [ ] Candidat ne peut PAS accéder à `/api/dges/statistiques`

## 📞 Support

Si un test échoue, vérifiez :
1. Le serveur est bien démarré
2. Les migrations sont appliquées
3. Le token est bien passé dans le header `Authorization: Bearer {token}`
4. Le rôle de l'utilisateur dans la base de données
