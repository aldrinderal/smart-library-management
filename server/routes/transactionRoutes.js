const express = require('express');
const router = express.Router();
const {
  issueBook,
  returnBook,
  getTransactions,
  getActiveTransactions,
  getOverdueTransactions,
  getStudentTransactions,
} = require('../controllers/transactionController');
const { protect, adminOnly } = require('../middleware/auth');

// All direct transaction management endpoints are strictly Admin only
router.use(protect, adminOnly);

router.post('/issue', issueBook);
router.post('/return', returnBook);
router.get('/', getTransactions);
router.get('/active', getActiveTransactions);
router.get('/overdue', getOverdueTransactions);
router.get('/student/:studentId', getStudentTransactions);

module.exports = router;

