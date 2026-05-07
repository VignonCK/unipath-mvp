# Architecture PHP + JavaScript - UniPath

## 🏗️ Architecture Hybride

Le système UniPath utilise une architecture hybride où **PHP natif est au cœur du backend** pour les opérations critiques, et **Node.js/Express sert d'API REST** pour le frontend React.

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
│                  unipath-front/src/                          │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP/REST
                       ↓
┌─────────────────────────────────────────────────────────────┐
│              API Layer (Node.js/Express)                     │
│                  unipath-api/src/                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Routes: /api/notifications, /api/candidats, etc.    │   │
│  │  Controllers: notification.controller.js             │   │
│  │  Services: notification.service.js                   │   │
│  └──────────────────────┬───────────────────────────────┘   │
│                         │                                    │
│                         ↓ Appel HTTP                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Backend PHP (Cœur métier)                    │   │
│  │            unipath-api/php/                          │   │
│  │  • EmailService.php (envoi emails)                   │   │
│  │  • preinscription.php (génération PDF)               │   │
│  │  • convocation.php (génération PDF)                  │   │
│  │  • SystemeCompletion.php                             │   │
│  │  • SystemeHistorique.php                             │   │
│  └──────────────────────┬───────────────────────────────┘   │
└─────────────────────────┼───────────────────────────────────┘
                          │
                          ↓
                  ┌───────────────┐
                  │  PostgreSQL   │
                  │   (Supabase)  │
                  └───────────────┘
```

## 📂 Répartition des Responsabilités

### PHP Natif (Cœur métier)
**Localisation:** `unipath-api/php/`

**Responsabilités:**
- ✅ **Envoi d'emails** (`EmailService.php`)
- ✅ **Génération de PDF** (`preinscription.php`, `convocation.php`)
- ✅ **Logique métier complexe** (calculs, validations)
- ✅ **Accès direct à la base de données** (`db.php`)
- ✅ **Système de complétion** (`SystemeCompletion.php`)
- ✅ **Système d'historique** (`SystemeHistorique.php`)

**Pourquoi PHP ?**
- Code existant et testé
- FPDF pour génération PDF
- Fonction `mail()` native PHP
- Performance pour traitement batch

### Node.js/Express (API REST)
**Localisation:** `unipath-api/src/`

**Responsabilités:**
- ✅ **API REST** pour le frontend React
- ✅ **Authentification JWT**
- ✅ **Gestion des sessions**
- ✅ **WebSocket** (notifications temps réel)
- ✅ **Orchestration** des services PHP
- ✅ **Prisma ORM** pour requêtes complexes
- ✅ **Middleware** (CORS, validation, etc.)

**Pourquoi Node.js ?**
- Écosystème moderne (Express, Prisma)
- WebSocket natif
- Asynchrone par défaut
- Intégration facile avec React

## 🔄 Flux de Communication

### Exemple: Envoi d'email de pré-inscription

```javascript
// 1. Frontend React appelle l'API
POST /api/notifications/pre-inscription
{
  "candidatId": "uuid",
  "candidatEmail": "candidat@example.com",
  "candidatNom": "Doe",
  "candidatPrenom": "John",
  "concours": "Licence Info",
  "numeroDossier": "D2025001"
}

// 2. Node.js (notification.controller.js)
notificationController.sendPreInscriptionNotification()
  ↓
// 3. Service de notification (notification.service.js)
notificationService.sendNotification()
  ↓ Crée notification in-app dans PostgreSQL
  ↓ Appelle email.service.js
  ↓
// 4. Service email JavaScript (email.service.js)
emailService.envoyerEmailPreInscription()
  ↓ Fait un POST HTTP vers PHP
  ↓
// 5. Service email PHP (EmailService.php)
POST http://localhost:3001/php/EmailService.php
{
  "action": "pre-inscription",
  "data": { ... }
}
  ↓ PHP envoie l'email via mail()
  ↓ PHP enregistre dans EmailDelivery
  ↓
// 6. Réponse remonte la chaîne
{ "success": true }
```

## 📝 Fichiers Modifiés

### 1. `unipath-api/src/services/email.service.js`
**Avant:** Utilisait Nodemailer directement
**Après:** Appelle le service PHP via HTTP

```javascript
// Nouveau code
async envoyerEmailPreInscription(data) {
  return await this.sendEmailViaPHP('pre-inscription', data);
}

async sendEmailViaPHP(action, data) {
  const response = await axios.post(PHP_EMAIL_SERVICE_URL, {
    action,
    data
  });
  return response.data;
}
```

### 2. `unipath-api/php/EmailService.php`
**Déjà existant** - Aucune modification nécessaire !
- Gère l'envoi d'emails
- Enregistre dans `EmailDelivery`
- Expose une API JSON

### 3. `unipath-api/src/app.js`
**Ajouté:** Route pour exécuter les scripts PHP

```javascript
app.post('/php/:file', (req, res) => {
  const phpFile = path.join(__dirname, '../php', req.params.file);
  exec(`php ${phpFile}`, { input: JSON.stringify(req.body) }, ...);
});
```

### 4. `unipath-api/.env`
**Ajouté:** URL du service PHP

```env
PHP_EMAIL_SERVICE_URL=http://localhost:3001/php/EmailService.php
```

## 🚀 Avantages de cette Architecture

### ✅ Séparation des Préoccupations
- PHP = Logique métier et emails
- Node.js = API REST et WebSocket
- React = Interface utilisateur

### ✅ Réutilisation du Code Existant
- Pas besoin de réécrire `EmailService.php`
- Pas besoin de réécrire les générateurs PDF
- Code PHP testé et fonctionnel

### ✅ Scalabilité
- PHP peut être déployé séparément
- Node.js peut être scalé horizontalement
- Chaque service peut avoir son propre serveur

### ✅ Maintenabilité
- Code PHP reste en PHP (familier pour l'équipe)
- Code JavaScript moderne pour l'API
- Chaque partie peut évoluer indépendamment

## 🔧 Configuration Requise

### Serveur
- **PHP 7.4+** avec extension `mail`
- **Node.js 18+**
- **PostgreSQL 15+**
- **Redis** (optionnel, pour queue)

### Variables d'Environnement
```env
# Email (utilisé par PHP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=votre-email@gmail.com
EMAIL_PASS=votre-mot-de-passe
EMAIL_FROM=noreply@unipath.bj

# Service PHP
PHP_EMAIL_SERVICE_URL=http://localhost:3001/php/EmailService.php

# Base de données
DATABASE_URL=postgresql://...
```

## 📊 Performance

### Temps de Réponse Typiques
- **Notification in-app seule:** ~50ms
- **Notification + Email:** ~200-500ms (dépend du SMTP)
- **Génération PDF + Email:** ~1-2s

### Optimisations Possibles
1. **Queue asynchrone** (Bull + Redis) pour emails
2. **Cache Redis** pour templates
3. **Pool de connexions** PHP-FPM
4. **CDN** pour fichiers statiques

## 🧪 Tests

### Tester l'envoi d'email via PHP
```bash
curl -X POST http://localhost:3001/php/EmailService.php \
  -H "Content-Type: application/json" \
  -d '{
    "action": "pre-inscription",
    "data": {
      "candidatEmail": "test@example.com",
      "candidatNom": "Test",
      "candidatPrenom": "User",
      "concours": "Test Concours",
      "numeroDossier": "D2025999"
    }
  }'
```

### Tester via l'API Node.js
```bash
curl -X POST http://localhost:3001/api/notifications/pre-inscription \
  -H "Content-Type: application/json" \
  -d '{
    "candidatId": "uuid-test",
    "candidatEmail": "test@example.com",
    "candidatNom": "Test",
    "candidatPrenom": "User",
    "concours": "Test Concours",
    "numeroDossier": "D2025999"
  }'
```

## 🔮 Évolutions Futures

### Court Terme
- [ ] Ajouter queue Redis pour emails asynchrones
- [ ] Implémenter retry automatique en cas d'échec
- [ ] Ajouter templates d'emails personnalisables

### Moyen Terme
- [ ] Migrer génération PDF vers Node.js (PDFKit)
- [ ] Ajouter WebSocket pour notifications temps réel
- [ ] Dashboard admin pour monitoring

### Long Terme
- [ ] Microservices séparés (Email, PDF, Notifications)
- [ ] API Gateway
- [ ] Kubernetes pour orchestration

## 📚 Documentation Complémentaire

- [NOTIFICATION_USAGE.md](./NOTIFICATION_USAGE.md) - Guide d'utilisation
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - Documentation API
- [php/README.md](./php/README.md) - Documentation PHP
