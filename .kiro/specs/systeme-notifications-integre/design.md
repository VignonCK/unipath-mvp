# Design Document - Système de Notifications Intégré

## Overview

Le système de notifications intégré UniPath est une solution complète de communication multi-canal qui remplace progressivement le système d'email actuel basé sur Nodemailer. Il offre:

- **Envoi d'emails transactionnels** avec gestion de files d'attente et retry automatique
- **Notifications in-app en temps réel** via WebSocket
- **Historique complet** des communications avec recherche et pagination
- **Dashboard de monitoring** pour les administrateurs
- **Logs d'audit** pour la conformité et la traçabilité
- **Migration progressive** sans interruption de service

### Objectifs Principaux

1. **Fiabilité**: Garantir la livraison des notifications critiques avec retry automatique
2. **Scalabilité**: Supporter un volume croissant de notifications (100+ par minute)
3. **Traçabilité**: Enregistrer tous les événements pour l'audit et le debugging
4. **Expérience utilisateur**: Notifications temps réel et historique consultable
5. **Maintenabilité**: Templates personnalisables sans modification de code

### Contraintes Techniques

- Backend: Node.js avec Express et Prisma ORM
- Base de données: PostgreSQL
- Frontend: React avec Vite
- Architecture: API REST + WebSocket
- Migration: Compatibilité avec le système Nodemailer existant

## Architecture

### Vue d'Ensemble du Système

```mermaid
graph TB
    subgraph "Frontend React"
        NC[NotificationCenter]
        Badge[Badge Compteur]
        Prefs[Préférences UI]
        AdminUI[Dashboard Admin]
    end

    subgraph "API Layer"
        REST[REST API]
        WS[WebSocket Server]
    end

    subgraph "Core Services"
        NS[NotificationService]
        ES[EmailService]
        TS[TemplateEngine]
        PS[PreferenceManager]
    end

    subgraph "Infrastructure"
        QM[QueueManager<br/>Bull/BullMQ]
        DT[DeliveryTracker]
        RH[RetryHandler]
        AL[AuditLogger]
    end

    subgraph "Data Layer"
        DB[(PostgreSQL)]
        Redis[(Redis Cache)]
    end

    subgraph "External"
        SMTP[SMTP Server]
    end

    NC --> REST
    NC --> WS
    AdminUI --> REST
    Prefs --> REST

    REST --> NS
    WS --> NS

    NS --> ES
    NS --> TS
    NS --> PS
    NS --> QM

    QM --> DT
    QM --> RH
    QM --> AL

    ES --> SMTP
    ES --> DT
    ES --> RH

    NS --> DB
    TS --> Redis
    DT --> DB
    AL --> DB
    PS --> DB
```

### Flux de Données Principaux

#### 1. Envoi d'Email Transactionnel

```mermaid
sequenceDiagram
    participant App as Application
    participant NS as NotificationService
    participant PM as PreferenceManager
    participant QM as QueueManager
    participant ES as EmailService
    participant SMTP as SMTP Server
    participant DT as DeliveryTracker

    App->>NS: sendNotification(event, user, data)
    NS->>PM: getUserPreferences(user)
    PM-->>NS: preferences
    
    alt Email enabled
        NS->>QM: enqueue(notification, priority)
        QM-->>NS: jobId
        NS->>DT: createDeliveryRecord(jobId, 'pending')
        
        QM->>ES: processEmail(notification)
        ES->>SMTP: sendMail(emailData)
        SMTP-->>ES: messageId
        ES->>DT: updateStatus(jobId, 'sent')
        
        alt Success
            SMTP-->>ES: delivery confirmation
            ES->>DT: updateStatus(jobId, 'delivered')
        else Failure
            SMTP-->>ES: error
            ES->>DT: updateStatus(jobId, 'failed')
            ES->>QM: scheduleRetry(jobId)
        end
    end
```

#### 2. Notification In-App Temps Réel

```mermaid
sequenceDiagram
    participant App as Application
    participant NS as NotificationService
    participant DB as Database
    participant WS as WebSocket Server
    participant Client as Frontend Client

    App->>NS: sendNotification(event, user, data)
    NS->>DB: createNotification(user, type, content)
    DB-->>NS: notificationId
    
    NS->>WS: emitToUser(userId, notification)
    WS->>Client: notification event
    Client->>Client: updateBadgeCount()
    Client->>Client: showToast()
```

### Composants Principaux

#### NotificationService (Orchestrateur)

**Responsabilités:**
- Point d'entrée unique pour toutes les notifications
- Coordination entre email et in-app
- Application des préférences utilisateur
- Gestion des priorités

**Interface:**
```typescript
interface NotificationService {
  sendNotification(params: SendNotificationParams): Promise<NotificationResult>
  getNotifications(userId: string, filters: NotificationFilters): Promise<Notification[]>
  markAsRead(notificationId: string): Promise<void>
  markAllAsRead(userId: string): Promise<void>
  getUnreadCount(userId: string): Promise<number>
}

interface SendNotificationParams {
  event: NotificationEvent
  userId: string
  data: Record<string, any>
  priority?: PriorityLevel
  channels?: NotificationChannel[]
}
```

#### EmailService

**Responsabilités:**
- Envoi d'emails via SMTP
- Gestion des pièces jointes
- Intégration avec le DeliveryTracker
- Respect des limites de taux

**Configuration SMTP:**
```javascript
{
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
  rateDelta: 3600000, // 1 heure
  rateLimit: 100 // 100 emails/heure
}
```

#### QueueManager (Bull/BullMQ)

**Responsabilités:**
- Gestion de la file d'attente des notifications
- Traitement asynchrone
- Gestion des priorités
- Monitoring de la file

**Configuration:**
```javascript
{
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD
  },
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 60000 // 1 minute
    },
    removeOnComplete: 100,
    removeOnFail: 500
  },
  limiter: {
    max: 100,
    duration: 60000 // 100 jobs par minute
  }
}
```

**Niveaux de priorité:**
- `urgent`: 1 (traité immédiatement, < 30s)
- `high`: 2 (traité rapidement, < 2 min)
- `normal`: 3 (traité normalement, < 5 min)
- `low`: 4 (traité quand possible, < 15 min)

#### TemplateEngine (Handlebars)

**Responsabilités:**
- Rendu des templates d'emails
- Validation de la syntaxe
- Cache des templates compilés
- Helpers personnalisés

**Helpers disponibles:**
```javascript
{
  formatDate: (date, format) => moment(date).format(format),
  uppercase: (str) => str.toUpperCase(),
  lowercase: (str) => str.toLowerCase(),
  truncate: (str, length) => str.substring(0, length) + '...',
  eq: (a, b) => a === b,
  ne: (a, b) => a !== b
}
```

**Exemple de template:**
```handlebars
<div style="font-family: Arial, sans-serif;">
  <h2 style="color: #008751;">{{title}}</h2>
  <p>Bonjour <strong>{{candidat.prenom}} {{candidat.nom}}</strong>,</p>
  <p>{{message}}</p>
  <p><strong>Numéro de dossier :</strong> {{numeroDossier}}</p>
  {{#if dateExamen}}
  <p><strong>Date de l'examen :</strong> {{formatDate dateExamen 'DD/MM/YYYY'}}</p>
  {{/if}}
  <hr/>
  <p style="color:#888;font-size:12px;">Université d'Abomey-Calavi | Année {{annee}}</p>
</div>
```

#### DeliveryTracker

**Responsabilités:**
- Suivi des statuts de livraison
- Enregistrement des tentatives
- Calcul des statistiques
- Détection des anomalies

**États de livraison:**
- `pending`: En attente de traitement
- `queued`: Dans la file d'attente
- `processing`: En cours de traitement
- `sent`: Envoyé au serveur SMTP
- `delivered`: Confirmé livré
- `failed`: Échec temporaire
- `bounced`: Rejeté définitivement
- `expired`: Expiré après max tentatives

#### RetryHandler

**Responsabilités:**
- Gestion des tentatives automatiques
- Stratégie de backoff exponentiel
- Limite de tentatives
- Alertes sur échecs définitifs

**Stratégie de retry:**
```javascript
{
  maxAttempts: 5,
  delays: [
    60000,      // 1 minute
    300000,     // 5 minutes
    900000,     // 15 minutes
    3600000,    // 1 heure
    14400000    // 4 heures
  ],
  onMaxAttemptsReached: (notification) => {
    // Créer une alerte admin
    // Marquer comme définitivement échoué
  }
}
```

#### AuditLogger

**Responsabilités:**
- Enregistrement de tous les événements
- Conformité RGPD
- Recherche dans les logs
- Export pour analyse

**Événements enregistrés:**
- Création de notification
- Envoi d'email
- Livraison confirmée
- Échec d'envoi
- Lecture de notification
- Modification de préférences
- Modification de template
- Accès aux données

## Components and Interfaces

### API REST Endpoints

#### Notifications

```
POST   /api/notifications              # Créer une notification
GET    /api/notifications              # Liste des notifications (paginée)
GET    /api/notifications/:id          # Détails d'une notification
PATCH  /api/notifications/:id/read     # Marquer comme lue
PATCH  /api/notifications/read-all     # Marquer toutes comme lues
DELETE /api/notifications/:id          # Supprimer une notification
GET    /api/notifications/unread-count # Nombre de non lues
```

#### Templates (Admin)

```
GET    /api/admin/templates            # Liste des templates
GET    /api/admin/templates/:id        # Détails d'un template
POST   /api/admin/templates            # Créer un template
PUT    /api/admin/templates/:id        # Modifier un template
DELETE /api/admin/templates/:id        # Supprimer un template
POST   /api/admin/templates/:id/preview # Prévisualiser avec données test
```

#### Préférences

```
GET    /api/preferences                # Préférences de l'utilisateur
PUT    /api/preferences                # Mettre à jour les préférences
POST   /api/preferences/reset          # Réinitialiser aux valeurs par défaut
```

#### Monitoring (Admin)

```
GET    /api/admin/dashboard/stats      # Statistiques globales
GET    /api/admin/dashboard/queue      # État de la file d'attente
GET    /api/admin/dashboard/failures   # Notifications échouées
GET    /api/admin/dashboard/alerts     # Alertes actives
GET    /api/admin/logs                 # Logs d'audit (paginés)
POST   /api/admin/notifications/:id/retry # Réessayer manuellement
```

### WebSocket Events

#### Client → Server

```javascript
// Connexion
socket.emit('authenticate', { token: 'jwt_token' })

// Marquer comme lue
socket.emit('mark_read', { notificationId: 'uuid' })

// S'abonner aux notifications
socket.emit('subscribe', { userId: 'uuid' })
```

#### Server → Client

```javascript
// Nouvelle notification
socket.on('notification', (notification) => {
  // { id, type, title, message, createdAt, read }
})

// Mise à jour du compteur
socket.on('unread_count', (count) => {
  // { count: 5 }
})

// Notification marquée comme lue
socket.on('notification_read', (notificationId) => {
  // 'uuid'
})
```

### Frontend Components

#### NotificationCenter

**Props:**
```typescript
interface NotificationCenterProps {
  userId: string
  onNotificationClick?: (notification: Notification) => void
  maxVisible?: number
  autoMarkAsRead?: boolean
}
```

**État:**
```typescript
interface NotificationCenterState {
  notifications: Notification[]
  unreadCount: number
  isOpen: boolean
  isLoading: boolean
  filter: NotificationFilter
  page: number
  hasMore: boolean
}
```

**Fonctionnalités:**
- Affichage en dropdown ou modal
- Badge avec compteur de non lues
- Filtrage par type
- Pagination infinie (scroll)
- Marquage comme lue au clic
- Connexion WebSocket automatique
- Mise à jour temps réel

#### NotificationBadge

**Props:**
```typescript
interface NotificationBadgeProps {
  count: number
  max?: number // Affiche "99+" si > max
  color?: string
  size?: 'small' | 'medium' | 'large'
}
```

#### PreferencesPanel

**Fonctionnalités:**
- Toggle par type d'événement
- Choix du canal (email, in-app, les deux)
- Sauvegarde automatique
- Indication des notifications critiques (non désactivables)

#### AdminDashboard

**Sections:**
1. **Vue d'ensemble**: Statistiques 24h, graphiques
2. **File d'attente**: Nombre en attente, temps moyen
3. **Échecs**: Liste des notifications échouées, retry manuel
4. **Templates**: Gestion des templates
5. **Logs**: Recherche et export des logs d'audit
6. **Alertes**: Alertes actives avec niveau de sévérité

## Data Models

### Schema Prisma Extensions

```prisma
// Nouvelle table: Notification
model Notification {
  id          String   @id @default(uuid())
  userId      String   // Candidat, Commission, ou DGES
  type        NotificationType
  title       String
  message     String   @db.Text
  data        Json?    // Données additionnelles
  read        Boolean  @default(false)
  readAt      DateTime?
  priority    PriorityLevel @default(NORMAL)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  expiresAt   DateTime? // Auto-suppression après 2 ans
  
  @@index([userId, createdAt(sort: Desc)])
  @@index([userId, read])
  @@index([type])
  @@index([expiresAt])
}

enum NotificationType {
  PRE_INSCRIPTION
  VALIDATION
  CONVOCATION
  REJET
  NOUVEAU_DOSSIER
  RAPPORT_HEBDO
  RAPPORT_MENSUEL
  SYSTEME
  ALERTE
}

enum PriorityLevel {
  LOW
  NORMAL
  HIGH
  URGENT
}

// Nouvelle table: NotificationTemplate
model NotificationTemplate {
  id          String   @id @default(uuid())
  name        String   @unique
  type        NotificationType
  subject     String
  htmlBody    String   @db.Text
  textBody    String?  @db.Text
  variables   Json     // Liste des variables disponibles
  isActive    Boolean  @default(true)
  isDefault   Boolean  @default(false)
  createdBy   String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([type])
  @@index([isActive])
}

// Nouvelle table: EmailDelivery
model EmailDelivery {
  id              String   @id @default(uuid())
  notificationId  String?  // Peut être null pour emails legacy
  userId          String
  recipient       String
  subject         String
  status          DeliveryStatus @default(PENDING)
  messageId       String?  // ID du serveur SMTP
  attempts        Int      @default(0)
  lastAttemptAt   DateTime?
  sentAt          DateTime?
  deliveredAt     DateTime?
  bouncedAt       DateTime?
  errorMessage    String?  @db.Text
  smtpCode        String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([notificationId])
  @@index([userId])
  @@index([status])
  @@index([createdAt(sort: Desc)])
}

enum DeliveryStatus {
  PENDING
  QUEUED
  PROCESSING
  SENT
  DELIVERED
  FAILED
  BOUNCED
  EXPIRED
}

// Nouvelle table: UserPreferences
model UserPreferences {
  id          String   @id @default(uuid())
  userId      String   @unique
  preferences Json     // Structure: { [NotificationType]: { email: bool, inApp: bool } }
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([userId])
}

// Nouvelle table: NotificationAuditLog
model NotificationAuditLog {
  id          String   @id @default(uuid())
  eventType   AuditEventType
  userId      String?  // Utilisateur concerné
  actorId     String?  // Utilisateur qui a effectué l'action
  resourceId  String?  // ID de la ressource (notification, template, etc.)
  resourceType String? // Type de ressource
  details     Json?    // Détails de l'événement
  ipAddress   String?
  userAgent   String?
  timestamp   DateTime @default(now())
  
  @@index([eventType])
  @@index([userId])
  @@index([actorId])
  @@index([timestamp(sort: Desc)])
  @@index([resourceType, resourceId])
}

enum AuditEventType {
  NOTIFICATION_CREATED
  NOTIFICATION_SENT
  NOTIFICATION_DELIVERED
  NOTIFICATION_FAILED
  NOTIFICATION_READ
  NOTIFICATION_DELETED
  TEMPLATE_CREATED
  TEMPLATE_UPDATED
  TEMPLATE_DELETED
  PREFERENCES_UPDATED
  DATA_ACCESSED
  RETRY_ATTEMPTED
  ALERT_CREATED
}

// Nouvelle table: SystemAlert
model SystemAlert {
  id          String   @id @default(uuid())
  type        AlertType
  severity    AlertSeverity
  title       String
  message     String   @db.Text
  data        Json?
  resolved    Boolean  @default(false)
  resolvedAt  DateTime?
  resolvedBy  String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([resolved])
  @@index([severity])
  @@index([createdAt(sort: Desc)])
}

enum AlertType {
  HIGH_FAILURE_RATE
  QUEUE_OVERLOAD
  SMTP_ERROR
  DELIVERY_ISSUE
  SYSTEM_ERROR
}

enum AlertSeverity {
  INFO
  WARNING
  ERROR
  CRITICAL
}
```

### Relations et Index

**Optimisations de performance:**

1. **Index composites** pour les requêtes fréquentes:
   - `(userId, createdAt DESC)` pour l'historique utilisateur
   - `(userId, read)` pour le compteur de non lues
   - `(type)` pour le filtrage par type
   - `(status)` pour le monitoring des livraisons

2. **Index sur les timestamps** pour:
   - Pagination chronologique
   - Recherche par période
   - Nettoyage automatique (expiresAt)

3. **Index sur les clés étrangères** pour:
   - Jointures rapides
   - Cascade deletes
   - Recherche par relation

### Stratégie de Nettoyage

**Cron job quotidien:**
```javascript
// Supprimer les notifications expirées (> 2 ans)
await prisma.notification.deleteMany({
  where: {
    expiresAt: {
      lt: new Date()
    }
  }
})

// Supprimer les logs d'audit anciens (> 3 ans)
await prisma.notificationAuditLog.deleteMany({
  where: {
    timestamp: {
      lt: new Date(Date.now() - 3 * 365 * 24 * 60 * 60 * 1000)
    }
  }
})

// Archiver les anciennes livraisons (> 1 an)
// Déplacer vers une table d'archive ou exporter
```


## Error Handling

### Stratégie Globale

Le système de notifications doit être résilient et gérer gracieusement tous les types d'erreurs sans perdre de données ni bloquer le système.

### Types d'Erreurs et Gestion

#### 1. Erreurs SMTP

**Erreurs temporaires (4xx):**
- `421`: Service non disponible
- `450`: Boîte mail temporairement indisponible
- `451`: Erreur de traitement local

**Action:** Retry automatique avec backoff exponentiel

**Erreurs permanentes (5xx):**
- `550`: Boîte mail inexistante
- `551`: Utilisateur non local
- `552`: Quota dépassé
- `553`: Adresse email invalide

**Action:** Marquer comme bounced, créer une alerte, ne pas retry

**Implémentation:**
```javascript
class SMTPErrorHandler {
  handle(error) {
    const code = error.responseCode
    
    if (code >= 400 && code < 500) {
      return {
        action: 'RETRY',
        delay: this.calculateBackoff(attempt),
        maxAttempts: 5
      }
    }
    
    if (code >= 500 && code < 600) {
      return {
        action: 'BOUNCE',
        createAlert: true,
        notifyAdmin: true
      }
    }
    
    // Erreurs réseau
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
      return {
        action: 'RETRY',
        delay: 60000, // 1 minute
        maxAttempts: 3
      }
    }
    
    // Erreur inconnue
    return {
      action: 'FAIL',
      createAlert: true,
      logDetails: true
    }
  }
}
```

#### 2. Erreurs de File d'Attente

**Erreurs possibles:**
- Redis indisponible
- File d'attente pleine
- Job bloqué (stalled)
- Timeout de traitement

**Gestion:**
```javascript
queue.on('error', (error) => {
  logger.error('Queue error:', error)
  metrics.increment('queue.errors')
  
  // Tenter de reconnecter
  if (error.code === 'ECONNREFUSED') {
    setTimeout(() => queue.reconnect(), 5000)
  }
})

queue.on('stalled', (job) => {
  logger.warn('Job stalled:', job.id)
  // Le job sera automatiquement réessayé
})

queue.on('failed', (job, error) => {
  logger.error('Job failed:', job.id, error)
  
  if (job.attemptsMade >= job.opts.attempts) {
    // Échec définitif
    await createAlert({
      type: 'JOB_FAILED',
      severity: 'ERROR',
      message: `Job ${job.id} failed after ${job.attemptsMade} attempts`,
      data: { jobId: job.id, error: error.message }
    })
  }
})
```

#### 3. Erreurs de Template

**Erreurs possibles:**
- Syntaxe invalide
- Variable manquante
- Helper inconnu
- Erreur de rendu

**Validation à la sauvegarde:**
```javascript
async function validateTemplate(template) {
  try {
    // Compiler le template
    const compiled = Handlebars.compile(template.htmlBody)
    
    // Tester avec des données fictives
    const testData = generateTestData(template.variables)
    const rendered = compiled(testData)
    
    // Valider le HTML
    if (!isValidHTML(rendered)) {
      throw new Error('Invalid HTML output')
    }
    
    return { valid: true }
  } catch (error) {
    return {
      valid: false,
      error: error.message,
      line: error.line,
      column: error.column
    }
  }
}
```

**Fallback au runtime:**
```javascript
async function renderTemplate(templateId, data) {
  try {
    const template = await getTemplate(templateId)
    const compiled = Handlebars.compile(template.htmlBody)
    return compiled(data)
  } catch (error) {
    logger.error('Template rendering failed:', error)
    
    // Utiliser le template par défaut
    const defaultTemplate = await getDefaultTemplate(template.type)
    const compiled = Handlebars.compile(defaultTemplate.htmlBody)
    return compiled(data)
  }
}
```

#### 4. Erreurs de Base de Données

**Erreurs possibles:**
- Connexion perdue
- Timeout de requête
- Contrainte violée
- Deadlock

**Gestion avec Prisma:**
```javascript
async function withRetry(operation, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      // Erreurs temporaires
      if (
        error.code === 'P2024' || // Timeout
        error.code === 'P2034' || // Transaction failed
        error.message.includes('Connection')
      ) {
        if (attempt < maxRetries) {
          await sleep(1000 * attempt)
          continue
        }
      }
      
      // Erreurs permanentes
      throw error
    }
  }
}

// Utilisation
await withRetry(async () => {
  return await prisma.notification.create({ data: notificationData })
})
```

#### 5. Erreurs WebSocket

**Erreurs possibles:**
- Connexion perdue
- Client déconnecté
- Message invalide
- Timeout

**Gestion:**
```javascript
io.on('connection', (socket) => {
  socket.on('error', (error) => {
    logger.error('Socket error:', error)
  })
  
  socket.on('disconnect', (reason) => {
    logger.info('Client disconnected:', reason)
    // Nettoyer les ressources
    cleanupUserSession(socket.userId)
  })
  
  // Heartbeat pour détecter les connexions mortes
  socket.on('pong', () => {
    socket.isAlive = true
  })
})

// Ping toutes les 30 secondes
setInterval(() => {
  io.sockets.sockets.forEach((socket) => {
    if (socket.isAlive === false) {
      return socket.terminate()
    }
    socket.isAlive = false
    socket.ping()
  })
}, 30000)
```

### Circuit Breaker Pattern

Pour protéger contre les défaillances en cascade:

```javascript
class CircuitBreaker {
  constructor(threshold = 5, timeout = 60000) {
    this.failureCount = 0
    this.threshold = threshold
    this.timeout = timeout
    this.state = 'CLOSED' // CLOSED, OPEN, HALF_OPEN
    this.nextAttempt = Date.now()
  }
  
  async execute(operation) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN')
      }
      this.state = 'HALF_OPEN'
    }
    
    try {
      const result = await operation()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }
  
  onSuccess() {
    this.failureCount = 0
    this.state = 'CLOSED'
  }
  
  onFailure() {
    this.failureCount++
    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN'
      this.nextAttempt = Date.now() + this.timeout
      logger.error('Circuit breaker opened')
    }
  }
}

// Utilisation
const smtpCircuitBreaker = new CircuitBreaker(5, 60000)

async function sendEmail(data) {
  return await smtpCircuitBreaker.execute(async () => {
    return await transporter.sendMail(data)
  })
}
```

### Logging et Monitoring

**Niveaux de log:**
- `ERROR`: Erreurs nécessitant une intervention
- `WARN`: Situations anormales mais gérées
- `INFO`: Événements importants
- `DEBUG`: Détails pour le debugging

**Métriques à surveiller:**
- Taux d'erreur par type
- Temps de réponse moyen
- Taille de la file d'attente
- Nombre de retries
- Taux de bounce
- Disponibilité des services

**Alertes automatiques:**
- Taux d'erreur > 10% sur 24h
- File d'attente > 1000 jobs
- Circuit breaker ouvert
- Service externe indisponible > 5 min
- Échec définitif d'une notification critique

## Testing Strategy

### Approche Globale

Le système de notifications intégré nécessite une stratégie de test complète combinant plusieurs types de tests. **Les tests basés sur les propriétés (Property-Based Testing) ne sont PAS appropriés** pour ce système car il s'agit principalement d'infrastructure, d'intégrations externes, et d'opérations CRUD déterministes.

### Pourquoi PBT n'est pas approprié ici

1. **Infrastructure as Code**: Le système gère des files d'attente, des connexions SMTP, et des WebSockets - ce sont des configurations, pas des fonctions pures
2. **Intégrations externes**: Les comportements dépendent de services externes (SMTP, Redis) qui ne varient pas de manière significative avec les entrées
3. **Opérations CRUD**: La création, lecture, mise à jour de notifications sont des opérations déterministes mieux testées avec des exemples concrets
4. **Side-effects**: L'envoi d'emails et les notifications WebSocket sont des effets de bord sans valeur de retour à valider universellement

### Types de Tests Recommandés

#### 1. Tests Unitaires (Jest)

**Objectif**: Tester la logique métier isolée

**Composants à tester:**

**NotificationService:**
```javascript
describe('NotificationService', () => {
  describe('sendNotification', () => {
    it('should create notification with correct data', async () => {
      const result = await notificationService.sendNotification({
        event: 'PRE_INSCRIPTION',
        userId: 'user-123',
        data: { numeroDossier: 'D001' }
      })
      
      expect(result.notificationId).toBeDefined()
      expect(result.channels).toContain('email')
      expect(result.channels).toContain('inApp')
    })
    
    it('should respect user preferences', async () => {
      await preferenceManager.setPreferences('user-123', {
        PRE_INSCRIPTION: { email: false, inApp: true }
      })
      
      const result = await notificationService.sendNotification({
        event: 'PRE_INSCRIPTION',
        userId: 'user-123',
        data: {}
      })
      
      expect(result.channels).not.toContain('email')
      expect(result.channels).toContain('inApp')
    })
    
    it('should always send critical notifications', async () => {
      await preferenceManager.setPreferences('user-123', {
        VALIDATION: { email: false, inApp: false }
      })
      
      const result = await notificationService.sendNotification({
        event: 'VALIDATION',
        userId: 'user-123',
        data: {}
      })
      
      // Les notifications critiques ignorent les préférences
      expect(result.channels).toContain('email')
      expect(result.channels).toContain('inApp')
    })
  })
})
```

**TemplateEngine:**
```javascript
describe('TemplateEngine', () => {
  it('should render template with variables', () => {
    const template = 'Bonjour {{prenom}} {{nom}}'
    const result = templateEngine.render(template, {
      prenom: 'Jean',
      nom: 'Dupont'
    })
    
    expect(result).toBe('Bonjour Jean Dupont')
  })
  
  it('should use default template on error', async () => {
    const invalidTemplate = 'Bonjour {{#invalid}}'
    const result = await templateEngine.renderSafe(invalidTemplate, {}, 'PRE_INSCRIPTION')
    
    expect(result).toContain('Pré-inscription') // Template par défaut
  })
  
  it('should validate template syntax', () => {
    const valid = templateEngine.validate('Bonjour {{nom}}')
    expect(valid.isValid).toBe(true)
    
    const invalid = templateEngine.validate('Bonjour {{#unclosed}')
    expect(invalid.isValid).toBe(false)
    expect(invalid.error).toBeDefined()
  })
})
```

**RetryHandler:**
```javascript
describe('RetryHandler', () => {
  it('should calculate exponential backoff', () => {
    const delays = [
      retryHandler.getDelay(1),
      retryHandler.getDelay(2),
      retryHandler.getDelay(3),
      retryHandler.getDelay(4),
      retryHandler.getDelay(5)
    ]
    
    expect(delays).toEqual([60000, 300000, 900000, 3600000, 14400000])
  })
  
  it('should not exceed max attempts', async () => {
    const job = { attemptsMade: 5, opts: { attempts: 5 } }
    const shouldRetry = retryHandler.shouldRetry(job)
    
    expect(shouldRetry).toBe(false)
  })
  
  it('should create alert on max attempts', async () => {
    const createAlertSpy = jest.spyOn(alertService, 'create')
    
    await retryHandler.onMaxAttemptsReached({
      id: 'job-123',
      data: { notificationId: 'notif-123' }
    })
    
    expect(createAlertSpy).toHaveBeenCalledWith({
      type: 'HIGH_FAILURE_RATE',
      severity: 'ERROR',
      message: expect.stringContaining('job-123')
    })
  })
})
```

#### 2. Tests d'Intégration

**Objectif**: Tester l'interaction entre composants

**Base de données (avec Prisma):**
```javascript
describe('Notification Integration', () => {
  beforeEach(async () => {
    await prisma.notification.deleteMany()
    await prisma.emailDelivery.deleteMany()
  })
  
  it('should create notification and email delivery record', async () => {
    const notification = await notificationService.sendNotification({
      event: 'PRE_INSCRIPTION',
      userId: 'user-123',
      data: { email: 'test@example.com' }
    })
    
    const dbNotification = await prisma.notification.findUnique({
      where: { id: notification.notificationId }
    })
    expect(dbNotification).toBeDefined()
    
    const delivery = await prisma.emailDelivery.findFirst({
      where: { notificationId: notification.notificationId }
    })
    expect(delivery).toBeDefined()
    expect(delivery.status).toBe('QUEUED')
  })
  
  it('should update delivery status on send', async () => {
    const notification = await notificationService.sendNotification({
      event: 'PRE_INSCRIPTION',
      userId: 'user-123',
      data: { email: 'test@example.com' }
    })
    
    // Simuler le traitement de la file
    await queueManager.processNext()
    
    const delivery = await prisma.emailDelivery.findFirst({
      where: { notificationId: notification.notificationId }
    })
    expect(delivery.status).toBe('SENT')
    expect(delivery.sentAt).toBeDefined()
  })
})
```

**File d'attente (avec Bull):**
```javascript
describe('Queue Integration', () => {
  it('should process jobs in priority order', async () => {
    const processed = []
    
    queue.process(async (job) => {
      processed.push(job.data.priority)
    })
    
    await queue.add({ priority: 'LOW' }, { priority: 4 })
    await queue.add({ priority: 'URGENT' }, { priority: 1 })
    await queue.add({ priority: 'NORMAL' }, { priority: 3 })
    
    await sleep(1000)
    
    expect(processed).toEqual(['URGENT', 'NORMAL', 'LOW'])
  })
  
  it('should retry failed jobs', async () => {
    let attempts = 0
    
    queue.process(async (job) => {
      attempts++
      if (attempts < 3) {
        throw new Error('Temporary failure')
      }
      return 'success'
    })
    
    await queue.add({ test: 'data' })
    await sleep(5000) // Attendre les retries
    
    expect(attempts).toBe(3)
  })
})
```

#### 3. Tests End-to-End

**Objectif**: Tester le flux complet

**Avec Supertest:**
```javascript
describe('Notification E2E', () => {
  it('should send notification and receive via WebSocket', async (done) => {
    const socket = io('http://localhost:3000', {
      auth: { token: testUserToken }
    })
    
    socket.on('notification', (notification) => {
      expect(notification.type).toBe('PRE_INSCRIPTION')
      expect(notification.title).toBeDefined()
      socket.disconnect()
      done()
    })
    
    // Créer une notification via API
    await request(app)
      .post('/api/notifications')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        event: 'PRE_INSCRIPTION',
        userId: testUserId,
        data: { numeroDossier: 'D001' }
      })
      .expect(201)
  })
  
  it('should mark notification as read', async () => {
    // Créer une notification
    const createRes = await request(app)
      .post('/api/notifications')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        event: 'PRE_INSCRIPTION',
        userId: testUserId,
        data: {}
      })
    
    const notificationId = createRes.body.notificationId
    
    // Marquer comme lue
    await request(app)
      .patch(`/api/notifications/${notificationId}/read`)
      .set('Authorization', `Bearer ${testUserToken}`)
      .expect(200)
    
    // Vérifier
    const getRes = await request(app)
      .get(`/api/notifications/${notificationId}`)
      .set('Authorization', `Bearer ${testUserToken}`)
      .expect(200)
    
    expect(getRes.body.read).toBe(true)
    expect(getRes.body.readAt).toBeDefined()
  })
})
```

#### 4. Tests de Charge (optionnel)

**Objectif**: Valider la performance et la scalabilité

**Avec Artillery ou k6:**
```yaml
# artillery-config.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Sustained load"
    - duration: 60
      arrivalRate: 100
      name: "Peak load"

scenarios:
  - name: "Send notifications"
    flow:
      - post:
          url: "/api/notifications"
          headers:
            Authorization: "Bearer {{token}}"
          json:
            event: "PRE_INSCRIPTION"
            userId: "{{userId}}"
            data: {}
```

#### 5. Tests de Sécurité

**Validation des entrées:**
```javascript
describe('Security', () => {
  it('should sanitize HTML in notification content', async () => {
    const result = await notificationService.sendNotification({
      event: 'SYSTEME',
      userId: 'user-123',
      data: {
        message: '<script>alert("XSS")</script>Hello'
      }
    })
    
    const notification = await prisma.notification.findUnique({
      where: { id: result.notificationId }
    })
    
    expect(notification.message).not.toContain('<script>')
    expect(notification.message).toContain('Hello')
  })
  
  it('should mask email in logs', () => {
    const masked = logger.maskEmail('john.doe@example.com')
    expect(masked).toBe('joh***@example.com')
  })
  
  it('should encrypt sensitive data at rest', async () => {
    const notification = await prisma.notification.create({
      data: {
        userId: 'user-123',
        type: 'PRE_INSCRIPTION',
        title: 'Test',
        message: 'Test',
        data: { numeroDossier: 'D001' }
      }
    })
    
    // Vérifier que les données sensibles sont chiffrées
    const raw = await prisma.$queryRaw`
      SELECT data FROM "Notification" WHERE id = ${notification.id}
    `
    
    expect(raw[0].data).not.toContain('D001') // Chiffré
  })
})
```

### Couverture de Test Cible

- **Couverture de code**: Minimum 80%
- **Couverture des branches**: Minimum 75%
- **Tests critiques**: 100% (envoi email, retry, audit)

### CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run migrations
        run: npx prisma migrate deploy
      
      - name: Run tests
        run: npm test -- --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

### Stratégie de Test par Requirement

| Requirement | Type de Test | Priorité |
|-------------|--------------|----------|
| Req 1: Envoi emails | Intégration + E2E | Critique |
| Req 2: Templates | Unitaire + Intégration | Haute |
| Req 3: Notifications in-app | E2E + WebSocket | Critique |
| Req 4: Historique | Intégration | Moyenne |
| Req 5: Préférences | Unitaire + Intégration | Haute |
| Req 6: File d'attente | Intégration | Critique |
| Req 7: Retry | Unitaire + Intégration | Critique |
| Req 8: Suivi livraison | Intégration | Haute |
| Req 9-10: Notifications rôles | E2E | Moyenne |
| Req 11: Dashboard | E2E | Moyenne |
| Req 12: Audit | Intégration | Haute |
| Req 13: Migration | Intégration + E2E | Critique |
| Req 14: Sécurité | Sécurité + Unitaire | Critique |
| Req 15: Performance | Charge | Moyenne |


## Migration Strategy

### Approche Progressive

La migration depuis le système Nodemailer actuel vers le nouveau système de notifications doit être progressive et sans interruption de service.

### Phase 1: Infrastructure (Semaine 1-2)

**Objectifs:**
- Mettre en place l'infrastructure de base
- Déployer sans activer

**Actions:**
1. Créer les nouvelles tables de base de données
2. Déployer Redis pour la file d'attente
3. Configurer Bull/BullMQ
4. Créer les services de base (sans les activer)
5. Mettre en place le monitoring

**Migration Prisma:**
```bash
# Créer la migration
npx prisma migrate dev --name add_notification_system

# Appliquer en production
npx prisma migrate deploy
```

**Vérification:**
```javascript
// Health check endpoint
app.get('/api/health/notifications', async (req, res) => {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    queue: await checkQueue(),
    smtp: await checkSMTP()
  }
  
  const allHealthy = Object.values(checks).every(c => c.healthy)
  
  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'healthy' : 'degraded',
    checks
  })
})
```

### Phase 2: Dual Write (Semaine 3-4)

**Objectifs:**
- Écrire dans les deux systèmes simultanément
- Valider le nouveau système en production

**Implémentation:**
```javascript
// email.service.js - Version de transition
class EmailService {
  async sendEmail(type, data) {
    const useNewSystem = await featureFlags.isEnabled('new_notification_system', type)
    
    if (useNewSystem) {
      // Nouveau système
      try {
        const result = await notificationService.sendNotification({
          event: type,
          userId: data.userId,
          data: data
        })
        
        // Log pour comparaison
        await logMigration({
          type,
          system: 'new',
          success: true,
          notificationId: result.notificationId
        })
        
        return result
      } catch (error) {
        // Fallback vers l'ancien système
        logger.error('New system failed, falling back to legacy', error)
        return await this.sendEmailLegacy(type, data)
      }
    } else {
      // Ancien système
      const result = await this.sendEmailLegacy(type, data)
      
      // Enregistrer dans le nouveau système pour l'historique
      try {
        await notificationService.recordLegacyNotification({
          event: type,
          userId: data.userId,
          data: data,
          legacyResult: result
        })
      } catch (error) {
        // Ne pas bloquer si l'enregistrement échoue
        logger.warn('Failed to record legacy notification', error)
      }
      
      return result
    }
  }
  
  async sendEmailLegacy(type, data) {
    // Code actuel Nodemailer
    switch (type) {
      case 'PRE_INSCRIPTION':
        return await envoyerEmailPreInscription(data)
      case 'VALIDATION':
        return await envoyerEmailValidation(data)
      case 'REJET':
        return await envoyerEmailRejet(data)
      default:
        throw new Error(`Unknown email type: ${type}`)
    }
  }
}
```

**Feature Flags:**
```javascript
// feature-flags.js
class FeatureFlags {
  constructor() {
    this.flags = {
      new_notification_system: {
        PRE_INSCRIPTION: false,
        VALIDATION: false,
        REJET: false,
        NOUVEAU_DOSSIER: false,
        RAPPORT_HEBDO: false,
        RAPPORT_MENSUEL: false
      }
    }
  }
  
  async isEnabled(flag, subFlag) {
    // Charger depuis la base de données ou variable d'environnement
    const config = await this.loadConfig()
    return config[flag]?.[subFlag] ?? false
  }
  
  async enable(flag, subFlag) {
    await this.updateConfig(flag, subFlag, true)
    logger.info(`Feature flag enabled: ${flag}.${subFlag}`)
  }
  
  async disable(flag, subFlag) {
    await this.updateConfig(flag, subFlag, false)
    logger.info(`Feature flag disabled: ${flag}.${subFlag}`)
  }
}
```

**Monitoring de la migration:**
```javascript
// Dashboard de comparaison
app.get('/api/admin/migration/stats', async (req, res) => {
  const stats = await prisma.migrationLog.groupBy({
    by: ['type', 'system', 'success'],
    _count: true,
    where: {
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24h
      }
    }
  })
  
  res.json({
    legacy: stats.filter(s => s.system === 'legacy'),
    new: stats.filter(s => s.system === 'new'),
    successRate: {
      legacy: calculateSuccessRate(stats, 'legacy'),
      new: calculateSuccessRate(stats, 'new')
    }
  })
})
```

### Phase 3: Migration Progressive par Type (Semaine 5-8)

**Ordre de migration:**
1. **Semaine 5**: NOUVEAU_DOSSIER (faible volume, non critique)
2. **Semaine 6**: RAPPORT_HEBDO et RAPPORT_MENSUEL (planifiés, prévisibles)
3. **Semaine 7**: PRE_INSCRIPTION (volume moyen, important)
4. **Semaine 8**: VALIDATION et REJET (critiques, haute priorité)

**Procédure par type:**
```bash
# 1. Activer le feature flag pour un type
curl -X POST http://localhost:3000/api/admin/feature-flags \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"flag": "new_notification_system", "subFlag": "NOUVEAU_DOSSIER", "enabled": true}'

# 2. Surveiller pendant 24h
# - Vérifier les logs
# - Comparer les taux de succès
# - Vérifier les temps de réponse

# 3. Si OK, passer au type suivant
# Si problème, désactiver immédiatement
curl -X POST http://localhost:3000/api/admin/feature-flags \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"flag": "new_notification_system", "subFlag": "NOUVEAU_DOSSIER", "enabled": false}'
```

**Critères de validation:**
- Taux de succès ≥ 99%
- Temps de réponse < 500ms (p95)
- Aucune perte de notification
- Aucune erreur critique

### Phase 4: Nettoyage (Semaine 9-10)

**Objectifs:**
- Supprimer l'ancien code
- Nettoyer les feature flags
- Optimiser le nouveau système

**Actions:**
1. Vérifier que tous les types utilisent le nouveau système
2. Supprimer les fonctions legacy (envoyerEmailPreInscription, etc.)
3. Supprimer les feature flags
4. Nettoyer les logs de migration
5. Mettre à jour la documentation

**Code final:**
```javascript
// email.service.js - Version finale
class EmailService {
  async sendEmail(type, data) {
    return await notificationService.sendNotification({
      event: type,
      userId: data.userId,
      data: data
    })
  }
}
```

### Rollback Plan

**En cas de problème critique:**

1. **Désactivation immédiate:**
```javascript
// Désactiver tous les feature flags
await featureFlags.disableAll('new_notification_system')
```

2. **Vérification:**
```bash
# Vérifier que le système legacy fonctionne
curl http://localhost:3000/api/health/email-legacy
```

3. **Investigation:**
- Consulter les logs d'erreur
- Analyser les métriques
- Identifier la cause racine

4. **Correction:**
- Corriger le problème
- Tester en environnement de staging
- Réactiver progressivement

### Migration des Données Historiques

**Optionnel**: Migrer l'historique des emails envoyés

```javascript
// scripts/migrate-email-history.js
async function migrateEmailHistory() {
  // Récupérer les logs d'emails depuis l'ancien système
  const legacyEmails = await getLegacyEmailLogs()
  
  for (const email of legacyEmails) {
    try {
      await prisma.notification.create({
        data: {
          userId: email.userId,
          type: mapLegacyType(email.type),
          title: email.subject,
          message: extractTextFromHTML(email.html),
          read: true, // Considéré comme lu
          createdAt: email.sentAt,
          updatedAt: email.sentAt
        }
      })
      
      await prisma.emailDelivery.create({
        data: {
          userId: email.userId,
          recipient: email.to,
          subject: email.subject,
          status: 'DELIVERED',
          sentAt: email.sentAt,
          deliveredAt: email.sentAt,
          createdAt: email.sentAt
        }
      })
    } catch (error) {
      logger.error('Failed to migrate email:', email.id, error)
    }
  }
}
```

## Deployment Considerations

### Infrastructure Requirements

**Serveurs:**
- **API Server**: Node.js 18+, 2 CPU, 4GB RAM minimum
- **Redis**: Version 7+, 1GB RAM minimum
- **PostgreSQL**: Version 15+, 4GB RAM minimum
- **SMTP**: Serveur SMTP configuré avec TLS

**Scaling:**
- API: Horizontal scaling avec load balancer
- Redis: Redis Cluster pour haute disponibilité
- PostgreSQL: Read replicas pour les requêtes de lecture
- Queue Workers: Instances dédiées pour le traitement

### Environment Variables

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/unipath"

# Redis
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD="secret"

# SMTP
EMAIL_HOST="smtp.example.com"
EMAIL_PORT="587"
EMAIL_USER="noreply@unipath.bj"
EMAIL_PASS="secret"
EMAIL_FROM="noreply@unipath.bj"

# Notification System
NOTIFICATION_QUEUE_CONCURRENCY="10"
NOTIFICATION_MAX_RETRIES="5"
NOTIFICATION_RATE_LIMIT="100" # emails per hour

# WebSocket
WEBSOCKET_PORT="3001"
WEBSOCKET_CORS_ORIGIN="https://unipath.bj"

# Feature Flags
FEATURE_NEW_NOTIFICATION_SYSTEM="false"

# Monitoring
SENTRY_DSN="https://..."
LOG_LEVEL="info"
```

### Docker Compose

```yaml
version: '3.8'

services:
  api:
    build: ./unipath-api
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
  
  queue-worker:
    build: ./unipath-api
    command: node src/workers/notification-worker.js
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    deploy:
      replicas: 3
  
  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=unipath
      - POSTGRES_USER=unipath
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
  
  redis:
    image: redis:7
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    restart: unless-stopped
  
  redis-commander:
    image: rediscommander/redis-commander
    environment:
      - REDIS_HOSTS=local:redis:6379:0:${REDIS_PASSWORD}
    ports:
      - "8081:8081"
    depends_on:
      - redis

volumes:
  postgres_data:
  redis_data:
```

### Monitoring et Observabilité

**Métriques à surveiller:**

```javascript
// Prometheus metrics
const promClient = require('prom-client')

const notificationsSent = new promClient.Counter({
  name: 'notifications_sent_total',
  help: 'Total number of notifications sent',
  labelNames: ['type', 'channel', 'status']
})

const notificationDuration = new promClient.Histogram({
  name: 'notification_duration_seconds',
  help: 'Duration of notification processing',
  labelNames: ['type', 'channel'],
  buckets: [0.1, 0.5, 1, 2, 5, 10]
})

const queueSize = new promClient.Gauge({
  name: 'notification_queue_size',
  help: 'Current size of notification queue',
  labelNames: ['priority']
})

const deliveryRate = new promClient.Gauge({
  name: 'notification_delivery_rate',
  help: 'Notification delivery success rate',
  labelNames: ['type']
})
```

**Dashboards Grafana:**
- Vue d'ensemble: Volume, taux de succès, latence
- File d'attente: Taille, temps d'attente, workers actifs
- Emails: Envoyés, livrés, bounced, failed
- WebSocket: Connexions actives, messages/sec
- Erreurs: Taux d'erreur par type, alertes actives

**Alertes:**
```yaml
# alerts.yml
groups:
  - name: notifications
    interval: 1m
    rules:
      - alert: HighFailureRate
        expr: rate(notifications_sent_total{status="failed"}[5m]) > 0.1
        for: 5m
        annotations:
          summary: "High notification failure rate"
      
      - alert: QueueOverload
        expr: notification_queue_size > 1000
        for: 5m
        annotations:
          summary: "Notification queue overloaded"
      
      - alert: SlowProcessing
        expr: histogram_quantile(0.95, notification_duration_seconds) > 5
        for: 10m
        annotations:
          summary: "Slow notification processing"
```

### Security Considerations

**Authentification:**
- JWT tokens pour l'API REST
- Token validation pour WebSocket
- Rate limiting par utilisateur

**Autorisation:**
- RBAC pour les endpoints admin
- Isolation des données par utilisateur
- Validation des permissions

**Chiffrement:**
- TLS pour SMTP
- HTTPS pour l'API
- WSS pour WebSocket
- Chiffrement at-rest pour données sensibles

**Validation:**
- Validation des entrées avec Zod
- Sanitization HTML
- Protection XSS
- Protection CSRF

**Audit:**
- Logs de toutes les actions sensibles
- Traçabilité complète
- Conformité RGPD

### Performance Optimization

**Caching:**
```javascript
// Cache Redis pour les templates
const templateCache = {
  async get(templateId) {
    const cached = await redis.get(`template:${templateId}`)
    if (cached) return JSON.parse(cached)
    
    const template = await prisma.notificationTemplate.findUnique({
      where: { id: templateId }
    })
    
    await redis.setex(`template:${templateId}`, 3600, JSON.stringify(template))
    return template
  },
  
  async invalidate(templateId) {
    await redis.del(`template:${templateId}`)
  }
}
```

**Database Optimization:**
```sql
-- Index pour les requêtes fréquentes
CREATE INDEX CONCURRENTLY idx_notifications_user_created 
  ON "Notification" (user_id, created_at DESC);

CREATE INDEX CONCURRENTLY idx_notifications_user_read 
  ON "Notification" (user_id, read);

CREATE INDEX CONCURRENTLY idx_email_delivery_status 
  ON "EmailDelivery" (status, created_at DESC);

-- Partitioning pour les grandes tables
CREATE TABLE "Notification_2025_01" PARTITION OF "Notification"
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
```

**Connection Pooling:**
```javascript
// Prisma connection pool
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  log: ['error', 'warn'],
  errorFormat: 'minimal',
  // Connection pool configuration
  pool: {
    min: 2,
    max: 10,
    acquireTimeoutMillis: 30000,
    idleTimeoutMillis: 30000
  }
})
```

### Backup and Recovery

**Backup Strategy:**
- Base de données: Backup quotidien avec rétention 30 jours
- Redis: Snapshot toutes les heures
- Logs: Archivage mensuel

**Recovery Procedures:**
```bash
# Restaurer la base de données
pg_restore -d unipath backup_2025_01_15.dump

# Restaurer Redis
redis-cli --rdb dump.rdb

# Rejouer les notifications échouées
node scripts/replay-failed-notifications.js --from="2025-01-15" --to="2025-01-16"
```

## Conclusion

Le système de notifications intégré UniPath offre une solution complète et robuste pour la communication avec les utilisateurs. La conception modulaire, la stratégie de migration progressive, et les mécanismes de résilience garantissent une transition en douceur depuis le système actuel tout en posant les bases d'une plateforme scalable et maintenable.

### Points Clés

1. **Architecture modulaire**: Services découplés et réutilisables
2. **Fiabilité**: Retry automatique, circuit breaker, monitoring
3. **Scalabilité**: File d'attente, caching, horizontal scaling
4. **Traçabilité**: Audit complet, logs détaillés, conformité RGPD
5. **Migration sûre**: Feature flags, dual write, rollback plan

### Prochaines Étapes

1. Valider le design avec les stakeholders
2. Créer les tâches d'implémentation détaillées
3. Mettre en place l'infrastructure de développement
4. Commencer l'implémentation par phases
5. Tester rigoureusement chaque composant
6. Déployer progressivement en production

