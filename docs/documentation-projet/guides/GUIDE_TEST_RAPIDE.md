# 🧪 Guide de Test Rapide - Nouvelles Fonctionnalités

## 🎯 3 Fonctionnalités à Tester

1. ✅ Suppression de la quittance du dossier
2. ✅ Commentaire de rejet obligatoire
3. ✅ Interface admin pour gérer les concours

---

## 1️⃣ Test : Suppression Quittance du Dossier

### Objectif
Vérifier que la quittance n'apparaît plus dans le dossier général, mais fonctionne toujours par inscription.

### Étapes

#### A. Vérifier l'absence dans Mon Compte
1. Se connecter en tant que **CANDIDAT**
2. Aller sur **Mon Compte** (`/mon-compte`)
3. ✅ **Vérifier** : La section "Quittance" ne doit PAS apparaître dans la liste des pièces
4. ✅ **Vérifier** : Seules ces pièces doivent apparaître :
   - Photo d'identité
   - Carte d'identité
   - Diplôme de baccalauréat
   - Relevé de notes
   - Certificat de nationalité

#### B. Vérifier l'absence dans Dashboard Candidat
1. Rester connecté en tant que **CANDIDAT**
2. Aller sur **Dashboard** (`/dashboard`)
3. ✅ **Vérifier** : La quittance ne doit PAS apparaître dans la section "Mon Dossier"

#### C. Vérifier la présence par inscription
1. Aller sur **Concours** (`/concours`)
2. Cliquer sur un concours
3. S'inscrire au concours
4. ✅ **Vérifier** : Une section "Quittance de participation" doit apparaître
5. ✅ **Vérifier** : On peut uploader un PDF de quittance

### Résultat Attendu
- ❌ Quittance dans dossier général : **N'existe plus**
- ✅ Quittance par inscription : **Fonctionne**

---

## 2️⃣ Test : Commentaire de Rejet Obligatoire

### Objectif
Vérifier qu'un membre de la commission ne peut pas rejeter un dossier sans laisser un commentaire.

### Étapes

#### A. Tenter de rejeter sans commentaire
1. Se connecter en tant que **COMMISSION**
2. Aller sur le dashboard commission (`/commission`)
3. Cliquer sur **"Rejeter"** sur un dossier
4. ✅ **Vérifier** : Une modale s'ouvre avec un textarea
5. Laisser le textarea **vide**
6. Cliquer sur **"Confirmer le rejet"**
7. ✅ **Vérifier** : Un message d'erreur apparaît : "Le commentaire est obligatoire"

#### B. Rejeter avec commentaire
1. Cliquer à nouveau sur **"Rejeter"**
2. Saisir un commentaire : "Documents incomplets - Attestation de baccalauréat manquante"
3. Cliquer sur **"Confirmer le rejet"**
4. ✅ **Vérifier** : Le dossier passe en statut "REJETE"
5. ✅ **Vérifier** : Un message de succès apparaît

#### C. Vérifier l'email
1. Ouvrir la boîte email du candidat
2. ✅ **Vérifier** : Un email de rejet a été reçu
3. ✅ **Vérifier** : L'email contient une section "Motif :" avec le commentaire

### Exemple d'Email Attendu
```
Décision de la commission

Bonjour Jean Dupont,

Votre dossier pour le concours ENS 2026 n'a pas été retenu.

Motif : Documents incomplets - Attestation de baccalauréat manquante

---
Université d'Abomey-Calavi | Année 2025-2026
```

### Résultat Attendu
- ❌ Rejet sans commentaire : **Impossible**
- ✅ Rejet avec commentaire : **Fonctionne**
- ✅ Email avec motif : **Envoyé**

---

## 3️⃣ Test : Interface Admin Gestion Concours

### Objectif
Vérifier que les administrateurs DGES peuvent créer, modifier et supprimer des concours.

### Étapes

#### A. Accès à l'interface
1. Se connecter en tant que **DGES**
2. ✅ **Vérifier** : Redirection automatique vers `/dashboard-dges`
3. ✅ **Vérifier** : Un bouton **"Gérer les concours"** apparaît en haut à droite
4. Cliquer sur **"Gérer les concours"**
5. ✅ **Vérifier** : Redirection vers `/gestion-concours`
6. ✅ **Vérifier** : Un tableau avec la liste des concours apparaît

#### B. Créer un concours
1. Cliquer sur **"Nouveau concours"** (bouton orange avec icône +)
2. ✅ **Vérifier** : Une modale s'ouvre
3. Remplir le formulaire :
   - **Libellé** : "Concours Test 2026"
   - **Date début** : 01/06/2026
   - **Date fin** : 30/06/2026
   - **Frais** : 5000
   - **Description** : "Concours de test pour validation"
4. Cliquer sur **"Créer"**
5. ✅ **Vérifier** : La modale se ferme
6. ✅ **Vérifier** : Le nouveau concours apparaît dans le tableau

#### C. Modifier un concours
1. Cliquer sur l'icône **crayon bleu** d'un concours
2. ✅ **Vérifier** : La modale s'ouvre avec les données pré-remplies
3. Modifier les **Frais** : 7000
4. Cliquer sur **"Modifier"**
5. ✅ **Vérifier** : Le tableau se met à jour avec les nouveaux frais

#### D. Tenter de supprimer un concours avec inscriptions
1. Cliquer sur l'icône **poubelle rouge** d'un concours qui a des inscriptions
2. Confirmer la suppression
3. ✅ **Vérifier** : Un message d'erreur apparaît : "Impossible de supprimer ce concours car X inscription(s) existe(nt)"

#### E. Supprimer un concours sans inscriptions
1. Cliquer sur l'icône **poubelle rouge** du concours créé au point B (sans inscriptions)
2. ✅ **Vérifier** : Une confirmation apparaît : "Êtes-vous sûr de vouloir supprimer..."
3. Confirmer
4. ✅ **Vérifier** : Le concours disparaît du tableau

#### F. Validation des dates
1. Cliquer sur **"Nouveau concours"**
2. Remplir :
   - **Date début** : 30/06/2026
   - **Date fin** : 01/06/2026 (avant la date de début)
3. Cliquer sur **"Créer"**
4. ✅ **Vérifier** : Un message d'erreur apparaît : "La date de fin doit être après la date de début"

### Résultat Attendu
- ✅ Création : **Fonctionne**
- ✅ Modification : **Fonctionne**
- ✅ Suppression (sans inscriptions) : **Fonctionne**
- ❌ Suppression (avec inscriptions) : **Bloquée**
- ✅ Validation dates : **Fonctionne**

---

## 📋 Checklist Complète

### Quittance
- [ ] Quittance absente de Mon Compte
- [ ] Quittance absente du Dashboard Candidat
- [ ] Quittance présente par inscription
- [ ] Upload PDF de quittance fonctionne

### Commentaire de Rejet
- [ ] Rejet sans commentaire impossible
- [ ] Rejet avec commentaire fonctionne
- [ ] Email de rejet contient le motif
- [ ] Commentaire enregistré en base de données

### Gestion Concours
- [ ] Redirection DGES vers `/dashboard-dges`
- [ ] Bouton "Gérer les concours" visible
- [ ] Page `/gestion-concours` accessible
- [ ] Création de concours fonctionne
- [ ] Modification de concours fonctionne
- [ ] Suppression (sans inscriptions) fonctionne
- [ ] Suppression (avec inscriptions) bloquée
- [ ] Validation des dates fonctionne
- [ ] Interface responsive sur mobile

---

## 🐛 Bugs Potentiels à Surveiller

### Quittance
- ⚠️ Vérifier que les anciennes données de quittance ne causent pas d'erreurs
- ⚠️ Vérifier que l'upload de quittance par inscription fonctionne toujours

### Commentaire de Rejet
- ⚠️ Vérifier que l'email est bien envoyé (check logs backend)
- ⚠️ Vérifier que le commentaire s'affiche correctement dans l'email
- ⚠️ Vérifier que les caractères spéciaux sont bien gérés

### Gestion Concours
- ⚠️ Vérifier que seuls les DGES ont accès
- ⚠️ Vérifier que les dates sont bien formatées
- ⚠️ Vérifier que les frais sont bien affichés en FCFA
- ⚠️ Vérifier le responsive sur mobile/tablette

---

## 🔧 Commandes Utiles

### Backend
```bash
# Vérifier les logs
cd unipath-api
npm run dev

# Vérifier la base de données
npx prisma studio
```

### Frontend
```bash
# Lancer le frontend
cd unipath-front
npm run dev
```

### Base de données
```bash
# Vérifier le schéma
cd unipath-api
npx prisma db pull

# Voir les données
npx prisma studio
```

---

## 📧 Emails à Vérifier

### Email de Rejet
- **Sujet** : `[UniPath] Décision concernant votre candidature - [Nom du concours]`
- **Contenu** : Doit contenir le motif du rejet
- **Destinataire** : Email du candidat

---

## 🎯 Critères de Succès

### Quittance
✅ La quittance du dossier général n'existe plus  
✅ La quittance par inscription fonctionne  
✅ Aucune erreur dans la console

### Commentaire de Rejet
✅ Impossible de rejeter sans commentaire  
✅ Email envoyé avec le motif  
✅ Commentaire enregistré en base

### Gestion Concours
✅ Interface accessible uniquement aux DGES  
✅ CRUD complet fonctionne  
✅ Validations en place  
✅ Protection contre suppression avec inscriptions

---

## 📞 Support

En cas de problème :
1. Vérifier les logs backend (`unipath-api/`)
2. Vérifier la console frontend (F12)
3. Vérifier la base de données avec Prisma Studio
4. Consulter la documentation :
   - `GESTION_CONCOURS_ADMIN.md`
   - `RESUME_TACHES_COMPLETEES.md`

---

**Date** : 6 mai 2026  
**Version** : 1.0  
**Durée estimée des tests** : 30-45 minutes

---

**Bon test !** 🚀
