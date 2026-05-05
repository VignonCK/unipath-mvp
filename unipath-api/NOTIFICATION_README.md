# 🔔 Système de Notifications UniPath

## Vue d'Ensemble

Système de notifications intégré permettant d'envoyer des notifications in-app et des emails aux candidats, membres de la commission et administrateurs DGES.

**Statut:** ✅ Phase 1 (MVP) Fonctionnelle  
**Version:** 1.0  
**Date:** Mai 2026

---

## 🚀 Démarrage Rapide

### Test Simple
```bash
node test-emails-tous-types.js
```

### Utilisation dans le Code
```javascript
const notificationService = require('./src/services/notification.service');

await notificationService.sendNotification({
  event: 'PRE_INSCRIPTION',
  userId: candidat.id,
  data: {
    candidatEmail: 'email@example.com',
    candidatNom: 'NOM',
    candidatPrenom: 'Prénom',
    concours: 'Master Informatique',
    numeroDossier: 'DOSS-12345'
  },
  priority: 'HIGH',
  sendEmail: true
});
```

---

## 📋 Types de Notifications

### 1. PRE_INSCRIPTION
Envoyé lors de la création d'une inscription.

**Données requises:**
```javascript
{
  candidatEmail: string,
  candidatNom: string,
  candidatPrenom: string,
  concours: string,
  numeroDossier: string
}
```

### 2. VALIDATION
Envoyé lors de la validation d'un dossier.

**Données requises:**
```javascript
{
  candidatEmail: string,
  candidatNom: string,
  candidatPrenom: string,
  concours: string,
  numeroDossier: string,
  dateExamen: string (optionnel),
  lieuExamen: string (optionnel)
}
```

### 3. REJET
Envoyé lors du rejet d'un dossier.

**Données requises:**
```javascript
{
  candidatEmail: string,
  candidatNom: string,
  candidatPrenom: string,
  concours: string,
  numeroDossier: string,
  motif: string (optionnel)
}
```

---

## 🔌 API REST

### Endpoints Disponibles

#### Récupérer les notifications
```http
GET /api/notifications
Headers: x-user-id: <userId>
Query: ?page=1&limit=20&type=PRE_INSCRIPTION&read=false
```

#### Compter les non lues
```http
GET /api/notifications/unread-count
Headers: x-user-id: <userId>
```

#### Marquer comme lu
```http
PATCH /api/notifications/:id/read
Headers: x-user-id: <userId>
```

#### Tout marquer comme lu
```http
PATCH /api/notifications/read-all
Headers: x-user-id: <userId>
```

---

## 🏗️ Architecture

```
NotificationService
    ├─→ EmailService (Nodemailer)
    │   └─→ Gmail SMTP
    │
    └─→ Prisma
        ├─→ Notification (in-app)
        └─→ EmailDelivery (tracking)
```

---

## 📁 Structure des Fichiers

```
unipath-api/
├── src/
│   ├── services/
│   │   ├── notification.service.js  # Service principal
│   │   └── email.service.js         # Service email
│   ├── routes/
│   │   └── notifications.routes.js  # Routes API
│   └── controllers/
│       └── notification.controller.js
├── test-email-simple.js             # Test basique
├── test-emails-tous-types.js        # Test complet
└── test-notification-complete.js    # Test avec DB
```

---

## ⚙️ Configuration

### Variables d'Environnement (.env)

```env
# Email SMTP
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=votre-email@gmail.com
EMAIL_PASS=votre-mot-de-passe-app
EMAIL_FROM=votre-email@gmail.com

# Base de données
DATABASE_URL=postgresql://...

# Redis (Phase 2)
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Obtenir un Mot de Passe d'Application Gmail

1. Aller sur https://myaccount.google.com/security
2. Activer la validation en 2 étapes
3. Aller dans "Mots de passe des applications"
4. Générer un nouveau mot de passe pour "Mail"
5. Copier le mot de passe dans EMAIL_PASS

---

## 🧪 Tests

### Test 1: Email Simple
```bash
node test-email-simple.js
```
Envoie un email de test basique.

### Test 2: Tous les Types
```bash
node test-emails-tous-types.js
```
Envoie les 3 types d'emails (pré-inscription, validation, rejet).

### Test 3: Notification Complète
```bash
node test-notification-complete.js
```
Crée une notification in-app + envoie un email (nécessite DB).

---

## 📊 Base de Données

### Tables Créées

1. **Notification** - Notifications in-app
2. **NotificationTemplate** - Templates d'emails
3. **EmailDelivery** - Tracking des emails
4. **UserPreferences** - Préférences utilisateur
5. **NotificationAuditLog** - Logs d'audit
6. **SystemAlert** - Alertes système

### Schéma Notification

```prisma
model Notification {
  id          String   @id @default(uuid())
  userId      String
  type        NotificationType
  title       String
  message     String
  data        Json?
  read        Boolean  @default(false)
  readAt      DateTime?
  priority    PriorityLevel @default(NORMAL)
  createdAt   DateTime @default(now())
  expiresAt   DateTime?
}
```

---

## 🎨 Frontend

### Composant NotificationCenter

```jsx
import NotificationCenter from './components/NotificationCenter';

// Dans votre layout
<NotificationCenter />
```

**Fonctionnalités:**
- Icône cloche avec badge
- Dropdown avec liste
- Marquer comme lu
- Tout marquer comme lu
- Design responsive

---

## 🔐 Sécurité

### Authentification
Actuellement: Header `x-user-id`  
**TODO:** Remplacer par JWT token

### Validation
- Validation des emails
- Sanitization des données
- Protection XSS

### Données Sensibles
- Emails masqués dans les logs
- Mots de passe stockés en variables d'environnement

---

## 🚧 Limitations Actuelles

### Phase 1 (MVP)
- ✅ Envoi d'emails synchrone
- ✅ Templates codés en dur
- ✅ Pas de retry automatique
- ✅ Pas de WebSocket
- ✅ Pas de préférences utilisateur

### Phase 2 (À Venir)
- ⏳ Queue Manager (Bull + Redis)
- ⏳ Template Engine (Handlebars)
- ⏳ Retry Handler
- ⏳ WebSocket temps réel
- ⏳ Préférences utilisateur
- ⏳ Admin Dashboard

---

## 🐛 Dépannage

### Problème: Emails n'arrivent pas
**Solutions:**
1. Vérifier les variables EMAIL_* dans .env
2. Vérifier le mot de passe d'application Gmail
3. Vérifier les spams
4. Tester avec `test-email-simple.js`

### Problème: "Can't reach database server"
**Solutions:**
1. Vérifier la connexion internet
2. Vérifier DATABASE_URL
3. Utiliser les tests sans DB

### Problème: "Invalid userId"
**Solution:** Utiliser un UUID (string), pas un nombre

---

## 📚 Documentation Complète

- **État du système:** `/NOTIFICATION_SYSTEM_STATUS.md`
- **Guide rapide:** `/QUICK_START_NOTIFICATIONS.md`
- **Récap session:** `/SESSION_RECAP_NOTIFICATIONS.md`
- **Spec complet:** `/.kiro/specs/systeme-notifications-integre/`
- **Architecture:** `/ARCHITECTURE_PHP_JS.md`

---

## 🤝 Contribution

### Ajouter un Nouveau Type de Notification

1. **Ajouter l'enum dans Prisma**
```prisma
enum NotificationType {
  // ... existants
  NOUVEAU_TYPE
}
```

2. **Ajouter le template dans EmailService**
```javascript
async envoyerEmailNouveauType(data) {
  await transporter.sendMail({
    from: `"UniPath" <${process.env.EMAIL_FROM}>`,
    to: data.candidatEmail,
    subject: '[UniPath] Sujet',
    html: `<div>...</div>`
  });
}
```

3. **Ajouter le mapping dans NotificationService**
```javascript
getTitle(event, data) {
  const titles = {
    // ... existants
    NOUVEAU_TYPE: 'Titre'
  };
  return titles[event];
}
```

---

## 📞 Support

Pour toute question ou problème:
1. Consulter la documentation
2. Vérifier les tests
3. Consulter les logs

---

**Dernière mise à jour:** 5 Mai 2026  
**Mainteneur:** Équipe UniPath  
**Licence:** Propriétaire
