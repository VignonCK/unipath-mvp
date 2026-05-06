# 🎨 Flux Visuel - Espace Commission

## 📍 Navigation Complète

```
┌─────────────────────────────────────────────────────────────────┐
│                         LOGIN PAGE                               │
│                    /login (Commission)                           │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DASHBOARD COMMISSION                          │
│                        /commission                               │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  📊 STATISTIQUES GLOBALES                                │  │
│  │  ┌──────┬──────┬──────┬──────┬──────┐                   │  │
│  │  │Total │ En   │Validé│Sous  │Rejeté│                   │  │
│  │  │  50  │attente│  20  │réserve│  5  │                   │  │
│  │  │      │  25   │      │  0   │      │                   │  │
│  │  └──────┴──────┴──────┴──────┴──────┘                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  🔍 FILTRES & RECHERCHE                                  │  │
│  │  [En attente] [Validé] [Sous réserve] [Rejeté]          │  │
│  │  [Rechercher par nom, matricule...]                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  📋 LISTE DES DOSSIERS                                   │  │
│  │                                                           │  │
│  │  ┌────────────────────────────────────────────────────┐ │  │
│  │  │ 👤 Jean DUPONT                    🟡 En attente    │ │  │
│  │  │ 📧 MAT-2025-001                                     │ │  │
│  │  │ 🎓 Concours EPAC 2025                               │ │  │
│  │  │ 📄 Pièces: 4/5 (80%)                                │ │  │
│  │  │                                                      │ │  │
│  │  │ [📋 Voir le profil complet] ◄─────────────────────┐│ │  │
│  │  │ [✅ Valider] [⚠ Sous réserve] [❌ Rejeter]        ││ │  │
│  │  └────────────────────────────────────────────────────┘│ │  │
│  │                                                           │  │
│  │  ┌────────────────────────────────────────────────────┐ │  │
│  │  │ 👤 Marie KOUASSI                  🟢 Validé        │ │  │
│  │  │ 📧 MAT-2025-002                                     │ │  │
│  │  │ 🎓 Concours FLASH 2025                              │ │  │
│  │  │ 📄 Pièces: 5/5 (100%)                               │ │  │
│  │  │                                                      │ │  │
│  │  │ [📋 Voir le profil complet] ◄─────────────────────┐│ │  │
│  │  └────────────────────────────────────────────────────┘│ │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Clic sur "Voir le profil complet"
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              PAGE DÉTAIL CANDIDAT COMMISSION                     │
│            /commission/candidat/:inscriptionId                   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  [← Retour]  UniPath - Détail du dossier                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  👤 PROFIL CANDIDAT                                      │  │
│  │  ┌────────────────────────────────────────────────────┐ │  │
│  │  │  JD  Jean DUPONT                  🟡 En attente    │ │  │
│  │  │      MAT-2025-001                                   │ │  │
│  │  │      jean.dupont@email.com                          │ │  │
│  │  │      +229 XX XX XX XX                               │ │  │
│  │  └────────────────────────────────────────────────────┘ │  │
│  │                                                           │  │
│  │  ┌──────────┬──────────┬──────────┬──────────┐         │  │
│  │  │Date naiss│Lieu naiss│   Sexe   │Nationalité│         │  │
│  │  │15/03/2000│  Cotonou │ Masculin │ Béninoise │         │  │
│  │  └──────────┴──────────┴──────────┴──────────┘         │  │
│  │                                                           │  │
│  │  ┌────────────────────────────────────────────────────┐ │  │
│  │  │ 🎓 CONCOURS                                         │ │  │
│  │  │ Concours EPAC 2025                                  │ │  │
│  │  │ École Polytechnique d'Abomey-Calavi                 │ │  │
│  │  │ 📅 Du 01/06/2025 au 30/06/2025                      │ │  │
│  │  └────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  📁 PIÈCES JUSTIFICATIVES                    4/5 pièces │  │
│  │  ████████████████░░░░ 80%                                │  │
│  │                                                           │  │
│  │  ┌──────────────────────┬──────────────────────┐        │  │
│  │  │ 📄 Acte de naissance │ 🪪 Carte d'identité  │        │  │
│  │  │ ✅ Déposée           │ ✅ Déposée           │        │  │
│  │  │ [👁 Voir]            │ [👁 Voir]            │        │  │
│  │  └──────────────────────┴──────────────────────┘        │  │
│  │                                                           │  │
│  │  ┌──────────────────────┬──────────────────────┐        │  │
│  │  │ 📷 Photo d'identité  │ 📊 Relevé de notes   │        │  │
│  │  │ ✅ Déposée           │ ✅ Déposée           │        │  │
│  │  │ [👁 Voir]            │ [👁 Voir]            │        │  │
│  │  └──────────────────────┴──────────────────────┘        │  │
│  │                                                           │  │
│  │  ┌──────────────────────────────────────────────┐       │  │
│  │  │ 💳 Quittance de paiement                     │       │  │
│  │  │ ❌ Non déposée                               │       │  │
│  │  └──────────────────────────────────────────────┘       │  │
│  │                                                           │  │
│  │  ┌──────────────────────────────────────────────┐       │  │
│  │  │ 💳 Quittance d'inscription au concours       │       │  │
│  │  │ ✅ Déposée                                   │       │  │
│  │  │ [👁 Voir]                                    │       │  │
│  │  └──────────────────────────────────────────────┘       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  ⚡ ACTIONS                                               │  │
│  │                                                           │  │
│  │  ┌────────────────────────────────────────────────────┐ │  │
│  │  │         [✅ Valider le dossier]                     │ │  │
│  │  └────────────────────────────────────────────────────┘ │  │
│  │                                                           │  │
│  │  ┌──────────────────────┬──────────────────────┐        │  │
│  │  │ [⚠ Sous réserve]     │ [❌ Rejeter]         │        │  │
│  │  └──────────────────────┴──────────────────────┘        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  📜 HISTORIQUE DES ACTIONS                               │  │
│  │  [Cliquer pour déplier/replier]                          │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎬 Scénarios d'Utilisation

### Scénario 1 : Validation d'un Dossier Complet

```
1. Commission se connecte
   ↓
2. Voit le dashboard avec les dossiers en attente
   ↓
3. Clique sur "Voir le profil complet" pour Jean DUPONT
   ↓
4. Examine les informations personnelles ✓
   ↓
5. Vérifie les pièces justificatives (5/5) ✓
   ↓
6. Clique sur "Voir" pour chaque pièce ✓
   ↓
7. Tout est conforme → Clique sur "Valider le dossier"
   ↓
8. Statut passe à VALIDÉ 🟢
   ↓
9. Email de convocation envoyé automatiquement 📧
   ↓
10. Retour au dashboard
```

### Scénario 2 : Acceptation Sous Réserve

```
1. Commission examine le dossier de Marie KOUASSI
   ↓
2. Constate que la photo n'est pas conforme
   ↓
3. Clique sur "Sous réserve"
   ↓
4. Modale s'ouvre
   ↓
5. Saisit : "Veuillez fournir une photo d'identité conforme
              (fond blanc, format 4x4, récente)"
   ↓
6. Clique sur "Confirmer"
   ↓
7. Statut passe à SOUS_RESERVE 🟠
   ↓
8. Email envoyé au candidat avec les conditions 📧
   ↓
9. Candidat peut corriger et resoummettre
```

### Scénario 3 : Rejet d'un Dossier

```
1. Commission examine le dossier de Paul MARTIN
   ↓
2. Constate que plusieurs pièces sont manquantes (2/5)
   ↓
3. Clique sur "Rejeter"
   ↓
4. Modale s'ouvre
   ↓
5. Saisit : "Dossier incomplet. Pièces manquantes :
              - Acte de naissance
              - Carte d'identité
              - Relevé de notes"
   ↓
6. Clique sur "Confirmer le rejet"
   ↓
7. Statut passe à REJETÉ 🔴
   ↓
8. Email envoyé au candidat avec le motif 📧
```

---

## 🖼️ Visualisation des Modales

### Modale de Visualisation de Document

```
┌─────────────────────────────────────────────────────────┐
│  Acte de naissance                                  [X] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │                                                   │ │
│  │                                                   │ │
│  │              [DOCUMENT PDF/IMAGE]                │ │
│  │                                                   │ │
│  │                                                   │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  [📥 Télécharger]                          [Fermer]    │
└─────────────────────────────────────────────────────────┘
```

### Modale de Rejet

```
┌─────────────────────────────────────────────────────────┐
│  Rejeter le dossier                                 [X] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Motif du rejet *                                       │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Expliquez pourquoi le dossier est rejeté...      │ │
│  │                                                   │ │
│  │                                                   │ │
│  │                                                   │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  ℹ️ Ce message sera envoyé au candidat par email.      │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                          [Annuler] [Confirmer le rejet] │
└─────────────────────────────────────────────────────────┘
```

### Modale Sous Réserve

```
┌─────────────────────────────────────────────────────────┐
│  Accepter sous réserve                              [X] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Conditions à remplir *                                 │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Indiquez les conditions que le candidat doit     │ │
│  │ remplir...                                        │ │
│  │                                                   │ │
│  │                                                   │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  ℹ️ Ce message sera envoyé au candidat par email avec  │
│     les conditions à remplir.                           │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                  [Annuler] [Confirmer]  │
└─────────────────────────────────────────────────────────┘
```

---

## 🎨 Palette de Couleurs

### Statuts
- 🟡 **#FCD34D** (Jaune) - En attente
- 🟢 **#10B981** (Vert) - Validé
- 🟠 **#F97316** (Orange) - Sous réserve
- 🔴 **#EF4444** (Rouge) - Rejeté

### Boutons
- 🔵 **#1E3A8A** (Bleu foncé) - Bouton principal
- 🟢 **#059669** (Vert) - Validation
- 🟠 **#EA580C** (Orange) - Sous réserve
- 🔴 **#DC2626** (Rouge) - Rejet

### Arrière-plans
- ⚪ **#F9FAFB** (Gris clair) - Fond de page
- ⚪ **#FFFFFF** (Blanc) - Cartes
- 🟦 **#DBEAFE** (Bleu clair) - Informations concours

---

## 📱 Responsive Design

### Desktop (> 768px)
```
┌─────────────────────────────────────────────────────────┐
│  Header                                                 │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │   Stat 1    │  │   Stat 2    │  │   Stat 3    │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Pièce 1          │  Pièce 2          │  Pièce 3│   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Mobile (< 768px)
```
┌───────────────────┐
│  Header           │
├───────────────────┤
│  ┌─────────────┐  │
│  │   Stat 1    │  │
│  └─────────────┘  │
│  ┌─────────────┐  │
│  │   Stat 2    │  │
│  └─────────────┘  │
│                   │
│  ┌─────────────┐  │
│  │   Pièce 1   │  │
│  └─────────────┘  │
│  ┌─────────────┐  │
│  │   Pièce 2   │  │
│  └─────────────┘  │
└───────────────────┘
```

---

## 🔔 Notifications Email

### Email de Validation
```
┌─────────────────────────────────────────────────────────┐
│  De: noreply@unipath.bj                                 │
│  À: jean.dupont@email.com                               │
│  Objet: ✅ Votre dossier a été validé                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Bonjour Jean DUPONT,                                   │
│                                                         │
│  Nous avons le plaisir de vous informer que votre       │
│  dossier pour le concours EPAC 2025 a été validé.      │
│                                                         │
│  📎 Votre convocation est jointe à cet email.           │
│                                                         │
│  Date de l'examen : 15/06/2025                          │
│  Lieu : EPAC - Université d'Abomey-Calavi              │
│                                                         │
│  ⚠️ Présentez-vous avec cette convocation et une        │
│     pièce d'identité valide.                            │
│                                                         │
│  Cordialement,                                          │
│  L'équipe UniPath                                       │
└─────────────────────────────────────────────────────────┘
```

### Email de Rejet
```
┌─────────────────────────────────────────────────────────┐
│  De: noreply@unipath.bj                                 │
│  À: paul.martin@email.com                               │
│  Objet: ❌ Votre dossier a été rejeté                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Bonjour Paul MARTIN,                                   │
│                                                         │
│  Nous regrettons de vous informer que votre dossier     │
│  pour le concours EPAC 2025 a été rejeté.              │
│                                                         │
│  Motif :                                                │
│  Dossier incomplet. Pièces manquantes :                │
│  - Acte de naissance                                    │
│  - Carte d'identité                                     │
│  - Relevé de notes                                      │
│                                                         │
│  Vous pouvez soumettre un nouveau dossier complet       │
│  avant la date limite d'inscription.                    │
│                                                         │
│  Cordialement,                                          │
│  L'équipe UniPath                                       │
└─────────────────────────────────────────────────────────┘
```

### Email Sous Réserve
```
┌─────────────────────────────────────────────────────────┐
│  De: noreply@unipath.bj                                 │
│  À: marie.kouassi@email.com                             │
│  Objet: ⚠️ Votre dossier est accepté sous réserve       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Bonjour Marie KOUASSI,                                 │
│                                                         │
│  Votre dossier pour le concours FLASH 2025 a été       │
│  accepté sous réserve.                                  │
│                                                         │
│  Conditions à remplir :                                 │
│  Veuillez fournir une photo d'identité conforme        │
│  (fond blanc, format 4x4, récente)                      │
│                                                         │
│  Merci de compléter votre dossier avant le 30/05/2025. │
│                                                         │
│  Cordialement,                                          │
│  L'équipe UniPath                                       │
└─────────────────────────────────────────────────────────┘
```
