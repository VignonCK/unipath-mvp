# Page de Détail Candidat pour la Commission

## 📋 Résumé

Une nouvelle page a été créée pour permettre aux membres de la commission de visualiser le profil complet d'un candidat et de prendre des décisions (VALIDÉ, REJETÉ, SOUS RÉSERVE) sur son dossier.

## ✅ Fonctionnalités Implémentées

### 1. **Page de Détail Candidat** (`DetailCandidatCommission.jsx`)

#### Informations Affichées :
- **Profil du candidat** :
  - Nom, prénom, matricule
  - Email et téléphone
  - Date et lieu de naissance
  - Sexe et nationalité
  - Statut du dossier (EN_ATTENTE, VALIDÉ, REJETÉ, SOUS_RESERVE)

- **Informations du concours** :
  - Libellé du concours
  - Établissement
  - Dates du concours

- **Pièces justificatives** :
  - Acte de naissance
  - Carte d'identité
  - Photo d'identité
  - Relevé de notes
  - Quittance de paiement (dossier)
  - Quittance d'inscription au concours
  - Indicateur visuel de complétude (X/5 pièces + barre de progression)
  - Bouton "Voir" pour visualiser chaque pièce dans une modale

- **Commentaires** :
  - Affichage du motif de rejet (si applicable)
  - Affichage des conditions à remplir (si sous réserve)

- **Historique des actions** :
  - Historique complet des actions effectuées sur le dossier
  - Pliable/dépliable

#### Actions Disponibles :

Pour les dossiers **EN_ATTENTE** :
1. **Valider le dossier** : Change le statut à VALIDÉ et envoie un email de convocation
2. **Sous réserve** : Ouvre une modale pour saisir les conditions à remplir
3. **Rejeter** : Ouvre une modale pour saisir le motif du rejet

### 2. **Modifications du Dashboard Commission**

- Ajout d'un bouton **"Voir le profil complet"** sur chaque carte de dossier
- Le bouton est toujours visible, quel que soit le statut du dossier
- Navigation vers la page de détail au clic

### 3. **Routing**

Nouvelle route ajoutée dans `App.jsx` :
```javascript
/commission/candidat/:inscriptionId
```

Protégée par le rôle `COMMISSION` uniquement.

## 🎨 Interface Utilisateur

### Design
- **Header** : Navigation avec bouton retour vers le dashboard
- **Cartes d'information** : Design cohérent avec le reste de l'application
- **Indicateurs visuels** :
  - Barre de couleur en haut selon le statut
  - Badges colorés pour les statuts
  - Icônes pour les pièces justificatives
  - Barre de progression pour la complétude du dossier

### Modales
- **Modale de rejet** : Champ obligatoire pour le motif
- **Modale sous réserve** : Champ obligatoire pour les conditions
- **Visualiseur de documents** : Affichage des PDF et images

## 🔄 Flux de Travail

1. **Commission accède au dashboard** → Liste des dossiers
2. **Clic sur "Voir le profil complet"** → Page de détail du candidat
3. **Examen des informations et pièces** → Visualisation des documents
4. **Prise de décision** :
   - Si conforme → **Valider**
   - Si manque quelque chose → **Sous réserve** (avec commentaire)
   - Si non conforme → **Rejeter** (avec motif)
5. **Notification automatique** → Email envoyé au candidat
6. **Retour au dashboard** → Bouton retour dans le header

## 📁 Fichiers Modifiés/Créés

### Créés :
- `unipath-front/src/pages/DetailCandidatCommission.jsx` (nouveau)

### Modifiés :
- `unipath-front/src/App.jsx` (ajout de la route et import)
- `unipath-front/src/pages/DashboardCommission.jsx` (ajout du bouton "Voir le profil")

## 🔐 Sécurité

- Route protégée par authentification
- Accès réservé au rôle `COMMISSION`
- Validation des données côté backend (déjà existante)

## 📧 Notifications Email

Les emails sont automatiquement envoyés lors des décisions :
- **VALIDÉ** : Email de convocation avec PDF
- **REJETÉ** : Email avec le motif du rejet
- **SOUS RÉSERVE** : Email avec les conditions à remplir

## 🎯 Avantages

1. **Vue complète** : Toutes les informations du candidat sur une seule page
2. **Visualisation des pièces** : Possibilité de voir les documents directement
3. **Décisions rapides** : Actions accessibles directement depuis la page
4. **Traçabilité** : Historique des actions visible
5. **UX améliorée** : Navigation fluide et intuitive

## 🚀 Prochaines Étapes Possibles

- [ ] Ajouter la possibilité de télécharger toutes les pièces en ZIP
- [ ] Ajouter un système de notes/annotations sur les pièces
- [ ] Permettre la modification du statut même après validation
- [ ] Ajouter des filtres avancés sur le dashboard
- [ ] Statistiques par membre de la commission

## 📝 Notes Techniques

- Utilise le service `commissionService` existant
- Compatible avec le système de notifications existant
- Réutilise les composants `DocumentViewer` et `HistoriqueActions`
- Design responsive (mobile-friendly)
