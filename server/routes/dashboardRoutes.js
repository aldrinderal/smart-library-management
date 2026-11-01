const express = require('express');
const router = express.Router();
const {
  getAdminDashboard,
  getStudentDashboard,
  triggerDueCheck,
} = require('../controllers/dashboardController');
const { protect, adminOnly, studentOnly } = require('../middleware/auth');

router.get('/admin', protect, adminOnly, getAdminDashboard);
router.post('/admin/trigger-check', protect, adminOnly, triggerDueCheck);
router.get('/student', protect, studentOnly, getStudentDashboard);

module.exports = router;

