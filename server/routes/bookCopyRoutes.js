const express = require('express');
const router = express.Router();
const {
  getBookCopies,
  getBookCopyByIdOrQr,
  createBookCopies,
  updateBookCopy,
  deleteBookCopy,
} = require('../controllers/bookCopyController');
const { protect, adminOnly } = require('../middleware/auth');

// Protected routes
router.use(protect);

// Admin-only copy management
router.get('/', adminOnly, getBookCopies);
router.post('/', adminOnly, createBookCopies);
router.patch('/:copyId', adminOnly, updateBookCopy);
router.delete('/:copyId', adminOnly, deleteBookCopy);

// Single copy lookup (both Admin scanning and copy detail)
router.get('/:copyId', getBookCopyByIdOrQr);

module.exports = router;

