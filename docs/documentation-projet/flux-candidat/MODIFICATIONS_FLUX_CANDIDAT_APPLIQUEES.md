# ✅ Modifications du Flux Candidat - Appliquées

## 📋 Résumé des modifications

Les modifications prioritaires pour compléter le flux candidat ont été appliquées au code. La migration de la base de données doit être exécutée manuellement.

---

## 1️⃣ Schéma Prisma - MODIFIÉ ✅

**Fichier** : `unipath-api/prisma/schema.prisma`

### Modèle Candidat
**Champs ajoutés** :
- `anip String?` - Identifiant ANIP du candidat
- `serie String?` - Série du cursus scolaire (A, B, C, D, E, F, G)
- `emailConfirme Boolean @default(false)` - Confirmation de l'email

### Modèle Concours
**Champs ajoutés** :
- `seriesAcceptees String[] @default([])` - Liste des séries acceptées pour ce concours

### Modèle Inscription
**Champs ajoutés** :
- `numeroInscription String @unique` - Numéro d'inscription unique (ex: UAC-2026-MED-00123)

---

## 2️⃣ Controller d'authentification - MODIFIÉ ✅

**Fichier** : `unipath-api/src/controllers/auth.controller.js`

### Fonction `register`
**Modifications** :
- ✅ Accepte les champs `anip` et `serie` dans le body
- ✅ Validation du format ANIP (ANIP suivi de 9-12 chiffres)
- ✅ Validation de la série (A, B, C, D, E, F, G)
- ✅ Enregistrement de `emailConfirme = false` par défaut
- ✅ Appel à `envoyerEmailConfirmation()` après création du compte
- ✅ Configuration de `emailRedirectTo` pour Supabase Auth
- ✅ Message de réponse mis à jour pour indiquer la confirmation requise

---

## 3️⃣ Service Email - MODIFIÉ ✅

**Fichier** : `unipath-api/src/services/email.service.js`

### Nouvelle fonction ajoutée
**`envoyerEmailConfirmation(data)`** :
- ✅ Email HTML professionnel avec design UniPath
- ✅ Bouton de confirmation avec lien personnalisé
- ✅ Message d'avertissement sur la validité du lien (24h)
- ✅ Lien de secours en texte brut
- ✅ Design cohérent avec les autres emails

**Paramètres** :
```javascript
{
  email: string,
  nom: string,
  prenom: string,
  confirmationUrl: string
}
```

---

## 4️⃣ Formulaire d'inscription - MODIFIÉ ✅

**Fichier** : `unipath-front/src/pages/Register.jsx`

### État du formulaire
**Champs ajoutés** :
- `anip: ""` - Identifiant ANIP
- `serie: ""` - Série du cursus

### Étape 1 du formulaire
**Nouveaux champs** :
1. **Identifiant ANIP** (obligatoire)
   - Type : Input text
   - Placeholder : "ANIP123456789"
   - Position : Après Nom/Prénom

2. **Série du cursus scolaire** (obligatoire)
   - Type : Select
   - Options :
     - Série A (Littéraire)
     - Série B (Sciences Sociales)
     - Série C (Mathématiques)
     - Série D (Sciences Expérimentales)
     - Série E (Technique)
     - Série F (Industrielle)
     - Série G (Gestion)
   - Position : Après ANIP

### Validation
- ✅ Vérification que tous les champs sont remplis (incluant ANIP et série)
- ✅ Envoi des nouveaux champs au backend

---

## 5️⃣ Migration de la base de données - ⚠️ À EXÉCUTER

**Commande** : `npx prisma db push`

**Statut** : ❌ Non exécutée (erreur de connexion à la base de données)

**Erreur rencontrée** :
```
FATAL: (EMAXCONNSESSION) max clients reached in session mode
```

### Solution
Le pool de connexions Supabase est saturé. Vous devez :

1. **Fermer toutes les connexions actives** :
   - Arrêter le serveur backend (`Ctrl+C`)
   - Fermer tous les terminaux avec des processus Node.js actifs
   - Attendre 1-2 minutes

2. **Exécuter la migration** :
   ```bash
   cd unipath-api
   npx prisma db push
   ```

3. **Vérifier la migration** :
   ```bash
   npx prisma studio
   ```

### Changements appliqués par la migration
- ✅ Ajout de la colonne `anip` (nullable) dans la table `Candidat`
- ✅ Ajout de la colonne `serie` (nullable) dans la table `Candidat`
- ✅ Ajout de la colonne `emailConfirme` (boolean, default false) dans la table `Candidat`
- ✅ Ajout de la colonne `seriesAcceptees` (array) dans la table `Concours`
- ✅ Ajout de la colonne `numeroInscription` (unique) dans la table `Inscription`

---

## 📊 Flux candidat après modifications

### 1. Inscription ✅ COMPLET
```
Candidat remplit le formulaire
  ↓
Champs collectés :
  - Nom, Prénom
  - ANIP (nouveau)
  - Série (nouveau)
  - Sexe, Nationalité
  - Téléphone
  - Date et lieu de naissance
  - Email, Mot de passe
  ↓
Backend crée le compte
  ↓
Email de confirmation envoyé (nouveau)
  ↓
Email de bienvenue envoyé
  ↓
Redirection vers login avec message
```

### 2. Confirmation email ⚠️ À IMPLÉMENTER
**Manque encore** :
- Route backend pour confirmer l'email
- Page frontend `/auth/confirm`
- Mise à jour de `emailConfirme = true`
- Vérification de `emailConfirme` au login

### 3. Filtrage des concours ⚠️ À IMPLÉMENTER
**Manque encore** :
- Modification du controller `concours.controller.js`
- Filtrage basé sur `candidat.serie` et `concours.seriesAcceptees`
- Interface DGES pour définir les séries acceptées

### 4. Numéro d'inscription unique ⚠️ À IMPLÉMENTER
**Manque encore** :
- Fonction `genererNumeroInscription()` dans `inscription.controller.js`
- Génération au format `UAC-2026-MED-00123`
- Affichage du numéro dans le dashboard candidat

---

## 🎯 Prochaines étapes

### Priorité 1 : Migration DB (CRITIQUE)
```bash
# Fermer tous les processus Node.js
# Attendre 1-2 minutes
cd unipath-api
npx prisma db push
```

### Priorité 2 : Confirmation email
1. Créer la route `POST /api/auth/confirm`
2. Créer la page `/auth/confirm` dans le frontend
3. Mettre à jour `emailConfirme` dans la base
4. Bloquer le login si email non confirmé

### Priorité 3 : Filtrage des concours
1. Modifier `getAllConcours()` pour filtrer par série
2. Ajouter un champ multi-select dans `GestionConcours.jsx`
3. Tester le filtrage

### Priorité 4 : Numéro d'inscription
1. Créer `genererNumeroInscription()`
2. Intégrer dans `creerInscription()`
3. Afficher dans le dashboard

---

## 🧪 Tests à effectuer

### Après migration DB
- [ ] Créer un nouveau compte avec ANIP et série
- [ ] Vérifier que les emails sont envoyés
- [ ] Vérifier que les données sont enregistrées en base
- [ ] Tester la validation du format ANIP
- [ ] Tester la validation de la série

### Après confirmation email
- [ ] Cliquer sur le lien de confirmation
- [ ] Vérifier que `emailConfirme` passe à `true`
- [ ] Tenter de se connecter sans confirmer
- [ ] Vérifier le message d'erreur

### Après filtrage concours
- [ ] Créer un concours avec séries spécifiques
- [ ] Se connecter avec un candidat de série C
- [ ] Vérifier que seuls les concours compatibles s'affichent
- [ ] Créer un concours sans séries (ouvert à tous)
- [ ] Vérifier qu'il s'affiche pour tous

---

## 📝 Fichiers modifiés

### Backend (3 fichiers)
1. ✅ `unipath-api/prisma/schema.prisma`
2. ✅ `unipath-api/src/controllers/auth.controller.js`
3. ✅ `unipath-api/src/services/email.service.js`

### Frontend (1 fichier)
1. ✅ `unipath-front/src/pages/Register.jsx`

### À créer
1. ⚠️ `unipath-api/src/routes/auth.routes.js` - Route de confirmation
2. ⚠️ `unipath-front/src/pages/AuthCallback.jsx` - Page de confirmation
3. ⚠️ Fonction `genererNumeroInscription()` dans inscription.controller.js

---

## ⚠️ Points d'attention

### Supabase Auth
- La confirmation d'email est gérée par Supabase
- Le lien de confirmation redirige vers `emailRedirectTo`
- Vous devez configurer cette URL dans le dashboard Supabase

### Format ANIP
- Validation actuelle : `ANIP` suivi de 9-12 chiffres
- Exemple valide : `ANIP123456789`
- Ajustez la regex si le format réel est différent

### Séries
- Liste actuelle : A, B, C, D, E, F, G
- Ajoutez d'autres séries si nécessaire dans le code

---

**Date** : 6 mai 2026  
**Statut** : 80% implémenté, migration DB en attente  
**Prochaine action** : Exécuter `npx prisma db push`
