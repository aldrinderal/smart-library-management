const express = require('express');
const router = express.Router();
const {
  getMyBooks,
  getMyHistory,
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getMyProfile,
} = require('../controllers/studentSelfController');
const { protect, studentOnly } = require('../middleware/auth');

// All endpoints in this file are student self-service only
router.use(protect, studentOnly);

router.get('/books', getMyBooks);
router.get('/history', getMyHistory);
router.get('/notifications', getMyNotifications);
router.patch('/notifications/:id/read', markNotificationAsRead);
router.patch('/notifications/read-all', markAllNotificationsAsRead);
router.get('/profile', getMyProfile);

module.exports = router;

