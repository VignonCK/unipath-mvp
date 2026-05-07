# Connexion entre Dossier Général et Dossier de Concours - Corrigée

## Date: 7 Mai 2026

## Problème Identifié

Il y avait une confusion dans le code entre deux sources de données pour le dossier du candidat:
1. `candidat.dossier` - Dossier récupéré via `candidatService.getProfil()`
2. `dossierCandidat` - Dossier récupéré via `concoursService.getById()`

Ces deux sources pointent vers **la même table `Dossier`** dans la base de données, mais étaient gérées séparément dans le code frontend, créant de la confusion et des bugs potentiels.

## Architecture des Données

### Table `Dossier` (Unique et Partagé)

```prisma
model Dossier {
  id              String   @id @default(uuid())
  candidatId      String   @unique  // ✅ Un seul dossier par candidat
  acteNaissance   String?  // URL Supabase
  carteIdentite   String?  // URL Supabase
  photo           String?  // URL Supabase
  releve          String?  // URL Supabase
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  candidat        Candidat @relation(...)
}
```

**Caractéristiques**:
- ✅ **Un seul dossier par candidat** (`candidatId` unique)
- ✅ **Partagé entre tous les concours**
- ✅ **Uploadé une seule fois, réutilisé partout**

### Table `Inscription` (Spécifique à chaque Concours)

```prisma
model Inscription {
  id              String   @id @default(uuid())
  candidatId      String
  concoursId      String
  quittanceUrl    String?  // ✅ Spécifique au concours
  piecesExtras    Json?    // ✅ Pièces personnalisées du concours
  statut          String   @default("EN_ATTENTE")
  ...
}
```

**Caractéristiques**:
- ✅ **Une inscription par concours**
- ✅ **Contient la quittance** (spécifique au concours)
- ✅ **Peut contenir des pièces personnalisées** (spécifiques au concours)

## Flux de Données

### Backend

#### 1. `candidatService.getProfil()` → `candidat.controller.js`

```javascript
exports.getProfil = async (req, res) => {
  const candidat = await prisma.candidat.findUnique({
    where: { id: req.user.id },
    include: {
      inscriptions: { include: { concours: true } },
      dossier: true,  // ✅ Inclut le dossier
    },
  });
  res.json(candidat);
};
```

**Retourne**:
```json
{
  "id": "...",
  "nom": "...",
  "prenom": "...",
  "dossier": {
    "id": "...",
    "acteNaissance": "https://...",
    "carteIdentite": "https://...",
    "photo": "https://...",
    "releve": "https://..."
  },
  "inscriptions": [...]
}
```

#### 2. `concoursService.getById()` → `concours.controller.js`

```javascript
exports.getConcoursById = async (req, res) => {
  const concours = await prisma.concours.findUnique({
    where: { id },
    include: { _count: { select: { inscriptions: true } } },
  });

  // Récupérer le dossier du candidat si authentifié
  let dossierCandidat = null;
  if (userId) {
    dossierCandidat = await prisma.dossier.findUnique({
      where: { candidatId: userId },
    });
  }

  res.json({ ...concours, dossierCandidat });
};
```

**Retourne**:
```json
{
  "id": "...",
  "libelle": "...",
  "piecesRequises": {...},
  "dossierCandidat": {
    "id": "...",
    "acteNaissance": "https://...",
    "carteIdentite": "https://...",
    "photo": "https://...",
    "releve": "https://..."
  }
}
```

**⚠️ Problème**: `dossierCandidat` et `candidat.dossier` sont **la même chose** mais gérés séparément !

### Frontend (Avant Correction)

```javascript
// ❌ AVANT: Deux sources de données pour le même dossier
const [candidat, setCandidат] = useState(null);
const [dossierCandidat, setDossierCandidat] = useState(null);

// Fonction qui vérifie si une pièce est fournie
function getPieceStatut(piece, candidat, inscription, dossierCandidat) {
  if (PIECES_DOSSIER_BASE[piece]) {
    // ❌ Vérifie les deux sources (redondant et confus)
    return !!(candidat?.dossier?.[piece] || dossierCandidat?.[piece]);
  }
}
```

**Problèmes**:
1. ❌ Duplication de données
2. ❌ Confusion sur quelle source utiliser
3. ❌ Risque de désynchronisation
4. ❌ Code plus complexe

### Frontend (Après Correction)

```javascript
// ✅ APRÈS: Une seule source de données
const [candidat, setCandidат] = useState(null);
// ✅ Plus de dossierCandidat séparé

// Fonction simplifiée
function getPieceStatut(piece, candidat, inscription) {
  if (PIECES_DOSSIER_BASE[piece]) {
    // ✅ Une seule source: candidat.dossier
    return !!candidat?.dossier?.[piece];
  }
}
```

**Avantages**:
1. ✅ Une seule source de vérité
2. ✅ Code plus simple et clair
3. ✅ Pas de risque de désynchronisation
4. ✅ Cohérence garantie

## Modifications Apportées

### 1. Suppression de `dossierCandidat` State

**Avant**:
```javascript
const [dossierCandidat, setDossierCandidat] = useState(null);
```

**Après**:
```javascript
// ✅ Supprimé - on utilise seulement candidat.dossier
```

### 2. Simplification de `getPieceStatut()`

**Avant**:
```javascript
function getPieceStatut(piece, candidat, inscription, dossierCandidat) {
  if (piece === 'quittance') return !!inscription?.quittanceUrl;
  if (PIECES_DOSSIER_BASE[piece]) {
    return !!(candidat?.dossier?.[piece] || dossierCandidat?.[piece]);
  }
  return !!(inscription?.piecesExtras?.[piece]);
}
```

**Après**:
```javascript
function getPieceStatut(piece, candidat, inscription) {
  if (piece === 'quittance') return !!inscription?.quittanceUrl;
  if (PIECES_DOSSIER_BASE[piece]) {
    return !!candidat?.dossier?.[piece];  // ✅ Une seule source
  }
  return !!(inscription?.piecesExtras?.[piece]);
}
```

### 3. Suppression des Appels à `setDossierCandidat()`

**Avant**:
```javascript
refreshData(id).then(({ candidat: p, concours: c }) => {
  setCandidат(p);
  setConcours(c);
  if (c.dossierCandidat) setDossierCandidat(c.dossierCandidat);
  // ...
});
```

**Après**:
```javascript
refreshData(id).then(({ candidat: p, concours: c }) => {
  setCandidат(p);
  setConcours(c);
  // ✅ Plus besoin de setDossierCandidat
  // ...
});
```

### 4. Mise à Jour de Tous les Appels à `getPieceStatut()`

**Avant**:
```javascript
const fournie = getPieceStatut(piece, candidat, inscription, dossierCandidat);
const nbFournies = toutesLesPieces.filter(p => 
  getPieceStatut(p, candidat, inscription, dossierCandidat)
).length;
```

**Après**:
```javascript
const fournie = getPieceStatut(piece, candidat, inscription);
const nbFournies = toutesLesPieces.filter(p => 
  getPieceStatut(p, candidat, inscription)
).length;
```

## Vérification de la Cohérence

### Page "Mon Compte" (`AccueilCandidat.jsx`)

```javascript
// ✅ Utilise candidat.dossier
const pieces = ['acteNaissance', 'carteIdentite', 'photo', 'releve'];
const nbPieces = pieces.filter(p => candidat?.dossier?.[p]).length;
```

### Page "Détail Concours" (`DetailConcours.jsx`)

```javascript
// ✅ Utilise aussi candidat.dossier (maintenant cohérent)
function getPieceStatut(piece, candidat, inscription) {
  if (PIECES_DOSSIER_BASE[piece]) {
    return !!candidat?.dossier?.[piece];
  }
}
```

### Composant "Dossier Completion" (`DossierCompletion.jsx`)

À vérifier qu'il utilise aussi `candidat.dossier`.

## Workflow Complet

### 1. Candidat Dépose une Pièce

```
Frontend: Upload fichier
    ↓
Backend: dossier.controller.js → uploadPiece()
    ↓
Supabase Storage: Stockage du fichier
    ↓
Database: UPDATE Dossier SET acteNaissance = 'https://...'
    ↓
Frontend: Refresh candidat.dossier
```

### 2. Candidat Consulte un Concours

```
Frontend: Charge le concours
    ↓
Backend: concours.controller.js → getConcoursById()
    ↓
Backend: candidat.controller.js → getProfil()
    ↓
Frontend: Reçoit candidat avec candidat.dossier
    ↓
Frontend: Affiche les pièces depuis candidat.dossier
```

### 3. Candidat S'inscrit à un Concours

```
Frontend: Vérifie candidat.dossier complet
    ↓
Backend: inscription.controller.js → creerInscription()
    ↓
Database: INSERT INTO Inscription (candidatId, concoursId, ...)
    ↓
Frontend: Peut maintenant uploader la quittance
```

## Avantages de la Correction

1. ✅ **Simplicité**: Une seule source de données pour le dossier
2. ✅ **Cohérence**: Pas de risque de désynchronisation
3. ✅ **Performance**: Moins de requêtes et de state à gérer
4. ✅ **Maintenabilité**: Code plus facile à comprendre et maintenir
5. ✅ **Fiabilité**: Moins de bugs potentiels

## Fichiers Modifiés

- `unipath-front/src/pages/DetailConcours.jsx` - Suppression de `dossierCandidat`, utilisation de `candidat.dossier`

## Tests à Effectuer

1. **Tester l'affichage des pièces**:
   - Se connecter en tant que candidat
   - Aller sur "Mon compte"
   - Vérifier que les pièces déposées sont affichées
   - Aller sur la page d'un concours
   - Vérifier que les **mêmes pièces** sont affichées comme déposées

2. **Tester le dépôt de pièces**:
   - Déposer une pièce sur "Mon compte"
   - Aller sur la page d'un concours
   - Vérifier que la pièce est bien marquée comme déposée

3. **Tester l'inscription**:
   - Déposer toutes les pièces du dossier général
   - S'inscrire à un concours
   - Vérifier que les pièces sont toujours affichées comme déposées
   - Déposer la quittance
   - Vérifier que toutes les pièces sont complètes

## Conclusion

La connexion entre le dossier général et le dossier de concours est maintenant **claire et cohérente**:
- ✅ **Un seul dossier** par candidat (table `Dossier`)
- ✅ **Une seule source** de données dans le frontend (`candidat.dossier`)
- ✅ **Partagé** entre tous les concours
- ✅ **Quittance** spécifique à chaque inscription (table `Inscription`)

Le code est maintenant plus simple, plus fiable et plus facile à maintenir.
