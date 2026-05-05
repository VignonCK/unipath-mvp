# 🚀 Démarrage Rapide - Système de Notifications

## ✅ Ce qui fonctionne MAINTENANT

### 1. Tester l'envoi d'emails (SANS base de données)

```bash
cd unipath-api
node test-emails-tous-types.js
```

**Résultat attendu:** 3 emails envoyés à test@example.com
- Email de pré-inscription
- Email de validation/convocation
- Email de rejet

---

### 2. Utiliser le système dans votre code

#### Backend - Envoyer une notification

```javascript
const notificationService = require('./src/services/notification.service');

// Exemple: Notification de pré-inscription
await notificationService.sendNotification({
  event: 'PRE_INSCRIPTION',
  userId: candidat.id, // UUID du candidat
  data: {
    candidatEmail: candidat.email,
    candidatNom: candidat.nom,
    candidatPrenom: candidat.prenom,
    concours: 'Master Informatique 2025-2026',
    numeroDossier: inscription.numeroDossier
  },
  priority: 'HIGH', // LOW, NORMAL, HIGH, URGENT
  sendEmail: true // false pour notification in-app uniquement
});
```

#### Types d'événements disponibles

```javascript
// PRE_INSCRIPTION - Confirmation d'inscription
{
  event: 'PRE_INSCRIPTION',
  data: {
    candidatEmail, candidatNom, candidatPrenom,
    concours, numeroDossier
  }
}

// VALIDATION - Dossier validé + convocation
{
  event: 'VALIDATION',
  data: {
    candidatEmail, candidatNom, candidatPrenom,
    concours, numeroDossier,
    dateExamen: '15 Juin 2026 à 8h00',
    lieuExamen: 'Amphithéâtre A - UAC'
  }
}

// REJET - Dossier rejeté
{
  event: 'REJET',
  data: {
    candidatEmail, candidatNom, candidatPrenom,
    concours, numeroDossier,
    motif: 'Dossier incomplet'
  }
}
```

---

### 3. Frontend - NotificationCenter

Le composant est déjà intégré dans le header de `CandidatLayout`.

**Fonctionnalités:**
- ✅ Icône cloche avec badge de compteur
- ✅ Dropdown avec liste de notifications
- ✅ Marquer comme lu (clic sur notification)
- ✅ Tout marquer comme lu (bouton)
- ✅ Design responsive

**Utilisation:**
```jsx
import NotificationCenter from './components/NotificationCenter';

// Dans votre layout/navbar
<NotificationCenter />
```

---

## 🔧 Configuration Requise

### Variables d'environnement (.env)

```env
# Email SMTP
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=votre-email@gmail.com
EMAIL_PASS=votre-mot-de-passe-app
EMAIL_FROM=votre-email@gmail.com

# Base de données (Supabase ou MySQL)
DATABASE_URL=postgresql://user:password@host:5432/database
```

---

## 📡 API REST Disponible

### Endpoints

```bash
# Récupérer les notifications d'un utilisateur
GET /api/notifications
Headers: x-user-id: <userId>
Query: ?page=1&limit=20&type=PRE_INSCRIPTION&read=false

# Compter les notifications non lues
GET /api/notifications/unread-count
Headers: x-user-id: <userId>

# Marquer une notification comme lue
PATCH /api/notifications/:id/read
Headers: x-user-id: <userId>

# Marquer toutes les notifications comme lues
PATCH /api/notifications/read-all
Headers: x-user-id: <userId>
```

### Exemple avec fetch

```javascript
// Récupérer les notifications
const response = await fetch('http://localhost:3001/api/notifications', {
  headers: {
    'x-user-id': localStorage.getItem('userId')
  }
});
const notifications = await response.json();

// Compter les non lues
const countResponse = await fetch('http://localhost:3001/api/notifications/unread-count', {
  headers: {
    'x-user-id': localStorage.getItem('userId')
  }
});
const { count } = await countResponse.json();
```

---

## 🧪 Tests Disponibles

### 1. Test Email Simple
```bash
cd unipath-api
node test-email-simple.js
```
Envoie un email de test basique.

### 2. Test Tous les Types d'Emails
```bash
cd unipath-api
node test-emails-tous-types.js
```
Envoie les 3 types d'emails (pré-inscription, validation, rejet).

### 3. Test Notification Complète (nécessite DB)
```bash
cd unipath-api
node test-notification-complete.js
```
Crée une notification in-app + envoie un email.

---

## 🎯 Intégration dans le Workflow

### Exemple: Lors de la création d'une inscription

```javascript
// Dans votre controller d'inscription
const { PrismaClient } = require('@prisma/client');
const notificationService = require('./services/notification.service');

const prisma = new PrismaClient();

async function creerInscription(candidatId, concoursId) {
  // 1. Créer l'inscription
  const inscription = await prisma.inscription.create({
    data: {
      candidatId,
      concoursId,
      statut: 'EN_ATTENTE'
    },
    include: {
      candidat: true,
      concours: true
    }
  });

  // 2. Envoyer la notification
  await notificationService.sendNotification({
    event: 'PRE_INSCRIPTION',
    userId: candidatId,
    data: {
      candidatEmail: inscription.candidat.email,
      candidatNom: inscription.candidat.nom,
      candidatPrenom: inscription.candidat.prenom,
      concours: inscription.concours.libelle,
      numeroDossier: `DOSS-${inscription.id.substring(0, 8)}`
    },
    priority: 'HIGH',
    sendEmail: true
  });

  return inscription;
}
```

### Exemple: Lors de la validation d'un dossier

```javascript
async function validerDossier(inscriptionId, dateExamen, lieuExamen) {
  // 1. Mettre à jour le statut
  const inscription = await prisma.inscription.update({
    where: { id: inscriptionId },
    data: { statut: 'VALIDE' },
    include: {
      candidat: true,
      concours: true
    }
  });

  // 2. Envoyer la notification de validation
  await notificationService.sendNotification({
    event: 'VALIDATION',
    userId: inscription.candidatId,
    data: {
      candidatEmail: inscription.candidat.email,
      candidatNom: inscription.candidat.nom,
      candidatPrenom: inscription.candidat.prenom,
      concours: inscription.concours.libelle,
      numeroDossier: `DOSS-${inscription.id.substring(0, 8)}`,
      dateExamen,
      lieuExamen
    },
    priority: 'URGENT',
    sendEmail: true
  });

  return inscription;
}
```

---

## ⚠️ Limitations Actuelles

### Ce qui N'est PAS encore implémenté

- ❌ **Queue système** (emails envoyés de manière synchrone)
- ❌ **Templates personnalisables** (emails codés en dur)
- ❌ **Retry automatique** (si email échoue, pas de réessai)
- ❌ **WebSocket** (pas de notifications temps réel)
- ❌ **Préférences utilisateur** (pas de désactivation d'emails)
- ❌ **Admin dashboard** (pas d'interface de monitoring)

### Workarounds

**Pour l'instant:**
- Les emails sont envoyés de manière synchrone (peut ralentir l'API)
- Si un email échoue, il faut le renvoyer manuellement
- Les notifications temps réel nécessitent un refresh de page
- Tous les utilisateurs reçoivent tous les types de notifications

**Solution:** Implémenter les tâches 2-10 du spec pour les fonctionnalités avancées.

---

## 🐛 Dépannage

### Problème: "Can't reach database server"
**Solution:** Vérifier la connexion internet ou utiliser les tests sans DB (`test-emails-tous-types.js`)

### Problème: "connect ECONNREFUSED 127.0.0.1:587"
**Solution:** Vérifier que les variables EMAIL_* sont bien définies dans `.env`

### Problème: "Invalid userId: Expected String, provided Int"
**Solution:** Utiliser un UUID (string) pour userId, pas un nombre

### Problème: Emails n'arrivent pas
**Solution:** 
1. Vérifier le mot de passe d'application Gmail
2. Vérifier les spams
3. Tester avec `test-email-simple.js`

---

## 📚 Documentation Complète

- **État du système:** `NOTIFICATION_SYSTEM_STATUS.md`
- **Spec complet:** `.kiro/specs/systeme-notifications-integre/`
- **Architecture:** `unipath-api/ARCHITECTURE_PHP_JS.md`
- **Usage détaillé:** `unipath-api/NOTIFICATION_USAGE.md`

---

**Dernière mise à jour:** 5 Mai 2026  
**Version:** 1.0 (Phase 1 - MVP)
