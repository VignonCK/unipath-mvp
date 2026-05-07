const express = require('express');
const router = express.Router();
const notificationService = require('../services/notification.service');
const notificationController = require('../controllers/notification.controller');

// Middleware d'authentification (à adapter selon votre système)
const authenticate = (req, res, next) => {
  // TODO: Implémenter l'authentification JWT
  req.userId = req.headers['x-user-id']; // Temporaire
  next();
};

// ── Routes pour envoyer des notifications ──────────────────────
router.post('/', notificationController.sendNotification);
router.post('/pre-inscription', notificationController.sendPreInscriptionNotification);
router.post('/validation', notificationController.sendValidationNotification);
router.post('/rejet', notificationController.sendRejetNotification);

// ── Routes pour consulter les notifications ────────────────────
// Liste des notifications
router.get('/', authenticate, async (req, res) => {
  try {
    const { page, limit, type, read } = req.query;
    const notifications = await notificationService.getNotifications(req.userId, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      type,
      read: read === 'true' ? true : read === 'false' ? false : undefined
    });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Nombre de non lues
router.get('/unread-count', authenticate, async (req, res) => {
  try {
    const count = await notificationService.getUnreadCount(req.userId);
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Marquer comme lue
router.patch('/:id/read', authenticate, async (req, res) => {
  try {
    const notification = await notificationService.markAsRead(req.params.id);
    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Marquer toutes comme lues
router.patch('/read-all', authenticate, async (req, res) => {
  try {
    await notificationService.markAllAsRead(req.userId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
