# Tasks Document - Système Email Notifications Performant

## Vue d'ensemble

Ce document décompose l'implémentation du système d'email notifications en tâches concrètes et actionnables. Les tâches sont organisées en 4 phases correspondant au plan de migration défini dans le design document.

## Légende des Statuts

- ⬜ **TODO** : Tâche non commencée
- 🔄 **IN_PROGRESS** : Tâche en cours
- ✅ **DONE** : Tâche terminée
- ⏸️ **BLOCKED** : Tâche bloquée (dépendance non satisfaite)
- ⚠️ **REVIEW** : Tâche en revue

## Phase 1 : Préparation (Semaine 1)

### 1.1 Migration Base de Données

#### Task 1.1.1 : Créer la migration Prisma
**Status** : ✅ DONE  
**Assigné** : Backend Dev  
**Estimation** : 2h  
**Priorité** : HIGH

**Description** :
Créer la migration Prisma pour ajouter les champs nécessaires à la table `EmailDelivery`.

**Critères d'acceptation** :
- [x] Migration créée avec `npx prisma migrate dev --name add_email_content_fields`
- [x] Champs ajoutés : `htmlBody`, `textBody`, `attachments`, `lastAttemptAt`, `nextRetryAt`
- [x] Champ `userId` rendu nullable
- [x] Ancien champ `lastAttemptAt` renommé en `nextRetryAt`
- [x] Index créé : `idx_emaildelivery_status_nextretryat`
- [x] Migration testée en local

**Fichiers** :
- `unipath-api/prisma/schema.prisma`
- `unipath-api/prisma/migrations/YYYYMMDDHHMMSS_add_email_content_fields/migration.sql`

**Commandes** :
```bash
cd unipath-api
npx prisma migrate dev --name add_email_content_fields
npx prisma generate
```

---

#### Task 1.1.2 : Créer les index de performance
**Status** : ✅ DONE  
**Assigné** : Backend Dev  
**Estimation** : 1h  
**Priorité** : MEDIUM

**Description** :
Créer les index supplémentaires pour optimiser les requêtes du worker et du rate limiter.

**Critères d'acceptation** :
- [x] Index créé : `idx_emaildelivery_userid_createdat`
- [x] Index créé : `idx_emaildelivery_createdat_status`
- [x] Index testés avec EXPLAIN ANALYZE

**Fichiers** :
- `unipath-api/prisma/migrations/YYYYMMDDHHMMSS_add_performance_indexes/migration.sql`

**SQL** :
```sql
CREATE INDEX idx_emaildelivery_userid_createdat 
ON "EmailDelivery" ("userId", "createdAt")
WHERE "userId" IS NOT NULL;

CREATE INDEX idx_emaildelivery_createdat_status 
ON "EmailDelivery" ("createdAt", status);
```

---

### 1.2 Installation des Dépendances

#### Task 1.2.1 : Installer node-cron
**Status** : ✅ DONE  
**Assigné** : Backend Dev  
**Estimation** : 15min  
**Priorité** : HIGH

**Description** :
Installer la librairie `node-cron` pour le worker.

**Critères d'acceptation** :
- [x] `node-cron` installé : `npm install node-cron`
- [x] Types installés : `npm install --save-dev @types/node-cron`
- [x] Version ajoutée au `package.json`

**Commandes** :
```bash
cd unipath-api
npm install node-cron
npm install --save-dev @types/node-cron
```

---

#### Task 1.2.2 : Installer Winston pour logging
**Status** : ✅ DONE  
**Assigné** : Backend Dev  
**Estimation** : 15min  
**Priorité** : MEDIUM

**Description** :
Installer Winston pour les logs structurés.

**Critères d'acceptation** :
- [x] `winston` installé : `npm install winston`
- [x] Configuration de base créée dans `src/config/logger.js`
- [x] Logs écrits dans `logs/email-error.log` et `logs/email-combined.log`

**Commandes** :
```bash
cd unipath-api
npm install winston
```

---

### 1.3 Configuration

#### Task 1.3.1 : Ajouter les variables d'environnement
**Status** : ✅ DONE  
**Assigné** : Backend Dev  
**Estimation** : 30min  
**Priorité** : HIGH

**Description** :
Ajouter toutes les variables d'environnement nécessaires au système d'email.

**Critères d'acceptation** :
- [x] Variables ajoutées à `.env.example`
- [x] Variables ajoutées à `.env.local`
- [x] Documentation des variables dans `README.md`
- [x] Validation des variables au démarrage

**Fichiers** :
- `unipath-api/.env.example`
- `unipath-api/.env.local`
- `unipath-api/README.md`

**Variables** :
```env
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_EMAIL=noreply@unipath.bj
SMTP_FROM_NAME=UniPath

# Application
APP_URL=https://unipath.bj
ACADEMIC_YEAR=2024-2025

# Email Queue
EMAIL_QUEUE_ENABLED=true
EMAIL_RETRY_DELAYS=1,5,15,60,240
EMAIL_RATE_LIMIT_PER_USER=10
EMAIL_RATE_LIMIT_GLOBAL=100
```

---

## Phase 2 : Implémentation (Semaine 2-3)

### 2.1 Email Service

#### Task 2.1.1 : Refactorer email.service.js
**Status** : ✅ DONE  
**Assigné** : Backend Dev  
**Estimation** : 4h  
**Priorité** : HIGH

**Description** :
Refactorer le service d'email pour utiliser la nouvelle architecture avec queue.

**Critères d'acceptation** :
- [x] Méthode `createEmail()` créée avec persistance de `htmlBody`, `textBody`, `attachments`
- [x] Méthode `envoyerEmailConfirmation()` mise à jour (userId=null, textBody ajouté)
- [x] Méthode `envoyerEmailBienvenue()` mise à jour (userId ajouté, textBody ajouté)
- [x] Méthode `envoyerEmailPreInscription()` mise à jour (userId ajouté, textBody ajouté)
- [x] Méthode `envoyerEmailConvocation()` mise à jour (userId ajouté, textBody ajouté)
- [x] Méthode `envoyerEmailRejet()` mise à jour (userId ajouté, textBody ajouté)
- [x] Méthode `envoyerEmailSousReserve()` mise à jour (userId ajouté, textBody ajouté)
- [x] Validation des paramètres implémentée
- [x] Rate limiting conditionnel (si userId fourni)
- [x] Retour immédiat avec `{ emailId, status: 'QUEUED' }`

**Fichiers** :
- `unipath-api/src/services/email.service.js`

**Dépendances** :
- Task 1.1.1 (Migration)
- Task 2.2.1 (Rate Limiter)

---

#### Task 2.1.2 : Créer les utilitaires de validation
**Status** : ✅ DONE  
**Assigné** : Backend Dev  
**Estimation** : 1h  
**Priorité** : MEDIUM

**Description** :
Créer les fonctions de validation pour les emails et paramètres.

**Critères d'acceptation** :
- [x] Fonction `validateEmail(email)` créée avec regex
- [x] Fonction `validateParams(params)` créée
- [x] Fonction `sanitizeInput(input)` créée pour prévenir XSS
- [x] Tests unitaires pour chaque fonction

**Fichiers** :
- `unipath-api/src/utils/validation.js`
- `unipath-api/tests/utils/validation.test.js`

---

### 2.2 Rate Limiter

#### Task 2.2.1 : Créer rate-limiter.js
**Status** : ✅ DONE  
**Assigné** : Backend Dev  
**Estimation** : 2h  
**Priorité** : HIGH

**Description** :
Créer le service de rate limiting pour prévenir les abus.

**Critères d'acceptation** :
- [x] Classe `RateLimiter` créée
- [x] Méthode `checkRateLimit(userId)` implémentée
- [x] Limite par utilisateur : 10 emails/heure
- [x] Limite globale : 100 emails/heure
- [x] Alerte créée si queue > 500 emails
- [x] Tests unitaires

**Fichiers** :
- `unipath-api/src/services/rate-limiter.js`
- `unipath-api/tests/services/rate-limiter.test.js`

**Dépendances** :
- Task 1.1.1 (Migration)

---

### 2.3 Email Worker

#### Task 2.3.1 : Créer email.worker.js
**Status** : ✅ DONE  
**Assigné** : Backend Dev  
**Estimation** : 4h  
**Priorité** : HIGH

**Description** :
Créer le worker avec cron job intégré pour traiter la file d'attente.

**Critères d'acceptation** :
- [x] Classe `EmailWorker` créée
- [x] Cron job configuré : toutes les 10 secondes
- [x] Méthode `start()` implémentée
- [x] Méthode `stop()` implémentée (graceful shutdown)
- [x] Méthode `processQueue()` implémentée (max 5 emails)
- [x] Méthode `processEmail()` implémentée avec lock optimiste
- [x] Méthode `calculateNextRetry()` implémentée (exponential backoff)
- [x] Gestion des pièces jointes
- [x] Création d'alertes en cas d'échec définitif
- [x] Tests unitaires

**Fichiers** :
- `unipath-api/src/services/email.worker.js`
- `unipath-api/tests/services/email.worker.test.js`

**Dépendances** :
- Task 1.1.1 (Migration)
- Task 1.2.1 (node-cron)

---

#### Task 2.3.2 : Intégrer le worker dans server.js
**Status** : ✅ DONE  
**Assigné** : Backend Dev  
**Estimation** : 1h  
**Priorité** : HIGH

**Description** :
Intégrer le worker dans le serveur Express avec démarrage automatique et arrêt gracieux.

**Critères d'acceptation** :
- [x] Worker importé dans `server.js`
- [x] `emailWorker.start()` appelé au démarrage
- [x] `emailWorker.stop()` appelé sur SIGTERM
- [x] `emailWorker.stop()` appelé sur SIGINT
- [x] Logs de démarrage/arrêt

**Fichiers** :
- `unipath-api/server.js`

**Dépendances** :
- Task 2.3.1 (Email Worker)

---

### 2.4 Monitoring

#### Task 2.4.1 : Créer l'endpoint /api/email/health
**Status** : ⬜ TODO  
**Assigné** : Backend Dev  
**Estimation** : 2h  
**Priorité** : MEDIUM

**Description** :
Créer l'endpoint de monitoring pour vérifier l'état du système.

**Critères d'acceptation** :
- [ ] Route GET `/api/email/health` créée
- [ ] Permissions : DGES, CONTROLEUR
- [ ] Retourne : queue size, stats 24h, worker status, alerts
- [ ] Tests d'intégration

**Fichiers** :
- `unipath-api/src/routes/email.routes.js`
- `unipath-api/src/controllers/email.controller.js`
- `unipath-api/tests/integration/email.health.test.js`

---

#### Task 2.4.2 : Créer l'endpoint /api/email/stats
**Status** : ⬜ TODO  
**Assigné** : Backend Dev  
**Estimation** : 2h  
**Priorité** : LOW

**Description** :
Créer l'endpoint de statistiques détaillées.

**Critères d'acceptation** :
- [ ] Route GET `/api/email/stats` créée
- [ ] Query parameter `period` : hour, day, week, month
- [ ] Permissions : DGES, CONTROLEUR
- [ ] Retourne : total, byStatus, byType, failureRate, avgDeliveryTime
- [ ] Tests d'intégration

**Fichiers** :
- `unipath-api/src/routes/email.routes.js`
- `unipath-api/src/controllers/email.controller.js`
- `unipath-api/tests/integration/email.stats.test.js`

---

### 2.5 Logging

#### Task 2.5.1 : Configurer Winston
**Status** : ✅ DONE  
**Assigné** : Backend Dev  
**Estimation** : 1h  
**Priorité** : MEDIUM

**Description** :
Configurer Winston pour les logs structurés.

**Critères d'acceptation** :
- [x] Configuration Winston créée dans `src/config/logger.js`
- [x] Logs error dans `logs/email-error.log`
- [x] Logs combined dans `logs/email-combined.log`
- [x] Format JSON avec timestamp
- [x] Fonction `maskEmail()` pour masquer les emails dans les logs

**Fichiers** :
- `unipath-api/src/config/logger.js`
- `unipath-api/src/utils/mask-email.js`

**Dépendances** :
- Task 1.2.2 (Winston)

---

#### Task 2.5.2 : Intégrer les logs dans le worker
**Status** : ⬜ TODO  
**Assigné** : Backend Dev  
**Estimation** : 1h  
**Priorité** : MEDIUM

**Description** :
Remplacer les `console.log` par des logs Winston structurés.

**Critères d'acceptation** :
- [ ] Logs info pour emails envoyés avec succès
- [ ] Logs error pour emails échoués
- [ ] Logs warning pour retry programmés
- [ ] Emails masqués dans les logs

**Fichiers** :
- `unipath-api/src/services/email.worker.js`

**Dépendances** :
- Task 2.5.1 (Winston Config)

---

## Phase 3 : Tests (Semaine 3)

### 3.1 Tests Unitaires

#### Task 3.1.1 : Tests Email Service
**Status** : ⬜ TODO  
**Assigné** : Backend Dev  
**Estimation** : 3h  
**Priorité** : HIGH

**Description** :
Créer les tests unitaires pour le service d'email.

**Critères d'acceptation** :
- [ ] Test `createEmail()` avec tous les champs
- [ ] Test `envoyerEmailConfirmation()` avec userId=null
- [ ] Test `envoyerEmailBienvenue()` avec userId
- [ ] Test validation email invalide
- [ ] Test rate limiting dépassé
- [ ] Couverture > 80%

**Fichiers** :
- `unipath-api/tests/services/email.service.test.js`

---

#### Task 3.1.2 : Tests Email Worker
**Status** : ⬜ TODO  
**Assigné** : Backend Dev  
**Estimation** : 3h  
**Priorité** : HIGH

**Description** :
Créer les tests unitaires pour le worker.

**Critères d'acceptation** :
- [ ] Test `processEmail()` envoi réussi
- [ ] Test `processEmail()` échec avec retry
- [ ] Test `processEmail()` échec définitif après 5 tentatives
- [ ] Test `calculateNextRetry()` exponential backoff
- [ ] Test lock optimiste (email déjà pris)
- [ ] Couverture > 80%

**Fichiers** :
- `unipath-api/tests/services/email.worker.test.js`

---

#### Task 3.1.3 : Tests Rate Limiter
**Status** : ⬜ TODO  
**Assigné** : Backend Dev  
**Estimation** : 2h  
**Priorité** : MEDIUM

**Description** :
Créer les tests unitaires pour le rate limiter.

**Critères d'acceptation** :
- [ ] Test limite par utilisateur (10/h)
- [ ] Test limite globale (100/h)
- [ ] Test alerte queue > 500
- [ ] Couverture > 80%

**Fichiers** :
- `unipath-api/tests/services/rate-limiter.test.js`

---

### 3.2 Tests d'Intégration

#### Task 3.2.1 : Test end-to-end email confirmation
**Status** : ⬜ TODO  
**Assigné** : Backend Dev  
**Estimation** : 2h  
**Priorité** : HIGH

**Description** :
Tester le flux complet d'envoi d'email de confirmation.

**Critères d'acceptation** :
- [ ] Email créé avec statut QUEUED
- [ ] Worker traite l'email dans les 15 secondes
- [ ] Email passe à statut SENT
- [ ] messageId enregistré
- [ ] lastAttemptAt et sentAt définis

**Fichiers** :
- `unipath-api/tests/integration/email.confirmation.test.js`

---

#### Task 3.2.2 : Test end-to-end avec retry
**Status** : ⬜ TODO  
**Assigné** : Backend Dev  
**Estimation** : 2h  
**Priorité** : MEDIUM

**Description** :
Tester le flux de retry en cas d'échec SMTP.

**Critères d'acceptation** :
- [ ] Email échoue à la première tentative
- [ ] nextRetryAt calculé correctement
- [ ] Worker réessaie après le délai
- [ ] Email finalement envoyé

**Fichiers** :
- `unipath-api/tests/integration/email.retry.test.js`

---

### 3.3 Tests de Charge

#### Task 3.3.1 : Test 100 emails en 5 minutes
**Status** : ⬜ TODO  
**Assigné** : Backend Dev  
**Estimation** : 2h  
**Priorité** : LOW

**Description** :
Tester la capacité du système à traiter 100 emails rapidement.

**Critères d'acceptation** :
- [ ] 100 emails créés en parallèle
- [ ] Tous les emails traités en < 5 minutes
- [ ] Aucune erreur de rate limiting
- [ ] Aucun email perdu

**Fichiers** :
- `unipath-api/tests/load/email.load.test.js`

---

## Phase 4 : Migration et Déploiement (Semaine 4-5)

### 4.1 Migration Progressive

#### Task 4.1.1 : Déployer avec EMAIL_QUEUE_ENABLED=false
**Status** : ⬜ TODO  
**Assigné** : DevOps  
**Estimation** : 2h  
**Priorité** : HIGH

**Description** :
Déployer le nouveau code en mode synchrone pour vérifier la compatibilité.

**Critères d'acceptation** :
- [ ] Code déployé en staging
- [ ] Variable `EMAIL_QUEUE_ENABLED=false`
- [ ] Emails envoyés de manière synchrone
- [ ] Aucune régression détectée
- [ ] Monitoring actif

---

#### Task 4.1.2 : Activer la queue pour CONFIRMATION
**Status** : ⬜ TODO  
**Assigné** : DevOps  
**Estimation** : 1h  
**Priorité** : HIGH

**Description** :
Activer la queue uniquement pour les emails de confirmation.

**Critères d'acceptation** :
- [ ] Variable `EMAIL_QUEUE_ENABLED=true`
- [ ] Emails CONFIRMATION passent par la queue
- [ ] Autres emails restent synchrones
- [ ] Monitoring : 0 erreur pendant 24h

**Dépendances** :
- Task 4.1.1

---

#### Task 4.1.3 : Activer la queue pour tous les emails
**Status** : ⬜ TODO  
**Assigné** : DevOps  
**Estimation** : 1h  
**Priorité** : HIGH

**Description** :
Activer la queue pour tous les types d'emails.

**Critères d'acceptation** :
- [ ] Tous les emails passent par la queue
- [ ] Monitoring : taux d'échec < 5%
- [ ] Temps moyen d'envoi < 30 secondes
- [ ] Aucune alerte critique

**Dépendances** :
- Task 4.1.2

---

### 4.2 Optimisation

#### Task 4.2.1 : Configurer le nettoyage automatique
**Status** : ⬜ TODO  
**Assigné** : Backend Dev  
**Estimation** : 1h  
**Priorité** : LOW

**Description** :
Configurer le cron job de nettoyage des vieux emails.

**Critères d'acceptation** :
- [ ] Cron job créé : tous les jours à 2h
- [ ] Supprime les emails SENT > 90 jours
- [ ] Logs du nombre d'emails supprimés

**Fichiers** :
- `unipath-api/src/services/email.cleanup.js`

---

#### Task 4.2.2 : Ajuster les paramètres de retry
**Status** : ⬜ TODO  
**Assigné** : Backend Dev  
**Estimation** : 1h  
**Priorité** : LOW

**Description** :
Ajuster les délais de retry en fonction des métriques de production.

**Critères d'acceptation** :
- [ ] Analyse des métriques de retry
- [ ] Ajustement de `EMAIL_RETRY_DELAYS` si nécessaire
- [ ] Documentation des changements

---

### 4.3 Documentation

#### Task 4.3.1 : Documenter les procédures opérationnelles
**Status** : ⬜ TODO  
**Assigné** : Backend Dev  
**Estimation** : 2h  
**Priorité** : MEDIUM

**Description** :
Créer la documentation opérationnelle pour l'équipe.

**Critères d'acceptation** :
- [ ] Guide de démarrage/arrêt
- [ ] Guide de monitoring
- [ ] Guide de troubleshooting
- [ ] Guide de maintenance
- [ ] Runbook pour les incidents

**Fichiers** :
- `unipath-api/docs/EMAIL_OPERATIONS.md`

---

#### Task 4.3.2 : Mettre à jour le README
**Status** : ⬜ TODO  
**Assigné** : Backend Dev  
**Estimation** : 1h  
**Priorité** : LOW

**Description** :
Mettre à jour le README avec les informations sur le système d'email.

**Critères d'acceptation** :
- [ ] Section "Email System" ajoutée
- [ ] Variables d'environnement documentées
- [ ] Commandes de test documentées
- [ ] Liens vers la documentation complète

**Fichiers** :
- `unipath-api/README.md`

---

## Résumé des Tâches

### Par Phase

| Phase | Tâches | Estimation | Priorité HIGH |
|-------|--------|------------|---------------|
| Phase 1 : Préparation | 6 | 5h 30min | 3 |
| Phase 2 : Implémentation | 11 | 23h | 6 |
| Phase 3 : Tests | 7 | 16h | 3 |
| Phase 4 : Migration | 7 | 10h | 3 |
| **TOTAL** | **31** | **54h 30min** | **15** |

### Par Priorité

| Priorité | Nombre | Estimation |
|----------|--------|------------|
| HIGH | 15 | 32h 30min |
| MEDIUM | 11 | 16h |
| LOW | 5 | 6h |

### Dépendances Critiques

```
Phase 1 (Préparation)
  └─> Task 1.1.1 (Migration) ──┐
                                ├─> Phase 2 (Implémentation)
  └─> Task 1.2.1 (node-cron) ──┘
                                └─> Phase 3 (Tests)
                                    └─> Phase 4 (Migration)
```

### Chemin Critique

1. Task 1.1.1 : Migration Prisma (2h)
2. Task 1.2.1 : Installer node-cron (15min)
3. Task 1.3.1 : Variables d'environnement (30min)
4. Task 2.2.1 : Rate Limiter (2h)
5. Task 2.1.1 : Email Service (4h)
6. Task 2.3.1 : Email Worker (4h)
7. Task 2.3.2 : Intégration server.js (1h)
8. Task 3.1.1 : Tests Email Service (3h)
9. Task 3.1.2 : Tests Email Worker (3h)
10. Task 3.2.1 : Test end-to-end (2h)
11. Task 4.1.1 : Déploiement staging (2h)
12. Task 4.1.3 : Activation complète (1h)

**Durée totale du chemin critique** : ~25h

---

## Notes d'Implémentation

### Ordre Recommandé

1. **Jour 1-2** : Phase 1 (Préparation)
   - Migration DB, installation dépendances, configuration

2. **Jour 3-7** : Phase 2 (Implémentation)
   - Rate Limiter → Email Service → Email Worker → Monitoring

3. **Jour 8-10** : Phase 3 (Tests)
   - Tests unitaires → Tests intégration → Tests charge

4. **Jour 11-15** : Phase 4 (Migration)
   - Déploiement progressif → Optimisation → Documentation

### Points d'Attention

⚠️ **Migration DB** : Tester en local avant staging  
⚠️ **Rate Limiting** : Vérifier les limites Gmail (100/h)  
⚠️ **Worker** : Tester le graceful shutdown  
⚠️ **Tests** : Utiliser des mocks SMTP pour éviter les envois réels  
⚠️ **Déploiement** : Activer progressivement par type d'email  

### Rollback Plan

En cas de problème critique :
1. Mettre `EMAIL_QUEUE_ENABLED=false`
2. Redémarrer le serveur
3. Analyser les logs Winston
4. Corriger le bug
5. Réactiver après validation

---

## Checklist de Complétion

### Phase 1 ✅
- [x] Migration Prisma appliquée
- [x] Index créés
- [x] Dépendances installées
- [x] Variables d'environnement configurées

### Phase 2 ✅
- [ ] Email Service refactoré
- [ ] Rate Limiter implémenté
- [ ] Email Worker créé
- [ ] Worker intégré dans server.js
- [ ] Endpoints de monitoring créés
- [ ] Logging Winston configuré

### Phase 3 ✅
- [ ] Tests unitaires > 80% couverture
- [ ] Tests d'intégration passent
- [ ] Tests de charge validés

### Phase 4 ✅
- [ ] Déployé en staging
- [ ] Queue activée progressivement
- [ ] Monitoring actif
- [ ] Documentation complète
- [ ] Équipe formée

---

**Date de création** : 2026-05-11  
**Dernière mise à jour** : 2026-05-11  
**Version** : 1.0