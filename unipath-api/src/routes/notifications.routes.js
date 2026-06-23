const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { protect } = require('../middleware/auth.middleware');
const { checkRole } = require('../middleware/role.middleware');

// 🔒 Routes POST protégées - Réservées aux rôles administratifs
router.post('/', protect, checkRole(['COMMISSION', 'CONTROLEUR', 'DGES']), notificationController.sendNotification);
router.post('/pre-inscription', protect, checkRole(['COMMISSION', 'CONTROLEUR', 'DGES']), notificationController.sendPreInscriptionNotification);
router.post('/validation', protect, checkRole(['COMMISSION', 'CONTROLEUR', 'DGES']), notificationController.sendValidationNotification);
router.post('/rejet', protect, checkRole(['COMMISSION', 'CONTROLEUR', 'DGES']), notificationController.sendRejetNotification);

// Routes GET/PATCH - Déléguées au contrôleur pour cohérence
router.get('/unread-count', protect, notificationController.getUnreadCount);
router.patch('/read-all', protect, notificationController.markAllAsRead);
router.get('/', protect, notificationController.getNotifications);
router.patch('/:id/read', protect, notificationController.markAsRead);

module.exports = router;