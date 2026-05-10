# Correction des Bugs Critiques de Gestion des Statuts

## 🐛 Bugs Identifiés et Corrigés

### Bug 1: `getCandidatsParConcours` filtre par `VALIDE` au lieu de `VALIDE_PAR_COMMISSION`

**Problème :**
La commission ne voyait jamais ses propres candidats validés car la fonction filtrait uniquement par `statut: 'VALIDE'`, qui n'existe qu'après validation du contrôleur.

**Impact :**
- La commission ne pouvait pas voir les candidats qu'elle avait validés
- Impossible d'attribuer des notes aux candidats validés par la commission
- Le workflow commission → contrôleur était bloqué

**Solution Appliquée :**
```javascript
// AVANT (❌ Bug)
where: { statut: 'VALIDE' }

// APRÈS (✅ Corrigé)
where: { 
  statut: {
    in: ['VALIDE_PAR_COMMISSION', 'VALIDE']
  }
}
```

**Fichier :** `unipath-api/src/controllers/commission.controller.js`

---

### Bug 2: `getClassement` filtre `VALIDE` prématurément

**Problème :**
La fonction `getClassement` filtrait uniquement par `statut: 'VALIDE'`, ce qui empêchait la commission de voir un classement avant la validation du contrôleur.

**Impact :**
- La commission ne pouvait pas voir le classement des candidats qu'elle avait validés
- Le classement était toujours vide pour la commission
- Impossible de vérifier les notes avant validation du contrôleur

**Solution Appliquée :**
```javascript
// Ajout d'un paramètre role dans la query
const { role } = req.query;

// Déterminer les statuts selon le rôle
let statutsValides;
if (role === 'COMMISSION') {
  // La commission voit les candidats qu'elle a validés
  statutsValides = ['VALIDE_PAR_COMMISSION', 'VALIDE'];
} else {
  // Par défaut (DGES, public), seulement les validés définitivement
  statutsValides = ['VALIDE'];
}

// Utiliser le filtre dynamique
where: {
  concoursId: id,
  statut: {
    in: statutsValides
  },
}
```

**Fichier :** `unipath-api/src/controllers/concours.controller.js`

**Utilisation :**
```javascript
// Frontend - Commission
GET /api/concours/:id/classement?role=COMMISSION

// Frontend - DGES ou Public
GET /api/concours/:id/classement
```

---

### Bug 3: Actions de validation du contrôleur incohérentes

**Problème :**
Le commentaire indiquait `action peut être: 'CONFIRMER', 'VALIDER', 'REJETER', 'SOUS_RESERVE'`, mais le code faisait `nouveauStatut = action`, ce qui créait des statuts invalides si le frontend envoyait 'VALIDER' au lieu de 'VALIDE'.

**Impact :**
- Statuts incorrects en base de données ('VALIDER' au lieu de 'VALIDE')
- Emails non envoyés car le statut ne correspondait pas
- Incohérence entre l'API et le schéma Prisma

**Solution Appliquée :**
```javascript
// Validation stricte des actions
const actionsValides = ['CONFIRMER', 'VALIDER', 'REJETER', 'SOUS_RESERVE'];
if (!actionsValides.includes(action)) {
  return res.status(400).json({ 
    error: `Action invalide. Actions acceptées : ${actionsValides.join(', ')}` 
  });
}

// Mapping explicite des actions vers les statuts
if (action === 'CONFIRMER') {
  const mapping = {
    'VALIDE_PAR_COMMISSION': 'VALIDE',
    'REJETE_PAR_COMMISSION': 'REJETE',
    'SOUS_RESERVE_PAR_COMMISSION': 'SOUS_RESERVE'
  };
  nouveauStatut = mapping[inscription.statut];
  typeEmail = nouveauStatut;
} else if (['VALIDER', 'REJETER', 'SOUS_RESERVE'].includes(action)) {
  // Mapper les actions vers les statuts corrects
  const actionMapping = {
    'VALIDER': 'VALIDE',
    'REJETER': 'REJETE',
    'SOUS_RESERVE': 'SOUS_RESERVE'
  };
  nouveauStatut = actionMapping[action];
  typeEmail = nouveauStatut;
}
```

**Fichier :** `unipath-api/src/controllers/controleur.controller.js`

---

## 📊 Flux des Statuts Corrigé

### Workflow Complet

```
1. CANDIDAT SOUMET DOSSIER
   └─> Statut: EN_ATTENTE

2. COMMISSION ÉVALUE
   ├─> Valide    → VALIDE_PAR_COMMISSION
   ├─> Rejette   → REJETE_PAR_COMMISSION
   └─> Sous rés. → SOUS_RESERVE_PAR_COMMISSION

3. CONTRÔLEUR VALIDE
   ├─> Confirme  → VALIDE / REJETE / SOUS_RESERVE
   ├─> Modifie   → VALIDE / REJETE / SOUS_RESERVE (avec commentaire)
   └─> Email envoyé au candidat

4. COMMISSION ATTRIBUE NOTES
   └─> Uniquement pour statuts: VALIDE_PAR_COMMISSION ou VALIDE
```

### Matrice de Visibilité

| Fonction | Commission | Contrôleur | DGES/Public |
|----------|-----------|------------|-------------|
| `getCandidatsParConcours` | VALIDE_PAR_COMMISSION + VALIDE | - | - |
| `getClassement` (role=COMMISSION) | VALIDE_PAR_COMMISSION + VALIDE | - | - |
| `getClassement` (défaut) | - | - | VALIDE uniquement |
| `getDossiersEnAttente` | - | VALIDE_PAR_COMMISSION + REJETE_PAR_COMMISSION + SOUS_RESERVE_PAR_COMMISSION | - |

---

## ✅ Tests de Validation

### Test 1: Commission voit ses candidats validés
```bash
# 1. Commission valide un candidat
POST /api/commission/dossiers/:id/statut
{
  "statut": "VALIDE",
  "commentaireRejet": null
}

# 2. Vérifier que le candidat apparaît dans la liste
GET /api/commission/candidats-par-concours

# Résultat attendu: Le candidat apparaît avec statut VALIDE_PAR_COMMISSION
```

### Test 2: Commission voit le classement
```bash
# 1. Commission attribue des notes
PATCH /api/commission/inscriptions/:id/note
{
  "note": 15.5
}

# 2. Consulter le classement
GET /api/concours/:id/classement?role=COMMISSION

# Résultat attendu: Le classement s'affiche avec les notes
```

### Test 3: Contrôleur utilise les bonnes actions
```bash
# 1. Contrôleur confirme la décision
POST /api/controleur/dossiers/:id/valider
{
  "action": "CONFIRMER"
}

# Résultat attendu: Statut passe à VALIDE, email envoyé

# 2. Contrôleur modifie la décision
POST /api/controleur/dossiers/:id/valider
{
  "action": "REJETER",
  "commentaireControleur": "Dossier incomplet"
}

# Résultat attendu: Statut passe à REJETE, email envoyé
```

### Test 4: Actions invalides sont rejetées
```bash
POST /api/controleur/dossiers/:id/valider
{
  "action": "VALIDE"  # ❌ Action invalide
}

# Résultat attendu: Erreur 400 avec message explicite
```

---

## 🔧 Modifications Frontend Requises

### 1. Page Commission - Liste des Candidats
```javascript
// Aucune modification requise
// L'API retourne maintenant les candidats avec VALIDE_PAR_COMMISSION
```

### 2. Page Commission - Classement
```javascript
// Ajouter le paramètre role
const response = await fetch(
  `/api/concours/${concoursId}/classement?role=COMMISSION`
);
```

### 3. Page Contrôleur - Validation
```javascript
// Utiliser les actions correctes
const validerDecision = async (action) => {
  await fetch(`/api/controleur/dossiers/${inscriptionId}/valider`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: action, // 'CONFIRMER', 'VALIDER', 'REJETER', 'SOUS_RESERVE'
      commentaireControleur: commentaire
    })
  });
};
```

---

## 📝 Checklist de Vérification

### Backend
- [x] `getCandidatsParConcours` filtre par VALIDE_PAR_COMMISSION + VALIDE
- [x] `getClassement` supporte le paramètre `role`
- [x] `validerDecision` mappe correctement les actions vers les statuts
- [x] Validation stricte des actions dans `validerDecision`
- [x] Messages d'erreur explicites

### Frontend
- [ ] Page Commission utilise `?role=COMMISSION` pour le classement
- [ ] Page Contrôleur envoie les bonnes actions ('VALIDER' pas 'VALIDE')
- [ ] Gestion des erreurs 400 pour actions invalides

### Tests
- [ ] Commission voit les candidats validés
- [ ] Commission peut attribuer des notes
- [ ] Commission voit le classement
- [ ] Contrôleur peut confirmer les décisions
- [ ] Contrôleur peut modifier les décisions
- [ ] Actions invalides sont rejetées

---

## 🚀 Déploiement

### Étapes
1. ✅ Corriger les contrôleurs backend
2. ✅ Tester les endpoints avec Postman/Insomnia
3. ⏳ Mettre à jour le frontend
4. ⏳ Tester le workflow complet
5. ⏳ Déployer en production

### Rollback
Si problème, les anciens statuts restent compatibles :
- `VALIDE` fonctionne toujours
- `VALIDE_PAR_COMMISSION` est maintenant inclus

---

**Date de correction :** 7 Mai 2026  
**Version :** 1.0  
**Statut :** ✅ Backend Corrigé - Frontend en attente
