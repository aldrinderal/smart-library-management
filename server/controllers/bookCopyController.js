const BookCopy = require('../models/BookCopy');
const Book = require('../models/Book');
const BorrowTransaction = require('../models/BorrowTransaction');

// GET /api/book-copies (Admin/Authenticated)
const getBookCopies = async (req, res) => {
  try {
    const { search, bookId, status, shelfBlock, page = 1, limit = 50 } = req.query;

    const query = {};

    if (bookId) {
      query.book = bookId;
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    if (shelfBlock && shelfBlock !== 'All') {
      query.shelfBlock = shelfBlock;
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ copyId: searchRegex }, { qrCodeValue: searchRegex }];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const [copies, total] = await Promise.all([
      BookCopy.find(query)
        .populate('book')
        .sort({ copyId: 1 })
        .skip(skip)
        .limit(limitNum),
      BookCopy.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: copies,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum,
      },
    });
  } catch (error) {
    console.error('[BookCopyController.getBookCopies] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve book copies.',
      error: error.message,
    });
  }
};

// GET /api/book-copies/:copyIdOrQr (Lookup by Copy ID or QR code payload)
const getBookCopyByIdOrQr = async (req, res) => {
  try {
    const rawParam = req.params.copyId.trim();

    // Check if input is standard copyId (e.g. COPY001) or QR payload (e.g. BOOK_COPY:COPY001)
    let copyIdToFind = rawParam;
    if (rawParam.startsWith('BOOK_COPY:')) {
      copyIdToFind = rawParam.replace('BOOK_COPY:', '').trim();
    }

    const copy = await BookCopy.findOne({
      $or: [
        { copyId: copyIdToFind.toUpperCase() },
        { qrCodeValue: rawParam },
        { qrCodeValue: `BOOK_COPY:${copyIdToFind.toUpperCase()}` },
      ],
    }).populate('book');

    if (!copy) {
      return res.status(404).json({
        success: false,
        message: `Book copy '${rawParam}' not found in the library database.`,
      });
    }

    // Check if currently issued and get active transaction details
    let activeTransaction = null;
    if (copy.status === 'Issued') {
      activeTransaction = await BorrowTransaction.findOne({
        bookCopy: copy._id,
        status: { $in: ['Issued', 'Overdue'] },
      })
        .populate('student', 'name registerNumber email department phone')
        .select('issueDate dueDate status');
    }

    return res.status(200).json({
      success: true,
      data: copy,
      activeTransaction,
      isAvailable: copy.status === 'Available',
    });
  } catch (error) {
    console.error('[BookCopyController.getBookCopyByIdOrQr] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error looking up book copy.',
      error: error.message,
    });
  }
};

// POST /api/book-copies (Admin only - Add single or multiple copies)
const createBookCopies = async (req, res) => {
  try {
    const { bookId, count = 1, shelfBlock, shelfNumber, rackNumber } = req.body;

    if (!bookId) {
      return res.status(400).json({
        success: false,
        message: 'Book ID is required.',
      });
    }

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Parent book not found.',
      });
    }

    const numberOfCopies = Math.max(1, parseInt(count, 10) || 1);
    const createdCopies = [];

    // Find highest copy number to assign sequential IDs
    const lastCopy = await BookCopy.findOne().sort({ createdAt: -1 });
    let nextNum = 1;
    if (lastCopy && lastCopy.copyId) {
      const match = lastCopy.copyId.match(/COPY(\d+)/i);
      if (match) {
        nextNum = parseInt(match[1], 10) + 1;
      } else {
        const totalCount = await BookCopy.countDocuments();
        nextNum = totalCount + 1;
      }
    }

    for (let i = 0; i < numberOfCopies; i++) {
      let copyIdCandidate;
      let exists = true;
      while (exists) {
        copyIdCandidate = `COPY${String(nextNum).padStart(3, '0')}`;
        const conflict = await BookCopy.findOne({ copyId: copyIdCandidate });
        if (!conflict) {
          exists = false;
        } else {
          nextNum++;
        }
      }

      const qrCodeValue = `BOOK_COPY:${copyIdCandidate}`;

      const newCopy = await BookCopy.create({
        copyId: copyIdCandidate,
        book: book._id,
        qrCodeValue,
        shelfBlock: shelfBlock ? shelfBlock.trim() : 'Block A',
        shelfNumber: shelfNumber ? shelfNumber.trim() : 'Shelf 01',
        rackNumber: rackNumber ? rackNumber.trim() : 'Rack 01',
        status: 'Available',
      });

      createdCopies.push(newCopy);
      nextNum++;
    }

    return res.status(201).json({
      success: true,
      message: `Successfully created ${createdCopies.length} copy/copies for "${book.title}".`,
      data: createdCopies,
    });
  } catch (error) {
    console.error('[BookCopyController.createBookCopies] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create book copies.',
      error: error.message,
    });
  }
};

// PATCH /api/book-copies/:copyId (Admin only - Update copy)
const updateBookCopy = async (req, res) => {
  try {
    const { shelfBlock, shelfNumber, rackNumber, status } = req.body;
    const copyIdParam = req.params.copyId.toUpperCase().trim();

    const copy = await BookCopy.findOne({ copyId: copyIdParam });
    if (!copy) {
      return res.status(404).json({
        success: false,
        message: 'Book copy not found.',
      });
    }

    // If changing status from Issued or to Issued manually, check active transaction
    if (status && status !== copy.status) {
      if (copy.status === 'Issued' && status === 'Available') {
        const activeTx = await BorrowTransaction.findOne({
          bookCopy: copy._id,
          status: { $in: ['Issued', 'Overdue'] },
        });
        if (activeTx) {
          return res.status(400).json({
            success: false,
            message: 'Cannot manually mark an issued copy as Available. Please use the Return Book workflow.',
          });
        }
      }
      copy.status = status;
    }

    if (shelfBlock !== undefined) copy.shelfBlock = shelfBlock.trim();
    if (shelfNumber !== undefined) copy.shelfNumber = shelfNumber.trim();
    if (rackNumber !== undefined) copy.rackNumber = rackNumber.trim();

    await copy.save();

    return res.status(200).json({
      success: true,
      message: 'Book copy updated successfully.',
      data: copy,
    });
  } catch (error) {
    console.error('[BookCopyController.updateBookCopy] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update book copy.',
      error: error.message,
    });
  }
};

// DELETE /api/book-copies/:copyId (Admin only)
const deleteBookCopy = async (req, res) => {
  try {
    const copyIdParam = req.params.copyId.toUpperCase().trim();
    const copy = await BookCopy.findOne({ copyId: copyIdParam });

    if (!copy) {
      return res.status(404).json({
        success: false,
        message: 'Book copy not found.',
      });
    }

    if (copy.status === 'Issued') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete copy: It is currently issued to a student.',
      });
    }

    const activeTx = await BorrowTransaction.findOne({
      bookCopy: copy._id,
      status: { $in: ['Issued', 'Overdue'] },
    });

    if (activeTx) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete copy: It has an active borrowing transaction.',
      });
    }

    await BookCopy.findByIdAndDelete(copy._id);

    return res.status(200).json({
      success: true,
      message: `Book copy ${copyIdParam} deleted successfully.`,
    });
  } catch (error) {
    console.error('[BookCopyController.deleteBookCopy] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete book copy.',
      error: error.message,
    });
  }
};

module.exports = {
  getBookCopies,
  getBookCopyByIdOrQr,
  createBookCopies,
  updateBookCopy,
  deleteBookCopy,
};

