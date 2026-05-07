# 📄 Guide - Génération de PDFs et Envoi par Email

## ✅ Fonctionnalités Implémentées

### 1. Fiche de Pré-inscription (PDF)
- Générée automatiquement lors de la pré-inscription
- Contient toutes les informations du candidat et du concours
- Numéro de dossier unique
- Design officiel avec logos et couleurs UAC

### 2. Convocation (PDF)
- Générée automatiquement lors de la validation du dossier
- Contient les informations du candidat et du concours
- Date et lieu d'examen
- Document officiel à présenter le jour de l'examen

---

## 🚀 Utilisation

### Envoyer une notification avec PDF

```javascript
const notificationService = require('./src/services/notification.service');

// Pré-inscription avec fiche PDF
await notificationService.sendNotification({
  event: 'PRE_INSCRIPTION',
  userId: candidat.id,
  data: {
    // Informations candidat
    candidatEmail: candidat.email,
    candidatNom: candidat.nom,
    candidatPrenom: candidat.prenom,
    candidatMatricule: candidat.matricule,
    candidatTelephone: candidat.telephone,
    candidatDateNaiss: candidat.dateNaiss,
    candidatLieuNaiss: candidat.lieuNaiss,
    
    // Informations concours
    concours: concours.libelle,
    concoursDateDebut: concours.dateDebut,
    concoursDateFin: concours.dateFin,
    concoursDescription: concours.description,
    
    // Numéro de dossier
    numeroDossier: inscription.numeroDossier
  },
  priority: 'HIGH',
  sendEmail: true
});

// Validation avec convocation PDF
await notificationService.sendNotification({
  event: 'VALIDATION',
  userId: candidat.id,
  data: {
    // Informations candidat
    candidatEmail: candidat.email,
    candidatNom: candidat.nom,
    candidatPrenom: candidat.prenom,
    candidatMatricule: candidat.matricule,
    candidatTelephone: candidat.telephone,
    
    // Informations concours
    concours: concours.libelle,
    concoursDateDebut: concours.dateDebut,
    concoursDateFin: concours.dateFin,
    concoursDescription: concours.description,
    
    // Informations examen
    numeroDossier: inscription.numeroDossier,
    dateExamen: '15 Juin 2026 à 8h00',
    lieuExamen: 'Amphithéâtre A - UAC Abomey-Calavi'
  },
  priority: 'URGENT',
  sendEmail: true
});
```

---

## 🔧 Services Disponibles

### PDFService

```javascript
const pdfService = require('./src/services/pdf.service');

// Générer une fiche de pré-inscription
const result = await pdfService.genererFichePreInscription({
  candidat: {
    matricule: 'UAC2026001',
    nom: 'DEDJI',
    prenom: 'Harry',
    email: 'email@example.com',
    telephone: '+229 97000000',
    dateNaiss: '2000-01-15',
    lieuNaiss: 'Cotonou'
  },
  concours: {
    libelle: 'Master Informatique 2025-2026',
    dateDebut: '2026-01-01',
    dateFin: '2026-06-30',
    description: 'Concours d\'entrée'
  },
  numeroDossier: 'DOSS-12345'
});

// result.filePath contient le chemin du PDF généré
// result.fileName contient le nom du fichier

// Générer une convocation
const result = await pdfService.genererConvocation({
  candidat: {
    matricule: 'UAC2026001',
    nom: 'DEDJI',
    prenom: 'Harry',
    email: 'email@example.com',
    telephone: '+229 97000000'
  },
  concours: {
    libelle: 'Master Informatique 2025-2026',
    dateDebut: '2026-01-01',
    dateFin: '2026-06-30',
    description: 'Concours d\'entrée'
  }
});

// Nettoyer un PDF temporaire
await pdfService.nettoyerPDF(filePath);

// Nettoyer tous les fichiers temporaires de plus de 1h
await pdfService.nettoyerFichiersTemporaires();
```

### EmailService (avec PDFs)

```javascript
const emailService = require('./src/services/email.service');

// Envoyer un email avec PDF
await emailService.envoyerEmailPreInscription(data, pdfPath);
await emailService.envoyerEmailValidation(data, pdfPath);
await emailService.envoyerEmailConvocation(data, pdfPath);

// Sans PDF (comme avant)
await emailService.envoyerEmailPreInscription(data);
await emailService.envoyerEmailRejet(data);
```

---

## 🧪 Tests

### Test Complet avec PDFs
```bash
cd unipath-api
node test-emails-avec-pdf.js
```

**Résultat attendu:**
- 2 emails envoyés avec PDFs attachés
- Fiche de pré-inscription (PDF)
- Convocation (PDF)

---

## 📁 Structure des Fichiers

```
unipath-api/
├── php/
│   ├── fiche-preinscription.php  ✨ NOUVEAU
│   ├── convocation.php            (existant)
│   └── fpdf.php                   (bibliothèque)
│
├── src/services/
│   ├── pdf.service.js            ✨ NOUVEAU
│   ├── email.service.js          (modifié - support PDF)
│   └── notification.service.js   (modifié - génération PDF)
│
├── temp/                          ✨ NOUVEAU (auto-créé)
│   └── (fichiers PDF temporaires)
│
└── test-emails-avec-pdf.js       ✨ NOUVEAU
```

---

## 🎨 Design des PDFs

### Éléments Communs
- **Bandeau vert** en haut (couleur UAC)
- **Logos** : Drapeau du Bénin + Logo MESRS
- **Ligne tricolore** : Vert, Jaune, Rouge
- **Sections colorées** pour les informations
- **Bandeau tricolore** en bas
- **Pied de page** avec date de génération

### Fiche de Pré-inscription
- Titre: "FICHE DE PRE-INSCRIPTION"
- Numéro de dossier en rouge
- Informations candidat (fond vert clair)
- Informations concours (fond jaune clair)
- Statut: "EN ATTENTE DE VALIDATION"
- Prochaines étapes
- Avertissement important

### Convocation
- Titre: "CONVOCATION"
- Informations candidat (fond vert clair)
- Informations concours (fond jaune clair)
- Avertissement important
- Signature du Directeur Général

---

## ⚙️ Configuration

### Prérequis
- **PHP** installé et accessible via la commande `php`
- **FPDF** (déjà inclus dans `php/fpdf.php`)
- **Nodemailer** (déjà installé)

### Variables d'Environnement
Aucune nouvelle variable nécessaire ! Utilise la configuration email existante.

---

## 🔄 Workflow Automatique

### 1. Pré-inscription
```
Candidat s'inscrit
    ↓
NotificationService.sendNotification('PRE_INSCRIPTION')
    ↓
PDFService.genererFichePreInscription()
    ↓
EmailService.envoyerEmailPreInscription(data, pdfPath)
    ↓
Email envoyé avec fiche PDF attachée
    ↓
PDF temporaire supprimé après 5 secondes
```

### 2. Validation
```
Commission valide le dossier
    ↓
NotificationService.sendNotification('VALIDATION')
    ↓
PDFService.genererConvocation()
    ↓
EmailService.envoyerEmailValidation(data, pdfPath)
    ↓
Email envoyé avec convocation PDF attachée
    ↓
PDF temporaire supprimé après 5 secondes
```

---

## 🛡️ Gestion des Erreurs

### Si la génération PDF échoue
- L'email est quand même envoyé **sans PDF**
- Une erreur est loggée dans la console
- Le système continue de fonctionner

### Si l'envoi email échoue
- L'erreur est capturée et loggée
- Le PDF temporaire est quand même nettoyé
- L'erreur est enregistrée dans EmailDelivery

---

## 🗑️ Nettoyage Automatique

### Fichiers Temporaires
- Les PDFs sont stockés dans `temp/`
- Supprimés automatiquement après envoi (5 secondes)
- Nettoyage automatique des fichiers > 1 heure

### Commande Manuelle
```javascript
await pdfService.nettoyerFichiersTemporaires();
```

---

## 📊 Exemple Complet d'Intégration

### Dans le Controller d'Inscription

```javascript
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

  // 2. Générer le numéro de dossier
  const numeroDossier = `DOSS-${inscription.id.substring(0, 8).toUpperCase()}`;

  // 3. Envoyer la notification avec fiche PDF
  await notificationService.sendNotification({
    event: 'PRE_INSCRIPTION',
    userId: candidatId,
    data: {
      candidatEmail: inscription.candidat.email,
      candidatNom: inscription.candidat.nom,
      candidatPrenom: inscription.candidat.prenom,
      candidatMatricule: inscription.candidat.matricule,
      candidatTelephone: inscription.candidat.telephone,
      candidatDateNaiss: inscription.candidat.dateNaiss,
      candidatLieuNaiss: inscription.candidat.lieuNaiss,
      concours: inscription.concours.libelle,
      concoursDateDebut: inscription.concours.dateDebut,
      concoursDateFin: inscription.concours.dateFin,
      concoursDescription: inscription.concours.description,
      numeroDossier
    },
    priority: 'HIGH',
    sendEmail: true
  });

  return inscription;
}

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

  // 2. Envoyer la notification avec convocation PDF
  await notificationService.sendNotification({
    event: 'VALIDATION',
    userId: inscription.candidatId,
    data: {
      candidatEmail: inscription.candidat.email,
      candidatNom: inscription.candidat.nom,
      candidatPrenom: inscription.candidat.prenom,
      candidatMatricule: inscription.candidat.matricule,
      candidatTelephone: inscription.candidat.telephone,
      concours: inscription.concours.libelle,
      concoursDateDebut: inscription.concours.dateDebut,
      concoursDateFin: inscription.concours.dateFin,
      concoursDescription: inscription.concours.description,
      numeroDossier: `DOSS-${inscription.id.substring(0, 8).toUpperCase()}`,
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

## ✅ Checklist de Vérification

- [x] PHP installé et fonctionnel
- [x] FPDF disponible
- [x] Dossier `temp/` créé automatiquement
- [x] Logos disponibles (`drapeau_du_benin.png`, `logo_mesrs.png`)
- [x] Service PDF créé
- [x] Service Email mis à jour
- [x] Service Notification mis à jour
- [x] Tests réussis
- [x] PDFs générés correctement
- [x] Emails envoyés avec pièces jointes
- [x] Nettoyage automatique fonctionnel

---

## 🎉 Résultat

**Le système envoie maintenant automatiquement:**
- ✅ Fiche de pré-inscription (PDF) lors de l'inscription
- ✅ Convocation officielle (PDF) lors de la validation
- ✅ Emails avec pièces jointes
- ✅ Design professionnel et officiel
- ✅ Nettoyage automatique des fichiers temporaires

**Prêt pour la production ! 🚀**
