const Book = require('../models/Book');
const BookCopy = require('../models/BookCopy');
const BorrowTransaction = require('../models/BorrowTransaction');

// GET /api/books (Public/Authenticated)
const getBooks = async (req, res) => {
  try {
    const { search, category, page = 1, limit = 20 } = req.query;

    const query = {};

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { author: searchRegex },
        { isbn: searchRegex },
        { bookTitleId: searchRegex },
      ];
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [books, total] = await Promise.all([
      Book.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Book.countDocuments(query),
    ]);

    // Aggregate copy stats for these books
    const bookIds = books.map((b) => b._id);
    const copyStats = await BookCopy.aggregate([
      { $match: { book: { $in: bookIds } } },
      {
        $group: {
          _id: { book: '$book', status: '$status' },
          count: { $sum: 1 },
        },
      },
    ]);

    const booksWithCounts = books.map((book) => {
      const bObj = book.toObject();
      const stats = copyStats.filter((s) => s._id.book.toString() === book._id.toString());
      bObj.totalCopies = stats.reduce((acc, curr) => acc + curr.count, 0);
      bObj.availableCopies =
        stats.find((s) => s._id.status === 'Available')?.count || 0;
      bObj.issuedCopies =
        stats.find((s) => s._id.status === 'Issued')?.count || 0;
      return bObj;
    });

    // Also get distinct categories for filtering
    const categories = await Book.distinct('category');

    return res.status(200).json({
      success: true,
      data: booksWithCounts,
      categories,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum,
      },
    });
  } catch (error) {
    console.error('[BookController.getBooks] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch books.',
      error: error.message,
    });
  }
};

// GET /api/books/:id
const getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found.',
      });
    }

    const copies = await BookCopy.find({ book: book._id }).sort({ copyId: 1 });

    const totalCopies = copies.length;
    const availableCopies = copies.filter((c) => c.status === 'Available').length;
    const issuedCopies = copies.filter((c) => c.status === 'Issued').length;

    return res.status(200).json({
      success: true,
      data: {
        ...book.toObject(),
        copies,
        totalCopies,
        availableCopies,
        issuedCopies,
      },
    });
  } catch (error) {
    console.error('[BookController.getBookById] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve book details.',
      error: error.message,
    });
  }
};

// POST /api/books (Admin only)
const createBook = async (req, res) => {
  try {
    const { bookTitleId, title, author, isbn, publisher, edition, category, description } = req.body;

    if (!title || !author || !isbn || !category) {
      return res.status(400).json({
        success: false,
        message: 'Title, Author, ISBN, and Category are required.',
      });
    }

    const normalizedIsbn = isbn.trim().toUpperCase();

    const existingIsbn = await Book.findOne({ isbn: normalizedIsbn });
    if (existingIsbn) {
      return res.status(400).json({
        success: false,
        message: 'A book with this ISBN already exists.',
      });
    }

    // Auto-generate title ID if omitted
    let assignedTitleId = bookTitleId ? bookTitleId.trim().toUpperCase() : null;
    if (!assignedTitleId) {
      const count = await Book.countDocuments();
      assignedTitleId = `TITLE${String(count + 1).padStart(3, '0')}`;
    }

    const book = await Book.create({
      bookTitleId: assignedTitleId,
      title: title.trim(),
      author: author.trim(),
      isbn: normalizedIsbn,
      publisher: publisher ? publisher.trim() : '',
      edition: edition ? edition.trim() : '1st Edition',
      category: category.trim(),
      description: description ? description.trim() : '',
    });

    return res.status(201).json({
      success: true,
      message: 'Book created successfully.',
      data: book,
    });
  } catch (error) {
    console.error('[BookController.createBook] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create book.',
      error: error.message,
    });
  }
};

// PATCH /api/books/:id (Admin only)
const updateBook = async (req, res) => {
  try {
    const { title, author, isbn, publisher, edition, category, description } = req.body;

    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found.',
      });
    }

    if (isbn && isbn.trim().toUpperCase() !== book.isbn) {
      const isbnConflict = await Book.findOne({
        isbn: isbn.trim().toUpperCase(),
        _id: { $ne: book._id },
      });
      if (isbnConflict) {
        return res.status(400).json({
          success: false,
          message: 'Another book already exists with this ISBN.',
        });
      }
      book.isbn = isbn.trim().toUpperCase();
    }

    if (title) book.title = title.trim();
    if (author) book.author = author.trim();
    if (publisher !== undefined) book.publisher = publisher.trim();
    if (edition !== undefined) book.edition = edition.trim();
    if (category) book.category = category.trim();
    if (description !== undefined) book.description = description.trim();

    await book.save();

    return res.status(200).json({
      success: true,
      message: 'Book updated successfully.',
      data: book,
    });
  } catch (error) {
    console.error('[BookController.updateBook] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update book.',
      error: error.message,
    });
  }
};

// DELETE /api/books/:id (Admin only)
const deleteBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found.',
      });
    }

    // Check if copies have active transactions
    const copies = await BookCopy.find({ book: book._id });
    const copyIds = copies.map((c) => c._id);

    const activeTransaction = await BorrowTransaction.findOne({
      bookCopy: { $in: copyIds },
      status: { $in: ['Issued', 'Overdue'] },
    });

    if (activeTransaction) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete book: One or more physical copies currently have an active borrowing transaction.',
      });
    }

    // Delete copies and book
    await BookCopy.deleteMany({ book: book._id });
    await Book.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Book and associated copies removed successfully.',
    });
  } catch (error) {
    console.error('[BookController.deleteBook] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete book.',
      error: error.message,
    });
  }
};

module.exports = {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
};

