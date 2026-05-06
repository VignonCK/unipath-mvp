# 🏆 Système de Notes et Classement - Documentation Complète

## 📋 Vue d'Ensemble

Implémentation d'un système complet de gestion des notes et classements pour les concours universitaires.

**Date** : 6 mai 2026  
**Statut** : ✅ Implémenté

---

## ✅ Fonctionnalités Implémentées

### 1. **Base de Données**
- ✅ Ajout du champ `note Float?` au modèle `Inscription`
- ✅ Ajout du champ `etablissement String?` au modèle `Concours`
- ✅ Ajout du champ `dateComposition DateTime?` au modèle `Concours`

### 2. **Backend - API**
- ✅ Route `GET /api/concours/:id/classement` - Classement d'un concours
- ✅ Route `GET /api/commission/concours` - Liste des concours avec candidats validés
- ✅ Route `PATCH /api/commission/notes/:inscriptionId` - Mise à jour d'une note

### 3. **Frontend - Pages**
- ✅ **ClassementConcours.jsx** - Affichage du classement public
- ✅ **GestionNotes.jsx** - Interface commission pour saisir les notes
- ✅ **GestionConcours.jsx** - Ajout des champs établissement et date composition

### 4. **Navigation**
- ✅ Bouton "Voir le classement" dans DetailConcours (candidats)
- ✅ Bouton "Gérer les notes" dans DashboardCommission
- ✅ Routes ajoutées dans App.jsx

---

## 🗄️ Modifications Base de Données

### Modèle `Inscription`
```prisma
model Inscription {
  id String @id @default(uuid())
  candidatId String
  concoursId String
  statut StatutDossier @default(EN_ATTENTE)
  quittanceUrl String?
  commentaireRejet String?
  note Float? // ✨ NOUVEAU - Note obtenue (null = absent)
  createdAt DateTime @default(now())
  candidat Candidat @relation(fields: [candidatId], references: [id])
  concours Concours @relation(fields: [concoursId], references: [id])
  @@unique([candidatId, concoursId])
}
```

### Modèle `Concours`
```prisma
model Concours {
  id String @id @default(uuid())
  libelle String
  etablissement String? // ✨ NOUVEAU - Établissement organisateur
  dateDebut DateTime
  dateFin DateTime
  dateComposition DateTime? // ✨ NOUVEAU - Date de composition
  description String?
  fraisParticipation Int?
  createdAt DateTime @default(now())
  inscriptions Inscription[]
}
```

### Migration
```bash
cd unipath-api
npx prisma db push
```

---

## 🔌 API Backend

### 1. Classement d'un Concours
**Route** : `GET /api/concours/:id/classement`  
**Accès** : Public (tous les utilisateurs connectés)

**Réponse** :
```json
{
  "concours": {
    "id": "uuid",
    "libelle": "Concours ENS 2026",
    "etablissement": "EPAC - Université d'Abomey-Calavi",
    "dateComposition": "2026-06-15T00:00:00.000Z"
  },
  "totalCandidats": 150,
  "candidatsPresents": 142,
  "candidatsAbsents": 8,
  "classement": [
    {
      "rang": 1,
      "candidat": {
        "id": "uuid",
        "matricule": "2026001",
        "nom": "DUPONT",
        "prenom": "Jean",
        "email": "jean.dupont@example.com"
      },
      "note": 18.5,
      "statut": "Présent"
    },
    {
      "rang": null,
      "candidat": { ... },
      "note": null,
      "statut": "Absent"
    }
  ]
}
```

**Logique** :
- Seuls les candidats avec statut `VALIDE` sont inclus
- Tri par note décroissante (meilleurs en premier)
- Note `null` = candidat absent
- Rang attribué uniquement aux candidats présents

---

### 2. Liste des Concours avec Candidats (Commission)
**Route** : `GET /api/commission/concours`  
**Accès** : Commission uniquement  
**Headers** : `Authorization: Bearer <token>`

**Réponse** :
```json
[
  {
    "id": "uuid",
    "libelle": "Concours ENS 2026",
    "etablissement": "EPAC",
    "dateComposition": "2026-06-15T00:00:00.000Z",
    "totalValides": 150,
    "candidatsAvecNote": 142,
    "candidatsSansNote": 8,
    "inscriptions": [
      {
        "id": "inscription-uuid",
        "candidat": {
          "id": "uuid",
          "matricule": "2026001",
          "nom": "DUPONT",
          "prenom": "Jean",
          "email": "jean.dupont@example.com",
          "telephone": "+229..."
        },
        "note": 18.5,
        "statut": "Noté"
      }
    ]
  }
]
```

---

### 3. Mise à Jour d'une Note
**Route** : `PATCH /api/commission/notes/:inscriptionId`  
**Accès** : Commission uniquement  
**Headers** : `Authorization: Bearer <token>`

**Body** :
```json
{
  "note": 15.5  // ou null pour marquer absent
}
```

**Validation** :
- Note entre 0 et 20
- Peut être `null` (candidat absent)
- Décimales autorisées (ex: 15.25, 18.75)

**Réponse** :
```json
{
  "message": "Note mise à jour avec succès",
  "inscription": {
    "id": "uuid",
    "note": 15.5,
    "candidat": { ... },
    "concours": { ... }
  }
}
```

---

## 🎨 Frontend - Pages

### 1. ClassementConcours.jsx
**Route** : `/concours/:id/classement`  
**Accès** : Candidats inscrits

**Fonctionnalités** :
- ✅ Affichage du podium (Top 3)
- ✅ Classement complet du 1er au dernier
- ✅ Statistiques : Total, Présents, Absents
- ✅ Médailles colorées (🥇 Or, 🥈 Argent, 🥉 Bronze)
- ✅ Indication "Absent" pour les candidats sans note
- ✅ Design responsive

**Composants** :
- Header avec nom du concours et établissement
- Cartes statistiques (3 colonnes)
- Section podium (Top 3 en grand)
- Tableau classement complet

---

### 2. GestionNotes.jsx
**Route** : `/commission/notes`  
**Accès** : Commission uniquement

**Fonctionnalités** :
- ✅ Liste de tous les concours avec candidats validés
- ✅ Saisie inline des notes (clic sur crayon)
- ✅ Validation 0-20
- ✅ Possibilité de laisser vide (absent)
- ✅ Compteurs : Notés / Non notés
- ✅ Édition rapide avec boutons ✓ et ✗

**Workflow** :
1. Commission voit tous les concours
2. Pour chaque concours : liste des candidats validés
3. Clic sur crayon → Input apparaît
4. Saisie de la note (ou laisser vide)
5. Clic sur ✓ → Note enregistrée
6. Clic sur ✗ → Annulation

---

### 3. GestionConcours.jsx (Mise à Jour)
**Route** : `/gestion-concours`  
**Accès** : DGES uniquement

**Nouveaux Champs** :
- ✅ **Établissement organisateur** (optionnel)
- ✅ **Date de composition** (optionnel)

**Formulaire Complet** :
- Libellé * (obligatoire)
- Établissement (optionnel)
- Date début * (obligatoire)
- Date fin * (obligatoire)
- Date de composition (optionnel)
- Frais de participation (optionnel)
- Description (optionnel)

---

## 🔄 Flux Utilisateur

### Flux Candidat

1. **Inscription au concours**
   - Candidat s'inscrit via `/concours/:id`
   - Dossier soumis à la commission

2. **Validation du dossier**
   - Commission valide le dossier
   - Candidat reçoit email de convocation

3. **Composition du concours**
   - Candidat compose à la date prévue
   - Commission saisit les notes

4. **Consultation du classement**
   - Candidat clique "Voir le classement"
   - Affichage du rang et de la note
   - Podium visible pour tous

---

### Flux Commission

1. **Validation des dossiers**
   - Commission valide/rejette les dossiers
   - Seuls les dossiers validés peuvent avoir une note

2. **Saisie des notes**
   - Clic sur "Gérer les notes"
   - Liste de tous les concours
   - Saisie des notes par candidat
   - Note vide = absent

3. **Suivi**
   - Compteurs : Notés / Non notés
   - Progression visible par concours

---

### Flux DGES

1. **Création de concours**
   - Remplir tous les champs (libellé, établissement, dates, etc.)
   - Date de composition importante pour la commission

2. **Suivi des statistiques**
   - Dashboard avec vue d'ensemble
   - Classements disponibles pour tous les concours

---

## 📊 Règles de Gestion

### Notes
- **Plage** : 0 à 20
- **Décimales** : Autorisées (0.25, 0.5, 0.75)
- **Null** : Candidat absent (n'a pas composé)
- **Modification** : Possible à tout moment par la commission

### Classement
- **Tri** : Par note décroissante
- **Rang** : Attribué uniquement aux présents
- **Absents** : Affichés en fin de liste sans rang
- **Égalité** : Même rang si même note (ex aequo)

### Visibilité
- **Classement** : Public (tous les candidats inscrits)
- **Notes** : Visibles par tous après saisie
- **Gestion** : Commission uniquement

---

## 🎨 Design

### Couleurs
- **Or (1er)** : `text-yellow-500`
- **Argent (2e)** : `text-gray-400`
- **Bronze (3e)** : `text-orange-600`
- **Présent** : Badge vert `bg-green-100 text-green-700`
- **Absent** : Badge rouge `bg-red-100 text-red-700`

### Composants
- **Podium** : Fond dégradé orange-bleu
- **Tableau** : Hover gris clair
- **Statistiques** : Cartes blanches avec ombre
- **Notes** : Input inline avec focus orange

---

## 🧪 Tests Recommandés

### Test 1 : Création de Concours avec Nouveaux Champs
```bash
# Se connecter en DGES
# Aller sur /gestion-concours
# Créer un concours avec :
- Libellé : "Concours Test 2026"
- Établissement : "EPAC"
- Date composition : 15/06/2026
# Vérifier que tout est enregistré
```

### Test 2 : Saisie de Notes (Commission)
```bash
# Se connecter en COMMISSION
# Cliquer "Gérer les notes"
# Saisir une note : 15.5
# Laisser un candidat sans note (absent)
# Vérifier les compteurs
```

### Test 3 : Affichage du Classement (Candidat)
```bash
# Se connecter en CANDIDAT
# Aller sur un concours inscrit
# Cliquer "Voir le classement"
# Vérifier :
  - Podium (Top 3)
  - Classement complet
  - Statistiques
  - Absents en fin de liste
```

### Test 4 : Modification de Note
```bash
# Commission modifie une note existante
# Passer de 15.5 à 18.0
# Vérifier que le classement se met à jour
```

### Test 5 : Candidat Absent
```bash
# Commission laisse la note vide
# Vérifier que le candidat apparaît comme "Absent"
# Vérifier qu'il n'a pas de rang
```

---

## 📁 Fichiers Créés/Modifiés

### Créés
- `unipath-front/src/pages/ClassementConcours.jsx`
- `unipath-front/src/pages/GestionNotes.jsx`
- `SYSTEME_NOTES_CLASSEMENT.md`

### Modifiés Backend
- `unipath-api/prisma/schema.prisma`
- `unipath-api/src/controllers/concours.controller.js`
- `unipath-api/src/controllers/commission.controller.js`
- `unipath-api/src/routes/concours.routes.js`
- `unipath-api/src/routes/commission.routes.js`

### Modifiés Frontend
- `unipath-front/src/services/api.js`
- `unipath-front/src/App.jsx`
- `unipath-front/src/pages/GestionConcours.jsx`
- `unipath-front/src/pages/DashboardCommission.jsx`
- `unipath-front/src/pages/DetailConcours.jsx`

---

## 🚀 Déploiement

### Étapes
1. **Migration base de données**
   ```bash
   cd unipath-api
   npx prisma db push
   ```

2. **Redémarrer le backend**
   ```bash
   npm run dev
   ```

3. **Redémarrer le frontend**
   ```bash
   cd unipath-front
   npm run dev
   ```

4. **Tests**
   - Créer un concours avec les nouveaux champs
   - Valider des candidats
   - Saisir des notes
   - Consulter le classement

---

## 📝 Notes Importantes

### Note Null vs Note 0
- **Null** : Candidat absent (n'a pas composé)
- **0** : Candidat présent mais note de 0

### Modification des Notes
- Les notes peuvent être modifiées à tout moment
- Le classement se met à jour automatiquement
- Pas d'historique des modifications (pour l'instant)

### Performance
- Classement calculé à la volée (pas de cache)
- Optimisé avec tri SQL (`orderBy: { note: 'desc' }`)
- Pagination possible si > 1000 candidats

---

## 🎯 Prochaines Étapes Possibles

### Court terme
- [ ] Export du classement en PDF
- [ ] Notification email aux candidats après saisie des notes
- [ ] Statistiques : Moyenne, Médiane, Écart-type

### Moyen terme
- [ ] Historique des modifications de notes
- [ ] Validation à deux niveaux (saisie + vérification)
- [ ] Import de notes en masse (CSV/Excel)

### Long terme
- [ ] Système de réclamations
- [ ] Délibération en ligne
- [ ] Publication officielle des résultats

---

**Fin de la documentation** 🎉

**Statut** : ✅ Système complet et fonctionnel  
**Prêt pour** : Tests et déploiement
