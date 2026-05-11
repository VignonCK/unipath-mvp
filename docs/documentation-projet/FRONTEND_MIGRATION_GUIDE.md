# Guide de Migration Frontend - Refonte Dossier & Inscription

**Date** : 11 mai 2026  
**Statut** : ⚠️ **AJUSTEMENTS REQUIS**

---

## 📊 Analyse de Compatibilité

### ✅ Points Compatibles

1. **Structure des pièces de base** : Le frontend utilise déjà les 4 documents de base (acteNaissance, carteIdentite, photo, releve)
2. **Gestion de la quittance** : Séparée des autres pièces
3. **Calcul de complétude** : Logique similaire à celle du backend
4. **Upload de pièces** : Mécanisme existant réutilisable

### ⚠️ Points à Ajuster

1. **Endpoints API** : Certains endpoints ont changé
2. **Structure de réponse** : Nouveaux champs dans les réponses API
3. **Référence au statut** : Le statut est maintenant dans `DossierInscription`, pas `Inscription`
4. **ActionHistory** : Référence `dossierInscriptionId` au lieu de `dossierId`

---

## 🔧 Modifications Requises

### 1. Services API (`src/services/api.js`)

#### Avant (Ancien)
```javascript
// dossierService
uploadPiece: async (typePiece, file) => {
  const formData = new FormData();
  formData.append('typePiece', typePiece);
  formData.append('file', file);
  return apiCall('/dossier/upload', 'POST', formData, true);
}

// inscriptionService
uploadQuittance: async (inscriptionId, file) => {
  const formData = new FormData();
  formData.append('quittance', file);
  return apiCall(`/inscriptions/${inscriptionId}/quittance`, 'POST', formData, true);
}
```

#### Après (Nouveau)
```javascript
// dossierService - Documents de base
uploadPiece: async (candidatId, typePiece, file) => {
  const formData = new FormData();
  formData.append('typePiece', typePiece);
  formData.append('file', file);
  return apiCall(`/dossier/candidats/${candidatId}/dossier-personnel/pieces`, 'PUT', formData, true);
},

getDossierPersonnel: async (candidatId) => {
  return apiCall(`/dossier/candidats/${candidatId}/dossier-personnel`, 'GET');
},

// inscriptionService - Documents spécifiques au concours
uploadQuittance: async (inscriptionId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  return apiCall(`/inscriptions/${inscriptionId}/dossier-concours/quittance`, 'POST', formData, true);
},

uploadPieceExtra: async (inscriptionId, typePiece, file) => {
  const formData = new FormData();
  formData.append('typePiece', typePiece);
  formData.append('file', file);
  return apiCall(`/inscriptions/${inscriptionId}/dossier-concours/pieces-extras`, 'POST', formData, true);
},

getDossierComplet: async (inscriptionId) => {
  return apiCall(`/completion/inscriptions/${inscriptionId}/dossier-complet`, 'GET');
}
```

### 2. Composant `DossierCompletion.jsx`

#### Modifications Nécessaires

```javascript
// ❌ ANCIEN - Référence directe au dossier
const deposees = PIECES_DOSSIER.filter(pieceId => {
  if (dossier?.[pieceId]) return true;
  const legacyKey = Object.keys(PIECES_LABELS).find(
    key => convertLegacyId(key) === pieceId
  );
  return legacyKey && dossier?.[legacyKey];
}).length;

// ✅ NOUVEAU - Utiliser l'endpoint getDossierPersonnel
useEffect(() => {
  if (!candidatId) return;
  
  fetch(`${BASE_URL}/dossier/candidats/${candidatId}/dossier-personnel`, {
    headers: getAuthHeaders()
  })
    .then(res => res.json())
    .then(data => {
      setData({
        pourcentage: data.completude.pourcentage,
        piecesPresentes: data.completude.piecesPresentes,
        piecesRequises: data.completude.piecesRequises,
        piecesManquantes: data.piecesBase
          .filter(p => p.statut === 'manquante')
          .map(p => p.type),
        estComplet: data.completude.pourcentage === 100
      });
      setLoading(false);
    })
    .catch(err => {
      console.error('Erreur:', err);
      setLoading(false);
    });
}, [candidatId]);
```

#### Mise à jour de la soumission

```javascript
// ❌ ANCIEN - Référence dossierId
const handleSoumettre = async () => {
  await fetch(`${BASE_URL}/history/action`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      dossierId: dossier?.id,
      typeAction: 'DOSSIER_SOUMIS',
      details: { message: 'Dossier soumis officiellement par le candidat' },
    }),
  });
};

// ✅ NOUVEAU - Référence dossierInscriptionId
const handleSoumettre = async (dossierInscriptionId) => {
  await fetch(`${BASE_URL}/history/action`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      dossierInscriptionId: dossierInscriptionId,
      typeAction: 'DOSSIER_SOUMIS',
      details: { message: 'Dossier soumis officiellement par le candidat' },
    }),
  });
};
```

### 3. Page `DetailConcours.jsx`

#### Modifications Nécessaires

```javascript
// ❌ ANCIEN - Upload de pièce de base
const handleUploadPiece = async (piece, fichier) => {
  if (PIECES_DOSSIER_BASE[piece]) {
    await dossierService.uploadPiece(piece, fichier);
  }
};

// ✅ NOUVEAU - Upload avec candidatId
const handleUploadPiece = async (piece, fichier) => {
  if (PIECES_DOSSIER_BASE[piece]) {
    await dossierService.uploadPiece(candidat.id, piece, fichier);
  }
};
```

#### Récupération du dossier complet

```javascript
// ✅ NOUVEAU - Utiliser getDossierComplet pour une inscription
useEffect(() => {
  if (inscription?.id) {
    inscriptionService.getDossierComplet(inscription.id)
      .then(data => {
        // data contient :
        // - piecesBase (depuis Dossier Personnel)
        // - piecesSpecifiques (depuis Dossier Concours)
        // - completudeGlobale
        // - dossierInscription (avec statut)
        // - decisions
        setDossierComplet(data);
      });
  }
}, [inscription?.id]);
```

#### Accès au statut de l'inscription

```javascript
// ❌ ANCIEN - Statut dans inscription
const statut = inscription?.statut;

// ✅ NOUVEAU - Statut dans dossierInscription
const statut = inscription?.dossierInscription?.statut;

// OU utiliser getDossierComplet
const statut = dossierComplet?.dossierInscription?.statut;
```

### 4. Page `AccueilCandidat.jsx`

#### Calcul de complétude

```javascript
// ❌ ANCIEN - Calcul manuel
const pieces = ['acteNaissance', 'carteIdentite', 'photo', 'releve'];
const nbPieces = pieces.filter(p => candidat?.dossier?.[p]).length;
const pct = Math.round((nbPieces / pieces.length) * 100);

// ✅ NOUVEAU - Utiliser l'API
const [dossierPersonnel, setDossierPersonnel] = useState(null);

useEffect(() => {
  if (candidat?.id) {
    dossierService.getDossierPersonnel(candidat.id)
      .then(data => {
        setDossierPersonnel(data);
      });
  }
}, [candidat?.id]);

const pct = dossierPersonnel?.completude?.pourcentage || 0;
const nbPieces = dossierPersonnel?.completude?.piecesPresentes || 0;
```

#### Statut des inscriptions

```javascript
// ❌ ANCIEN - Statut dans inscription
const nbValides = candidat?.inscriptions?.filter(i => i.statut === 'VALIDE').length || 0;

// ✅ NOUVEAU - Statut dans dossierInscription
const nbValides = candidat?.inscriptions?.filter(i => 
  i.dossierInscription?.statut === 'VALIDE'
).length || 0;
```

---

## 📝 Nouveau Fichier `src/services/api.js` (Complet)

```javascript
// src/services/api.js
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

async function apiCall(endpoint, method = 'GET', body = null, isFormData = false) {
  const headers = isFormData ? { 'Authorization': `Bearer ${localStorage.getItem('token')}` } : getAuthHeaders();
  const options = { method, headers };
  if (body && !isFormData) options.body = JSON.stringify(body);
  if (body && isFormData) options.body = body;
  
  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erreur API');
  }
  return response.json();
}

// ============================================
// DOSSIER SERVICE - Documents de base
// ============================================
export const dossierService = {
  // ✅ NOUVEAU - Récupérer le dossier personnel
  getDossierPersonnel: async (candidatId) => {
    return apiCall(`/dossier/candidats/${candidatId}/dossier-personnel`, 'GET');
  },

  // ✅ NOUVEAU - Upload document de base
  uploadPiece: async (candidatId, typePiece, file) => {
    const formData = new FormData();
    formData.append('typePiece', typePiece);
    formData.append('file', file);
    return apiCall(`/dossier/candidats/${candidatId}/dossier-personnel/pieces`, 'PUT', formData, true);
  },
};

// ============================================
// INSCRIPTION SERVICE - Documents spécifiques
// ============================================
export const inscriptionService = {
  // Créer une inscription
  creer: async (concoursId) => {
    return apiCall('/inscriptions', 'POST', { concoursId });
  },

  // Annuler une inscription
  annuler: async (inscriptionId) => {
    return apiCall(`/inscriptions/${inscriptionId}`, 'DELETE');
  },

  // ✅ NOUVEAU - Récupérer le dossier complet d'une inscription
  getDossierComplet: async (inscriptionId) => {
    return apiCall(`/completion/inscriptions/${inscriptionId}/dossier-complet`, 'GET');
  },

  // ✅ NOUVEAU - Upload quittance
  uploadQuittance: async (inscriptionId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiCall(`/inscriptions/${inscriptionId}/dossier-concours/quittance`, 'POST', formData, true);
  },

  // ✅ NOUVEAU - Upload pièce extra
  uploadPieceExtra: async (inscriptionId, typePiece, file) => {
    const formData = new FormData();
    formData.append('typePiece', typePiece);
    formData.append('file', file);
    return apiCall(`/inscriptions/${inscriptionId}/dossier-concours/pieces-extras`, 'POST', formData, true);
  },

  // Récupérer mes inscriptions
  getMesInscriptions: async () => {
    return apiCall('/inscriptions/mes-inscriptions', 'GET');
  },

  // Récupérer une inscription par ID
  getById: async (inscriptionId) => {
    return apiCall(`/inscriptions/${inscriptionId}`, 'GET');
  },
};

// ============================================
// HISTORY SERVICE
// ============================================
export const historyService = {
  // ✅ NOUVEAU - Enregistrer une action (avec dossierInscriptionId)
  enregistrerAction: async (dossierInscriptionId, typeAction, details = null) => {
    return apiCall('/history/action', 'POST', {
      dossierInscriptionId,
      typeAction,
      details,
    });
  },

  // ✅ NOUVEAU - Récupérer l'historique d'un dossier d'inscription
  getHistorique: async (dossierInscriptionId, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiCall(`/history/dossiers-inscription/${dossierInscriptionId}?${query}`, 'GET');
  },
};

// ============================================
// CANDIDAT SERVICE
// ============================================
export const candidatService = {
  getProfil: async () => {
    return apiCall('/candidats/profil', 'GET');
  },

  updateProfil: async (data) => {
    return apiCall('/candidats/profil', 'PUT', data);
  },
};

// ============================================
// CONCOURS SERVICE
// ============================================
export const concoursService = {
  getAll: async () => {
    return apiCall('/concours', 'GET');
  },

  getById: async (id) => {
    return apiCall(`/concours/${id}`, 'GET');
  },
};

// ============================================
// CONVOCATION SERVICE
// ============================================
export const convocationService = {
  telechargerPreinscription: async (inscriptionId) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${BASE_URL}/pdf/preinscription/${inscriptionId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Erreur téléchargement');
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `preinscription_${inscriptionId}.pdf`;
    a.click();
  },
};

export { getAuthHeaders };
```

---

## 🔄 Plan de Migration Frontend

### Phase 1 : Mise à jour des services (Priorité Haute)

1. **Mettre à jour `src/services/api.js`**
   - Ajouter les nouveaux endpoints
   - Mettre à jour les signatures de fonctions
   - Ajouter `getDossierPersonnel` et `getDossierComplet`

### Phase 2 : Mise à jour des composants (Priorité Haute)

2. **Mettre à jour `DossierCompletion.jsx`**
   - Utiliser `getDossierPersonnel` au lieu du calcul manuel
   - Mettre à jour `handleSoumettre` pour utiliser `dossierInscriptionId`

3. **Mettre à jour `DetailConcours.jsx`**
   - Passer `candidatId` à `uploadPiece`
   - Utiliser `getDossierComplet` pour récupérer le dossier complet
   - Accéder au statut via `inscription.dossierInscription.statut`

4. **Mettre à jour `AccueilCandidat.jsx`**
   - Utiliser `getDossierPersonnel` pour la complétude
   - Accéder au statut via `inscription.dossierInscription.statut`

### Phase 3 : Tests (Priorité Haute)

5. **Tester les workflows complets**
   - Première inscription (upload documents de base + quittance)
   - Inscription suivante (réutilisation documents de base)
   - Mise à jour d'un document de base
   - Soumission de dossier

---

## ✅ Checklist de Migration Frontend

### Services API
- [ ] Mettre à jour `dossierService.uploadPiece` (ajouter `candidatId`)
- [ ] Ajouter `dossierService.getDossierPersonnel`
- [ ] Mettre à jour `inscriptionService.uploadQuittance` (nouveau endpoint)
- [ ] Ajouter `inscriptionService.getDossierComplet`
- [ ] Ajouter `inscriptionService.uploadPieceExtra`
- [ ] Mettre à jour `historyService` (utiliser `dossierInscriptionId`)

### Composants
- [ ] Mettre à jour `DossierCompletion.jsx`
- [ ] Mettre à jour `DetailConcours.jsx`
- [ ] Mettre à jour `AccueilCandidat.jsx`
- [ ] Vérifier tous les accès à `inscription.statut` → `inscription.dossierInscription.statut`

### Tests
- [ ] Tester upload document de base
- [ ] Tester upload quittance
- [ ] Tester upload pièce extra
- [ ] Tester calcul de complétude
- [ ] Tester première inscription
- [ ] Tester inscription suivante
- [ ] Tester affichage du statut

---

## 🎯 Résumé des Changements

| Ancien | Nouveau | Impact |
|--------|---------|--------|
| `POST /dossier/upload` | `PUT /dossier/candidats/:candidatId/dossier-personnel/pieces` | Moyen |
| `POST /inscriptions/:id/quittance` | `POST /inscriptions/:id/dossier-concours/quittance` | Faible |
| `inscription.statut` | `inscription.dossierInscription.statut` | Élevé |
| `dossierId` dans ActionHistory | `dossierInscriptionId` | Moyen |
| Calcul manuel de complétude | `GET /dossier/candidats/:id/dossier-personnel` | Moyen |
| Pas de vue agrégée | `GET /completion/inscriptions/:id/dossier-complet` | Nouveau |

---

## 📞 Support

Pour toute question sur la migration frontend, consultez :
- [Documentation API](./API_ENDPOINTS_REFONTE.md)
- [Documentation complète](./REFONTE_DOSSIER_INSCRIPTION.md)

---

**Version** : 1.0  
**Date** : 11 mai 2026  
**Statut** : ⚠️ **AJUSTEMENTS REQUIS**
