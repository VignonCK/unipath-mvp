# 📖 Guide d'Utilisation - Espace Commission

## 🎯 Objectif

Ce guide explique comment les membres de la commission peuvent examiner les dossiers des candidats et prendre des décisions.

---

## 🚀 Accès à l'Espace Commission

1. **Connexion** : Connectez-vous avec vos identifiants commission
2. **Redirection automatique** : Vous êtes redirigé vers `/commission`
3. **Dashboard** : Vous voyez la liste de tous les dossiers

---

## 📊 Dashboard Commission

### Vue d'ensemble

Le dashboard affiche :
- **Statistiques globales** : Total, En attente, Validés, Sous réserve, Rejetés
- **Filtres** : Boutons pour filtrer par statut
- **Barre de recherche** : Recherche par nom, matricule ou concours
- **Liste des dossiers** : Cartes avec informations résumées

### Informations sur chaque carte

Chaque carte de dossier affiche :
- ✅ **Identité** : Nom, prénom, matricule
- 📚 **Concours** : Libellé du concours
- 📅 **Date d'inscription**
- 🏷️ **Statut** : Badge coloré (Jaune = En attente, Vert = Validé, Rouge = Rejeté, Orange = Sous réserve)
- 📄 **Pièces** : Indicateur visuel (X/5 pièces)

---

## 🔍 Examiner un Dossier Complet

### Étape 1 : Accéder au profil

1. Sur le dashboard, repérez le dossier à examiner
2. Cliquez sur le bouton **"Voir le profil complet"** (bouton bleu)
3. Vous êtes redirigé vers la page de détail

### Étape 2 : Consulter les informations

La page de détail affiche :

#### 👤 Informations Personnelles
- Nom, prénom, matricule
- Email et téléphone
- Date et lieu de naissance
- Sexe et nationalité

#### 🎓 Informations du Concours
- Libellé du concours
- Établissement
- Dates du concours

#### 📁 Pièces Justificatives

Pour chaque pièce :
- **Icône** : Indique le type de pièce
- **Statut** : Déposée (vert) ou Non déposée (gris)
- **Bouton "Voir"** : Visualise le document

**Liste des pièces** :
1. 📄 Acte de naissance
2. 🪪 Carte d'identité
3. 📷 Photo d'identité
4. 📊 Relevé de notes
5. 💳 Quittance de paiement (dossier)
6. 💳 Quittance d'inscription au concours

**Indicateur de complétude** :
- Affiche "X/5 pièces"
- Barre de progression colorée :
  - 🟢 Vert = 100% complet
  - 🟡 Jaune = 60-99% complet
  - 🔴 Rouge = < 60% complet

### Étape 3 : Visualiser les documents

1. Cliquez sur le bouton **"Voir"** à côté d'une pièce
2. Une modale s'ouvre avec le document
3. **Pour les PDF** : Visualisation directe dans la modale
4. **Pour les images** : Affichage en grand format
5. **Bouton "Télécharger"** : Télécharge le document
6. **Bouton "Fermer"** : Ferme la modale

---

## ✅ Prendre une Décision

### Option 1 : Valider le Dossier

**Quand l'utiliser** : Le dossier est complet et conforme

1. Vérifiez que toutes les pièces sont présentes et conformes
2. Cliquez sur le bouton **"Valider le dossier"** (vert)
3. Le statut passe à **VALIDÉ**
4. Le candidat reçoit automatiquement :
   - Un email de convocation
   - Un PDF de convocation (généré automatiquement)

### Option 2 : Accepter Sous Réserve

**Quand l'utiliser** : Le dossier est acceptable mais nécessite des corrections mineures

1. Cliquez sur le bouton **"Sous réserve"** (orange)
2. Une modale s'ouvre
3. **Saisissez les conditions** à remplir (obligatoire)
   - Exemple : "Fournir une photo d'identité conforme"
   - Exemple : "Corriger le relevé de notes (signature manquante)"
4. Cliquez sur **"Confirmer"**
5. Le statut passe à **SOUS_RESERVE**
6. Le candidat reçoit un email avec les conditions à remplir

### Option 3 : Rejeter le Dossier

**Quand l'utiliser** : Le dossier ne peut pas être accepté

1. Cliquez sur le bouton **"Rejeter"** (rouge)
2. Une modale s'ouvre
3. **Saisissez le motif du rejet** (obligatoire)
   - Exemple : "Pièces non conformes : acte de naissance illisible"
   - Exemple : "Candidat ne remplit pas les critères d'admission"
4. Cliquez sur **"Confirmer le rejet"**
5. Le statut passe à **REJETÉ**
6. Le candidat reçoit un email avec le motif du rejet

---

## 📜 Historique des Actions

### Consulter l'historique

1. Sur la page de détail, repérez la section **"Historique des actions"**
2. Cliquez sur le titre pour déplier/replier
3. L'historique affiche :
   - Date et heure de chaque action
   - Type d'action (création, modification, validation, etc.)
   - Auteur de l'action
   - Détails de l'action

### Utilité de l'historique

- **Traçabilité** : Savoir qui a fait quoi et quand
- **Audit** : Vérifier les actions passées
- **Transparence** : Historique complet des modifications

---

## 🔄 Retour au Dashboard

Pour revenir au dashboard :
1. Cliquez sur la **flèche de retour** (←) dans le header
2. Ou cliquez sur **"UniPath"** dans le header

---

## 🎨 Codes Couleurs

### Statuts
- 🟡 **Jaune** : En attente (dossier à examiner)
- 🟢 **Vert** : Validé (dossier accepté)
- 🟠 **Orange** : Sous réserve (dossier accepté avec conditions)
- 🔴 **Rouge** : Rejeté (dossier refusé)

### Pièces
- 🟢 **Vert** : Pièce déposée
- ⚪ **Gris** : Pièce non déposée

### Complétude
- 🟢 **Vert** : 100% complet (5/5 pièces)
- 🟡 **Jaune** : 60-99% complet (3-4/5 pièces)
- 🔴 **Rouge** : < 60% complet (0-2/5 pièces)

---

## 💡 Bonnes Pratiques

### Avant de valider
✅ Vérifier que toutes les pièces sont présentes
✅ Vérifier que les pièces sont lisibles
✅ Vérifier que les informations correspondent
✅ Vérifier que les documents sont authentiques

### Avant de rejeter
✅ Vérifier qu'il n'y a pas d'alternative (sous réserve)
✅ Rédiger un motif clair et précis
✅ Indiquer les pièces problématiques
✅ Être professionnel dans le message

### Avant d'accepter sous réserve
✅ Lister clairement les conditions à remplir
✅ Être spécifique (quelle pièce, quel problème)
✅ Donner des instructions claires au candidat
✅ Vérifier que les conditions sont réalisables

---

## 🆘 Problèmes Courants

### Le document ne s'affiche pas
- Vérifiez votre connexion internet
- Essayez de télécharger le document
- Contactez le support technique si le problème persiste

### Je ne peux pas prendre de décision
- Vérifiez que le dossier est en statut "EN_ATTENTE"
- Les dossiers déjà traités ne peuvent pas être modifiés depuis cette page
- Contactez un administrateur si nécessaire

### Le commentaire est obligatoire
- Pour les rejets et les acceptations sous réserve, un commentaire est obligatoire
- Rédigez un message clair et professionnel
- Le message sera envoyé au candidat par email

---

## 📞 Support

En cas de problème technique :
- Contactez l'administrateur système
- Envoyez un email à support@unipath.bj
- Appelez le +229 XX XX XX XX

---

## 🔒 Sécurité

- Ne partagez jamais vos identifiants
- Déconnectez-vous après chaque session
- Les actions sont tracées et auditables
- Respectez la confidentialité des données des candidats
