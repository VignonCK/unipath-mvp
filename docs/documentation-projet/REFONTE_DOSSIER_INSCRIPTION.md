# Refonte Dossier Candidat et Inscription

## 📋 Vue d'ensemble

Cette refonte implémente le principe **"Upload Once, Use Everywhere"** en séparant clairement :
- **Dossier Personnel** : 4 documents de base réutilisables pour toutes les inscriptions
- **Dossier Concours** : Documents spécifiques à chaque inscription (quittance + pièces extras)

## 🎯 Objectifs

1. **Éliminer la duplication** : Un candidat upload ses documents de base une seule fois
2. **Clarifier les responsabilités** : Séparation nette entre documents personnels et documents par concours
3. **Améliorer la traçabilité** : Historique lié aux dossiers d'inscription, pas aux dossiers personnels
4. **Simplifier la gestion** : Impact multi-inscription automatique lors de la mise à jour des documents de base

## 🏗️ Architecture

### Avant la refonte

```
Inscription
├── statut
├── quittanceUrl
├── piecesExtras
├── commentaireRejet
└── decision fields...

Dossier
├── candidatId
├── acteNaissance
├── carteIdentite
├── photo
└── releve

ActionHistory
└── dossierId (référence Dossier)
```

**Problèmes** :
- Confusion entre documents personnels et documents par concours
- ActionHistory référence le mauvais objet (Dossier au lieu de l'inscription)
- Pas de séparation claire des responsabilités

### Après la refonte

```
Dossier (Personnel)
├── candidatId (1-1)
├── acteNaissance
├── carteIdentite
├── photo
└── releve

Inscription
├── candidatId
├── concoursId
├── numeroInscription
├── note
└── createdAt

DossierInscription (Concours)
├── inscriptionId (1-1)
├── quittanceUrl
├── piecesExtras (JSON)
├── statut
├── commentaireRejet
├── commentaireSousReserve
└── decision fields...

ActionHistory
└── dossierInscriptionId (référence DossierInscription)
```

**Avantages** :
- ✅ Séparation claire : Dossier (personnel) vs DossierInscription (concours)
- ✅ Référence implicite : Inscription → Candidat → Dossier (pour les documents de base)
- ✅ Traçabilité correcte : ActionHistory → DossierInscription
- ✅ Pas de duplication : Documents de base partagés entre toutes les inscriptions

## 📊 Diagramme de flux

### Première inscription d'un candidat

```
1. Candidat crée une inscription
   └─> Création automatique de Dossier (vide) si n'existe pas
   └─> Création automatique de DossierInscription (statut: EN_ATTENTE)
   └─> ActionHistory: DOSSIER_CONCOURS_CREE

2. Candidat upload documents de base
   └─> Upload vers Dossier Personnel
   └─> ActionHistory créé pour CHAQUE DossierInscription du candidat
   └─> Notification multi-inscription si plusieurs inscriptions

3. Candidat upload quittance
   └─> Upload vers DossierInscription
   └─> ActionHistory: PIECE_AJOUTEE

4. Calcul de complétude
   └─> 4 documents de base (depuis Dossier via référence implicite)
   └─> 1 quittance (depuis DossierInscription)
   └─> N pièces extras (depuis DossierInscription.piecesExtras)
```

### Inscriptions suivantes du même candidat

```
1. Candidat crée une 2ème inscription
   └─> Dossier existe déjà (réutilisé)
   └─> Création automatique de DossierInscription
   └─> Documents de base déjà disponibles (via référence implicite)

2. Candidat upload uniquement la quittance
   └─> Upload vers DossierInscription
   └─> Complétude = 100% si documents de base déjà présents

3. Mise à jour d'un document de base
   └─> Mise à jour dans Dossier Personnel
   └─> ActionHistory créé pour TOUTES les DossierInscription du candidat
   └─> Impact automatique sur toutes les inscriptions
```

## 🔄 Migration des données

### Étape 1 : Modification du schéma Prisma

**Fichier** : `unipath-api/prisma/schema.prisma`

```prisma
// Nouveau modèle DossierInscription
model DossierInscription {
  id                        String   @id @default(cuid())
  inscriptionId             String   @unique
  inscription               Inscription @relation(fields: [inscriptionId], references: [id], onDelete: Cascade)
  
  // Documents spécifiques au concours
  quittanceUrl              String?
  piecesExtras              Json?    @default("{}")
  
  // Statut et décisions
  statut                    StatutDossier @default(EN_ATTENTE)
  commentaireRejet          String?
  commentaireSousReserve    String?
  
  // Décisions commission
  decisionCommissionPar     String?
  decisionCommissionDate    DateTime?
  
  // Décisions contrôleur
  decisionControleurPar     String?
  decisionControleurDate    DateTime?
  commentaireControleur     String?
  
  // Timestamps
  createdAt                 DateTime @default(now())
  updatedAt                 DateTime @updatedAt
  
  // Relations
  actionHistory             ActionHistory[]
  
  @@index([inscriptionId])
  @@index([statut])
  @@index([createdAt])
}

// Modèle Inscription simplifié
model Inscription {
  id                  String   @id @default(cuid())
  numeroInscription   String   @unique
  candidatId          String
  candidat            Candidat @relation(fields: [candidatId], references: [id])
  concoursId          String
  concours            Concours @relation(fields: [concoursId], references: [id])
  note                Float?
  createdAt           DateTime @default(now())
  
  // Relation 1-1 avec DossierInscription
  dossierInscription  DossierInscription?
  
  @@index([candidatId])
  @@index([concoursId])
}

// ActionHistory mis à jour
model ActionHistory {
  id                    String   @id @default(cuid())
  dossierInscriptionId  String   // Changé de dossierId
  dossierInscription    DossierInscription @relation(fields: [dossierInscriptionId], references: [id], onDelete: Cascade)
  utilisateurId         String
  typeAction            String
  details               Json?
  ipAddress             String?
  userAgent             String?
  timestamp             DateTime @default(now())
  
  @@index([dossierInscriptionId])
  @@index([timestamp])
}
```

### Étape 2 : Génération de la migration

```bash
cd unipath-api
npx prisma migrate dev --name refonte-dossier-inscription --create-only
```

**Fichier généré** : `unipath-api/prisma/migrations/20260510173725_refonte_dossier_inscription/migration.sql`

### Étape 3 : Migration des données existantes

**Fichier** : `unipath-api/prisma/migrations/data-migration-dossier-inscription.js`

Le script effectue :
1. Création d'un DossierInscription pour chaque Inscription existante
2. Copie des champs (statut, quittanceUrl, piecesExtras, décisions)
3. Mise à jour des références ActionHistory (dossierId → dossierInscriptionId)
4. Validation de l'intégrité des données

### Étape 4 : Exécution de la migration

```bash
# 1. Backup de la base de données
pg_dump $DATABASE_URL > backup_before_refonte_$(date +%Y%m%d_%H%M%S).sql

# 2. Exécution de la migration Prisma
npx prisma migrate deploy

# 3. Exécution de la migration des données
node prisma/migrations/data-migration-dossier-inscription.js

# 4. Vérification
npx prisma studio
```

## 🎮 Utilisation des nouveaux endpoints

### 1. Dossier Personnel

#### Récupérer le dossier personnel d'un candidat

```http
GET /api/dossier/candidats/:candidatId/dossier-personnel
Authorization: Bearer <token>
```

**Réponse** :
```json
{
  "candidatId": "clx123...",
  "piecesBase": [
    {
      "type": "acteNaissance",
      "statut": "fournie",
      "url": "https://...",
      "uploadedAt": "2026-05-10T10:30:00Z",
      "source": "dossier_personnel"
    },
    {
      "type": "carteIdentite",
      "statut": "fournie",
      "url": "https://...",
      "uploadedAt": "2026-05-10T10:32:00Z",
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

#### Uploader un document de base

```http
PUT /api/dossier/candidats/:candidatId/dossier-personnel/pieces
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "typePiece": "photo",
  "file": <binary>
}
```

**Réponse** :
```json
{
  "message": "Document photo uploadé avec succès",
  "url": "https://...",
  "impactInscriptions": [
    {
      "inscriptionId": "clx456...",
      "numeroInscription": "INS-2026-001",
      "concoursNom": "Concours A"
    },
    {
      "inscriptionId": "clx789...",
      "numeroInscription": "INS-2026-002",
      "concoursNom": "Concours B"
    }
  ]
}
```

### 2. Dossier Concours

#### Récupérer le dossier complet d'une inscription

```http
GET /api/completion/inscriptions/:inscriptionId/dossier-complet
Authorization: Bearer <token>
```

**Réponse** :
```json
{
  "inscriptionId": "clx456...",
  "numeroInscription": "INS-2026-001",
  "candidat": {
    "nom": "Dupont",
    "prenom": "Jean"
  },
  "concours": {
    "nom": "Concours A",
    "annee": 2026
  },
  "piecesBase": [
    {
      "type": "acteNaissance",
      "statut": "fournie",
      "url": "https://...",
      "uploadedAt": "2026-05-10T10:30:00Z",
      "source": "dossier_personnel"
    }
    // ... 3 autres documents de base
  ],
  "piecesSpecifiques": [
    {
      "type": "quittance",
      "statut": "fournie",
      "url": "https://...",
      "uploadedAt": "2026-05-10T11:00:00Z",
      "source": "dossier_concours",
      "obligatoire": true
    },
    {
      "type": "attestation_travail",
      "statut": "fournie",
      "url": "https://...",
      "uploadedAt": "2026-05-10T11:05:00Z",
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
    "id": "clx999...",
    "statut": "VALIDE",
    "createdAt": "2026-05-10T09:00:00Z",
    "updatedAt": "2026-05-10T14:00:00Z"
  },
  "decisions": {
    "commission": {
      "par": "Marie Martin",
      "date": "2026-05-10T14:00:00Z",
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

#### Uploader la quittance

```http
POST /api/inscriptions/:inscriptionId/dossier-concours/quittance
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "file": <binary>
}
```

#### Uploader une pièce extra

```http
POST /api/inscriptions/:inscriptionId/dossier-concours/pieces-extras
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "typePiece": "attestation_travail",
  "file": <binary>
}
```

### 3. Historique

#### Récupérer l'historique d'un dossier d'inscription

```http
GET /api/history/dossiers-inscription/:dossierInscriptionId?limite=50&offset=0
Authorization: Bearer <token>
```

**Réponse** :
```json
{
  "dossierInscriptionId": "clx999...",
  "inscription": {
    "id": "clx456...",
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
      "id": "clxabc...",
      "typeAction": "DOSSIER_CONCOURS_CREE",
      "utilisateurId": "clx123...",
      "timestamp": "2026-05-10T09:00:00Z",
      "details": null,
      "ipAddress": "192.168.1.1"
    },
    {
      "id": "clxdef...",
      "typeAction": "PIECE_BASE_MISE_A_JOUR",
      "utilisateurId": "clx123...",
      "timestamp": "2026-05-10T10:30:00Z",
      "details": { "typePiece": "acteNaissance" },
      "ipAddress": "192.168.1.1"
    },
    {
      "id": "clxghi...",
      "typeAction": "PIECE_AJOUTEE",
      "utilisateurId": "clx123...",
      "timestamp": "2026-05-10T11:00:00Z",
      "details": { "typePiece": "quittance" },
      "ipAddress": "192.168.1.1"
    }
  ],
  "pagination": {
    "total": 3,
    "limite": 50,
    "offset": 0,
    "pages": 1
  }
}
```

## 🔐 Permissions

### Dossier Personnel

| Rôle | GET dossier-personnel | PUT pieces |
|------|----------------------|------------|
| CANDIDAT | ✅ Self only | ✅ Self only |
| COMMISSION | ✅ All | ✅ All |
| CONTROLEUR | ✅ All | ✅ All |
| DGES | ✅ All | ✅ All |

### Dossier Concours

| Rôle | GET dossier-complet | POST quittance | POST pieces-extras |
|------|---------------------|----------------|-------------------|
| CANDIDAT | ✅ Owner only | ✅ Owner only | ✅ Owner only |
| COMMISSION | ✅ All | ✅ All | ✅ All |
| CONTROLEUR | ✅ All | ✅ All | ✅ All |
| DGES | ✅ All | ✅ All | ✅ All |

### Historique

| Rôle | GET historique | POST action |
|------|----------------|-------------|
| CANDIDAT | ❌ | ✅ Limited actions |
| COMMISSION | ✅ | ✅ |
| CONTROLEUR | ✅ | ✅ |
| DGES | ✅ | ✅ |

## 🧪 Scénarios de test

### Scénario 1 : Première inscription

1. Créer un candidat et s'authentifier
2. Créer une inscription → Vérifie que DossierInscription est créé automatiquement
3. Uploader 4 documents de base → Vérifie qu'ils vont dans Dossier
4. Uploader quittance → Vérifie qu'elle va dans DossierInscription
5. Vérifier complétude = 100%
6. Vérifier ActionHistory contient toutes les actions

### Scénario 2 : Inscription suivante

1. Créer une 2ème inscription pour le même candidat
2. Vérifier que documents de base sont déjà disponibles (complétude partielle)
3. Uploader uniquement la quittance
4. Vérifier complétude = 100%

### Scénario 3 : Mise à jour document de base

1. Candidat avec 2 inscriptions
2. Mettre à jour un document de base (ex: photo)
3. Vérifier que ActionHistory est créé pour les 2 DossierInscription
4. Vérifier que complétude est mise à jour pour les 2 inscriptions

### Scénario 4 : Vue commission

1. S'authentifier en tant que COMMISSION
2. Récupérer dossier-complet d'une inscription
3. Vérifier que documents de base et spécifiques sont présents
4. Vérifier les indicateurs de source (dossier_personnel vs dossier_concours)

## 📝 Types d'actions dans ActionHistory

| Type d'action | Déclencheur | Rôles autorisés |
|---------------|-------------|-----------------|
| `DOSSIER_CONCOURS_CREE` | Création d'inscription | CANDIDAT |
| `PIECE_BASE_MISE_A_JOUR` | Mise à jour document de base | CANDIDAT |
| `PIECE_AJOUTEE` | Upload quittance ou pièce extra | CANDIDAT |
| `PIECE_SUPPRIMEE` | Suppression document | CANDIDAT |
| `DOSSIER_SOUMIS` | Soumission dossier | CANDIDAT |
| `DOSSIER_MODIFIE` | Modification dossier | CANDIDAT, COMMISSION, CONTROLEUR, DGES |
| `DOSSIER_VALIDE` | Validation dossier | COMMISSION, CONTROLEUR, DGES |
| `DOSSIER_REJETE` | Rejet dossier | COMMISSION, CONTROLEUR, DGES |
| `DECISION_COMMISSION` | Décision commission | COMMISSION, DGES |
| `DECISION_CONTROLEUR` | Décision contrôleur | CONTROLEUR, DGES |

## 🚀 Déploiement

### Pré-requis

- [ ] Backup de la base de données créé
- [ ] Migration testée en environnement de staging
- [ ] Script de rollback prêt et testé
- [ ] Tous les tests passent en staging
- [ ] Monitoring et alertes configurés

### Étapes de déploiement

1. **Maintenance mode** : Activer le mode maintenance
2. **Backup** : Créer un backup complet de la base de données
3. **Migration schema** : Exécuter `npx prisma migrate deploy`
4. **Migration data** : Exécuter le script de migration des données
5. **Validation** : Vérifier l'intégrité des données
6. **Déploiement code** : Déployer le nouveau code de l'API
7. **Tests smoke** : Exécuter les tests de base
8. **Monitoring** : Surveiller les logs et métriques
9. **Maintenance mode off** : Désactiver le mode maintenance

### Rollback

En cas de problème :

```bash
# 1. Restaurer le backup
psql $DATABASE_URL < backup_before_refonte_YYYYMMDD_HHMMSS.sql

# 2. Revenir au code précédent
git revert <commit-hash>

# 3. Redéployer
npm run deploy
```

## 📊 Métriques à surveiller

- Nombre de DossierInscription créés = Nombre d'Inscription
- Nombre d'ActionHistory avec dossierInscriptionId valide = 100%
- Temps de réponse des endpoints de complétude < 500ms
- Taux d'erreur sur les uploads < 1%
- Nombre d'inscriptions par candidat (moyenne)

## 🔗 Références

- [Requirements](../../.kiro/specs/refonte-dossier-candidat-inscription/requirements.md)
- [Design](../../.kiro/specs/refonte-dossier-candidat-inscription/design.md)
- [Tasks](../../.kiro/specs/refonte-dossier-candidat-inscription/tasks.md)
- [Prisma Schema](../../unipath-api/prisma/schema.prisma)
- [Migration SQL](../../unipath-api/prisma/migrations/20260510173725_refonte_dossier_inscription/migration.sql)

---

**Date de création** : 11 mai 2026  
**Version** : 1.0  
**Auteur** : Équipe UniPath
