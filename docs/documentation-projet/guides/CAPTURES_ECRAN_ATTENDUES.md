# 📸 Captures d'Écran Attendues - Page Détail Commission

## 🎯 Vue d'Ensemble

Ce document décrit les captures d'écran attendues pour la page de détail candidat commission. Utilisez-le comme référence pour valider l'interface.

---

## 1️⃣ Dashboard Commission - Vue Initiale

### Description
Liste des dossiers avec bouton "Voir le profil complet"

### Éléments Visibles
```
┌─────────────────────────────────────────────────────────────┐
│ [UniPath] Espace Commission          [Gérer notes] [👤] [⚡]│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                  │
│ │Total│ │ En  │ │Valid│ │Sous │ │Rejet│                  │
│ │ 50  │ │attnt│ │ 20  │ │rés. │ │  5  │                  │
│ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘                  │
│                                                             │
│ [En attente] [Validé] [Sous réserve] [Rejeté]              │
│ [🔍 Rechercher...]                                          │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ JD  Jean DUPONT              🟡 En attente              ││
│ │     MAT-2025-001                                         ││
│ │     Concours EPAC 2025                                   ││
│ │     📄 4/5 (80%)                                         ││
│ │                                                          ││
│ │     [📋 Voir le profil complet] ◄─── NOUVEAU BOUTON    ││
│ │     [✅ Valider] [⚠ Sous réserve] [❌ Rejeter]          ││
│ └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### Points de Validation
- ✅ Bouton "Voir le profil complet" visible en bleu
- ✅ Bouton positionné au-dessus des actions
- ✅ Icône de profil (👤) visible
- ✅ Texte clair et lisible

---

## 2️⃣ Page Détail - En-tête Candidat

### Description
Informations principales du candidat avec badge de statut

### Éléments Visibles
```
┌─────────────────────────────────────────────────────────────┐
│ [←] UniPath - Détail du dossier                    [👤] [⚡]│
├─────────────────────────────────────────────────────────────┤
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │ ← Barre colorée
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐│
│ │  JD   Jean DUPONT                    🟡 En attente     ││
│ │       MAT-2025-001                                      ││
│ │       jean.dupont@email.com                             ││
│ │       +229 XX XX XX XX                                  ││
│ │                                                          ││
│ │  ┌──────────┬──────────┬──────────┬──────────┐         ││
│ │  │Date naiss│Lieu naiss│   Sexe   │Nationalité│         ││
│ │  │15/03/2000│  Cotonou │ Masculin │ Béninoise │         ││
│ │  └──────────┴──────────┴──────────┴──────────┘         ││
│ │                                                          ││
│ │  ┌────────────────────────────────────────────────────┐ ││
│ │  │ 🎓 CONCOURS                                         │ ││
│ │  │ Concours EPAC 2025                                  │ ││
│ │  │ École Polytechnique d'Abomey-Calavi                 │ ││
│ │  │ 📅 Du 01/06/2025 au 30/06/2025                      │ ││
│ │  └────────────────────────────────────────────────────┘ ││
│ └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### Points de Validation
- ✅ Barre colorée en haut (jaune pour "En attente")
- ✅ Avatar avec initiales (JD)
- ✅ Badge de statut coloré (🟡 En attente)
- ✅ Toutes les informations personnelles visibles
- ✅ Carte concours en bleu clair
- ✅ Bouton retour (←) fonctionnel

---

## 3️⃣ Page Détail - Pièces Justificatives

### Description
Liste des pièces avec indicateur de complétude et boutons de visualisation

### Éléments Visibles
```
┌─────────────────────────────────────────────────────────────┐
│ 📁 PIÈCES JUSTIFICATIVES                    4/5 pièces     │
│ ████████████████░░░░ 80%                                    │
│                                                             │
│ ┌──────────────────────┬──────────────────────┐            │
│ │ 📄 Acte de naissance │ 🪪 Carte d'identité  │            │
│ │ ✅ Déposée           │ ✅ Déposée           │            │
│ │ [👁 Voir]            │ [👁 Voir]            │            │
│ └──────────────────────┴──────────────────────┘            │
│                                                             │
│ ┌──────────────────────┬──────────────────────┐            │
│ │ 📷 Photo d'identité  │ 📊 Relevé de notes   │            │
│ │ ✅ Déposée           │ ✅ Déposée           │            │
│ │ [👁 Voir]            │ [👁 Voir]            │            │
│ └──────────────────────┴──────────────────────┘            │
│                                                             │
│ ┌──────────────────────────────────────────────┐           │
│ │ 💳 Quittance de paiement                     │           │
│ │ ❌ Non déposée                               │           │
│ └──────────────────────────────────────────────┘           │
│                                                             │
│ ┌──────────────────────────────────────────────┐           │
│ │ 💳 Quittance d'inscription au concours       │           │
│ │ ✅ Déposée                                   │           │
│ │ [👁 Voir]                                    │           │
│ └──────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

### Points de Validation
- ✅ Indicateur "4/5 pièces" visible
- ✅ Barre de progression à 80% (jaune)
- ✅ Pièces déposées en vert avec ✅
- ✅ Pièces non déposées en gris avec ❌
- ✅ Bouton "Voir" uniquement pour pièces déposées
- ✅ Icônes appropriées pour chaque pièce
- ✅ Quittance concours séparée (fond violet)

---

## 4️⃣ Modale de Visualisation de Document (PDF)

### Description
Modale affichant un document PDF

### Éléments Visibles
```
┌─────────────────────────────────────────────────────────────┐
│ Acte de naissance                                       [X] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐│
│ │                                                         ││
│ │                    [DOCUMENT PDF]                       ││
│ │                                                         ││
│ │  ┌────────────────────────────────────────────────┐   ││
│ │  │                                                │   ││
│ │  │  RÉPUBLIQUE DU BÉNIN                           │   ││
│ │  │                                                │   ││
│ │  │  ACTE DE NAISSANCE                             │   ││
│ │  │                                                │   ││
│ │  │  Nom: DUPONT                                   │   ││
│ │  │  Prénom: Jean                                  │   ││
│ │  │  Date: 15/03/2000                              │   ││
│ │  │  ...                                           │   ││
│ │  └────────────────────────────────────────────────┘   ││
│ │                                                         ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ [📥 Télécharger]                               [Fermer]    │
└─────────────────────────────────────────────────────────────┘
```

### Points de Validation
- ✅ Modale centrée sur l'écran
- ✅ Fond semi-transparent (overlay)
- ✅ Titre du document affiché
- ✅ PDF affiché dans iframe
- ✅ Bouton "Télécharger" fonctionnel
- ✅ Bouton "Fermer" fonctionnel
- ✅ Bouton [X] en haut à droite

---

## 5️⃣ Modale de Visualisation de Document (Image)

### Description
Modale affichant une image

### Éléments Visibles
```
┌─────────────────────────────────────────────────────────────┐
│ Photo d'identité                                        [X] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                    ┌─────────────────┐                      │
│                    │                 │                      │
│                    │                 │                      │
│                    │   [PHOTO 4x4]   │                      │
│                    │                 │                      │
│                    │                 │                      │
│                    └─────────────────┘                      │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ [📥 Télécharger]                               [Fermer]    │
└─────────────────────────────────────────────────────────────┘
```

### Points de Validation
- ✅ Image centrée et redimensionnée
- ✅ Image nette et lisible
- ✅ Boutons fonctionnels

---

## 6️⃣ Section Actions (Dossier En Attente)

### Description
Boutons d'action pour un dossier en attente

### Éléments Visibles
```
┌─────────────────────────────────────────────────────────────┐
│ ⚡ ACTIONS                                                  │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐│
│ │              [✅ Valider le dossier]                     ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ ┌──────────────────────┬──────────────────────┐            │
│ │ [⚠ Sous réserve]     │ [❌ Rejeter]         │            │
│ └──────────────────────┴──────────────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

### Points de Validation
- ✅ Bouton "Valider" en vert, pleine largeur
- ✅ Boutons "Sous réserve" (orange) et "Rejeter" (rouge) côte à côte
- ✅ Icônes appropriées pour chaque action
- ✅ Textes clairs et lisibles

---

## 7️⃣ Modale de Rejet

### Description
Modale pour saisir le motif du rejet

### Éléments Visibles
```
┌─────────────────────────────────────────────────────────────┐
│ Rejeter le dossier                                      [X] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Motif du rejet *                                            │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ Expliquez pourquoi le dossier est rejeté...            ││
│ │                                                         ││
│ │                                                         ││
│ │                                                         ││
│ │                                                         ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ ℹ️ Ce message sera envoyé au candidat par email.           │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                          [Annuler] [Confirmer le rejet]    │
└─────────────────────────────────────────────────────────────┘
```

### Points de Validation
- ✅ Titre clair "Rejeter le dossier"
- ✅ Champ obligatoire marqué avec *
- ✅ Textarea avec placeholder
- ✅ Message d'information en bas
- ✅ Bouton "Annuler" (gris)
- ✅ Bouton "Confirmer le rejet" (rouge)

---

## 8️⃣ Modale Sous Réserve

### Description
Modale pour saisir les conditions à remplir

### Éléments Visibles
```
┌─────────────────────────────────────────────────────────────┐
│ Accepter sous réserve                                   [X] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Conditions à remplir *                                      │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ Indiquez les conditions que le candidat doit remplir...││
│ │                                                         ││
│ │                                                         ││
│ │                                                         ││
│ │                                                         ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ ℹ️ Ce message sera envoyé au candidat par email avec les   │
│    conditions à remplir.                                    │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                  [Annuler] [Confirmer]     │
└─────────────────────────────────────────────────────────────┘
```

### Points de Validation
- ✅ Titre clair "Accepter sous réserve"
- ✅ Champ obligatoire marqué avec *
- ✅ Textarea avec placeholder
- ✅ Message d'information en bas
- ✅ Bouton "Annuler" (gris)
- ✅ Bouton "Confirmer" (orange)

---

## 9️⃣ Section Commentaires (Après Rejet)

### Description
Affichage du motif de rejet

### Éléments Visibles
```
┌─────────────────────────────────────────────────────────────┐
│ 💬 COMMENTAIRES                                             │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ Motif du rejet                                          ││
│ │                                                          ││
│ │ Dossier incomplet. Pièces manquantes :                  ││
│ │ - Acte de naissance                                      ││
│ │ - Carte d'identité                                       ││
│ │ Documents fournis non conformes.                         ││
│ └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### Points de Validation
- ✅ Carte avec fond rouge clair
- ✅ Bordure rouge
- ✅ Titre "Motif du rejet" en rouge
- ✅ Texte du commentaire lisible

---

## 🔟 Section Commentaires (Après Sous Réserve)

### Description
Affichage des conditions à remplir

### Éléments Visibles
```
┌─────────────────────────────────────────────────────────────┐
│ 💬 COMMENTAIRES                                             │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ Conditions à remplir                                     ││
│ │                                                          ││
│ │ Veuillez fournir une photo d'identité conforme          ││
│ │ (fond blanc, format 4x4, récente)                        ││
│ └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### Points de Validation
- ✅ Carte avec fond orange clair
- ✅ Bordure orange
- ✅ Titre "Conditions à remplir" en orange
- ✅ Texte du commentaire lisible

---

## 1️⃣1️⃣ Historique des Actions

### Description
Liste des actions effectuées sur le dossier

### Éléments Visibles
```
┌─────────────────────────────────────────────────────────────┐
│ 📜 HISTORIQUE DES ACTIONS                              [▼] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ 🔵 DOSSIER_CREE                                         ││
│ │ 15/05/2025 à 10:30                                      ││
│ │ Par: Jean DUPONT (Candidat)                             ││
│ │ Création du dossier                                     ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ 🟢 PIECE_AJOUTEE                                        ││
│ │ 15/05/2025 à 10:35                                      ││
│ │ Par: Jean DUPONT (Candidat)                             ││
│ │ Ajout de la pièce: Acte de naissance                    ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ 🟢 DOSSIER_VALIDE                                       ││
│ │ 20/05/2025 à 14:20                                      ││
│ │ Par: Marie KOUASSI (Commission)                         ││
│ │ Validation du dossier                                   ││
│ └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### Points de Validation
- ✅ Section pliable/dépliable
- ✅ Actions triées par date (plus récente en premier)
- ✅ Chaque action affiche : icône, type, date, auteur, détails
- ✅ Couleurs différentes selon le type d'action

---

## 1️⃣2️⃣ Message de Succès

### Description
Toast de confirmation après une action

### Éléments Visibles
```
┌─────────────────────────────────────────────────────────────┐
│ ✅ Dossier validé avec succès                          [X] │
└─────────────────────────────────────────────────────────────┘
```

### Points de Validation
- ✅ Fond vert clair
- ✅ Bordure verte
- ✅ Icône ✅
- ✅ Message clair
- ✅ Bouton [X] pour fermer
- ✅ Disparaît automatiquement après 4 secondes

---

## 1️⃣3️⃣ Message d'Erreur

### Description
Toast d'erreur

### Éléments Visibles
```
┌─────────────────────────────────────────────────────────────┐
│ ❌ Le commentaire de rejet est obligatoire             [X] │
└─────────────────────────────────────────────────────────────┘
```

### Points de Validation
- ✅ Fond rouge clair
- ✅ Bordure rouge
- ✅ Icône ❌
- ✅ Message clair
- ✅ Bouton [X] pour fermer

---

## 1️⃣4️⃣ Vue Mobile (< 768px)

### Description
Adaptation responsive sur mobile

### Éléments Visibles
```
┌───────────────────┐
│ [←] UniPath  [👤] │
├───────────────────┤
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
│                   │
│ ┌───────────────┐ │
│ │ JD            │ │
│ │ Jean DUPONT   │ │
│ │ 🟡 En attente │ │
│ └───────────────┘ │
│                   │
│ ┌───────────────┐ │
│ │ Date naiss    │ │
│ │ 15/03/2000    │ │
│ └───────────────┘ │
│                   │
│ ┌───────────────┐ │
│ │ 📄 Acte       │ │
│ │ ✅ Déposée    │ │
│ │ [👁 Voir]     │ │
│ └───────────────┘ │
│                   │
│ ┌───────────────┐ │
│ │ [✅ Valider]  │ │
│ └───────────────┘ │
│ ┌───────────────┐ │
│ │ [⚠ Sous rés.] │ │
│ └───────────────┘ │
│ ┌───────────────┐ │
│ │ [❌ Rejeter]  │ │
│ └───────────────┘ │
└───────────────────┘
```

### Points de Validation
- ✅ Grille 1 colonne pour les pièces
- ✅ Boutons empilés verticalement
- ✅ Textes lisibles
- ✅ Header compact
- ✅ Pas de défilement horizontal

---

## ✅ Checklist de Validation Visuelle

### En-tête
- [ ] Bouton retour visible
- [ ] Logo UniPath visible
- [ ] Avatar utilisateur visible
- [ ] Responsive sur mobile

### Profil Candidat
- [ ] Barre colorée selon statut
- [ ] Avatar avec initiales
- [ ] Badge de statut coloré
- [ ] Informations complètes
- [ ] Carte concours en bleu

### Pièces Justificatives
- [ ] Indicateur de complétude
- [ ] Barre de progression colorée
- [ ] Pièces déposées en vert
- [ ] Pièces non déposées en gris
- [ ] Boutons "Voir" fonctionnels
- [ ] Icônes appropriées

### Actions
- [ ] Bouton "Valider" en vert
- [ ] Bouton "Sous réserve" en orange
- [ ] Bouton "Rejeter" en rouge
- [ ] Icônes appropriées

### Modales
- [ ] Overlay semi-transparent
- [ ] Modale centrée
- [ ] Boutons fonctionnels
- [ ] Champs obligatoires marqués

### Messages
- [ ] Toast de succès en vert
- [ ] Toast d'erreur en rouge
- [ ] Fermeture automatique
- [ ] Bouton [X] fonctionnel

### Responsive
- [ ] Desktop (> 1024px) OK
- [ ] Tablette (768-1024px) OK
- [ ] Mobile (< 768px) OK

---

## 📝 Notes

- Toutes les captures doivent être prises avec des données de test réalistes
- Les couleurs doivent correspondre à la palette définie
- Les textes doivent être en français
- Les icônes doivent être cohérentes
- Le design doit être cohérent avec le reste de l'application
