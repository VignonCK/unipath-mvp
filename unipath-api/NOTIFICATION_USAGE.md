# Guide d'utilisation du système de notifications

## 📧 Envoyer une notification avec email

### 1. Notification de pré-inscription

```javascript
// Dans votre code (ex: après création d'une inscription)
const notificationService = require('./services/notification.service');

await notificationService.sendNotification({
  event: 'PRE_INSCRIPTION',
  userId: candidat.id,
  data: {
    candidatEmail: candidat.email,
    candidatNom: candidat.nom,
    candidatPrenom: candidat.prenom,
    concours: 'Licence Informatique',
    numeroDossier: 'D2025001',
    pdfPath: './uploads/fiche-D2025001.pdf'
  }
});
```

**Résultat :**
- ✅ Notification in-app créée
- ✅ Email envoyé avec PDF en pièce jointe
- ✅ Historique enregistré dans la base de données

### 2. Notification de validation/convocation

```javascript
await notificationService.sendNotification({
  event: 'VALIDATION',
  userId: candidat.id,
  data: {
    candidatEmail: candidat.email,
    candidatNom: candidat.nom,
    candidatPrenom: candidat.prenom,
    concours: 'Licence Informatique',
    numeroDossier: 'D2025001',
    pdfPath: './uploads/convocation-D2025001.pdf',
    dateExamen: '15/06/2025',
    lieuExamen: 'Amphi A - UAC'
  }
});
```

### 3. Notification de rejet

```javascript
await notificationService.sendNotification({
  event: 'REJET',
  userId: candidat.id,
  data: {
    candidatEmail: candidat.email,
    candidatNom: candidat.nom,
    candidatPrenom: candidat.prenom,
    concours: 'Licence Informatique',
    motif: 'Dossier incomplet'
  }
});
```

### 4. Notification sans email (in-app uniquement)

```javascript
await notificationService.sendNotification({
  event: 'SYSTEME',
  userId: candidat.id,
  data: {
    message: 'Votre dossier est en cours de traitement'
  },
  sendEmail: false  // ← Désactive l'envoi d'email
});
```

## 🌐 Via l'API REST

### Envoyer une notification de pré-inscription

```bash
POST /api/notifications/pre-inscription
Content-Type: application/json

{
  "candidatId": "uuid-du-candidat",
  "candidatEmail": "candidat@example.com",
  "candidatNom": "Doe",
  "candidatPrenom": "John",
  "concours": "Licence Informatique",
  "numeroDossier": "D2025001",
  "pdfPath": "./uploads/fiche-D2025001.pdf"
}
```

### Envoyer une notification de validation

```bash
POST /api/notifications/validation
Content-Type: application/json

{
  "candidatId": "uuid-du-candidat",
  "candidatEmail": "candidat@example.com",
  "candidatNom": "Doe",
  "candidatPrenom": "John",
  "concours": "Licence Informatique",
  "numeroDossier": "D2025001",
  "pdfPath": "./uploads/convocation-D2025001.pdf",
  "dateExamen": "15/06/2025",
  "lieuExamen": "Amphi A - UAC"
}
```

### Envoyer une notification de rejet

```bash
POST /api/notifications/rejet
Content-Type: application/json

{
  "candidatId": "uuid-du-candidat",
  "candidatEmail": "candidat@example.com",
  "candidatNom": "Doe",
  "candidatPrenom": "John",
  "concours": "Licence Informatique",
  "motif": "Dossier incomplet"
}
```

### Notification personnalisée

```bash
POST /api/notifications
Content-Type: application/json

{
  "event": "PRE_INSCRIPTION",
  "userId": "uuid-du-candidat",
  "data": {
    "candidatEmail": "candidat@example.com",
    "candidatNom": "Doe",
    "candidatPrenom": "John",
    "concours": "Licence Informatique",
    "numeroDossier": "D2025001"
  },
  "priority": "HIGH",
  "sendEmail": true
}
```

## 📱 Consulter les notifications (Frontend)

### Récupérer les notifications d'un utilisateur

```bash
GET /api/notifications
Headers: x-user-id: uuid-du-candidat
```

### Nombre de notifications non lues

```bash
GET /api/notifications/unread-count
Headers: x-user-id: uuid-du-candidat
```

### Marquer une notification comme lue

```bash
PATCH /api/notifications/:id/read
Headers: x-user-id: uuid-du-candidat
```

### Marquer toutes comme lues

```bash
PATCH /api/notifications/read-all
Headers: x-user-id: uuid-du-candidat
```

## 🎨 Intégrer le composant React

```jsx
import NotificationCenter from './components/NotificationCenter';

function Navbar() {
  return (
    <nav>
      <div>Logo</div>
      <NotificationCenter />  {/* ← Ajouter ici */}
      <div>Menu</div>
    </nav>
  );
}
```

## 📊 Suivi des emails

Toutes les tentatives d'envoi d'email sont enregistrées dans la table `EmailDelivery` :

```javascript
// Consulter l'historique des emails d'un utilisateur
const emails = await prisma.emailDelivery.findMany({
  where: { userId: candidat.id },
  orderBy: { createdAt: 'desc' }
});

// Statistiques
const stats = await prisma.emailDelivery.groupBy({
  by: ['status'],
  _count: true
});
```

## 🔧 Configuration requise

Assurez-vous que votre fichier `.env` contient :

```env
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=noreply@unipath.bj
EMAIL_PASS=votre-mot-de-passe
EMAIL_FROM=noreply@unipath.bj
```

## ✅ Avantages du système

1. **Notification in-app + Email** : Double canal de communication
2. **Historique complet** : Toutes les notifications sont sauvegardées
3. **Suivi des emails** : Statut d'envoi enregistré (SENT, FAILED)
4. **Réutilisable** : Une seule fonction pour tous les types de notifications
5. **Extensible** : Facile d'ajouter de nouveaux types d'événements
