const BorrowTransaction = require('../models/BorrowTransaction');
const Notification = require('../models/Notification');
const User = require('../models/User');

// Helper to calculate days remaining
const calculateStatusAndDays = (dueDate, status) => {
  if (status === 'Returned') return { status: 'Returned', daysRemaining: 0 };

  const now = new Date();
  const due = new Date(dueDate);

  // Strip time for exact date comparison
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());

  const diffTime = dueDay.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { status: 'Overdue', daysRemaining: diffDays, daysOverdue: Math.abs(diffDays) };
  } else if (diffDays === 0) {
    return { status: 'Due Today', daysRemaining: 0, daysOverdue: 0 };
  } else if (diffDays <= 3) {
    return { status: 'Due Soon', daysRemaining: diffDays, daysOverdue: 0 };
  } else {
    return { status: 'Issued', daysRemaining: diffDays, daysOverdue: 0 };
  }
};

// GET /api/student/me/books (Currently borrowed books)
const getMyBooks = async (req, res) => {
  try {
    const studentId = req.user._id;

    const activeBorrows = await BorrowTransaction.find({
      student: studentId,
      status: { $in: ['Issued', 'Overdue'] },
    })
      .populate('book')
      .populate('bookCopy')
      .sort({ dueDate: 1 });

    const formattedBooks = activeBorrows.map((tx) => {
      const calculation = calculateStatusAndDays(tx.dueDate, tx.status);
      return {
        _id: tx._id,
        bookTitle: tx.book?.title || 'Unknown Title',
        author: tx.book?.author || 'Unknown Author',
        category: tx.book?.category || 'General',
        isbn: tx.book?.isbn || '',
        copyId: tx.bookCopy?.copyId || '',
        shelfLocation: `${tx.bookCopy?.shelfBlock || 'N/A'}, ${tx.bookCopy?.shelfNumber || ''}`,
        issueDate: tx.issueDate,
        dueDate: tx.dueDate,
        daysRemaining: calculation.daysRemaining,
        daysOverdue: calculation.daysOverdue || 0,
        borrowingStatus: calculation.status,
      };
    });

    return res.status(200).json({
      success: true,
      count: formattedBooks.length,
      data: formattedBooks,
    });
  } catch (error) {
    console.error('[StudentSelfController.getMyBooks] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch your borrowed books.',
      error: error.message,
    });
  }
};

// GET /api/student/me/history (Borrowing history)
const getMyHistory = async (req, res) => {
  try {
    const studentId = req.user._id;

    const history = await BorrowTransaction.find({
      student: studentId,
      status: 'Returned',
    })
      .populate('book')
      .populate('bookCopy')
      .sort({ returnDate: -1 });

    const formattedHistory = history.map((tx) => ({
      _id: tx._id,
      bookTitle: tx.book?.title || 'Unknown Title',
      author: tx.book?.author || 'Unknown Author',
      category: tx.book?.category || 'General',
      isbn: tx.book?.isbn || '',
      copyId: tx.bookCopy?.copyId || '',
      issueDate: tx.issueDate,
      dueDate: tx.dueDate,
      returnDate: tx.returnDate,
      fineAmount: tx.fineAmount || 0,
      status: 'Returned',
    }));

    return res.status(200).json({
      success: true,
      count: formattedHistory.length,
      data: formattedHistory,
    });
  } catch (error) {
    console.error('[StudentSelfController.getMyHistory] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch borrowing history.',
      error: error.message,
    });
  }
};

// GET /api/student/me/notifications (In-app notifications)
const getMyNotifications = async (req, res) => {
  try {
    const studentId = req.user._id;

    const notifications = await Notification.find({ student: studentId })
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      student: studentId,
      isRead: false,
    });

    return res.status(200).json({
      success: true,
      unreadCount,
      data: notifications,
    });
  } catch (error) {
    console.error('[StudentSelfController.getMyNotifications] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications.',
      error: error.message,
    });
  }
};

// PATCH /api/student/me/notifications/:id/read
const markNotificationAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, student: req.user._id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Notification marked as read.',
      data: notification,
    });
  } catch (error) {
    console.error('[StudentSelfController.markNotificationAsRead] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update notification.',
      error: error.message,
    });
  }
};

// PATCH /api/student/me/notifications/read-all
const markAllNotificationsAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ student: req.user._id, isRead: false }, { isRead: true });

    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read.',
    });
  } catch (error) {
    console.error('[StudentSelfController.markAllNotificationsAsRead] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update notifications.',
      error: error.message,
    });
  }
};

// GET /api/student/me/profile
const getMyProfile = async (req, res) => {
  try {
    const student = await User.findById(req.user._id).select('-passwordHash');
    return res.status(200).json({
      success: true,
      data: student,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile.',
      error: error.message,
    });
  }
};

module.exports = {
  getMyBooks,
  getMyHistory,
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getMyProfile,
};

