# API Endpoints - Refonte Dossier & Inscription

## 📋 Table des matières

1. [Dossier Personnel](#dossier-personnel)
2. [Dossier Concours](#dossier-concours)
3. [Historique](#historique)
4. [Complétude](#complétude)

---

## 🗂️ Dossier Personnel

### GET /api/dossier/candidats/:candidatId/dossier-personnel

Récupère le dossier personnel d'un candidat (4 documents de base).

**Authentification** : Requise  
**Rôles autorisés** : CANDIDAT (self only), COMMISSION, CONTROLEUR, DGES

#### Paramètres de route

| Paramètre | Type | Description |
|-----------|------|-------------|
| `candidatId` | string | ID du candidat |

#### Réponse succès (200)

```json
{
  "candidatId": "clx123abc",
  "piecesBase": [
    {
      "type": "acteNaissance",
      "statut": "fournie",
      "url": "https://storage.supabase.co/...",
      "uploadedAt": "2026-05-10T10:30:00.000Z",
      "source": "dossier_personnel"
    },
    {
      "type": "carteIdentite",
      "statut": "fournie",
      "url": "https://storage.supabase.co/...",
      "uploadedAt": "2026-05-10T10:32:00.000Z",
      "source": "dossier_personnel"
    },
    {
      "type": "photo",
      "statut": "manquante",
      "url": null,
      "uploadedAt": null,
      "source": "dossier_personnel"
    },
    {
      "type": "releve",
      "statut": "manquante",
      "url": null,
      "uploadedAt": null,
      "source": "dossier_personnel"
    }
  ],
  "completude": {
    "pourcentage": 50,
    "piecesPresentes": 2,
    "piecesRequises": 4
  },
  "impactInscriptions": 2
}
```

#### Erreurs

| Code | Description |
|------|-------------|
| 401 | Non authentifié |
| 403 | Accès refusé (candidat essaie d'accéder au dossier d'un autre) |
| 404 | Candidat non trouvé |

#### Exemple cURL

```bash
curl -X GET \
  'https://api.unipath.com/api/dossier/candidats/clx123abc/dossier-personnel' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

---

### PUT /api/dossier/candidats/:candidatId/dossier-personnel/pieces

Upload ou met à jour un document de base du dossier personnel.

**Authentification** : Requise  
**Rôles autorisés** : CANDIDAT (self only), COMMISSION, CONTROLEUR, DGES

#### Paramètres de route

| Paramètre | Type | Description |
|-----------|------|-------------|
| `candidatId` | string | ID du candidat |

#### Body (multipart/form-data)

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `typePiece` | string | ✅ | Type de document : `acteNaissance`, `carteIdentite`, `photo`, `releve` |
| `file` | file | ✅ | Fichier à uploader (PDF, JPG, PNG) |

#### Réponse succès (200)

```json
{
  "message": "Document photo uploadé avec succès",
  "url": "https://storage.supabase.co/...",
  "typePiece": "photo",
  "impactInscriptions": [
    {
      "inscriptionId": "clx456def",
      "numeroInscription": "INS-2026-001",
      "concoursNom": "Concours A",
      "actionHistoryId": "clxabc123"
    },
    {
      "inscriptionId": "clx789ghi",
      "numeroInscription": "INS-2026-002",
      "concoursNom": "Concours B",
      "actionHistoryId": "clxdef456"
    }
  ]
}
```

#### Erreurs

| Code | Description |
|------|-------------|
| 400 | Fichier manquant ou type de pièce invalide |
| 401 | Non authentifié |
| 403 | Accès refusé |
| 413 | Fichier trop volumineux (max 5MB) |
| 415 | Type de fichier non supporté |

#### Exemple cURL

```bash
curl -X PUT \
  'https://api.unipath.com/api/dossier/candidats/clx123abc/dossier-personnel/pieces' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -F 'typePiece=photo' \
  -F 'file=@/path/to/photo.jpg'
```

---

## 🎓 Dossier Concours

### GET /api/completion/inscriptions/:inscriptionId/dossier-complet

Récupère le dossier complet d'une inscription (documents de base + documents spécifiques).

**Authentification** : Requise  
**Rôles autorisés** : CANDIDAT (owner only), COMMISSION, CONTROLEUR, DGES

#### Paramètres de route

| Paramètre | Type | Description |
|-----------|------|-------------|
| `inscriptionId` | string | ID de l'inscription |

#### Réponse succès (200)

```json
{
  "inscriptionId": "clx456def",
  "numeroInscription": "INS-2026-001",
  "candidat": {
    "id": "clx123abc",
    "nom": "Dupont",
    "prenom": "Jean",
    "email": "jean.dupont@example.com"
  },
  "concours": {
    "id": "clxconcours1",
    "nom": "Concours A",
    "annee": 2026
  },
  "piecesBase": [
    {
      "type": "acteNaissance",
      "statut": "fournie",
      "url": "https://storage.supabase.co/...",
      "uploadedAt": "2026-05-10T10:30:00.000Z",
      "source": "dossier_personnel"
    },
    {
      "type": "carteIdentite",
      "statut": "fournie",
      "url": "https://storage.supabase.co/...",
      "uploadedAt": "2026-05-10T10:32:00.000Z",
      "source": "dossier_personnel"
    },
    {
      "type": "photo",
      "statut": "fournie",
      "url": "https://storage.supabase.co/...",
      "uploadedAt": "2026-05-10T10:35:00.000Z",
      "source": "dossier_personnel"
    },
    {
      "type": "releve",
      "statut": "fournie",
      "url": "https://storage.supabase.co/...",
      "uploadedAt": "2026-05-10T10:40:00.000Z",
      "source": "dossier_personnel"
    }
  ],
  "piecesSpecifiques": [
    {
      "type": "quittance",
      "statut": "fournie",
      "url": "https://storage.supabase.co/...",
      "uploadedAt": "2026-05-10T11:00:00.000Z",
      "source": "dossier_concours",
      "obligatoire": true
    },
    {
      "type": "attestation_travail",
      "statut": "fournie",
      "url": "https://storage.supabase.co/...",
      "uploadedAt": "2026-05-10T11:05:00.000Z",
      "source": "dossier_concours",
      "obligatoire": false
    }
  ],
  "completudeGlobale": {
    "pourcentage": 100,
    "piecesPresentes": 6,
    "piecesRequises": 6,
    "estComplet": true
  },
  "dossierInscription": {
    "id": "clxdossier1",
    "statut": "VALIDE",
    "createdAt": "2026-05-10T09:00:00.000Z",
    "updatedAt": "2026-05-10T14:00:00.000Z"
  },
  "decisions": {
    "commission": {
      "par": "Marie Martin",
      "date": "2026-05-10T14:00:00.000Z",
      "commentaires": "Dossier complet et conforme"
    },
    "controleur": null
  },
  "permissions": {
    "peutModifier": false,
    "peutVoirDetails": true
  }
}
```

#### Erreurs

| Code | Description |
|------|-------------|
| 401 | Non authentifié |
| 403 | Accès refusé |
| 404 | Inscription non trouvée |

#### Exemple cURL

```bash
curl -X GET \
  'https://api.unipath.com/api/completion/inscriptions/clx456def/dossier-complet' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

---

### POST /api/inscriptions/:inscriptionId/dossier-concours/quittance

Upload la quittance pour une inscription spécifique.

**Authentification** : Requise  
**Rôles autorisés** : CANDIDAT (owner only), COMMISSION, CONTROLEUR, DGES

#### Paramètres de route

| Paramètre | Type | Description |
|-----------|------|-------------|
| `inscriptionId` | string | ID de l'inscription |

#### Body (multipart/form-data)

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `file` | file | ✅ | Fichier quittance (PDF, JPG, PNG) |

#### Réponse succès (200)

```json
{
  "message": "Quittance uploadée avec succès",
  "url": "https://storage.supabase.co/...",
  "inscriptionId": "clx456def",
  "actionHistoryId": "clxaction1"
}
```

#### Erreurs

| Code | Description |
|------|-------------|
| 400 | Fichier manquant |
| 401 | Non authentifié |
| 403 | Accès refusé |
| 404 | Inscription non trouvée |
| 413 | Fichier trop volumineux |
| 415 | Type de fichier non supporté |

#### Exemple cURL

```bash
curl -X POST \
  'https://api.unipath.com/api/inscriptions/clx456def/dossier-concours/quittance' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -F 'file=@/path/to/quittance.pdf'
```

---

### POST /api/inscriptions/:inscriptionId/dossier-concours/pieces-extras

Upload une pièce extra pour une inscription spécifique.

**Authentification** : Requise  
**Rôles autorisés** : CANDIDAT (owner only), COMMISSION, CONTROLEUR, DGES

#### Paramètres de route

| Paramètre | Type | Description |
|-----------|------|-------------|
| `inscriptionId` | string | ID de l'inscription |

#### Body (multipart/form-data)

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `typePiece` | string | ✅ | Type de pièce extra (ex: `attestation_travail`) |
| `file` | file | ✅ | Fichier à uploader (PDF, JPG, PNG) |

#### Réponse succès (200)

```json
{
  "message": "Pièce extra attestation_travail uploadée avec succès",
  "url": "https://storage.supabase.co/...",
  "typePiece": "attestation_travail",
  "inscriptionId": "clx456def",
  "actionHistoryId": "clxaction2"
}
```

#### Erreurs

| Code | Description |
|------|-------------|
| 400 | Fichier ou typePiece manquant |
| 401 | Non authentifié |
| 403 | Accès refusé |
| 404 | Inscription non trouvée |
| 413 | Fichier trop volumineux |
| 415 | Type de fichier non supporté |

#### Exemple cURL

```bash
curl -X POST \
  'https://api.unipath.com/api/inscriptions/clx456def/dossier-concours/pieces-extras' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -F 'typePiece=attestation_travail' \
  -F 'file=@/path/to/attestation.pdf'
```

---

## 📜 Historique

### GET /api/history/dossiers-inscription/:dossierInscriptionId

Récupère l'historique des actions pour un dossier d'inscription.

**Authentification** : Requise  
**Rôles autorisés** : COMMISSION, CONTROLEUR, DGES

#### Paramètres de route

| Paramètre | Type | Description |
|-----------|------|-------------|
| `dossierInscriptionId` | string | ID du dossier d'inscription |

#### Paramètres de query

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `dateDebut` | string (ISO 8601) | ❌ | Date de début du filtre |
| `dateFin` | string (ISO 8601) | ❌ | Date de fin du filtre |
| `utilisateur` | string | ❌ | ID de l'utilisateur |
| `typeAction` | string | ❌ | Type d'action à filtrer |
| `limite` | number | ❌ | Nombre de résultats (défaut: 50) |
| `offset` | number | ❌ | Offset pour pagination (défaut: 0) |

#### Réponse succès (200)

```json
{
  "dossierInscriptionId": "clxdossier1",
  "inscription": {
    "id": "clx456def",
    "numeroInscription": "INS-2026-001",
    "candidat": {
      "nom": "Dupont",
      "prenom": "Jean",
      "email": "jean.dupont@example.com"
    },
    "concours": {
      "nom": "Concours A",
      "annee": 2026
    }
  },
  "actions": [
    {
      "id": "clxaction1",
      "typeAction": "DOSSIER_CONCOURS_CREE",
      "utilisateurId": "clx123abc",
      "timestamp": "2026-05-10T09:00:00.000Z",
      "details": null,
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0..."
    },
    {
      "id": "clxaction2",
      "typeAction": "PIECE_BASE_MISE_A_JOUR",
      "utilisateurId": "clx123abc",
      "timestamp": "2026-05-10T10:30:00.000Z",
      "details": {
        "typePiece": "acteNaissance"
      },
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0..."
    },
    {
      "id": "clxaction3",
      "typeAction": "PIECE_AJOUTEE",
      "utilisateurId": "clx123abc",
      "timestamp": "2026-05-10T11:00:00.000Z",
      "details": {
        "typePiece": "quittance"
      },
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0..."
    },
    {
      "id": "clxaction4",
      "typeAction": "DOSSIER_VALIDE",
      "utilisateurId": "clxcommission1",
      "timestamp": "2026-05-10T14:00:00.000Z",
      "details": {
        "commentaire": "Dossier complet et conforme"
      },
      "ipAddress": "192.168.1.50",
      "userAgent": "Mozilla/5.0..."
    }
  ],
  "pagination": {
    "total": 4,
    "limite": 50,
    "offset": 0,
    "pages": 1
  }
}
```

#### Erreurs

| Code | Description |
|------|-------------|
| 401 | Non authentifié |
| 403 | Accès refusé (seuls COMMISSION, CONTROLEUR, DGES) |
| 404 | Dossier d'inscription non trouvé |

#### Exemple cURL

```bash
curl -X GET \
  'https://api.unipath.com/api/history/dossiers-inscription/clxdossier1?limite=50&offset=0' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

---

### POST /api/history/action

Enregistre une nouvelle action dans l'historique.

**Authentification** : Requise  
**Rôles autorisés** : Tous (avec restrictions par type d'action)

#### Body (application/json)

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `dossierInscriptionId` | string | ✅ | ID du dossier d'inscription |
| `typeAction` | string | ✅ | Type d'action (voir tableau ci-dessous) |
| `details` | object | ❌ | Détails supplémentaires (JSON) |

#### Types d'actions autorisés par rôle

| Type d'action | CANDIDAT | COMMISSION | CONTROLEUR | DGES |
|---------------|----------|------------|------------|------|
| `DOSSIER_CONCOURS_CREE` | ✅ | ❌ | ❌ | ❌ |
| `PIECE_AJOUTEE` | ✅ | ❌ | ❌ | ❌ |
| `PIECE_SUPPRIMEE` | ✅ | ❌ | ❌ | ❌ |
| `DOSSIER_SOUMIS` | ✅ | ❌ | ❌ | ❌ |
| `DOSSIER_MODIFIE` | ✅ | ✅ | ✅ | ✅ |
| `PIECE_BASE_MISE_A_JOUR` | ✅ | ❌ | ❌ | ❌ |
| `DOSSIER_VALIDE` | ❌ | ✅ | ✅ | ✅ |
| `DOSSIER_REJETE` | ❌ | ✅ | ✅ | ✅ |
| `DECISION_COMMISSION` | ❌ | ✅ | ❌ | ✅ |
| `DECISION_CONTROLEUR` | ❌ | ❌ | ✅ | ✅ |

#### Réponse succès (201)

```json
{
  "message": "Action enregistrée avec succès",
  "actionId": "clxaction5",
  "timestamp": "2026-05-10T15:00:00.000Z"
}
```

#### Erreurs

| Code | Description |
|------|-------------|
| 400 | dossierInscriptionId ou typeAction manquant |
| 401 | Non authentifié |
| 403 | Action non autorisée pour ce rôle |
| 404 | Dossier d'inscription non trouvé |

#### Exemple cURL

```bash
curl -X POST \
  'https://api.unipath.com/api/history/action' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "dossierInscriptionId": "clxdossier1",
    "typeAction": "DOSSIER_VALIDE",
    "details": {
      "commentaire": "Dossier complet et conforme"
    }
  }'
```

---

## 📊 Complétude

### GET /api/completion/inscriptions/:inscriptionId/completion

Calcule la complétude d'une inscription (alias de dossier-complet avec moins de détails).

**Note** : Utilisez plutôt `/dossier-complet` pour une vue complète.

---

## 🔐 Résumé des permissions

| Endpoint | CANDIDAT | COMMISSION | CONTROLEUR | DGES |
|----------|----------|------------|------------|------|
| GET dossier-personnel | Self only | ✅ | ✅ | ✅ |
| PUT dossier-personnel/pieces | Self only | ✅ | ✅ | ✅ |
| GET dossier-complet | Owner only | ✅ | ✅ | ✅ |
| POST quittance | Owner only | ✅ | ✅ | ✅ |
| POST pieces-extras | Owner only | ✅ | ✅ | ✅ |
| GET historique | ❌ | ✅ | ✅ | ✅ |
| POST action | Limited | ✅ | ✅ | ✅ |

---

## 📝 Notes importantes

1. **Référence implicite** : Les documents de base sont récupérés via Inscription → Candidat → Dossier
2. **Impact multi-inscription** : La mise à jour d'un document de base crée une ActionHistory pour chaque DossierInscription du candidat
3. **Cascade deletion** : La suppression d'une Inscription supprime automatiquement le DossierInscription et les ActionHistory associés
4. **Validation des fichiers** : 
   - Taille max : 5MB
   - Formats acceptés : PDF, JPG, JPEG, PNG
5. **Rate limiting** : 100 requêtes par minute par utilisateur

---

**Version** : 1.0  
**Date** : 11 mai 2026
