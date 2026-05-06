# 🧪 Tests - Page Détail Candidat Commission

## 📋 Plan de Tests

### Tests Fonctionnels

#### ✅ Test 1 : Navigation vers la page de détail
**Objectif** : Vérifier que la navigation fonctionne correctement

**Étapes** :
1. Se connecter en tant que membre de la commission
2. Accéder au dashboard commission (`/commission`)
3. Cliquer sur "Voir le profil complet" d'un dossier
4. Vérifier la redirection vers `/commission/candidat/:inscriptionId`

**Résultat attendu** :
- ✅ Redirection réussie
- ✅ URL contient l'ID de l'inscription
- ✅ Page de détail s'affiche correctement

---

#### ✅ Test 2 : Affichage des informations du candidat
**Objectif** : Vérifier que toutes les informations sont affichées

**Étapes** :
1. Accéder à la page de détail d'un candidat
2. Vérifier l'affichage des informations

**Résultat attendu** :
- ✅ Nom et prénom affichés
- ✅ Matricule affiché
- ✅ Email et téléphone affichés
- ✅ Date et lieu de naissance affichés (si disponibles)
- ✅ Sexe et nationalité affichés (si disponibles)
- ✅ Statut du dossier affiché avec la bonne couleur

---

#### ✅ Test 3 : Affichage des pièces justificatives
**Objectif** : Vérifier l'affichage des pièces

**Étapes** :
1. Accéder à la page de détail
2. Vérifier la section "Pièces justificatives"

**Résultat attendu** :
- ✅ Toutes les pièces sont listées (5 pièces du dossier + quittance concours)
- ✅ Indicateur de complétude correct (X/5)
- ✅ Barre de progression affichée avec la bonne couleur
- ✅ Pièces déposées marquées en vert
- ✅ Pièces non déposées marquées en gris
- ✅ Bouton "Voir" visible uniquement pour les pièces déposées

---

#### ✅ Test 4 : Visualisation d'un document
**Objectif** : Vérifier que les documents s'ouvrent correctement

**Étapes** :
1. Cliquer sur "Voir" pour une pièce déposée
2. Vérifier l'ouverture de la modale

**Résultat attendu** :
- ✅ Modale s'ouvre
- ✅ Document affiché (PDF ou image)
- ✅ Bouton "Télécharger" fonctionnel
- ✅ Bouton "Fermer" ferme la modale
- ✅ Clic en dehors de la modale la ferme

**Test avec différents types** :
- ✅ PDF : Affichage dans iframe
- ✅ Image (JPG, PNG) : Affichage en grand format
- ✅ Autres formats : Message + bouton télécharger

---

#### ✅ Test 5 : Validation d'un dossier
**Objectif** : Vérifier le processus de validation

**Prérequis** : Dossier en statut "EN_ATTENTE"

**Étapes** :
1. Accéder à la page de détail d'un dossier en attente
2. Cliquer sur "Valider le dossier"
3. Attendre la confirmation

**Résultat attendu** :
- ✅ Message de succès affiché
- ✅ Statut passe à "VALIDÉ"
- ✅ Badge devient vert
- ✅ Boutons d'action disparaissent
- ✅ Email de convocation envoyé au candidat
- ✅ PDF de convocation généré

---

#### ✅ Test 6 : Acceptation sous réserve
**Objectif** : Vérifier le processus d'acceptation sous réserve

**Prérequis** : Dossier en statut "EN_ATTENTE"

**Étapes** :
1. Cliquer sur "Sous réserve"
2. Vérifier l'ouverture de la modale
3. Laisser le champ vide et cliquer sur "Confirmer"
4. Vérifier le message d'erreur
5. Saisir un commentaire
6. Cliquer sur "Confirmer"

**Résultat attendu** :
- ✅ Modale s'ouvre
- ✅ Champ de commentaire obligatoire
- ✅ Message d'erreur si champ vide
- ✅ Validation réussie avec commentaire
- ✅ Statut passe à "SOUS_RESERVE"
- ✅ Badge devient orange
- ✅ Commentaire affiché dans la section "Commentaires"
- ✅ Email envoyé au candidat avec les conditions

---

#### ✅ Test 7 : Rejet d'un dossier
**Objectif** : Vérifier le processus de rejet

**Prérequis** : Dossier en statut "EN_ATTENTE"

**Étapes** :
1. Cliquer sur "Rejeter"
2. Vérifier l'ouverture de la modale
3. Laisser le champ vide et cliquer sur "Confirmer le rejet"
4. Vérifier le message d'erreur
5. Saisir un motif
6. Cliquer sur "Confirmer le rejet"

**Résultat attendu** :
- ✅ Modale s'ouvre
- ✅ Champ de motif obligatoire
- ✅ Message d'erreur si champ vide
- ✅ Rejet réussi avec motif
- ✅ Statut passe à "REJETÉ"
- ✅ Badge devient rouge
- ✅ Motif affiché dans la section "Commentaires"
- ✅ Email envoyé au candidat avec le motif

---

#### ✅ Test 8 : Historique des actions
**Objectif** : Vérifier l'affichage de l'historique

**Étapes** :
1. Accéder à la page de détail
2. Cliquer sur "Historique des actions"
3. Vérifier l'affichage

**Résultat attendu** :
- ✅ Section se déplie
- ✅ Historique affiché
- ✅ Actions triées par date (plus récente en premier)
- ✅ Chaque action affiche : date, type, auteur, détails
- ✅ Clic à nouveau replie la section

---

#### ✅ Test 9 : Retour au dashboard
**Objectif** : Vérifier la navigation de retour

**Étapes** :
1. Depuis la page de détail
2. Cliquer sur la flèche de retour dans le header

**Résultat attendu** :
- ✅ Redirection vers `/commission`
- ✅ Dashboard s'affiche
- ✅ Statistiques mises à jour

---

### Tests de Sécurité

#### 🔒 Test 10 : Accès non autorisé
**Objectif** : Vérifier que seuls les membres de la commission peuvent accéder

**Étapes** :
1. Se déconnecter
2. Tenter d'accéder à `/commission/candidat/:inscriptionId`
3. Se connecter en tant que CANDIDAT
4. Tenter d'accéder à `/commission/candidat/:inscriptionId`

**Résultat attendu** :
- ✅ Redirection vers `/login` si non connecté
- ✅ Redirection vers `/dashboard` si rôle CANDIDAT
- ✅ Accès autorisé uniquement pour rôle COMMISSION

---

#### 🔒 Test 11 : Inscription inexistante
**Objectif** : Vérifier le comportement avec un ID invalide

**Étapes** :
1. Accéder à `/commission/candidat/id-inexistant`

**Résultat attendu** :
- ✅ Message "Inscription non trouvée"
- ✅ Bouton "Retour au tableau de bord"
- ✅ Pas d'erreur JavaScript

---

### Tests d'Interface

#### 🎨 Test 12 : Responsive Design
**Objectif** : Vérifier l'affichage sur différents écrans

**Étapes** :
1. Ouvrir la page sur desktop (> 1024px)
2. Ouvrir la page sur tablette (768px - 1024px)
3. Ouvrir la page sur mobile (< 768px)

**Résultat attendu** :
- ✅ Desktop : Grille 2 colonnes pour les pièces
- ✅ Tablette : Grille 2 colonnes pour les pièces
- ✅ Mobile : Grille 1 colonne pour les pièces
- ✅ Header responsive
- ✅ Boutons adaptés à la taille de l'écran
- ✅ Textes lisibles sur tous les écrans

---

#### 🎨 Test 13 : Codes couleurs
**Objectif** : Vérifier la cohérence des couleurs

**Étapes** :
1. Vérifier les couleurs pour chaque statut

**Résultat attendu** :
- ✅ EN_ATTENTE : Jaune (#FCD34D)
- ✅ VALIDÉ : Vert (#10B981)
- ✅ SOUS_RESERVE : Orange (#F97316)
- ✅ REJETÉ : Rouge (#EF4444)
- ✅ Barre de progression : Vert (100%), Jaune (60-99%), Rouge (<60%)

---

### Tests de Performance

#### ⚡ Test 14 : Temps de chargement
**Objectif** : Vérifier que la page se charge rapidement

**Étapes** :
1. Mesurer le temps de chargement initial
2. Mesurer le temps d'ouverture d'un document

**Résultat attendu** :
- ✅ Page de détail : < 2 secondes
- ✅ Ouverture document : < 3 secondes
- ✅ Pas de freeze de l'interface

---

#### ⚡ Test 15 : Gestion des erreurs
**Objectif** : Vérifier la gestion des erreurs réseau

**Étapes** :
1. Simuler une erreur réseau (désactiver le backend)
2. Tenter de charger la page
3. Tenter de valider un dossier

**Résultat attendu** :
- ✅ Message d'erreur clair
- ✅ Pas de crash de l'application
- ✅ Possibilité de réessayer

---

### Tests d'Intégration

#### 🔗 Test 16 : Intégration avec le backend
**Objectif** : Vérifier la communication avec l'API

**Étapes** :
1. Vérifier les appels API lors du chargement
2. Vérifier les appels API lors des actions

**Résultat attendu** :
- ✅ GET `/api/commission/dossiers` : Récupération des inscriptions
- ✅ PATCH `/api/commission/dossiers/:id` : Mise à jour du statut
- ✅ Gestion correcte des tokens d'authentification
- ✅ Gestion des erreurs API

---

#### 🔗 Test 17 : Envoi des emails
**Objectif** : Vérifier que les emails sont envoyés

**Étapes** :
1. Valider un dossier
2. Vérifier la boîte email du candidat
3. Rejeter un dossier
4. Vérifier la boîte email du candidat
5. Accepter sous réserve
6. Vérifier la boîte email du candidat

**Résultat attendu** :
- ✅ Email de validation reçu avec PDF de convocation
- ✅ Email de rejet reçu avec le motif
- ✅ Email sous réserve reçu avec les conditions
- ✅ Emails bien formatés
- ✅ Informations correctes dans les emails

---

## 📊 Checklist de Tests

### Tests Fonctionnels
- [ ] Navigation vers la page de détail
- [ ] Affichage des informations du candidat
- [ ] Affichage des pièces justificatives
- [ ] Visualisation d'un document
- [ ] Validation d'un dossier
- [ ] Acceptation sous réserve
- [ ] Rejet d'un dossier
- [ ] Historique des actions
- [ ] Retour au dashboard

### Tests de Sécurité
- [ ] Accès non autorisé
- [ ] Inscription inexistante

### Tests d'Interface
- [ ] Responsive Design
- [ ] Codes couleurs

### Tests de Performance
- [ ] Temps de chargement
- [ ] Gestion des erreurs

### Tests d'Intégration
- [ ] Intégration avec le backend
- [ ] Envoi des emails

---

## 🐛 Bugs Connus

### Bugs à Corriger
- [ ] Aucun bug connu pour le moment

### Améliorations Futures
- [ ] Ajouter un bouton pour télécharger toutes les pièces en ZIP
- [ ] Ajouter la possibilité d'annoter les documents
- [ ] Ajouter un historique des modifications de statut
- [ ] Ajouter des filtres sur l'historique
- [ ] Ajouter la possibilité de modifier le statut après validation

---

## 📝 Rapport de Tests

### Date : [À compléter]
### Testeur : [À compléter]

| Test | Statut | Commentaires |
|------|--------|--------------|
| Test 1 | ⏳ | À tester |
| Test 2 | ⏳ | À tester |
| Test 3 | ⏳ | À tester |
| Test 4 | ⏳ | À tester |
| Test 5 | ⏳ | À tester |
| Test 6 | ⏳ | À tester |
| Test 7 | ⏳ | À tester |
| Test 8 | ⏳ | À tester |
| Test 9 | ⏳ | À tester |
| Test 10 | ⏳ | À tester |
| Test 11 | ⏳ | À tester |
| Test 12 | ⏳ | À tester |
| Test 13 | ⏳ | À tester |
| Test 14 | ⏳ | À tester |
| Test 15 | ⏳ | À tester |
| Test 16 | ⏳ | À tester |
| Test 17 | ⏳ | À tester |

**Légende** :
- ✅ Réussi
- ❌ Échoué
- ⏳ À tester
- ⚠️ Partiellement réussi

---

## 🚀 Commandes de Test

### Lancer le frontend
```bash
cd unipath-front
npm run dev
```

### Lancer le backend
```bash
cd unipath-api
npm run dev
```

### Accéder à l'application
```
http://localhost:5173
```

### Compte de test Commission
```
Email: commission@unipath.bj
Mot de passe: [À définir]
```

---

## 📞 Support

En cas de problème lors des tests :
- Vérifier les logs du backend
- Vérifier la console du navigateur
- Vérifier les appels réseau dans l'onglet Network
- Contacter l'équipe de développement
