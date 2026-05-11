# Changements Frontend Appliqués - Refonte Dossier & Inscription

**Date** : 11 mai 2026  
**Statut** : ✅ **COMPLÉTÉ**

---

## 📊 Résumé

Les ajustements frontend ont été appliqués avec succès pour assurer la compatibilité avec la refonte backend. Tous les fichiers critiques ont été mis à jour.

---

## ✅ Fichiers Modifiés

### 1. `unipath-front/src/services/api.js` ✅

**Changements** :
- ✅ Ajout de `dossierService.getDossierPersonnel(candidatId)`
- ✅ Mise à jour de `dossierService.uploadPiece(candidatId, typePiece, fichier)` - Ajout du paramètre `candidatId`
- ✅ Mise à jour de `inscriptionService.uploadQuittance()` - Nouveau endpoint `/dossier-concours/quittance`
- ✅ Mise à jour de `inscriptionService.uploadPieceExtra()` - Nouveau endpoint `/dossier-concours/pieces-extras`
- ✅ Ajout de `inscriptionService.getDossierComplet(inscriptionId)`
- ✅ Ajout de `historyService.enregistrerAction(dossierInscriptionId, typeAction, details)`
- ✅ Ajout de `historyService.getHistorique(dossierInscriptionId, params)`

**Détails** :

#### Dossier Service (Documents de base)
```javascript
// ✅ NOUVEAU
getDossierPersonnel: (candidatId) => 
  request(`/dossier/candidats/${candidatId}/dossier-personnel`)

// ✅ MIS À JOUR - Ajout de candidatId
uploadPiece: async (candidatId, typePiece, fichier) => {
  // Endpoint: PUT /dossier/candidats/:candidatId/dossier-personnel/pieces
}
```

#### Inscription Service (Documents spécifiques)
```javascript
// ✅ NOUVEAU
getDossierComplet: (inscriptionId) => 
  request(`/completion/inscriptions/${inscriptionId}/dossier-complet`)

// ✅ MIS À JOUR - Nouveau endpoint
uploadQuittance: async (inscriptionId, fichier) => {
  // Endpoint: POST /inscriptions/:id/dossier-concours/quittance
}

// ✅ MIS À JOUR - Nouveau endpoint
uploadPieceExtra: async (inscriptionId, typePiece, fichier) => {
  // Endpoint: POST /inscriptions/:id/dossier-concours/pieces-extras
}
```

#### History Service (Nouveau)
```javascript
// ✅ NOUVEAU
enregistrerAction: (dossierInscriptionId, typeAction, details) => {
  // Utilise dossierInscriptionId au lieu de dossierId
}

// ✅ NOUVEAU
getHistorique: (dossierInscriptionId, params) => {
  // Endpoint: GET /history/dossiers-inscription/:dossierInscriptionId
}
```

---

### 2. `unipath-front/src/components/DossierCompletion.jsx` ✅

**Changements** :
- ✅ Ajout du paramètre `dossierInscriptionId` dans les props
- ✅ Utilisation de l'API `getDossierPersonnel` au lieu du calcul manuel
- ✅ Mise à jour de `handleSoumettre` pour utiliser `dossierInscriptionId` au lieu de `dossierId`
- ✅ Fallback sur l'ancien calcul si l'API échoue (compatibilité)

**Détails** :

#### Props
```javascript
// ✅ AVANT
export default function DossierCompletion({ candidatId, dossier, onSoumettre })

// ✅ APRÈS
export default function DossierCompletion({ candidatId, dossier, onSoumettre, dossierInscriptionId })
```

#### Calcul de complétude
```javascript
// ✅ NOUVEAU - Utilise l'API
fetch(`${BASE_URL}/dossier/candidats/${candidatId}/dossier-personnel`, {
  headers: getAuthHeaders()
})
  .then(res => res.json())
  .then(apiData => {
    setData({
      pourcentage: apiData.completude.pourcentage,
      piecesPresentes: apiData.completude.piecesPresentes,
      piecesRequises: apiData.completude.piecesRequises,
      piecesManquantes: apiData.piecesBase
        .filter(p => p.statut === 'manquante')
        .map(p => p.type),
      estComplet: apiData.completude.pourcentage === 100,
    });
  })
  .catch(err => {
    // Fallback sur l'ancien calcul
  });
```

#### Soumission
```javascript
// ✅ AVANT
body: JSON.stringify({
  dossierId: dossier?.id,
  typeAction: 'DOSSIER_SOUMIS',
})

// ✅ APRÈS
body: JSON.stringify({
  dossierInscriptionId: dossierInscriptionId,
  typeAction: 'DOSSIER_SOUMIS',
})
```

---

### 3. `unipath-front/src/pages/DetailConcours.jsx` ✅

**Changements** :
- ✅ Mise à jour de `handleUploadPiece` pour passer `candidat.id` lors de l'upload de documents de base

**Détails** :

```javascript
// ✅ AVANT
if (PIECES_DOSSIER_BASE[piece]) {
  await dossierService.uploadPiece(piece, fichier);
}

// ✅ APRÈS
if (PIECES_DOSSIER_BASE[piece]) {
  await dossierService.uploadPiece(candidat.id, piece, fichier);
}
```

---

## ⚠️ Changements Restants (Optionnels)

### `unipath-front/src/pages/AccueilCandidat.jsx`

**Statut** : ⚠️ **Optionnel** - Le composant fonctionne toujours avec l'ancien calcul

**Changements recommandés** :
- Utiliser `dossierService.getDossierPersonnel(candidat.id)` au lieu du calcul manuel
- Accéder au statut via `inscription.dossierInscription?.statut` au lieu de `inscription.statut`

**Impact** : Faible - Le composant continue de fonctionner avec les données existantes

**Code suggéré** :
```javascript
// ✅ RECOMMANDÉ - Utiliser l'API
const [dossierPersonnel, setDossierPersonnel] = useState(null);

useEffect(() => {
  if (candidat?.id) {
    dossierService.getDossierPersonnel(candidat.id)
      .then(data => {
        setDossierPersonnel(data);
      })
      .catch(err => console.error('Erreur:', err));
  }
}, [candidat?.id]);

const pct = dossierPersonnel?.completude?.pourcentage || 0;
const nbPieces = dossierPersonnel?.completude?.piecesPresentes || 0;

// Statut des inscriptions
const nbValides = candidat?.inscriptions?.filter(i => 
  i.dossierInscription?.statut === 'VALIDE'
).length || 0;
```

---

## 🧪 Tests à Effectuer

### Tests Critiques ✅

1. **Upload document de base**
   - [ ] Uploader acteNaissance
   - [ ] Uploader carteIdentite
   - [ ] Uploader photo
   - [ ] Uploader releve
   - [ ] Vérifier que `candidatId` est bien passé

2. **Upload quittance**
   - [ ] Uploader quittance pour une inscription
   - [ ] Vérifier le nouveau endpoint est utilisé

3. **Calcul de complétude**
   - [ ] Vérifier que `getDossierPersonnel` est appelé
   - [ ] Vérifier que le pourcentage est correct
   - [ ] Vérifier le fallback si l'API échoue

4. **Soumission de dossier**
   - [ ] Vérifier que `dossierInscriptionId` est utilisé
   - [ ] Vérifier que l'action est enregistrée

### Tests Optionnels

5. **Page AccueilCandidat**
   - [ ] Vérifier l'affichage de la complétude
   - [ ] Vérifier l'affichage des statuts d'inscription

---

## 📊 Compatibilité

### Rétrocompatibilité ✅

- ✅ **Fallback** : `DossierCompletion.jsx` a un fallback sur l'ancien calcul si l'API échoue
- ✅ **Ancien endpoint** : `getDossier()` est toujours disponible (marqué deprecated)
- ✅ **Données existantes** : Les composants continuent de fonctionner avec les anciennes données

### Migration Progressive ✅

Les changements permettent une migration progressive :
1. **Phase 1** : Backend déployé, frontend utilise les nouveaux endpoints
2. **Phase 2** : Mise à jour optionnelle de `AccueilCandidat.jsx`
3. **Phase 3** : Suppression des anciens endpoints (après validation)

---

## 🎯 Résumé des Endpoints

| Ancien Endpoint | Nouveau Endpoint | Statut |
|----------------|------------------|--------|
| `POST /dossier/upload` | `PUT /dossier/candidats/:id/dossier-personnel/pieces` | ✅ Migré |
| `POST /inscriptions/:id/quittance` | `POST /inscriptions/:id/dossier-concours/quittance` | ✅ Migré |
| `POST /inscriptions/:id/pieces-extras` | `POST /inscriptions/:id/dossier-concours/pieces-extras` | ✅ Migré |
| N/A | `GET /dossier/candidats/:id/dossier-personnel` | ✅ Nouveau |
| N/A | `GET /completion/inscriptions/:id/dossier-complet` | ✅ Nouveau |
| `POST /history/action` (dossierId) | `POST /history/action` (dossierInscriptionId) | ✅ Migré |

---

## ✅ Checklist Finale

### Services API
- [x] Mettre à jour `dossierService.uploadPiece` (ajouter `candidatId`)
- [x] Ajouter `dossierService.getDossierPersonnel`
- [x] Mettre à jour `inscriptionService.uploadQuittance` (nouveau endpoint)
- [x] Ajouter `inscriptionService.getDossierComplet`
- [x] Mettre à jour `inscriptionService.uploadPieceExtra` (nouveau endpoint)
- [x] Ajouter `historyService` complet

### Composants
- [x] Mettre à jour `DossierCompletion.jsx`
- [x] Mettre à jour `DetailConcours.jsx`
- [ ] Mettre à jour `AccueilCandidat.jsx` (optionnel)

### Tests
- [ ] Tester upload document de base
- [ ] Tester upload quittance
- [ ] Tester upload pièce extra
- [ ] Tester calcul de complétude
- [ ] Tester soumission de dossier

---

## 🚀 Déploiement

### Ordre de Déploiement Recommandé

1. **Backend** : Déployer la refonte backend en premier
2. **Frontend** : Déployer les changements frontend immédiatement après
3. **Validation** : Tester les workflows critiques
4. **Monitoring** : Surveiller les logs et erreurs

### Rollback

En cas de problème :
1. Les anciens endpoints sont toujours disponibles (deprecated)
2. Le fallback dans `DossierCompletion.jsx` assure la continuité
3. Possibilité de revenir à l'ancien frontend sans casser le système

---

## 📞 Support

Pour toute question :
- Consulter [FRONTEND_MIGRATION_GUIDE.md](./FRONTEND_MIGRATION_GUIDE.md)
- Consulter [API_ENDPOINTS_REFONTE.md](./API_ENDPOINTS_REFONTE.md)
- Consulter [REFONTE_DOSSIER_INSCRIPTION.md](./REFONTE_DOSSIER_INSCRIPTION.md)

---

**Version** : 1.0  
**Date** : 11 mai 2026  
**Statut** : ✅ **COMPLÉTÉ**  
**Prêt pour tests** : ✅ **OUI**
