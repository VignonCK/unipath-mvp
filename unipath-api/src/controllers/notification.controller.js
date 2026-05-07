const notificationService = require('../services/notification.service');

// Envoyer une notification (email + in-app)
const sendNotification = async (req, res) => {
  try {
    const { event, userId, data, priority, sendEmail } = req.body;
    
    const result = await notificationService.sendNotification({
      event,
      userId,
      data,
      priority,
      sendEmail
    });
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Erreur envoi notification:', error);
    res.status(500).json({ error: error.message });
  }
};

// Exemples d'utilisation rapide
const sendPreInscriptionNotification = async (req, res) => {
  try {
    const { candidatId, candidatEmail, candidatNom, candidatPrenom, concours, numeroDossier, pdfPath } = req.body;
    
    const result = await notificationService.sendNotification({
      event: 'PRE_INSCRIPTION',
      userId: candidatId,
      data: {
        candidatEmail,
        candidatNom,
        candidatPrenom,
        concours,
        numeroDossier,
        pdfPath
      }
    });
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Erreur notification pré-inscription:', error);
    res.status(500).json({ error: error.message });
  }
};

const sendValidationNotification = async (req, res) => {
  try {
    const { candidatId, candidatEmail, candidatNom, candidatPrenom, concours, numeroDossier, pdfPath, dateExamen, lieuExamen } = req.body;
    
    const result = await notificationService.sendNotification({
      event: 'VALIDATION',
      userId: candidatId,
      data: {
        candidatEmail,
        candidatNom,
        candidatPrenom,
        concours,
        numeroDossier,
        pdfPath,
        dateExamen,
        lieuExamen
      }
    });
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Erreur notification validation:', error);
    res.status(500).json({ error: error.message });
  }
};

const sendRejetNotification = async (req, res) => {
  try {
    const { candidatId, candidatEmail, candidatNom, candidatPrenom, concours, motif } = req.body;
    
    const result = await notificationService.sendNotification({
      event: 'REJET',
      userId: candidatId,
      data: {
        candidatEmail,
        candidatNom,
        candidatPrenom,
        concours,
        motif
      }
    });
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Erreur notification rejet:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  sendNotification,
  sendPreInscriptionNotification,
  sendValidationNotification,
  sendRejetNotification
};
