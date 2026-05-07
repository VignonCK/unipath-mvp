# Système de Validation à Deux Niveaux

## Vue d'ensemble

Le système de validation des dossiers candidats fonctionne en deux étapes :
1. **Commission** : Évalue et prend une décision initiale
2. **Contrôleur** : Valide ou modifie la décision de la commission

**Important** : Les emails ne sont envoyés aux candidats qu'après validation du contrôleur.

## Workflow Complet

```
┌─────────────┐
│  CANDIDAT   │
│  Dépose     │
│  dossier    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────┐
│  Statut: EN_ATTENTE         │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│  COMMISSION évalue          │
│  - Valider                  │
│  - Rejeter                  │
│  - Sous réserve             │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│  Statut: XXX_PAR_COMMISSION │
│  ❌ PAS D'EMAIL ENVOYÉ      │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│  CONTROLEUR vérifie         │
│  - Confirmer décision       │
│  - Modifier en VALIDE       │
│  - Modifier en REJETE       │
│  - Modifier en SOUS_RESERVE │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│  Statut: VALIDE/REJETE/     │
│           SOUS_RESERVE      │
│  ✅ EMAIL ENVOYÉ            │
└─────────────────────────────┘
```

## Nouveaux Statuts

### Statuts Intermédiaires (après décision commission)
- `VALIDE_PAR_COMMISSION` : Commission a validé, attend contrôleur
- `REJETE_PAR_COMMISSION` : Commission a rejeté, attend contrôleur
- `SOUS_RESERVE_PAR_COMMISSION` : Commission a mis sous réserve, attend contrôleur

### Statuts Finaux (après décision contrôleur)
- `VALIDE` : Validé définitivement
- `REJETE` : Rejeté définitivement
- `SOUS_RESERVE` : Sous réserve définitif

## Nouveau Rôle: CONTROLEUR

### Permissions
- ✅ Voir tous les dossiers en attente de validation
- ✅ Confirmer les décisions de la commission
- ✅ Modifier les décisions de la commission
- ✅ Déclencher l'envoi des emails aux candidats

### Différences avec COMMISSION
| Fonctionnalité | COMMISSION | CONTROLEUR |
|----------------|------------|------------|
| Évaluer les dossiers | ✅ | ❌ |
| Prendre décision initiale | ✅ | ❌ |
| Valider/modifier décisions | ❌ | ✅ |
| Déclencher emails candidats | ❌ | ✅ |
| Saisir les notes | ✅ | ❌ |

## Modifications Base de Données

### Table `Inscription` - Nouveaux champs

```sql
-- Traçabilité décision commission
decisionCommissionPar     TEXT         -- ID du membre commission
decisionCommissionDate    TIMESTAMP    -- Date de la décision

-- Traçabilité décision contrôleur
decisionControleurPar     TEXT         -- ID du contrôleur
decisionControleurDate    TIMESTAMP    -- Date de la décision
commentaireControleur     TEXT         -- Commentaire si modification
```

### Nouvelle Table `Controleur`

```sql
CREATE TABLE "Controleur" (
    id          TEXT PRIMARY KEY,
    nom         TEXT NOT NULL,
    prenom      TEXT NOT NULL,
    email       TEXT UNIQUE NOT NULL,
    telephone   TEXT,
    role        Role DEFAULT 'CONTROLEUR',
    createdAt   TIMESTAMP DEFAULT NOW(),
    updatedAt   TIMESTAMP
);
```

## API Endpoints

### Commission (modifié)

#### POST /api/commission/dossiers/:inscriptionId/statut
**Changement** : Ne déclenche plus l'envoi d'email

**Request:**
```json
{
  "statut": "VALIDE",
  "commentaireRejet": "...",
  "commentaireSousReserve": "..."
}
```

**Response:**
```json
{
  "message": "Décision enregistrée. En attente de validation du contrôleur.",
  "inscription": {
    "id": "...",
    "statut": "VALIDE_PAR_COMMISSION",
    "decisionCommissionPar": "commission-id",
    "decisionCommissionDate": "2024-05-07T10:30:00Z"
  }
}
```

### Contrôleur (nouveau)

#### GET /api/controleur/dossiers
Liste des dossiers en attente de validation

**Query params:**
- `statut` (optionnel) : Filtrer par statut

**Response:**
```json
{
  "total": 15,
  "inscriptions": [
    {
      "id": "...",
      "statut": "VALIDE_PAR_COMMISSION",
      "decisionCommissionDate": "2024-05-07T10:30:00Z",
      "candidat": { ... },
      "concours": { ... }
    }
  ]
}
```

#### PUT /api/controleur/dossiers/:inscriptionId/valider
Valider ou modifier la décision

**Request:**
```json
{
  "action": "CONFIRMER",  // ou "VALIDER", "REJETER", "SOUS_RESERVE"
  "commentaireControleur": "Modification justifiée car..."
}
```

**Response:**
```json
{
  "message": "Décision validée et email envoyé au candidat",
  "inscription": {
    "id": "...",
    "statut": "VALIDE",
    "decisionControleurPar": "controleur-id",
    "decisionControleurDate": "2024-05-07T14:00:00Z"
  }
}
```

#### GET /api/controleur/statistiques
Statistiques pour le dashboard

**Response:**
```json
{
  "enAttenteValidation": 15,
  "valides": 120,
  "rejetes": 8,
  "sousReserve": 12,
  "total": 140
}
```

## Migration

### 1. Appliquer la migration Prisma
```bash
cd unipath-api
npx prisma migrate dev --name add_controleur_role
```

### 2. Ou exécuter le SQL manuellement
```bash
psql $DATABASE_URL < prisma/migrations/add_controleur_role.sql
```

### 3. Créer les comptes
```bash
node scripts/create-commission-controleur.js
```

**Comptes créés:**
- Commission: `commission@unipath.bj` / `Commission2024!`
- Contrôleur: `controleur@unipath.bj` / `Controleur2024!`

## Frontend (à implémenter)

### Pages Contrôleur à créer

1. **DashboardControleur.jsx**
   - Statistiques
   - Liste des dossiers en attente
   - Filtres par statut

2. **ValidationControleur.jsx**
   - Détails du dossier
   - Décision de la commission
   - Actions : Confirmer / Modifier
   - Formulaire de commentaire

3. **ControleurLayout.jsx**
   - Sidebar de navigation
   - Menu : Dossiers, Statistiques, Historique

### Routes à ajouter

```javascript
<Route path="/controleur" element={<ProtectedRoute allowedRoles={['CONTROLEUR']} />}>
  <Route index element={<DashboardControleur />} />
  <Route path="validation/:inscriptionId" element={<ValidationControleur />} />
  <Route path="historique" element={<HistoriqueControleur />} />
</Route>
```

### Service API à ajouter

```javascript
export const controleurService = {
  getDossiersEnAttente: async (statut) => {
    const params = statut ? `?statut=${statut}` : '';
    const response = await axios.get(`${API_URL}/controleur/dossiers${params}`);
    return response.data;
  },
  
  validerDecision: async (inscriptionId, action, commentaire) => {
    const response = await axios.put(
      `${API_URL}/controleur/dossiers/${inscriptionId}/valider`,
      { action, commentaireControleur: commentaire }
    );
    return response.data;
  },
  
  getStatistiques: async () => {
    const response = await axios.get(`${API_URL}/controleur/statistiques`);
    return response.data;
  }
};
```

## Tests

### Scénario de test complet

1. **Commission évalue un dossier**
   ```bash
   POST /api/commission/dossiers/{id}/statut
   Body: { "statut": "VALIDE" }
   ```
   - ✅ Statut devient `VALIDE_PAR_COMMISSION`
   - ✅ `decisionCommissionPar` et `decisionCommissionDate` remplis
   - ❌ Aucun email envoyé

2. **Contrôleur confirme la décision**
   ```bash
   PUT /api/controleur/dossiers/{id}/valider
   Body: { "action": "CONFIRMER" }
   ```
   - ✅ Statut devient `VALIDE`
   - ✅ `decisionControleurPar` et `decisionControleurDate` remplis
   - ✅ Email de convocation envoyé au candidat

3. **Contrôleur modifie la décision**
   ```bash
   PUT /api/controleur/dossiers/{id}/valider
   Body: { 
     "action": "REJETER",
     "commentaireControleur": "Documents non conformes"
   }
   ```
   - ✅ Statut devient `REJETE` (au lieu de `VALIDE`)
   - ✅ Commentaire du contrôleur enregistré
   - ✅ Email de rejet envoyé avec le commentaire du contrôleur

## Avantages du Système

1. **Contrôle qualité** : Double vérification des décisions
2. **Traçabilité** : Historique complet des décisions
3. **Flexibilité** : Le contrôleur peut corriger les erreurs
4. **Sécurité** : Les candidats ne reçoivent que des décisions validées
5. **Audit** : Qui a pris quelle décision et quand

## Prochaines Étapes

- [ ] Appliquer la migration Prisma
- [ ] Créer les comptes commission et contrôleur
- [ ] Tester les endpoints backend
- [ ] Créer les pages frontend contrôleur
- [ ] Tester le workflow complet
- [ ] Former les utilisateurs
