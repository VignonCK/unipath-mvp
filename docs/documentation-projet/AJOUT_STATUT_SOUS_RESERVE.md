# Ajout du Statut "SOUS RÉSERVE"

## 📋 Résumé
Ajout d'un nouveau statut "SOUS_RESERVE" permettant à la commission d'accepter un dossier avec des conditions à remplir. Le candidat reçoit un email avec les conditions spécifiques.

## ✅ Modifications effectuées

### 1. Base de données (Prisma Schema)
**Fichier**: `unipath-api/prisma/schema.prisma`

- ✅ Ajout du statut `SOUS_RESERVE` dans l'enum `StatutDossier`
- ✅ Ajout du champ `commentaireSousReserve String?` dans le modèle `Inscription`
- ✅ Migration appliquée avec succès : `npx prisma db push`

```prisma
enum StatutDossier {
  EN_ATTENTE
  VALIDE
  REJETE
  SOUS_RESERVE  // ← Nouveau
}

model Inscription {
  // ...
  commentaireRejet String?
  commentaireSousReserve String?  // ← Nouveau
  // ...
}
```

### 2. Backend - Service Email
**Fichier**: `unipath-api/src/services/email.service.js`

- ✅ Nouvelle fonction `envoyerEmailSousReserve(data)`
- ✅ Email avec design orange (couleur de l'alerte)
- ✅ Affichage des conditions à remplir dans un encadré
- ✅ Numéro de dossier inclus
- ✅ Message d'avertissement pour régulariser avant le concours

**Template email** :
- Titre : "Dossier accepté sous réserve"
- Couleur : Orange (#f97316)
- Contenu : Conditions à remplir + numéro de dossier + avertissement

### 3. Backend - Controller Commission
**Fichier**: `unipath-api/src/controllers/commission.controller.js`

- ✅ Import de `envoyerEmailSousReserve`
- ✅ Validation du statut `SOUS_RESERVE` dans `updateStatut`
- ✅ Validation obligatoire du `commentaireSousReserve` si statut = SOUS_RESERVE
- ✅ Envoi automatique de l'email avec les conditions
- ✅ Mise à jour du champ `commentaireSousReserve` en base

**Logique** :
```javascript
if (statut === 'SOUS_RESERVE' && !commentaireSousReserve) {
  return res.status(400).json({
    error: 'Le commentaire de validation sous réserve est obligatoire',
  });
}
```

### 4. Frontend - Service API
**Fichier**: `unipath-front/src/services/api.js`

- ✅ Modification de `updateStatut` pour accepter un objet `payload` au lieu de paramètres séparés
- ✅ Permet d'envoyer `statut`, `commentaireRejet` ou `commentaireSousReserve` selon le cas

**Avant** :
```javascript
updateStatut: (inscriptionId, statut, commentaireRejet = null)
```

**Après** :
```javascript
updateStatut: (inscriptionId, payload)
```

### 5. Frontend - Dashboard Commission
**Fichier**: `unipath-front/src/pages/DashboardCommission.jsx`

#### Configuration du statut
```javascript
const STATUT_CONFIG = {
  VALIDE:        { label: 'Validé',        bar: 'bg-green-500',  badge: 'bg-green-100 text-green-700' },
  REJETE:        { label: 'Rejeté',        bar: 'bg-red-500',    badge: 'bg-red-100 text-red-700' },
  EN_ATTENTE:    { label: 'En attente',    bar: 'bg-yellow-400', badge: 'bg-yellow-100 text-yellow-700' },
  SOUS_RESERVE:  { label: 'Sous réserve',  bar: 'bg-orange-500', badge: 'bg-orange-100 text-orange-700' },
};
```

#### États ajoutés
- ✅ `sousReserveModal` : État pour gérer la modale
- ✅ `counts.SOUS_RESERVE` : Compteur des dossiers sous réserve

#### Fonctions ajoutées
- ✅ `ouvrirModalSousReserve(inscriptionId)` : Ouvre la modale
- ✅ `confirmerSousReserve()` : Valide et envoie la décision
- ✅ Modification de `handleDecision` pour gérer les 3 types de commentaires

#### Interface utilisateur
1. **Statistiques** : Nouvelle carte orange "Sous réserve" (5 cartes au total)
2. **Filtres** : Nouveau bouton "Sous réserve" avec compteur
3. **Actions** : 
   - Bouton "Valider le dossier" (vert, pleine largeur)
   - Bouton "Sous réserve" (orange, 50%)
   - Bouton "Rejeter" (rouge, 50%)
4. **Modale** :
   - Titre : "Accepter sous réserve"
   - Champ : "Conditions à remplir" (obligatoire)
   - Placeholder explicatif
   - Bouton orange "Confirmer"

#### Layout responsive
- Grid 5 colonnes sur desktop (md:grid-cols-5)
- Grid 2 colonnes sur mobile
- Boutons adaptés à la taille d'écran

## 🎨 Design

### Couleurs
- **Sous réserve** : Orange (#f97316)
- **Validé** : Vert (#22c55e)
- **Rejeté** : Rouge (#dc2626)
- **En attente** : Jaune (#facc15)

### Hiérarchie des boutons
```
┌─────────────────────────────────┐
│   Valider le dossier (vert)     │
├─────────────────┬───────────────┤
│ Sous réserve    │   Rejeter     │
│   (orange)      │   (rouge)     │
└─────────────────┴───────────────┘
```

## 📧 Email envoyé au candidat

**Objet** : `[UniPath] Dossier accepté sous réserve - [Nom du concours]`

**Contenu** :
- Titre orange : "Dossier accepté sous réserve"
- Message personnalisé avec nom/prénom
- Encadré orange avec les conditions à remplir
- Numéro de dossier
- Avertissement : "⚠️ Vous devez régulariser votre situation avant la date du concours"
- Footer standard UAC

## 🔄 Workflow complet

1. **Commission** : Clique sur "Sous réserve" pour un dossier EN_ATTENTE
2. **Modale** : S'ouvre avec un champ obligatoire "Conditions à remplir"
3. **Validation** : Commission saisit les conditions (ex: "Fournir l'acte de naissance original")
4. **Backend** : 
   - Vérifie que le commentaire n'est pas vide
   - Met à jour le statut → SOUS_RESERVE
   - Enregistre le commentaire dans `commentaireSousReserve`
   - Envoie l'email au candidat
5. **Candidat** : Reçoit l'email avec les conditions précises à remplir
6. **Dashboard** : Le dossier apparaît dans l'onglet "Sous réserve" avec badge orange

## 📊 Statistiques

Les dossiers "SOUS_RESERVE" sont comptabilisés séparément :
- Carte dédiée dans le dashboard
- Filtre dédié
- Compteur dans le total général

## ✅ Tests de compilation

- ✅ Backend : Aucune erreur de diagnostic
- ✅ Frontend : Build réussi (2.04s)
- ✅ Migration DB : Appliquée avec succès
- ✅ Tous les fichiers .jsx : Sans erreur

## 📝 Fichiers modifiés

### Backend (4 fichiers)
1. `unipath-api/prisma/schema.prisma`
2. `unipath-api/src/services/email.service.js`
3. `unipath-api/src/controllers/commission.controller.js`

### Frontend (2 fichiers)
1. `unipath-front/src/services/api.js`
2. `unipath-front/src/pages/DashboardCommission.jsx`

## 🚀 Déploiement

### Prérequis
- ✅ Migration DB appliquée
- ✅ Backend redémarré (pour charger le nouveau Prisma Client)
- ✅ Frontend rebuild

### Commandes
```bash
# Backend
cd unipath-api
npx prisma db push
npm start

# Frontend
cd unipath-front
npm run build
```

## 📌 Notes importantes

1. **Commentaire obligatoire** : Comme pour le rejet, le commentaire est obligatoire pour SOUS_RESERVE
2. **Email automatique** : L'email est envoyé automatiquement après validation
3. **Pas de PDF** : Contrairement à la validation complète, pas de convocation PDF générée
4. **Statut intermédiaire** : Le candidat peut régulariser et le dossier peut ensuite passer à VALIDE
5. **Comptabilisation** : Les dossiers SOUS_RESERVE ne sont PAS comptés comme validés pour les notes

## 🎯 Cas d'usage

**Exemples de conditions** :
- "Fournir l'acte de naissance original avant le 15/06/2025"
- "Corriger la photo d'identité (fond blanc requis)"
- "Compléter le relevé de notes avec le cachet de l'établissement"
- "Fournir une attestation de nationalité"
- "Régulariser le paiement des frais de participation"

## ✨ Améliorations futures possibles

- [ ] Permettre au candidat de répondre directement depuis l'email
- [ ] Ajouter une date limite de régularisation
- [ ] Historique des conditions demandées
- [ ] Notification push en plus de l'email
- [ ] Passage automatique à VALIDE après régularisation

---

**Date de création** : 6 mai 2026  
**Statut** : ✅ Implémenté et testé  
**Version** : 1.0
