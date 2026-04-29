# Documentation API UniPath

Base URL: `http://localhost:3001/api` (dev) | `https://unipath-api.onrender.com/api` (prod)

## 🔐 Authentification

La plupart des endpoints nécessitent un token JWT dans le header :

```
Authorization: Bearer <votre_token>
```

---

## 📋 Endpoints

### Health Check

#### `GET /health`

Vérifier que l'API fonctionne.

**Réponse:**
```json
{
  "status": "OK",
  "message": "UniPath API fonctionne !",
  "timestamp": "2026-04-29T10:30:00.000Z",
  "environment": "development"
}
```

---

## 🔑 Authentification

### `POST /api/auth/login`

Connexion d'un utilisateur.

**Body:**
```json
{
  "email": "candidat@example.com",
  "password": "motdepasse123"
}
```

**Réponse (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "candidat@example.com",
    "nom": "Doe",
    "prenom": "John",
    "role": "CANDIDAT"
  }
}
```

**Erreurs:**
- `400` — Email ou mot de passe manquant
- `401` — Identifiants incorrects

---

### `POST /api/auth/register`

Inscription d'un nouveau candidat.

**Body:**
```json
{
  "nom": "Doe",
  "prenom": "John",
  "email": "john.doe@example.com",
  "telephone": "+22997123456",
  "dateNaiss": "2000-01-15T00:00:00.000Z",
  "lieuNaiss": "Cotonou"
}
```

**Réponse (201):**
```json
{
  "message": "Inscription réussie",
  "candidat": {
    "id": "uuid",
    "matricule": "CAND-2026-001",
    "email": "john.doe@example.com",
    "nom": "Doe",
    "prenom": "John"
  }
}
```

**Erreurs:**
- `400` — Données invalides
- `409` — Email déjà utilisé

---

### `POST /api/auth/reset-password`

Demander une réinitialisation de mot de passe.

**Body:**
```json
{
  "email": "candidat@example.com"
}
```

**Réponse (200):**
```json
{
  "message": "Email de réinitialisation envoyé"
}
```

---

## 👤 Candidats

### `GET /api/candidats/profil`

Récupérer le profil du candidat connecté.

**Headers:** `Authorization: Bearer <token>`

**Réponse (200):**
```json
{
  "id": "uuid",
  "matricule": "CAND-2026-001",
  "nom": "Doe",
  "prenom": "John",
  "email": "john.doe@example.com",
  "telephone": "+22997123456",
  "dateNaiss": "2000-01-15T00:00:00.000Z",
  "lieuNaiss": "Cotonou",
  "role": "CANDIDAT"
}
```

---

### `PUT /api/candidats/profil`

Mettre à jour le profil du candidat.

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "telephone": "+22997654321",
  "lieuNaiss": "Porto-Novo"
}
```

**Réponse (200):**
```json
{
  "message": "Profil mis à jour",
  "candidat": { ... }
}
```

---

## 🎓 Concours

### `GET /api/concours`

Liste de tous les concours disponibles.

**Réponse (200):**
```json
[
  {
    "id": "uuid",
    "libelle": "Concours EPAC 2026",
    "dateDebut": "2026-05-01T00:00:00.000Z",
    "dateFin": "2026-05-15T00:00:00.000Z",
    "description": "Concours d'entrée à l'EPAC"
  }
]
```

---

### `GET /api/concours/:id`

Détails d'un concours spécifique.

**Réponse (200):**
```json
{
  "id": "uuid",
  "libelle": "Concours EPAC 2026",
  "dateDebut": "2026-05-01T00:00:00.000Z",
  "dateFin": "2026-05-15T00:00:00.000Z",
  "description": "Concours d'entrée à l'EPAC",
  "inscriptions": [...]
}
```

**Erreurs:**
- `404` — Concours introuvable

---

## 📝 Inscriptions

### `POST /api/inscriptions`

S'inscrire à un concours.

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "concoursId": "uuid-du-concours"
}
```

**Réponse (201):**
```json
{
  "message": "Inscription créée avec succès",
  "inscription": {
    "id": "uuid",
    "candidatId": "uuid",
    "concoursId": "uuid",
    "statut": "EN_ATTENTE",
    "createdAt": "2026-04-29T10:30:00.000Z"
  }
}
```

**Erreurs:**
- `400` — ID de concours invalide
- `409` — Déjà inscrit à ce concours

---

### `GET /api/inscriptions/mes-inscriptions`

Liste des inscriptions du candidat connecté.

**Headers:** `Authorization: Bearer <token>`

**Réponse (200):**
```json
[
  {
    "id": "uuid",
    "statut": "EN_ATTENTE",
    "createdAt": "2026-04-29T10:30:00.000Z",
    "concours": {
      "libelle": "Concours EPAC 2026",
      "dateDebut": "2026-05-01T00:00:00.000Z"
    }
  }
]
```

---

## 📁 Dossiers

### `POST /api/dossier/upload`

Upload d'une pièce justificative.

**Headers:** 
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Body (FormData):**
- `fichier`: File
- `typePiece`: "acteNaissance" | "carteIdentite" | "photo" | "releve" | "quittance"

**Réponse (200):**
```json
{
  "message": "Pièce uploadée avec succès",
  "url": "https://supabase.co/storage/..."
}
```

---

### `GET /api/dossier`

Récupérer le dossier du candidat.

**Headers:** `Authorization: Bearer <token>`

**Réponse (200):**
```json
{
  "id": "uuid",
  "candidatId": "uuid",
  "acteNaissance": "https://...",
  "carteIdentite": "https://...",
  "photo": "https://...",
  "releve": null,
  "quittance": null
}
```

---

## 🏛️ Commission

### `GET /api/commission/dossiers`

Liste des dossiers à évaluer.

**Headers:** `Authorization: Bearer <token>` (rôle COMMISSION requis)

**Query params:**
- `statut` (optionnel): "EN_ATTENTE" | "VALIDE" | "REJETE"

**Réponse (200):**
```json
[
  {
    "id": "uuid",
    "statut": "EN_ATTENTE",
    "candidat": {
      "nom": "Doe",
      "prenom": "John",
      "email": "john.doe@example.com"
    },
    "concours": {
      "libelle": "Concours EPAC 2026"
    }
  }
]
```

---

### `PATCH /api/commission/dossiers/:id`

Mettre à jour le statut d'un dossier.

**Headers:** `Authorization: Bearer <token>` (rôle COMMISSION requis)

**Body:**
```json
{
  "statut": "VALIDE"
}
```

**Réponse (200):**
```json
{
  "message": "Statut mis à jour",
  "inscription": { ... }
}
```

---

## 📊 DGES

### `GET /api/dges/statistiques`

Statistiques globales de tous les concours.

**Headers:** `Authorization: Bearer <token>` (rôle DGES requis)

**Réponse (200):**
```json
{
  "totaux": {
    "candidats": 1250,
    "inscriptions": 2100,
    "valides": 850,
    "rejetes": 120,
    "enAttente": 1130
  },
  "statistiques": [
    {
      "concoursId": "uuid",
      "libelle": "Concours EPAC 2026",
      "inscriptions": 450,
      "valides": 200,
      "rejetes": 30,
      "enAttente": 220
    }
  ]
}
```

---

### `GET /api/dges/statistiques/:id`

Statistiques d'un concours spécifique.

**Headers:** `Authorization: Bearer <token>` (rôle DGES requis)

**Réponse (200):**
```json
{
  "concours": {
    "id": "uuid",
    "libelle": "Concours EPAC 2026"
  },
  "statistiques": {
    "inscriptions": 450,
    "valides": 200,
    "rejetes": 30,
    "enAttente": 220
  }
}
```

---

## 📄 PDF

### `GET /api/candidats/convocation/:inscriptionId`

Télécharger la convocation en PDF.

**Headers:** `Authorization: Bearer <token>`

**Réponse:** Fichier PDF

---

### `GET /api/candidats/preinscription/:inscriptionId`

Télécharger le certificat de préinscription en PDF.

**Headers:** `Authorization: Bearer <token>`

**Réponse:** Fichier PDF

---

## ❌ Codes d'Erreur

| Code | Signification |
|------|---------------|
| 400  | Requête invalide (données manquantes ou incorrectes) |
| 401  | Non authentifié (token manquant ou invalide) |
| 403  | Accès interdit (permissions insuffisantes) |
| 404  | Ressource introuvable |
| 409  | Conflit (ex: email déjà utilisé) |
| 422  | Erreur de validation |
| 500  | Erreur serveur |

---

## 🔧 Exemples avec cURL

### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"candidat@example.com","password":"motdepasse123"}'
```

### Récupérer profil
```bash
curl http://localhost:3001/api/candidats/profil \
  -H "Authorization: Bearer <votre_token>"
```

### Upload fichier
```bash
curl -X POST http://localhost:3001/api/dossier/upload \
  -H "Authorization: Bearer <votre_token>" \
  -F "fichier=@/path/to/file.pdf" \
  -F "typePiece=acteNaissance"
```
