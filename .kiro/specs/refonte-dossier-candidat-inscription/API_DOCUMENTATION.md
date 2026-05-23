# Documentation API - Refonte Dossier Candidat et Inscription

## Vue d'Ensemble

Cette API implémente le principe **"Upload Once, Use Everywhere"** permettant aux candidats d'uploader leurs 4 pièces de base une seule fois et de les réutiliser pour tous leurs concours.

**Base URL :** `http://localhost:5000/api`

**Authentication :** Tous les endpoints nécessitent un token JWT dans le header `Authorization: Bearer <token>`

## 📚 Table des Matières

1. [Dossier Personnel](#dossier-personnel)
2. [Dossier Concours](#dossier-concours)
3. [Inscriptions](#inscriptions)
4. [Complétude](#complétude)
5. [Historique](#historique)
6. [Codes d'Erreur](#codes-derreur)

---

## 🗂️ Dossier Personnel

### GET `/candidats/:candidatId/dossier-personnel`

Récupère le dossier personnel d'un candidat avec les 4 pièces de base.

**Permissions :** CANDIDAT (soi-même), COMMISSION, CONTROLEUR, DGES

**Paramètres URL :**
- `candidatId` (string, requis) : ID du candidat

**Réponse 200 :**
```json
{
  "id": "uuid",
  "candidatId": "uuid",
  "candidat": {
    "nom": "DOE",
    "prenom": "John",
    "email": "john.doe@example.com"
  },
  "piecesBase": {
    "acteNaissance": {
      "url": "https://storage.supabase.co/...",
      "uploadedAt": "2024-01-15T10:30:00Z",
      "statut": "fournie"
    },
    "carteIdentite": {
      "url": "https://storage.supabase.co/...",
      "uploadedAt": "2024-01-15T10:32:00Z",
      "statut": "fournie"
    },
    "photo": {
      "url": null,
      "uploadedAt": null,
      "statut": "manquante"
    },
    "releve": {
      "url": "https://storage.supabase.co/...",
      "uploadedAt": "2024-01-15T10:35:00Z",
      "statut": "fournie"
    }
  },
  "completude": {
    "pourcentage": 75,
    "piecesPresentes": 3,
    "piecesRequises": 4
  },
  "impactInscriptions": 3,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:35:00Z"
}
```

**Erreurs :**
- `403` : Accès refusé (candidat essaie d'accéder au dossier d'un autre)
- `404` : Candidat non trouvé

**Exemple cURL :**
```bash
curl -X GET http://localhost:5000/api/candidats/uuid-candidat/dossier-personnel \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### POST `/dossier/upload`

Upload une pièce de base dans le dossier personnel (routage intelligent).

**Permissions :** CANDIDAT

**Body (multipart/form-data) :**
- `fichier` (file, requis) : Fichier à uploader (PDF, JPEG, PNG, max 5MB)
- `typePiece` (string, requis) : Type de pièce (`acteNaissance`, `carteIdentite`, `photo`, `releve`)
- `inscriptionId` (string, optionnel) : Requis uniquement pour quittance et piecesExtras

**Réponse 200 (Pièce de base) :**
```json
{
  "message": "acteNaissance uploadee avec succes dans votre dossier personnel",
  "url": "https://storage.supabase.co/...",
  "dossier": {
    "id": "uuid",
    "candidatId": "uuid",
    "acteNaissance": "https://storage.supabase.co/...",
    "updatedAt": "2024-01-15T10:30:00Z"
  },
  "impactInscriptions": 3,
  "inscriptionsAffectees": [
    { "id": "uuid1", "concours": "Médecine 2024" },
    { "id": "uuid2", "concours": "Pharmacie 2024" },
    { "id": "uuid3", "concours": "Odontologie 2024" }
  ]
}
```

**Erreurs :**
- `400` : Type de pièce manquant ou fichier manquant
- `413` : Fichier trop volumineux (> 5MB)
- `415` : Type de fichier non autorisé

**Exemple cURL :**
```bash
curl -X POST http://localhost:5000/api/dossier/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "fichier=@acte_naissance.pdf" \
  -F "typePiece=acteNaissance"
```

---

## 📋 Dossier Concours

### GET `/completion/inscriptions/:inscriptionId/dossier-complet`

Récupère la vue agrégée d'un dossier d'inscription (pièces de base + pièces spécifiques).

**Permissions :** CANDIDAT (propriétaire), COMMISSION, CONTROLEUR, DGES

**Paramètres URL :**
- `inscriptionId` (string, requis) : ID de l'inscription

**Réponse 200 :**
```json
{
  "inscription": {
    "id": "uuid",
    "numeroInscription": "UAC-2024-MED-00123",
    "candidat": {
      "id": "uuid",
      "nom": "DOE",
      "prenom": "John",
      "email": "john.doe@example.com",
      "telephone": "+229 12345678",
      "dateNaiss": "2000-05-15T00:00:00Z",
      "lieuNaiss": "Cotonou"
    },
    "concours": {
      "id": "uuid",
      "libelle": "Concours Médecine 2024",
      "etablissement": "Faculté de Médecine"
    },
    "note": null,
    "createdAt": "2024-01-16T08:00:00Z"
  },
  "piecesBase": [
    {
      "nom": "acteNaissance",
      "statut": "fournie",
      "source": "dossier_personnel",
      "url": "https://storage.supabase.co/...",
      "uploadedAt": "2024-01-15T10:30:00Z"
    },
    {
      "nom": "carteIdentite",
      "statut": "fournie",
      "source": "dossier_personnel",
      "url": "https://storage.supabase.co/...",
      "uploadedAt": "2024-01-15T10:32:00Z"
    },
    {
      "nom": "photo",
      "statut": "manquante",
      "source": "dossier_personnel",
      "url": null,
      "uploadedAt": null
    },
    {
      "nom": "releve",
      "statut": "fournie",
      "source": "dossier_personnel",
      "url": "https://storage.supabase.co/...",
      "uploadedAt": "2024-01-15T10:35:00Z"
    }
  ],
  "piecesSpecifiques": [
    {
      "nom": "quittance",
      "statut": "fournie",
      "source": "dossier_concours",
      "url": "https://storage.supabase.co/...",
      "uploadedAt": "2024-01-16T09:00:00Z",
      "obligatoire": true
    },
    {
      "nom": "diplome_bac",
      "statut": "manquante",
      "source": "dossier_concours",
      "url": null,
      "uploadedAt": null,
      "obligatoire": false
    }
  ],
  "completude": {
    "pourcentage": 80,
    "piecesPresentes": 4,
    "piecesRequises": 5,
    "estComplet": false
  },
  "dossierInscription": {
    "id": "uuid",
    "statut": "EN_ATTENTE",
    "commentaireRejet": null,
    "commentaireSousReserve": null,
    "decisionCommission": {
      "par": null,
      "date": null,
      "commentaires": {
        "rejet": null,
        "sousReserve": null
      }
    },
    "decisionControleur": {
      "par": null,
      "date": null,
      "commentaire": null
    },
    "createdAt": "2024-01-16T08:00:00Z",
    "updatedAt": "2024-01-16T09:00:00Z"
  }
}
```

**Erreurs :**
- `403` : Accès refusé
- `404` : Inscription non trouvée

**Exemple cURL :**
```bash
curl -X GET http://localhost:5000/api/completion/inscriptions/uuid-inscription/dossier-complet \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### POST `/dossier/upload` (Quittance)

Upload la quittance pour une inscription spécifique.

**Permissions :** CANDIDAT

**Body (multipart/form-data) :**
- `fichier` (file, requis) : Fichier quittance (PDF, JPEG, PNG, max 5MB)
- `typePiece` (string, requis) : `"quittance"`
- `inscriptionId` (string, requis) : ID de l'inscription

**Réponse 200 :**
```json
{
  "message": "Quittance uploadee avec succes",
  "url": "https://storage.supabase.co/...",
  "dossierInscription": {
    "id": "uuid",
    "inscriptionId": "uuid",
    "quittanceUrl": "https://storage.supabase.co/...",
    "statut": "EN_ATTENTE",
    "updatedAt": "2024-01-16T09:00:00Z"
  }
}
```

**Erreurs :**
- `400` : inscriptionId manquant
- `404` : Inscription non trouvée ou non autorisée

**Exemple cURL :**
```bash
curl -X POST http://localhost:5000/api/dossier/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "fichier=@quittance.pdf" \
  -F "typePiece=quittance" \
  -F "inscriptionId=uuid-inscription"
```

---

### POST `/dossier/upload` (Pièce Extra)

Upload une pièce extra configurée par le concours.

**Permissions :** CANDIDAT

**Body (multipart/form-data) :**
- `fichier` (file, requis) : Fichier (PDF, JPEG, PNG, max 5MB)
- `typePiece` (string, requis) : Nom de la pièce extra (ex: `"diplome_bac"`)
- `inscriptionId` (string, requis) : ID de l'inscription

**Réponse 200 :**
```json
{
  "message": "diplome_bac uploadee avec succes",
  "url": "https://storage.supabase.co/...",
  "dossierInscription": {
    "id": "uuid",
    "inscriptionId": "uuid",
    "piecesExtras": {
      "diplome_bac": "https://storage.supabase.co/..."
    },
    "statut": "EN_ATTENTE",
    "updatedAt": "2024-01-16T10:00:00Z"
  }
}
```

**Exemple cURL :**
```bash
curl -X POST http://localhost:5000/api/dossier/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "fichier=@diplome.pdf" \
  -F "typePiece=diplome_bac" \
  -F "inscriptionId=uuid-inscription"
```

---

## 📝 Inscriptions

### POST `/inscriptions`

Crée une nouvelle inscription à un concours (crée automatiquement le DossierInscription).

**Permissions :** CANDIDAT

**Body (JSON) :**
```json
{
  "concoursId": "uuid"
}
```

**Réponse 201 :**
```json
{
  "message": "Inscription créée avec succès",
  "inscription": {
    "id": "uuid",
    "numeroInscription": null,
    "candidatId": "uuid",
    "concoursId": "uuid",
    "note": null,
    "createdAt": "2024-01-16T08:00:00Z",
    "candidat": {
      "id": "uuid",
      "matricule": "UAC2024001",
      "nom": "DOE",
      "prenom": "John",
      "email": "john.doe@example.com"
    },
    "concours": {
      "id": "uuid",
      "libelle": "Concours Médecine 2024",
      "dateDebut": "2024-03-01T00:00:00Z",
      "dateFin": "2024-03-15T00:00:00Z"
    },
    "dossierInscription": {
      "id": "uuid",
      "inscriptionId": "uuid",
      "statut": "EN_ATTENTE",
      "quittanceUrl": null,
      "piecesExtras": {},
      "createdAt": "2024-01-16T08:00:00Z"
    }
  },
  "completude": {
    "pourcentage": 60,
    "piecesPresentes": 3,
    "piecesRequises": 5
  }
}
```

**Erreurs :**
- `400` : Déjà inscrit à ce concours
- `404` : Concours non trouvé

**Exemple cURL :**
```bash
curl -X POST http://localhost:5000/api/inscriptions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"concoursId": "uuid-concours"}'
```

---

### DELETE `/inscriptions/:inscriptionId`

Annule une inscription (supprime en cascade le DossierInscription et l'ActionHistory).

**Permissions :** CANDIDAT (propriétaire uniquement)

**Paramètres URL :**
- `inscriptionId` (string, requis) : ID de l'inscription

**Réponse 200 :**
```json
{
  "message": "Inscription annulée avec succès"
}
```

**Erreurs :**
- `400` : Impossible d'annuler une inscription déjà traitée (statut != EN_ATTENTE)
- `404` : Inscription non trouvée ou non autorisée

**Exemple cURL :**
```bash
curl -X DELETE http://localhost:5000/api/inscriptions/uuid-inscription \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📊 Complétude

### GET `/completion/:candidatId`

Calcule la complétude du dossier personnel d'un candidat.

**Permissions :** CANDIDAT (soi-même), COMMISSION, CONTROLEUR, DGES

**Paramètres URL :**
- `candidatId` (string, requis) : ID du candidat

**Réponse 200 :**
```json
{
  "candidatId": "uuid",
  "pourcentage": 75,
  "piecesPresentes": 3,
  "piecesRequises": 4,
  "piecesManquantes": ["photo"],
  "estComplet": false,
  "timestamp": "2024-01-16T10:00:00Z",
  "candidat": {
    "id": "uuid",
    "nom": "DOE",
    "prenom": "John",
    "email": "john.doe@example.com"
  },
  "permissions": {
    "peutModifier": true,
    "peutVoirDetails": false
  }
}
```

**Exemple cURL :**
```bash
curl -X GET http://localhost:5000/api/completion/uuid-candidat \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📜 Historique

### GET `/history/dossiers-inscription/:dossierInscriptionId`

Récupère l'historique des actions sur un dossier d'inscription.

**Permissions :** COMMISSION, CONTROLEUR, DGES

**Paramètres URL :**
- `dossierInscriptionId` (string, requis) : ID du dossier d'inscription

**Query Parameters :**
- `dateDebut` (ISO date, optionnel) : Filtrer à partir de cette date
- `dateFin` (ISO date, optionnel) : Filtrer jusqu'à cette date
- `utilisateur` (string, optionnel) : Filtrer par ID utilisateur
- `typeAction` (string, optionnel) : Filtrer par type d'action
- `limite` (number, optionnel, défaut: 50) : Nombre de résultats
- `offset` (number, optionnel, défaut: 0) : Pagination

**Réponse 200 :**
```json
{
  "dossierInscriptionId": "uuid",
  "inscription": {
    "id": "uuid",
    "numeroInscription": "UAC-2024-MED-00123",
    "candidat": {
      "nom": "DOE",
      "prenom": "John",
      "email": "john.doe@example.com"
    },
    "concours": {
      "nom": "Médecine",
      "annee": "2024"
    }
  },
  "actions": [
    {
      "id": "uuid",
      "utilisateurId": "uuid",
      "typeAction": "DOSSIER_CONCOURS_CREE",
      "details": {
        "concoursId": "uuid",
        "inscriptionId": "uuid"
      },
      "timestamp": "2024-01-16T08:00:00Z",
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "createdAt": "2024-01-16T08:00:00Z"
    },
    {
      "id": "uuid",
      "utilisateurId": "uuid",
      "typeAction": "QUITTANCE_AJOUTEE",
      "details": {
        "url": "https://storage.supabase.co/..."
      },
      "timestamp": "2024-01-16T09:00:00Z",
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "createdAt": "2024-01-16T09:00:00Z"
    },
    {
      "id": "uuid",
      "utilisateurId": "uuid",
      "typeAction": "PIECE_BASE_MISE_A_JOUR",
      "details": {
        "typePiece": "carteIdentite",
        "url": "https://storage.supabase.co/..."
      },
      "timestamp": "2024-01-20T14:00:00Z",
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "createdAt": "2024-01-20T14:00:00Z"
    }
  ],
  "pagination": {
    "total": 15,
    "limite": 50,
    "offset": 0,
    "pages": 1
  }
}
```

**Erreurs :**
- `403` : Accès refusé (seuls COMMISSION, CONTROLEUR, DGES)
- `404` : Dossier d'inscription non trouvé

**Exemple cURL :**
```bash
curl -X GET "http://localhost:5000/api/history/dossiers-inscription/uuid-dossier?typeAction=PIECE_BASE_MISE_A_JOUR&limite=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## ⚠️ Codes d'Erreur

### Codes HTTP

| Code | Signification | Description |
|------|---------------|-------------|
| 200 | OK | Requête réussie |
| 201 | Created | Ressource créée avec succès |
| 400 | Bad Request | Paramètres invalides ou manquants |
| 401 | Unauthorized | Token manquant ou invalide |
| 403 | Forbidden | Permissions insuffisantes |
| 404 | Not Found | Ressource non trouvée |
| 413 | Payload Too Large | Fichier trop volumineux (> 5MB) |
| 415 | Unsupported Media Type | Type de fichier non autorisé |
| 500 | Internal Server Error | Erreur serveur |

### Format des Erreurs

```json
{
  "error": "Message d'erreur descriptif"
}
```

### Types d'Actions (ActionHistory)

| Type | Description | Rôle autorisé |
|------|-------------|---------------|
| `DOSSIER_CONCOURS_CREE` | Création du dossier d'inscription | CANDIDAT |
| `PIECE_AJOUTEE` | Ajout d'une pièce | CANDIDAT |
| `PIECE_BASE_MISE_A_JOUR` | Mise à jour d'une pièce de base | CANDIDAT |
| `QUITTANCE_AJOUTEE` | Ajout de la quittance | CANDIDAT |
| `PIECE_EXTRA_AJOUTEE` | Ajout d'une pièce extra | CANDIDAT |
| `DOSSIER_VALIDE` | Validation du dossier | COMMISSION, CONTROLEUR, DGES |
| `DOSSIER_REJETE` | Rejet du dossier | COMMISSION, CONTROLEUR, DGES |
| `DECISION_COMMISSION` | Décision de la commission | COMMISSION, DGES |
| `DECISION_CONTROLEUR` | Décision du contrôleur | CONTROLEUR, DGES |

---

## 🔐 Authentification

Tous les endpoints nécessitent un token JWT valide.

**Obtenir un token :**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "password123"
  }'
```

**Utiliser le token :**
```bash
curl -X GET http://localhost:5000/api/endpoint \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 📌 Notes Importantes

### Principe "Upload Once, Use Everywhere"

1. **Pièces de base** (4) : Uploadées UNE FOIS dans le Dossier Personnel
   - `acteNaissance`, `carteIdentite`, `photo`, `releve`
   - Automatiquement réutilisées pour TOUS les concours

2. **Pièces spécifiques** : Uploadées PAR CONCOURS dans le Dossier Concours
   - `quittance` (obligatoire)
   - `piecesExtras` (configurables par concours)

### Impact Multi-Concours

Quand un candidat met à jour une pièce de base :
- La pièce est mise à jour dans le Dossier Personnel
- TOUTES les inscriptions du candidat sont affectées
- Une entrée `ActionHistory` est créée pour chaque DossierInscription
- Le candidat reçoit une notification indiquant le nombre d'inscriptions impactées

### Calcul de Complétude

```
Pourcentage = (piecesBasesPresentes + quittancePresente + piecesExtrasPresentes) / (4 + 1 + nombrePiecesExtrasRequises) * 100
```

**Exemple :**
- 3 pièces de base présentes
- Quittance présente
- 0 pièce extra (aucune requise)
- **Complétude = (3 + 1 + 0) / (4 + 1 + 0) * 100 = 80%**

---

**Version :** 1.0  
**Date :** 2026-05-20  
**Contact :** support@unipath.bj
