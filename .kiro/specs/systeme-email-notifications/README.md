# Système Email Notifications Performant

## Vue d'ensemble

Cette spec définit la refonte complète du service d'envoi d'emails (`email.service.js`) pour offrir une solution **fiable**, **traçable**, et **performante**.

## Problèmes du système actuel

1. ❌ **Envoi synchrone** : Bloque les actions métier en cas de problème réseau/SMTP
2. ❌ **Pas de traçabilité** : Impossible de savoir si un email a été envoyé ou non
3. ❌ **Pas de retry** : Un échec temporaire = email perdu
4. ❌ **Redondances** : `envoyerEmailBienvenue` et `envoyerEmailConfirmation` font la même chose
5. ❌ **Pas de rate limiting** : Risque d'abus et de dépassement des limites SMTP
6. ❌ **Signatures incohérentes** : Paramètres positionnels difficiles à maintenir

## Solutions apportées

### ✅ 1. Envoi Asynchrone avec Queue (Req 1, 14)
- File d'attente basée sur la table `EmailDelivery` (statut `QUEUED`)
- Worker séparé qui traite la queue en arrière-plan
- **Jamais de blocage** des actions métier

### ✅ 2. Traçabilité Complète (Req 2)
- Tous les emails enregistrés dans `EmailDelivery`
- Champs trackés : statut, tentatives, messageId, erreurs, codes SMTP
- Historique complet pour audit et diagnostic

### ✅ 3. Retry Automatique (Req 3)
- Stratégie exponential backoff : 1min → 5min → 15min → 1h → 4h
- Maximum 5 tentatives
- Alertes automatiques en cas d'échec définitif

### ✅ 4. Rate Limiting (Req 4)
- **10 emails max par candidat par heure**
- **100 emails max globalement par heure** (limite SMTP Gmail)
- Alertes si queue > 500 emails

### ✅ 5. Emails Standardisés (Req 5-9)
| Email | Méthode | Trigger | PDF |
|-------|---------|---------|-----|
| Confirmation de compte | `envoyerEmailConfirmation` | Création compte | ❌ |
| Pré-inscription | `envoyerEmailPreInscription` | Inscription concours | ✅ Fiche |
| Convocation | `envoyerEmailConvocation` | Validation contrôleur | ✅ Convocation |
| Rejet | `envoyerEmailRejet` | Rejet contrôleur | ❌ |
| Sous réserve | `envoyerEmailSousReserve` | Validation conditionnelle | ❌ |

**Note** : `envoyerEmailBienvenue` est **supprimée** et fusionnée dans `envoyerEmailConfirmation`

### ✅ 6. Signatures Standardisées (Req 10)
```javascript
// ❌ AVANT (paramètres positionnels)
envoyerEmailRejet(email, nom, prenom, concours, motif)

// ✅ APRÈS (objet de paramètres)
envoyerEmailRejet({ 
  candidatEmail, 
  candidatNom, 
  candidatPrenom, 
  concours, 
  motif 
})
```

### ✅ 7. Monitoring et Alertes (Req 11, 15)
- Logs structurés avec Winston/Pino
- Alertes automatiques dans `SystemAlert` :
  - Taux d'échec > 20% → `HIGH_FAILURE_RATE` (CRITICAL)
  - Queue > 500 emails → `QUEUE_OVERLOAD` (WARNING)
  - Erreur SMTP auth → `SMTP_ERROR` (CRITICAL)
  - Échec définitif → `DELIVERY_ISSUE` (ERROR)
- Métriques Prometheus
- Endpoint `/api/email/health`

### ✅ 8. Configuration Flexible (Req 12)
Variables d'environnement :
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
- `SMTP_FROM_EMAIL`, `SMTP_FROM_NAME`
- `APP_URL` (pour liens de confirmation)
- `ACADEMIC_YEAR` (année académique)
- `EMAIL_QUEUE_ENABLED` (activer/désactiver la queue)
- `EMAIL_RETRY_DELAYS` (délais de retry personnalisables)
- `EMAIL_RATE_LIMIT_PER_USER`, `EMAIL_RATE_LIMIT_GLOBAL`

### ✅ 9. Migration Progressive (Req 13)
- Compatible avec les appels actuels des contrôleurs
- Mode synchrone disponible via `EMAIL_QUEUE_ENABLED=false`
- Rollback possible en cas de problème
- Traçabilité même en mode synchrone

### ✅ 10. Tests et Qualité (Req 16)
- Couverture > 80%
- Tests unitaires + intégration + end-to-end
- Mocks SMTP pour éviter les envois réels

## Architecture

```
┌─────────────────┐
│   Controller    │ (auth, candidat, controleur)
└────────┬────────┘
         │ appelle
         ▼
┌─────────────────┐
│  Email Service  │ Crée entrée EmailDelivery (QUEUED)
└────────┬────────┘ Retourne immédiatement
         │
         ▼
┌─────────────────┐
│ EmailDelivery   │ Table Prisma (queue)
│   (QUEUED)      │
└────────┬────────┘
         │ interrogée par
         ▼
┌─────────────────┐
│  Email Worker   │ Processus séparé
│  (background)   │ Traite 5 emails en parallèle
└────────┬────────┘
         │ envoie via
         ▼
┌─────────────────┐
│  SMTP Server    │ Gmail
│   (Nodemailer)  │
└─────────────────┘
```

## Statuts EmailDelivery

```
PENDING → QUEUED → PROCESSING → SENT → DELIVERED
                        ↓
                     FAILED (retry)
                        ↓
                  (5 tentatives)
                        ↓
                     FAILED (définitif)
                     
BOUNCED (email rejeté par destinataire)
EXPIRED (rate limit dépassé)
```

## Prochaines étapes

1. **Design** : Créer `design.md` avec l'architecture détaillée
2. **Tasks** : Créer `tasks.md` avec les tâches d'implémentation
3. **Implémentation** :
   - Refactorer `email.service.js`
   - Créer `email.worker.js`
   - Ajouter rate limiting
   - Ajouter retry handler
   - Créer tests
   - Créer endpoint health
   - Documenter migration

## Liens avec autres specs

- **systeme-notifications-integre** : Le champ `notificationId` dans `EmailDelivery` permet de lier les emails aux notifications in-app
- **refonte-dossier-candidat-inscription** : Les emails utilisent les nouveaux modèles `Dossier` et `DossierInscription`

## Questions résolues

✅ **Token expiration** : 24 heures  
✅ **Rate limiting** : 10/user/hour, 100/global/hour  
✅ **Retry strategy** : 5 tentatives avec exponential backoff  
✅ **Queue system** : Database-based via `EmailDelivery`  
✅ **envoyerEmailBienvenue** : Supprimée, fusionnée dans confirmation  

## Métriques de succès

- ✅ 0% d'actions métier bloquées par l'envoi d'email
- ✅ 100% des emails tracés dans `EmailDelivery`
- ✅ < 5% de taux d'échec définitif
- ✅ < 30 secondes de délai moyen d'envoi
- ✅ > 80% de couverture de tests
