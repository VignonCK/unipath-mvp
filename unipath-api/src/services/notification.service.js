const { PrismaClient } = require('@prisma/client');
const emailService = require('./email.service');
const pdfService = require('./pdf.service');
const prisma = require('../prisma');

class NotificationService {
  async sendNotification({ event, userId, data, priority = 'NORMAL', sendEmail = true }) {
    const channels = [];

    // Créer la notification in-app
    const notification = await prisma.notification.create({
      data: {
        userId,
        type: event,
        title: this.getTitle(event, data),
        message: this.getMessage(event, data),
        data,
        priority,
        expiresAt: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000) // 2 ans
      }
    });
    channels.push('inApp');

    // Envoyer l'email si demandé
    if (sendEmail && data.candidatEmail) {
      try {
        await this.sendEmailForEvent(event, data);
        channels.push('email');
        
        // Enregistrer la livraison d'email
        await prisma.emailDelivery.create({
          data: {
            notificationId: notification.id,
            userId,
            recipient: data.candidatEmail,
            subject: this.getEmailSubject(event, data),
            status: 'SENT',
            sentAt: new Date()
          }
        });
      } catch (error) {
        console.error('Erreur envoi email:', error);
        // Enregistrer l'échec
        await prisma.emailDelivery.create({
          data: {
            notificationId: notification.id,
            userId,
            recipient: data.candidatEmail,
            subject: this.getEmailSubject(event, data),
            status: 'FAILED',
            errorMessage: error.message,
            attempts: 1
          }
        });
      }
    }

    return { notificationId: notification.id, channels };
  }

  async sendEmailForEvent(event, data) {
    // Utiliser le service email JavaScript (Nodemailer)
    const emailMethodMap = {
      'PRE_INSCRIPTION': 'envoyerEmailPreInscription',
      'VALIDATION': 'envoyerEmailValidation',
      'CONVOCATION': 'envoyerEmailConvocation',
      'REJET': 'envoyerEmailRejet'
    };
    
    const methodName = emailMethodMap[event];
    if (!methodName) {
      console.log(`Pas d'email configuré pour l'événement: ${event}`);
      return;
    }
    
    let pdfPath = null;
    
    try {
      // Générer le PDF selon le type d'événement
      if (event === 'PRE_INSCRIPTION') {
        console.log('📄 Génération fiche de pré-inscription...');
        const pdfResult = await pdfService.genererFichePreInscription({
          candidat: {
            matricule: data.candidatMatricule || 'En attente',
            nom: data.candidatNom,
            prenom: data.candidatPrenom,
            email: data.candidatEmail,
            telephone: data.candidatTelephone,
            dateNaiss: data.candidatDateNaiss,
            lieuNaiss: data.candidatLieuNaiss
          },
          concours: {
            libelle: data.concours,
            dateDebut: data.concoursDateDebut,
            dateFin: data.concoursDateFin,
            description: data.concoursDescription
          },
          numeroDossier: data.numeroDossier
        });
        pdfPath = pdfResult.filePath;
      } 
      else if (event === 'VALIDATION' || event === 'CONVOCATION') {
        console.log('📄 Génération convocation...');
        const pdfResult = await pdfService.genererConvocation({
          candidat: {
            matricule: data.candidatMatricule,
            nom: data.candidatNom,
            prenom: data.candidatPrenom,
            email: data.candidatEmail,
            telephone: data.candidatTelephone
          },
          concours: {
            libelle: data.concours,
            dateDebut: data.concoursDateDebut,
            dateFin: data.concoursDateFin,
            description: data.concoursDescription
          }
        });
        pdfPath = pdfResult.filePath;
      }
      
      // Appeler la méthode correspondante du service email avec le PDF
      const result = await emailService[methodName](data, pdfPath);
      
      return result;
      
    } catch (error) {
      console.error('Erreur lors de l\'envoi avec PDF:', error);
      // En cas d'erreur, essayer d'envoyer sans PDF
      console.log('⚠️ Envoi sans PDF...');
      return await emailService[methodName](data);
    } finally {
      // Nettoyer le PDF temporaire
      if (pdfPath) {
        setTimeout(() => {
          pdfService.nettoyerPDF(pdfPath);
        }, 5000); // Attendre 5 secondes pour être sûr que l'email est envoyé
      }
    }
  }

  getEmailSubject(event, data) {
    const subjects = {
      PRE_INSCRIPTION: '[UniPath] Confirmation de votre pré-inscription',
      VALIDATION: `[UniPath] Convocation au concours ${data.concours || ''}`,
      CONVOCATION: `[UniPath] Convocation au concours ${data.concours || ''}`,
      REJET: `[UniPath] Décision concernant votre candidature - ${data.concours || ''}`
    };
    return subjects[event] || '[UniPath] Notification';
  }

  async getNotifications(userId, { page = 1, limit = 20, type, read } = {}) {
    const where = { userId };
    if (type) where.type = type;
    if (read !== undefined) where.read = read;

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    });

    return notifications;
  }

  async markAsRead(notificationId) {
    return await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true, readAt: new Date() }
    });
  }

  async markAllAsRead(userId) {
    return await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true, readAt: new Date() }
    });
  }

  async getUnreadCount(userId) {
    return await prisma.notification.count({
      where: { userId, read: false }
    });
  }

  getTitle(event, data) {
    const titles = {
      PRE_INSCRIPTION: 'Pré-inscription enregistrée',
      VALIDATION: 'Dossier validé',
      CONVOCATION: 'Convocation à l\'examen',
      REJET: 'Dossier rejeté',
      NOUVEAU_DOSSIER: 'Nouveau dossier à traiter',
      SYSTEME: 'Notification système'
    };
    return titles[event] || 'Notification';
  }

  getMessage(event, data) {
    const messages = {
      PRE_INSCRIPTION: `Votre pré-inscription au concours ${data.concours || ''} a été enregistrée.`,
      VALIDATION: `Votre dossier ${data.numeroDossier || ''} a été validé.`,
      CONVOCATION: `Vous êtes convoqué(e) à l'examen le ${data.dateExamen || ''}.`,
      REJET: `Votre dossier ${data.numeroDossier || ''} a été rejeté. Motif: ${data.motif || ''}`,
      NOUVEAU_DOSSIER: `Un nouveau dossier ${data.numeroDossier || ''} est en attente de traitement.`,
      SYSTEME: data.message || 'Notification système'
    };
    return messages[event] || 'Nouvelle notification';
  }
}

module.exports = new NotificationService();
