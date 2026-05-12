# Tests Unitaires - Système Email (Phase 3)

## 📋 Vue d'ensemble

Ce document décrit les tests unitaires créés pour le système email avec queue dans le cadre de la Phase 3 du spec `systeme-email-notifications`.

## ✅ Tests Créés

### Fichier: `unipath-api/tests/email.service.test.js`

**Total: 25 tests - Tous passants ✅**

## 📊 Couverture des Tests

### 1. Tests `createEmail()` - Création d'email avec tous les champs (6 tests)

- ✅ Devrait créer un email avec tous les champs requis (htmlBody, textBody, attachments, userId)
- ✅ Devrait créer un email sans textBody (génération automatique depuis HTML)
- ✅ Devrait créer un email sans attachments (tableau vide → null)
- ✅ Devrait rejeter un email avec une adresse invalide
- ✅ Devrait rejeter un email sans subject
- ✅ Devrait rejeter un email sans htmlBody

**Vérifications:**
- Persistance correcte de tous les champs dans Prisma
- Génération automatique de textBody depuis htmlBody
- Conversion tableau vide → null pour attachments
- Validation des paramètres requis
- Appel du rate limiter avec userId
- Logging correct des emails en queue

### 2. Tests `envoyerEmailConfirmation()` - Email avec userId=null (3 tests)

- ✅ Devrait créer un email de confirmation avec userId=null
- ✅ Devrait inclure le lien de confirmation dans le HTML
- ✅ Devrait rejeter si confirmationToken manquant

**Vérifications:**
- userId=null pour les emails de confirmation (candidat pas encore créé)
- Rate limiter NON appelé quand userId=null
- Lien de confirmation présent dans le HTML
- Nom et prénom du candidat inclus
- Validation du token de confirmation

### 3. Tests `envoyerEmailBienvenue()` - Email avec userId (3 tests)

- ✅ Devrait créer un email de bienvenue avec userId
- ✅ Devrait inclure le matricule dans le HTML
- ✅ Devrait accepter candidatId comme alias de userId

**Vérifications:**
- userId présent pour les emails post-confirmation
- Rate limiter appelé avec le userId
- Matricule inclus dans le HTML
- Email et nom du candidat présents
- Support de candidatId comme alias

### 4. Tests Validation des emails (3 tests)

- ✅ Devrait rejeter un email invalide (pas de @)
- ✅ Devrait rejeter un email invalide (domaine manquant)
- ✅ Devrait accepter un email valide (avec +tag)

**Vérifications:**
- Validation regex des adresses email
- Rejet des formats invalides
- Acceptation des formats valides (y compris +tag)

### 5. Tests Rate Limiting (2 tests)

- ✅ Devrait rejeter si rate limit dépassé
- ✅ Ne devrait pas vérifier le rate limit si userId=null

**Vérifications:**
- Rejet avec erreur si limite dépassée
- Logging de l'événement rate limit
- Pas de vérification si userId=null
- Pas de création d'email si rate limit dépassé

### 6. Tests `htmlToText()` - Conversion HTML vers texte (4 tests)

- ✅ Devrait convertir HTML simple en texte
- ✅ Devrait supprimer les balises style
- ✅ Devrait supprimer les balises script
- ✅ Devrait normaliser les espaces multiples

**Vérifications:**
- Suppression correcte des balises HTML
- Suppression des balises style et script
- Normalisation des espaces
- Texte propre et lisible

### 7. Tests Couverture > 80% - Autres méthodes (4 tests)

- ✅ Devrait tester envoyerEmailPreInscription avec PDF
- ✅ Devrait tester envoyerEmailConvocation
- ✅ Devrait tester envoyerEmailRejet
- ✅ Devrait tester envoyerEmailSousReserve

**Vérifications:**
- Attachments PDF correctement ajoutés
- userId passé pour rate limiting
- Contenu HTML spécifique à chaque type
- Délai de 48h mentionné pour SousReserve
- Motif de rejet inclus

## 🛠️ Configuration des Mocks

### Mocks Utilisés

1. **Prisma Client**
   - Mock des méthodes `create`, `findMany`, `update`
   - Retour de données simulées

2. **Rate Limiter**
   - Mock de `checkRateLimit()`
   - Simulation de dépassement de limite

3. **Logger**
   - Mock de `emailQueued()` et `rateLimitExceeded()`
   - Vérification des appels de logging

4. **Email Config**
   - Mock complet de la configuration SMTP
   - Évite la validation des variables d'environnement

5. **URL Helper**
   - Mock de `getFrontendUrl()`
   - Retourne URL de test

## 📈 Résultats

```
Test Suites: 1 passed, 1 total
Tests:       25 passed, 25 total
Snapshots:   0 total
Time:        2.117 s
```

## 🎯 Objectifs Atteints

- ✅ Tests pour `createEmail()` avec tous les champs
- ✅ Tests pour `envoyerEmailConfirmation()` avec userId=null
- ✅ Tests pour `envoyerEmailBienvenue()` avec userId
- ✅ Tests de validation email invalide
- ✅ Tests de rate limiting dépassé
- ✅ Couverture > 80% visée

## 📝 Prochaines Étapes

### Tests Restants (Phase 3)

1. **Tests email.worker.js**
   - Test `processEmail()` envoi réussi
   - Test `processEmail()` échec avec retry
   - Test `processEmail()` échec définitif après 5 tentatives
   - Test `calculateNextRetry()` exponential backoff
   - Test lock optimiste (email déjà pris)

2. **Tests rate-limiter.js**
   - Test limite par utilisateur (10/h)
   - Test limite globale (100/h)
   - Test alerte queue > 500

3. **Tests d'intégration**
   - Email créé → Worker traite → Statut SENT
   - Email échoue → Retry programmé → Succès
   - 100 emails en parallèle → Tous traités

## 🔗 Fichiers Modifiés

- ✅ `unipath-api/tests/email.service.test.js` (nouveau, 652 lignes)

## 📦 Commit

```
feat(email): Add comprehensive unit tests for email.service.js
- 25 tests covering all methods, validation, rate limiting
- All tests passing
```

**Commit hash:** `e5f1efb`
**Branch:** `feature/configuration-pieces-dossier-sidebar`
**Date:** 12 mai 2026

## 🎓 Leçons Apprises

1. **Ordre des Mocks Important**
   - Déclarer les fonctions mock avant de les utiliser
   - Mocker les dépendances AVANT de require le module testé

2. **Mock de Configuration**
   - Mocker `email.config.js` pour éviter validation env vars
   - Fournir une config complète et valide

3. **Singleton Pattern**
   - Le service email est un singleton
   - Utiliser des fonctions wrapper pour les mocks Prisma

4. **Tests Complets**
   - Tester les cas de succès ET d'échec
   - Vérifier les effets de bord (rate limiter, logger)
   - Valider le contenu HTML généré

---

**Statut:** ✅ Complété
**Auteur:** Kiro AI
**Spec:** systeme-email-notifications (Phase 3 - Testing)
