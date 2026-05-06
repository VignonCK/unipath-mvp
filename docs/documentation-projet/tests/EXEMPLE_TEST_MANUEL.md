# 🧪 Exemple de Test Manuel - Page Détail Commission

## 📋 Préparation

### 1. Démarrer le Backend
```bash
cd unipath-api
npm run dev
```

### 2. Démarrer le Frontend
```bash
cd unipath-front
npm run dev
```

### 3. Accéder à l'Application
Ouvrir le navigateur : `http://localhost:5173`

---

## 🔐 Connexion

### Compte Commission de Test
```
Email: commission@unipath.bj
Mot de passe: [Votre mot de passe]
```

**Note** : Si vous n'avez pas de compte commission, créez-en un avec le script :
```bash
cd unipath-api
node scripts/create-admin-accounts.js
```

---

## 🎬 Scénario de Test Complet

### Étape 1 : Connexion
1. Aller sur `http://localhost:5173/login`
2. Entrer les identifiants commission
3. Cliquer sur "Se connecter"
4. ✅ Vérifier la redirection vers `/commission`

### Étape 2 : Dashboard Commission
1. Observer le dashboard
2. ✅ Vérifier l'affichage des statistiques (Total, En attente, Validés, etc.)
3. ✅ Vérifier la liste des dossiers
4. ✅ Vérifier les filtres (En attente, Validé, Sous réserve, Rejeté)

### Étape 3 : Accéder au Profil d'un Candidat
1. Repérer un dossier en statut "En attente"
2. Cliquer sur le bouton **"Voir le profil complet"** (bouton bleu)
3. ✅ Vérifier la redirection vers `/commission/candidat/:inscriptionId`
4. ✅ Vérifier que l'URL contient l'ID de l'inscription

### Étape 4 : Examiner les Informations
1. Observer la page de détail
2. ✅ Vérifier l'affichage du nom, prénom, matricule
3. ✅ Vérifier l'affichage de l'email et du téléphone
4. ✅ Vérifier l'affichage des informations personnelles (date/lieu de naissance, sexe, nationalité)
5. ✅ Vérifier l'affichage des informations du concours
6. ✅ Vérifier le badge de statut (couleur et texte)

### Étape 5 : Examiner les Pièces Justificatives
1. Observer la section "Pièces justificatives"
2. ✅ Vérifier l'indicateur de complétude (X/5 pièces)
3. ✅ Vérifier la barre de progression (couleur selon le pourcentage)
4. ✅ Vérifier que les pièces déposées sont en vert
5. ✅ Vérifier que les pièces non déposées sont en gris
6. ✅ Vérifier que le bouton "Voir" n'apparaît que pour les pièces déposées

### Étape 6 : Visualiser un Document
1. Cliquer sur le bouton **"Voir"** d'une pièce déposée
2. ✅ Vérifier l'ouverture de la modale
3. ✅ Vérifier l'affichage du document (PDF ou image)
4. ✅ Tester le bouton "Télécharger"
5. ✅ Tester le bouton "Fermer"
6. ✅ Tester la fermeture en cliquant en dehors de la modale

**Tester avec différents types de documents** :
- PDF : Doit s'afficher dans un iframe
- Image (JPG, PNG) : Doit s'afficher en grand format
- Autres : Doit afficher un message + bouton télécharger

### Étape 7 : Consulter l'Historique
1. Cliquer sur "Historique des actions"
2. ✅ Vérifier que la section se déplie
3. ✅ Vérifier l'affichage des actions (date, type, auteur, détails)
4. ✅ Cliquer à nouveau pour replier

### Étape 8 : Tester la Validation
**Prérequis** : Dossier en statut "EN_ATTENTE"

1. Vérifier que toutes les pièces sont présentes (5/5)
2. Cliquer sur le bouton **"Valider le dossier"** (vert)
3. ✅ Vérifier l'affichage du message de succès
4. ✅ Vérifier que le statut passe à "VALIDÉ"
5. ✅ Vérifier que le badge devient vert
6. ✅ Vérifier que les boutons d'action disparaissent
7. ✅ Vérifier que la page se recharge avec les nouvelles données

**Vérifier l'email** :
1. Ouvrir la boîte email du candidat
2. ✅ Vérifier la réception de l'email de convocation
3. ✅ Vérifier la présence du PDF de convocation en pièce jointe
4. ✅ Vérifier les informations dans l'email (date, lieu, etc.)

### Étape 9 : Tester l'Acceptation Sous Réserve
**Prérequis** : Dossier en statut "EN_ATTENTE"

1. Cliquer sur le bouton **"Sous réserve"** (orange)
2. ✅ Vérifier l'ouverture de la modale
3. ✅ Vérifier le titre "Accepter sous réserve"
4. Laisser le champ vide et cliquer sur "Confirmer"
5. ✅ Vérifier l'affichage du message d'erreur "Le commentaire est obligatoire"
6. Saisir un commentaire :
   ```
   Veuillez fournir une photo d'identité conforme (fond blanc, format 4x4, récente)
   ```
7. Cliquer sur "Confirmer"
8. ✅ Vérifier l'affichage du message de succès
9. ✅ Vérifier que le statut passe à "SOUS_RESERVE"
10. ✅ Vérifier que le badge devient orange
11. ✅ Vérifier l'affichage du commentaire dans la section "Commentaires"

**Vérifier l'email** :
1. Ouvrir la boîte email du candidat
2. ✅ Vérifier la réception de l'email sous réserve
3. ✅ Vérifier la présence des conditions à remplir
4. ✅ Vérifier les informations dans l'email

### Étape 10 : Tester le Rejet
**Prérequis** : Dossier en statut "EN_ATTENTE"

1. Cliquer sur le bouton **"Rejeter"** (rouge)
2. ✅ Vérifier l'ouverture de la modale
3. ✅ Vérifier le titre "Rejeter le dossier"
4. Laisser le champ vide et cliquer sur "Confirmer le rejet"
5. ✅ Vérifier l'affichage du message d'erreur "Le commentaire de rejet est obligatoire"
6. Saisir un motif :
   ```
   Dossier incomplet. Pièces manquantes :
   - Acte de naissance
   - Carte d'identité
   Documents fournis non conformes.
   ```
7. Cliquer sur "Confirmer le rejet"
8. ✅ Vérifier l'affichage du message de succès
9. ✅ Vérifier que le statut passe à "REJETÉ"
10. ✅ Vérifier que le badge devient rouge
11. ✅ Vérifier l'affichage du motif dans la section "Commentaires"

**Vérifier l'email** :
1. Ouvrir la boîte email du candidat
2. ✅ Vérifier la réception de l'email de rejet
3. ✅ Vérifier la présence du motif du rejet
4. ✅ Vérifier les informations dans l'email

### Étape 11 : Tester le Retour au Dashboard
1. Cliquer sur la flèche de retour (←) dans le header
2. ✅ Vérifier la redirection vers `/commission`
3. ✅ Vérifier que le dashboard s'affiche
4. ✅ Vérifier que les statistiques sont mises à jour

---

## 🔒 Tests de Sécurité

### Test 1 : Accès Non Autorisé (Non Connecté)
1. Se déconnecter
2. Tenter d'accéder à `/commission/candidat/[un-id]`
3. ✅ Vérifier la redirection vers `/login`

### Test 2 : Accès Non Autorisé (Rôle CANDIDAT)
1. Se connecter en tant que CANDIDAT
2. Tenter d'accéder à `/commission/candidat/[un-id]`
3. ✅ Vérifier la redirection vers `/dashboard`

### Test 3 : Inscription Inexistante
1. Se connecter en tant que COMMISSION
2. Accéder à `/commission/candidat/id-inexistant-123`
3. ✅ Vérifier l'affichage du message "Inscription non trouvée"
4. ✅ Vérifier la présence du bouton "Retour au tableau de bord"
5. Cliquer sur le bouton
6. ✅ Vérifier la redirection vers `/commission`

---

## 📱 Tests Responsive

### Test Desktop (> 1024px)
1. Ouvrir la page sur un écran large
2. ✅ Vérifier que les pièces sont affichées en grille 2 colonnes
3. ✅ Vérifier que toutes les informations sont visibles
4. ✅ Vérifier que les boutons sont bien alignés

### Test Tablette (768px - 1024px)
1. Réduire la fenêtre à 800px
2. ✅ Vérifier que les pièces sont affichées en grille 2 colonnes
3. ✅ Vérifier que le header est responsive
4. ✅ Vérifier que les textes sont lisibles

### Test Mobile (< 768px)
1. Réduire la fenêtre à 375px (iPhone)
2. ✅ Vérifier que les pièces sont affichées en grille 1 colonne
3. ✅ Vérifier que le header est responsive
4. ✅ Vérifier que les boutons sont empilés verticalement
5. ✅ Vérifier que les textes sont lisibles
6. ✅ Vérifier que les modales sont adaptées

---

## 🎨 Tests Visuels

### Codes Couleurs
1. Tester avec un dossier "EN_ATTENTE"
   - ✅ Badge jaune
   - ✅ Barre supérieure jaune
2. Tester avec un dossier "VALIDÉ"
   - ✅ Badge vert
   - ✅ Barre supérieure verte
3. Tester avec un dossier "SOUS_RESERVE"
   - ✅ Badge orange
   - ✅ Barre supérieure orange
4. Tester avec un dossier "REJETÉ"
   - ✅ Badge rouge
   - ✅ Barre supérieure rouge

### Barre de Progression
1. Tester avec 5/5 pièces
   - ✅ Barre verte
   - ✅ Texte "5/5 pièces"
2. Tester avec 3/5 pièces
   - ✅ Barre jaune
   - ✅ Texte "3/5 pièces"
3. Tester avec 1/5 pièces
   - ✅ Barre rouge
   - ✅ Texte "1/5 pièces"

---

## ⚡ Tests de Performance

### Temps de Chargement
1. Ouvrir les DevTools (F12)
2. Aller dans l'onglet "Network"
3. Recharger la page
4. ✅ Vérifier que le temps de chargement est < 2 secondes
5. ✅ Vérifier qu'il n'y a pas d'erreurs 404 ou 500

### Ouverture de Document
1. Ouvrir les DevTools (F12)
2. Aller dans l'onglet "Network"
3. Cliquer sur "Voir" pour un document
4. ✅ Vérifier que le temps de chargement est < 3 secondes
5. ✅ Vérifier que le document s'affiche correctement

---

## 🐛 Tests d'Erreurs

### Erreur Réseau
1. Ouvrir les DevTools (F12)
2. Aller dans l'onglet "Network"
3. Activer "Offline"
4. Tenter de valider un dossier
5. ✅ Vérifier l'affichage d'un message d'erreur clair
6. ✅ Vérifier que l'application ne crash pas

### Document Manquant
1. Tenter d'ouvrir un document qui n'existe pas
2. ✅ Vérifier l'affichage d'un message d'erreur
3. ✅ Vérifier que la modale ne s'ouvre pas

---

## 📊 Checklist Rapide

### Navigation
- [ ] Connexion réussie
- [ ] Redirection vers dashboard
- [ ] Clic sur "Voir le profil complet"
- [ ] Affichage de la page de détail
- [ ] Retour au dashboard

### Affichage
- [ ] Informations candidat affichées
- [ ] Informations concours affichées
- [ ] Pièces justificatives affichées
- [ ] Indicateur de complétude correct
- [ ] Badge de statut correct

### Actions
- [ ] Validation fonctionne
- [ ] Rejet fonctionne
- [ ] Sous réserve fonctionne
- [ ] Modales s'ouvrent/ferment
- [ ] Messages de confirmation affichés

### Documents
- [ ] Visualisation PDF fonctionne
- [ ] Visualisation image fonctionne
- [ ] Téléchargement fonctionne
- [ ] Fermeture modale fonctionne

### Emails
- [ ] Email de validation reçu
- [ ] Email de rejet reçu
- [ ] Email sous réserve reçu
- [ ] PDF de convocation joint

### Sécurité
- [ ] Accès non autorisé bloqué
- [ ] Redirection correcte selon rôle
- [ ] Gestion des erreurs

### Responsive
- [ ] Desktop OK
- [ ] Tablette OK
- [ ] Mobile OK

---

## 📝 Notes de Test

### Date : _______________
### Testeur : _______________

**Résultats** :
- Tests réussis : _____ / _____
- Tests échoués : _____ / _____
- Bugs trouvés : _____

**Commentaires** :
```
[Vos commentaires ici]
```

**Bugs identifiés** :
1. 
2. 
3. 

**Améliorations suggérées** :
1. 
2. 
3. 

---

## ✅ Validation Finale

Une fois tous les tests passés :
- [ ] Tous les tests fonctionnels réussis
- [ ] Tous les tests de sécurité réussis
- [ ] Tous les tests responsive réussis
- [ ] Tous les tests de performance réussis
- [ ] Aucun bug bloquant
- [ ] Documentation à jour
- [ ] Prêt pour la production

**Signature** : _______________
**Date** : _______________
