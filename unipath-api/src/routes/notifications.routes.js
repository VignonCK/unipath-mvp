const express = require('express');
const router = express.Router();
const notificationService = require('../services/notification.service');
const notificationController = require('../controllers/notification.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/', notificationController.sendNotification);
router.post('/pre-inscription', notificationController.sendPreInscriptionNotification);
router.post('/validation', notificationController.sendValidationNotification);
router.post('/rejet', notificationController.sendRejetNotification);

router.get('/unread-count', protect, async (req, res) => {
  try {
    const count = await notificationService.getUnreadCount(req.user.id);
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/read-all', protect, async (req, res) => {
  try {
    await notificationService.markAllAsRead(req.user.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', protect, async (req, res) => {
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
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id/read', protect, async (req, res) => {
  try {
    const notification = await notificationService.markAsRead(req.params.id);
    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;