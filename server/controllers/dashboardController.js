const User = require('../models/User');
const Book = require('../models/Book');
const BookCopy = require('../models/BookCopy');
const BorrowTransaction = require('../models/BorrowTransaction');
const { checkDueDates } = require('../services/cronService');

// GET /api/dashboard/admin
const getAdminDashboard = async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      totalStudents,
      totalTitles,
      totalCopies,
      availableCopies,
      issuedCopies,
      overdueCount,
      returnedTodayCount,
      recentTransactions,
      categoryDistribution,
    ] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      Book.countDocuments(),
      BookCopy.countDocuments(),
      BookCopy.countDocuments({ status: 'Available' }),
      BookCopy.countDocuments({ status: 'Issued' }),
      BorrowTransaction.countDocuments({
        status: { $in: ['Issued', 'Overdue'] },
        dueDate: { $lt: now },
      }),
      BorrowTransaction.countDocuments({
        status: 'Returned',
        returnDate: { $gte: startOfToday },
      }),
      BorrowTransaction.find()
        .sort({ createdAt: -1 })
        .limit(6)
        .populate('student', 'name registerNumber department')
        .populate('book', 'title author')
        .populate('bookCopy', 'copyId shelfBlock shelfNumber'),
      Book.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 6 },
      ]),
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        totalStudents,
        totalTitles,
        totalCopies,
        availableCopies,
        issuedCopies,
        overdueCount,
        returnedTodayCount,
      },
      recentTransactions,
      categoryDistribution,
    });
  } catch (error) {
    console.error('[DashboardController.getAdminDashboard] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load admin dashboard statistics.',
      error: error.message,
    });
  }
};

// GET /api/dashboard/student
const getStudentDashboard = async (req, res) => {
  try {
    const studentId = req.user._id;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(today.getDate() + 3);

    const [activeBorrows, returnedCount] = await Promise.all([
      BorrowTransaction.find({
        student: studentId,
        status: { $in: ['Issued', 'Overdue'] },
      })
        .populate('book', 'title author category')
        .populate('bookCopy', 'copyId shelfBlock shelfNumber')
        .sort({ dueDate: 1 }),
      BorrowTransaction.countDocuments({
        student: studentId,
        status: 'Returned',
      }),
    ]);

    let currentlyBorrowed = activeBorrows.length;
    let dueSoonCount = 0;
    let overdueCount = 0;

    const formattedActiveBorrows = activeBorrows.map((tx) => {
      const dueDay = new Date(tx.dueDate.getFullYear(), tx.dueDate.getMonth(), tx.dueDate.getDate());
      const diffTime = dueDay.getTime() - today.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      let badge = 'Issued';
      if (diffDays < 0) {
        badge = 'Overdue';
        overdueCount++;
      } else if (diffDays === 0) {
        badge = 'Due Today';
        dueSoonCount++;
      } else if (diffDays <= 3) {
        badge = 'Due Soon';
        dueSoonCount++;
      }

      return {
        _id: tx._id,
        title: tx.book?.title,
        author: tx.book?.author,
        copyId: tx.bookCopy?.copyId,
        shelfLocation: `${tx.bookCopy?.shelfBlock}, ${tx.bookCopy?.shelfNumber}`,
        issueDate: tx.issueDate,
        dueDate: tx.dueDate,
        diffDays,
        badge,
      };
    });

    return res.status(200).json({
      success: true,
      stats: {
        currentlyBorrowed,
        dueSoonCount,
        overdueCount,
        totalReturned: returnedCount,
      },
      currentBooks: formattedActiveBorrows,
    });
  } catch (error) {
    console.error('[DashboardController.getStudentDashboard] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load student dashboard statistics.',
      error: error.message,
    });
  }
};

// POST /api/dashboard/trigger-check (Admin only - run due-check now)
const triggerDueCheck = async (req, res) => {
  try {
    const result = await checkDueDates();
    return res.status(200).json({
      success: true,
      message: 'Due-date check executed successfully.',
      result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to execute due-date check.',
      error: error.message,
    });
  }
};

module.exports = {
  getAdminDashboard,
  getStudentDashboard,
  triggerDueCheck,
};

