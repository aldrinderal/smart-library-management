const BorrowTransaction = require('../models/BorrowTransaction');
const BookCopy = require('../models/BookCopy');
const Book = require('../models/Book');
const User = require('../models/User');
const { createNotification } = require('../services/notificationService');

const MAX_BORROW_LIMIT = parseInt(process.env.MAX_BORROW_LIMIT || '3', 10);
const FINE_PER_DAY = parseFloat(process.env.FINE_PER_DAY || '0'); // default 0

const formatDate = (date) => {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: process.env.TIMEZONE || 'Asia/Kolkata',
  }).format(new Date(date));
};

// POST /api/transactions/issue (Admin only)
const issueBook = async (req, res) => {
  try {
    const { studentId, registerNumber, copyId, dueDate, remarks } = req.body;

    if (!dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Due date is required.',
      });
    }

    const parsedDueDate = new Date(dueDate);
    const now = new Date();

    if (isNaN(parsedDueDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid due date format.',
      });
    }

    if (parsedDueDate < now) {
      return res.status(400).json({
        success: false,
        message: 'Due date cannot be earlier than current date.',
      });
    }

    // 1. Find and validate student
    let student;
    if (studentId) {
      student = await User.findById(studentId);
    } else if (registerNumber) {
      student = await User.findOne({
        registerNumber: registerNumber.toUpperCase().trim(),
        role: 'student',
      });
    }

    if (!student || student.role !== 'student') {
      return res.status(404).json({
        success: false,
        message: 'Student not found or invalid student identifier.',
      });
    }

    if (!student.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Cannot issue book: Student account is deactivated.',
      });
    }

    // Check maximum borrowing limit
    const activeBorrowsCount = await BorrowTransaction.countDocuments({
      student: student._id,
      status: { $in: ['Issued', 'Overdue'] },
    });

    if (activeBorrowsCount >= MAX_BORROW_LIMIT) {
      return res.status(400).json({
        success: false,
        message: `Student has reached the maximum borrowing limit of ${MAX_BORROW_LIMIT} book(s). Please return existing books first.`,
      });
    }

    // 2. Find and validate physical book copy
    let copyIdToFind = copyId.trim();
    if (copyIdToFind.startsWith('BOOK_COPY:')) {
      copyIdToFind = copyIdToFind.replace('BOOK_COPY:', '').trim();
    }

    const copy = await BookCopy.findOne({
      $or: [
        { copyId: copyIdToFind.toUpperCase() },
        { qrCodeValue: copyId.trim() },
        { qrCodeValue: `BOOK_COPY:${copyIdToFind.toUpperCase()}` },
      ],
    }).populate('book');

    if (!copy) {
      return res.status(404).json({
        success: false,
        message: `Book copy '${copyId}' not found in the catalog.`,
      });
    }

    // Check if the student already has an active issue for this EXACT same book title (to prevent accidental duplicate issues of same title)
    const existingBorrowForTitle = await BorrowTransaction.findOne({
      student: student._id,
      book: copy.book._id,
      status: { $in: ['Issued', 'Overdue'] },
    });

    if (existingBorrowForTitle) {
      return res.status(400).json({
        success: false,
        message: `Student already has an active copy of "${copy.book.title}" issued. Cannot borrow duplicate copies of the same title.`,
      });
    }

    // 3. Atomic check-and-update to prevent race condition when two librarians issue the same copy
    const updatedCopy = await BookCopy.findOneAndUpdate(
      { _id: copy._id, status: 'Available' },
      { status: 'Issued' },
      { new: true }
    );

    if (!updatedCopy) {
      return res.status(409).json({
        success: false,
        message: `Book copy ${copy.copyId} is not available (Current status: ${copy.status}). It may have just been issued.`,
      });
    }

    // 4. Create Borrow Transaction
    const transaction = await BorrowTransaction.create({
      student: student._id,
      book: copy.book._id,
      bookCopy: copy._id,
      issueDate: now,
      dueDate: parsedDueDate,
      status: 'Issued',
      issuedBy: req.user._id,
      remarks: remarks ? remarks.trim() : '',
    });

    // 5. In-app notification for the student
    await createNotification({
      studentId: student._id,
      transactionId: transaction._id,
      type: 'INFO',
      title: 'Book Issued Successfully',
      message: `Your book '${copy.book.title}' (Copy: ${copy.copyId}) has been issued. Due date is ${formatDate(parsedDueDate)}. Shelf: ${copy.shelfBlock}, ${copy.shelfNumber}.`,
      reminderKey: `${transaction._id}_ISSUED`,
      studentEmail: student.email,
    });

    const populatedTransaction = await BorrowTransaction.findById(transaction._id)
      .populate('student', 'name registerNumber email department')
      .populate('book', 'title author isbn category')
      .populate('bookCopy', 'copyId shelfBlock shelfNumber rackNumber status');

    return res.status(201).json({
      success: true,
      message: `Book "${copy.book.title}" successfully issued to ${student.name} (${student.registerNumber}).`,
      data: populatedTransaction,
    });
  } catch (error) {
    console.error('[TransactionController.issueBook] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to issue book.',
      error: error.message,
    });
  }
};

// POST /api/transactions/return (Admin only)
const returnBook = async (req, res) => {
  try {
    const { transactionId, copyId, returnDate, remarks } = req.body;

    let transaction;

    if (transactionId) {
      transaction = await BorrowTransaction.findById(transactionId)
        .populate('student')
        .populate('book')
        .populate('bookCopy');
    } else if (copyId) {
      let copyIdToFind = copyId.trim();
      if (copyIdToFind.startsWith('BOOK_COPY:')) {
        copyIdToFind = copyIdToFind.replace('BOOK_COPY:', '').trim();
      }

      const copy = await BookCopy.findOne({
        $or: [
          { copyId: copyIdToFind.toUpperCase() },
          { qrCodeValue: copyId.trim() },
          { qrCodeValue: `BOOK_COPY:${copyIdToFind.toUpperCase()}` },
        ],
      });

      if (!copy) {
        return res.status(404).json({
          success: false,
          message: `Book copy '${copyId}' not found.`,
        });
      }

      transaction = await BorrowTransaction.findOne({
        bookCopy: copy._id,
        status: { $in: ['Issued', 'Overdue'] },
      })
        .populate('student')
        .populate('book')
        .populate('bookCopy');
    }

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'No active borrowing transaction found for this book copy.',
      });
    }

    if (transaction.status === 'Returned') {
      return res.status(400).json({
        success: false,
        message: 'This book has already been marked as returned.',
      });
    }

    const actualReturnDate = returnDate ? new Date(returnDate) : new Date();

    // Calculate overdue days and fine
    let overdueDays = 0;
    let fineAmount = 0;

    const dueDateObj = new Date(transaction.dueDate);
    dueDateObj.setHours(23, 59, 59, 999);

    if (actualReturnDate > dueDateObj) {
      const diffMs = actualReturnDate.getTime() - dueDateObj.getTime();
      overdueDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      fineAmount = overdueDays * FINE_PER_DAY;
    }

    // Update transaction
    transaction.status = 'Returned';
    transaction.returnDate = actualReturnDate;
    transaction.fineAmount = fineAmount;
    transaction.returnedBy = req.user._id;
    if (remarks) {
      transaction.remarks = (transaction.remarks ? transaction.remarks + ' | ' : '') + remarks.trim();
    }
    await transaction.save();

    // Mark book copy back to 'Available'
    await BookCopy.findByIdAndUpdate(transaction.bookCopy._id, { status: 'Available' });

    // Send return confirmation in-app notification
    await createNotification({
      studentId: transaction.student._id,
      transactionId: transaction._id,
      type: 'RETURN_CONFIRMATION',
      title: 'Book Returned Successfully',
      message: `Your book '${transaction.book.title}' has been returned successfully.${
        overdueDays > 0 ? ` (Overdue by ${overdueDays} days. Fine: Rs. ${fineAmount})` : ''
      }`,
      reminderKey: `${transaction._id}_RETURNED`,
      studentEmail: transaction.student.email,
    });

    return res.status(200).json({
      success: true,
      message: `Book "${transaction.book.title}" returned successfully.`,
      data: {
        transactionId: transaction._id,
        bookTitle: transaction.book.title,
        copyId: transaction.bookCopy.copyId,
        studentName: transaction.student.name,
        registerNumber: transaction.student.registerNumber,
        issueDate: transaction.issueDate,
        dueDate: transaction.dueDate,
        returnDate: actualReturnDate,
        isOverdue: overdueDays > 0,
        overdueDays,
        fineAmount,
      },
    });
  } catch (error) {
    console.error('[TransactionController.returnBook] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to return book.',
      error: error.message,
    });
  }
};

// GET /api/transactions (Admin only - all transactions with search and filter)
const getTransactions = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;

    const query = {};

    if (status && status !== 'All') {
      query.status = status;
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    let transactionQuery = BorrowTransaction.find(query)
      .populate('student', 'name registerNumber email department phone')
      .populate('book', 'title author isbn category')
      .populate('bookCopy', 'copyId shelfBlock shelfNumber rackNumber status')
      .populate('issuedBy', 'name email')
      .populate('returnedBy', 'name email')
      .sort({ createdAt: -1 });

    const [transactions, total] = await Promise.all([
      transactionQuery.skip(skip).limit(limitNum),
      BorrowTransaction.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: transactions,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum,
      },
    });
  } catch (error) {
    console.error('[TransactionController.getTransactions] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions.',
      error: error.message,
    });
  }
};

// GET /api/transactions/active (Admin only)
const getActiveTransactions = async (req, res) => {
  try {
    const active = await BorrowTransaction.find({
      status: { $in: ['Issued', 'Overdue'] },
    })
      .populate('student', 'name registerNumber email department phone')
      .populate('book', 'title author isbn category')
      .populate('bookCopy', 'copyId shelfBlock shelfNumber rackNumber status')
      .sort({ dueDate: 1 });

    return res.status(200).json({
      success: true,
      count: active.length,
      data: active,
    });
  } catch (error) {
    console.error('[TransactionController.getActiveTransactions] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch active transactions.',
      error: error.message,
    });
  }
};

// GET /api/transactions/overdue (Admin only)
const getOverdueTransactions = async (req, res) => {
  try {
    const now = new Date();
    const overdue = await BorrowTransaction.find({
      status: { $in: ['Issued', 'Overdue'] },
      dueDate: { $lt: now },
    })
      .populate('student', 'name registerNumber email department phone')
      .populate('book', 'title author isbn category')
      .populate('bookCopy', 'copyId shelfBlock shelfNumber rackNumber status')
      .sort({ dueDate: 1 });

    return res.status(200).json({
      success: true,
      count: overdue.length,
      data: overdue,
    });
  } catch (error) {
    console.error('[TransactionController.getOverdueTransactions] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch overdue transactions.',
      error: error.message,
    });
  }
};

// GET /api/transactions/student/:studentId (Admin only)
const getStudentTransactions = async (req, res) => {
  try {
    const transactions = await BorrowTransaction.find({ student: req.params.studentId })
      .populate('book', 'title author isbn category')
      .populate('bookCopy', 'copyId shelfBlock shelfNumber rackNumber status')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    console.error('[TransactionController.getStudentTransactions] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch student transactions.',
      error: error.message,
    });
  }
};

module.exports = {
  issueBook,
  returnBook,
  getTransactions,
  getActiveTransactions,
  getOverdueTransactions,
  getStudentTransactions,
};

