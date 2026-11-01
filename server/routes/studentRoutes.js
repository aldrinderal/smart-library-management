const express = require('express');
const router = express.Router();
const {
  getStudents,
  getStudentByRegNo,
  getStudentById,
  createStudent,
  updateStudent,
  updateStudentStatus,
} = require('../controllers/studentController');
const { protect, adminOnly } = require('../middleware/auth');

// All student management endpoints are Admin only
router.use(protect, adminOnly);

router.get('/', getStudents);
router.post('/', createStudent);
router.get('/search/regno/:regNo', getStudentByRegNo);
router.get('/:id', getStudentById);
router.patch('/:id', updateStudent);
router.patch('/:id/status', updateStudentStatus);

module.exports = router;

