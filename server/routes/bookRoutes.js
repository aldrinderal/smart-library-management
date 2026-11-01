const express = require('express');
const router = express.Router();
const {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
} = require('../controllers/bookController');
const { protect, adminOnly } = require('../middleware/auth');

// GET /api/books is open to authenticated users (admin and student)
router.get('/', protect, getBooks);
router.get('/:id', protect, getBookById);

// Admin-only management routes
router.post('/', protect, adminOnly, createBook);
router.patch('/:id', protect, adminOnly, updateBook);
router.delete('/:id', protect, adminOnly, deleteBook);

module.exports = router;

