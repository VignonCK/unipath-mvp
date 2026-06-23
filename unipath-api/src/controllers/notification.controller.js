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

// ✅ Méthodes déplacées depuis notifications.routes.js pour cohérence
const getUnreadCount = async (req, res) => {
  try {
    const count = await notificationService.getUnreadCount(req.user.id);
    res.json({ count });
  } catch (error) {
    console.error('Erreur getUnreadCount:', error);
    res.status(500).json({ error: error.message });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    await notificationService.markAllAsRead(req.user.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur markAllAsRead:', error);
    res.status(500).json({ error: error.message });
  }
};

const getNotifications = async (req, res) => {
  try {
    const { page, limit, type, read } = req.query;
    const notifications = await notificationService.getNotifications(req.user.id, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      type,
      read: read === 'true' ? true : read === 'false' ? false : undefined
    });
    res.json(notifications);
  } catch (error) {
    console.error('Erreur getNotifications:', error);
    res.status(500).json({ error: error.message });
  }
};

const markAsRead = async (req, res) => {
  try {
    const notification = await notificationService.markAsRead(req.params.id);
    res.json(notification);
  } catch (error) {
    console.error('Erreur markAsRead:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  sendNotification,
  sendPreInscriptionNotification,
  sendValidationNotification,
  sendRejetNotification,
  getUnreadCount,
  markAllAsRead,
  getNotifications,
  markAsRead
};
