# 🎴 Carte d'Identité Candidat - Documentation

## 📋 Vue d'Ensemble

Nouvelle page créée pour afficher une **carte d'identité professionnelle** pour chaque candidat, inspirée du design moderne et épuré.

**Route** : `/ma-carte`  
**Accès** : Candidats uniquement  
**Date** : 6 mai 2026

---

## ✨ Fonctionnalités

### 1. Affichage Professionnel
- ✅ Design type "carte d'identité officielle"
- ✅ Header avec logo INSUP Bénin
- ✅ Photo du candidat (ou avatar par défaut)
- ✅ Informations personnelles complètes
- ✅ Statut des documents du dossier
- ✅ QR Code simulé pour vérification

### 2. Sections de la Carte

#### Header (Bleu Marine)
- Logo "INSUP Bénin"
- Sous-titre "Carte d'Identité Candidat"
- Matricule du candidat (en badge)

#### Corps Principal
1. **Photo et Identité**
   - Photo 40x40 avec bordure bleue
   - Nom et prénom en grand
   - Badge "Candidat"

2. **Données Académiques** (Encadré Ambre)
   - Série du BAC
   - Année d'obtention

3. **Informations Civiles** (Encadré Bleu)
   - Sexe
   - Nationalité
   - Date de naissance
   - Lieu de naissance

4. **Contact** (Cartes Grises)
   - Email avec icône
   - Téléphone avec icône

5. **Documents du Dossier**
   - Photo d'identité
   - Carte d'identité
   - Acte de naissance
   - Relevé de notes
   - Statut : Validée (vert) / Non fournie (gris)

#### Footer
- Lien de vérification
- QR Code simulé

---

## 🎨 Design

### Couleurs
- **Header** : Gradient bleu marine (`from-blue-900 to-blue-800`)
- **Académique** : Ambre (`amber-50`, `amber-500`)
- **Civil** : Bleu clair (`blue-50`, `blue-500`)
- **Validé** : Vert (`green-100`, `green-700`)
- **Non fourni** : Gris (`gray-200`, `gray-600`)

### Typographie
- **Nom** : 3xl, font-black
- **Sections** : Uppercase, tracking-wide
- **Labels** : xs, text-gray-500
- **Valeurs** : sm, font-semibold

### Espacements
- Padding principal : 8 (32px)
- Gap entre sections : 8 (32px)
- Border radius : 3xl (24px)

---

## 🔄 Navigation

### Accès à la Carte
1. **Depuis le Dashboard** : Bouton "Ma carte candidat" (vert)
2. **URL directe** : `/ma-carte`

### Boutons d'Action
1. **Modifier mes informations** → `/mon-compte`
2. **Imprimer la carte** → `window.print()`

---

## 📱 Responsive

### Mobile (< 768px)
- Photo et infos en colonne
- Grille contact 1 colonne
- Boutons empilés

### Tablette/Desktop (≥ 768px)
- Photo et infos côte à côte
- Grille contact 2 colonnes
- Boutons en ligne

---

## 🔧 Implémentation Technique

### Fichiers Créés
- `unipath-front/src/pages/CarteCandidat.jsx`

### Fichiers Modifiés
- `unipath-front/src/App.jsx` - Ajout route `/ma-carte`
- `unipath-front/src/pages/AccueilCandidat.jsx` - Ajout bouton accès

### Dépendances
- `react-router-dom` - Navigation
- `candidatService` - Récupération données
- `authService` - Authentification

---

## 📊 Données Affichées

### Informations Personnelles
```javascript
{
  matricule: "2026001",
  prenom: "Jean",
  nom: "DUPONT",
  email: "jean.dupont@example.com",
  telephone: "+229 XX XX XX XX",
  sexe: "M",
  nationalite: "Béninoise",
  dateNaiss: "2000-01-15",
  lieuNaiss: "Cotonou",
  serie: "D",
  anneeBac: "2023"
}
```

### Documents du Dossier
```javascript
{
  photo: "url_ou_null",
  carteIdentite: "url_ou_null",
  acteNaissance: "url_ou_null",
  releve: "url_ou_null"
}
```

---

## 🖨️ Impression

### Fonction Print
```javascript
window.print()
```

### Optimisations Print (à ajouter si besoin)
```css
@media print {
  .no-print { display: none; }
  .card { box-shadow: none; }
}
```

---

## 🎯 Cas d'Usage

### 1. Candidat Consulte sa Carte
```
Dashboard → Clic "Ma carte candidat" → Affichage carte
```

### 2. Candidat Imprime sa Carte
```
Ma carte → Clic "Imprimer la carte" → Dialogue impression
```

### 3. Candidat Met à Jour ses Infos
```
Ma carte → Clic "Modifier mes informations" → Mon Compte
```

---

## 🔒 Sécurité

### Protection Route
- Route protégée par `ProtectedRoute`
- Rôle requis : `CANDIDAT`
- Redirection si non authentifié

### Données
- Chargement depuis API sécurisée
- Token JWT requis
- Pas de données sensibles exposées

---

## 🧪 Tests Recommandés

### Test 1 : Affichage Complet
```
1. Se connecter en CANDIDAT
2. Cliquer "Ma carte candidat"
3. Vérifier :
   - Photo affichée (ou avatar)
   - Toutes les infos présentes
   - Statuts documents corrects
```

### Test 2 : Documents Manquants
```
1. Candidat sans tous les documents
2. Vérifier badges "Non fournie" en gris
3. Vérifier icônes X rouges
```

### Test 3 : Impression
```
1. Cliquer "Imprimer la carte"
2. Vérifier aperçu impression
3. Vérifier mise en page
```

### Test 4 : Responsive
```
1. Tester sur mobile (< 768px)
2. Tester sur tablette (768-1024px)
3. Tester sur desktop (> 1024px)
```

---

## 🎨 Personnalisation Future

### Thèmes
- [ ] Mode sombre
- [ ] Couleurs personnalisables
- [ ] Logo personnalisable

### Fonctionnalités
- [ ] Export PDF
- [ ] Partage par email
- [ ] QR Code fonctionnel
- [ ] Badge NFC virtuel

### Données Supplémentaires
- [ ] Numéro d'étudiant
- [ ] Filière choisie
- [ ] Année d'inscription
- [ ] Photo de couverture

---

## 📝 Notes Importantes

### Photo
- Chargée depuis `localStorage`
- Clé : `photoProfil_${candidat.id}`
- Fallback : Avatar SVG

### Matricule
- Format : 7 caractères
- Exemple : "2026001"
- Unique par candidat

### QR Code
- Actuellement simulé (SVG)
- URL : `https://insup.bj/verify/{matricule}`
- À implémenter : Génération réelle

---

## 🚀 Prochaines Étapes

### Court terme
- [ ] Tests utilisateurs
- [ ] Ajustements design
- [ ] Optimisation print

### Moyen terme
- [ ] Export PDF natif
- [ ] QR Code fonctionnel
- [ ] Signature numérique

### Long terme
- [ ] Carte NFC virtuelle
- [ ] Intégration wallet mobile
- [ ] Vérification blockchain

---

## 📸 Aperçu du Design

```
┌─────────────────────────────────────────────────────┐
│ INSUP Bénin                        [Matricule: XXX] │
│ Carte d'Identité Candidat                           │
├─────────────────────────────────────────────────────┤
│                                                      │
│  [Photo]    Jean DUPONT                             │
│             Candidat                                 │
│                                                      │
│             [Données Académiques - Ambre]           │
│             Série: D | Année: 2023                  │
│                                                      │
│             [Informations Civiles - Bleu]           │
│             Sexe: M | Nationalité: Béninoise        │
│             Date: 15/01/2000 | Lieu: Cotonou        │
│                                                      │
│  [Email Icon] jean.dupont@...                       │
│  [Phone Icon] +229 XX XX XX XX                      │
│                                                      │
│  Documents du Dossier:                              │
│  ✓ Photo d'identité          [Validée]             │
│  ✓ Carte d'identité          [Validée]             │
│  ✗ Acte de naissance         [Non fournie]         │
│  ✓ Relevé de notes           [Validée]             │
│                                                      │
│  https://insup.bj/verify/XXX           [QR Code]   │
├─────────────────────────────────────────────────────┤
│ [Modifier mes informations] [Imprimer la carte]    │
└─────────────────────────────────────────────────────┘
```

---

**Date de création** : 6 mai 2026  
**Statut** : ✅ Implémenté et prêt pour tests  
**Inspiré de** : Design moderne type Google Meet

---

**Fin de la documentation** 🎉
