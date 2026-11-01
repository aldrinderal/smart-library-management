import React, { useState, useEffect } from 'react';
import libraryService from '../../services/libraryService';
import { QRCodeSVG } from 'qrcode.react';
import {
  BookOpen,
  Search,
  Plus,
  BookCopy as BookCopyIcon,
  MapPin,
  Trash2,
  Edit,
  Printer,
  QrCode,
  X,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

const BookManagement = () => {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [error, setError] = useState('');

  // Modals
  const [showAddTitleModal, setShowAddTitleModal] = useState(false);
  const [showCopiesModal, setShowCopiesModal] = useState(false);
  const [showAddCopiesModal, setShowAddCopiesModal] = useState(false);
  const [selectedBookForCopies, setSelectedBookForCopies] = useState(null);
  const [bookCopiesList, setBookCopiesList] = useState([]);
  const [copiesLoading, setCopiesLoading] = useState(false);

  // QR Print Modal
  const [showQrPrintModal, setShowQrPrintModal] = useState(false);
  const [selectedCopyForQr, setSelectedCopyForQr] = useState(null);

  // New Book Title Form
  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    isbn: '',
    publisher: '',
    edition: '1st Edition',
    category: 'Computer Science',
    description: '',
  });

  // Add Copies Form
  const [newCopiesData, setNewCopiesData] = useState({
    count: 1,
    shelfBlock: 'Block A',
    shelfNumber: 'Shelf 01',
    rackNumber: 'Rack 01',
  });

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (categoryFilter && categoryFilter !== 'All') params.category = categoryFilter;

      const res = await libraryService.getBooks(params);
      if (res.data.success) {
        setBooks(res.data.data || []);
        if (res.data.categories) {
          setCategories(res.data.categories);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch catalog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [categoryFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchBooks();
  };

  // Open Copies Modal
  const handleOpenCopies = async (book) => {
    setSelectedBookForCopies(book);
    setShowCopiesModal(true);
    setCopiesLoading(true);
    try {
      const res = await libraryService.getBookById(book._id);
      if (res.data.success && res.data.data) {
        setBookCopiesList(res.data.data.copies || []);
      }
    } catch (err) {
      alert('Failed to fetch physical copies: ' + err.message);
    } finally {
      setCopiesLoading(false);
    }
  };

  // Create Book Title
  const handleCreateBook = async (e) => {
    e.preventDefault();
    try {
      const res = await libraryService.createBook(newBook);
      if (res.data.success) {
        setShowAddTitleModal(false);
        setNewBook({
          title: '',
          author: '',
          isbn: '',
          publisher: '',
          edition: '1st Edition',
          category: 'Computer Science',
          description: '',
        });
        fetchBooks();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add book title.');
    }
  };

  // Add Physical Copies
  const handleAddCopies = async (e) => {
    e.preventDefault();
    if (!selectedBookForCopies) return;
    try {
      const res = await libraryService.createBookCopies({
        bookId: selectedBookForCopies._id,
        count: parseInt(newCopiesData.count, 10),
        shelfBlock: newCopiesData.shelfBlock,
        shelfNumber: newCopiesData.shelfNumber,
        rackNumber: newCopiesData.rackNumber,
      });

      if (res.data.success) {
        setShowAddCopiesModal(false);
        handleOpenCopies(selectedBookForCopies);
        fetchBooks();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create physical copies.');
    }
  };

  // Delete Book Title
  const handleDeleteBook = async (bookId, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This will also delete all associated copies without active loans.`)) {
      return;
    }
    try {
      const res = await libraryService.deleteBook(bookId);
      if (res.data.success) {
        fetchBooks();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete book.');
    }
  };

  // Open QR Print Modal
  const handleOpenQrModal = (copy, book) => {
    setSelectedCopyForQr({
      ...copy,
      bookTitle: book?.title || selectedBookForCopies?.title,
      bookAuthor: book?.author || selectedBookForCopies?.author,
    });
    setShowQrPrintModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center">
            <BookOpen className="h-6 w-6 mr-2 text-brand-600" />
            Book & Physical Copy Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage book titles, catalog metadata, physical shelf locations, and print QR tracking labels.
          </p>
        </div>

        <button
          onClick={() => setShowAddTitleModal(true)}
          className="inline-flex items-center px-4 py-2.5 rounded-lg text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          <span>Add New Book Title</span>
        </button>
      </div>

      {/* Search and Category Filter */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex gap-2">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, author, ISBN, or Title ID..."
              className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold"
          >
            Search
          </button>
        </form>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-slate-700"
          >
            <option value="All">All Categories</option>
            {categories.map((c, i) => (
              <option key={i} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Book Catalog Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Title ID</th>
                <th className="py-3 px-4">Title & Author</th>
                <th className="py-3 px-4">ISBN</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-center">Total Copies</th>
                <th className="py-3 px-4 text-center">Available</th>
                <th className="py-3 px-4 text-center">Issued</th>
                <th className="py-3 px-4 text-right">Physical Inventory</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-500">
                    <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading book titles...
                  </td>
                </tr>
              ) : books.length > 0 ? (
                books.map((book) => (
                  <tr key={book._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-brand-700">
                      {book.bookTitleId || 'N/A'}
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <span className="font-bold text-slate-900 block truncate">{book.title}</span>
                      <span className="text-[11px] text-slate-500">{book.author}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">{book.isbn}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {book.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-800">
                      {book.totalCopies || 0}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-600">
                      {book.availableCopies || 0}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-amber-600">
                      {book.issuedCopies || 0}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenCopies(book)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-[11px] inline-flex items-center space-x-1"
                      >
                        <BookCopyIcon className="h-3.5 w-3.5 text-brand-600" />
                        <span>Manage Copies ({book.totalCopies || 0})</span>
                      </button>
                      <button
                        onClick={() => handleDeleteBook(book._id, book.title)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                        title="Delete Book Title"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">
                    No book titles found in the catalog.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manage Physical Copies Modal */}
      {showCopiesModal && selectedBookForCopies && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Physical Copies for "{selectedBookForCopies.title}"
                </h3>
                <p className="text-xs text-slate-500">
                  Shelf locations and unique QR tracking IDs for each copy
                </p>
              </div>
              <button
                onClick={() => setShowCopiesModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                Total copies: <strong>{bookCopiesList.length}</strong>
              </span>
              <button
                onClick={() => setShowAddCopiesModal(true)}
                className="px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded text-xs font-semibold flex items-center space-x-1 shadow-sm"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add More Copies</span>
              </button>
            </div>

            {/* Copies Grid */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {copiesLoading ? (
                <div className="col-span-2 py-8 text-center text-slate-400 text-xs">
                  Loading copies...
                </div>
              ) : bookCopiesList.length > 0 ? (
                bookCopiesList.map((copy) => (
                  <div
                    key={copy._id}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-xs text-slate-900">
                          {copy.copyId}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            copy.status === 'Available'
                              ? 'bg-emerald-100 text-emerald-800'
                              : copy.status === 'Issued'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {copy.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1 flex items-center">
                        <MapPin className="h-3 w-3 mr-1 text-slate-400" />
                        {copy.shelfBlock}, {copy.shelfNumber} ({copy.rackNumber || 'Rack 01'})
                      </p>
                    </div>

                    <button
                      onClick={() => handleOpenQrModal(copy, selectedBookForCopies)}
                      className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded text-xs font-semibold flex items-center space-x-1"
                    >
                      <QrCode className="h-3.5 w-3.5 text-brand-600" />
                      <span>Print QR</span>
                    </button>
                  </div>
                ))
              ) : (
                <div className="col-span-2 py-8 text-center text-slate-400 text-xs">
                  No physical copies found for this book title. Click "Add More Copies" above.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Physical Copies Modal */}
      {showAddCopiesModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="font-bold text-base text-slate-900">Add Physical Copies</h3>
              <button
                onClick={() => setShowAddCopiesModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddCopies} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Number of Copies to Generate *
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  required
                  value={newCopiesData.count}
                  onChange={(e) =>
                    setNewCopiesData({ ...newCopiesData, count: e.target.value })
                  }
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Shelf Block *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCopiesData.shelfBlock}
                    onChange={(e) =>
                      setNewCopiesData({ ...newCopiesData, shelfBlock: e.target.value })
                    }
                    placeholder="Block A"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Shelf Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCopiesData.shelfNumber}
                    onChange={(e) =>
                      setNewCopiesData({ ...newCopiesData, shelfNumber: e.target.value })
                    }
                    placeholder="Shelf 01"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Rack Number
                </label>
                <input
                  type="text"
                  value={newCopiesData.rackNumber}
                  onChange={(e) =>
                    setNewCopiesData({ ...newCopiesData, rackNumber: e.target.value })
                  }
                  placeholder="Rack 01"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddCopiesModal(false)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded text-xs font-semibold"
                >
                  Generate Copies
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print QR Label Modal */}
      {showQrPrintModal && selectedCopyForQr && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl text-center">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 mb-4">
              <span className="text-xs font-bold text-slate-800">Physical Book QR Label</span>
              <button
                onClick={() => setShowQrPrintModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Printable Label Box */}
            <div
              id="printable-qr-label"
              className="p-4 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 flex flex-col items-center"
            >
              <div className="p-3 bg-white rounded-lg shadow-sm mb-3">
                <QRCodeSVG
                  value={selectedCopyForQr.qrCodeValue || `BOOK_COPY:${selectedCopyForQr.copyId}`}
                  size={160}
                  level="H"
                  includeMargin={true}
                />
              </div>

              <p className="font-mono font-extrabold text-sm text-slate-900 tracking-wider">
                {selectedCopyForQr.copyId}
              </p>
              <p className="text-xs font-bold text-slate-800 mt-1 max-w-[220px] truncate">
                {selectedCopyForQr.bookTitle}
              </p>
              <p className="text-[11px] text-slate-500">
                {selectedCopyForQr.shelfBlock} &bull; {selectedCopyForQr.shelfNumber} (
                {selectedCopyForQr.rackNumber || 'Rack 01'})
              </p>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center space-x-1"
              >
                <Printer className="h-4 w-4" />
                <span>Print QR Sticker</span>
              </button>
              <button
                onClick={() => setShowQrPrintModal(false)}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Book Title Modal */}
      {showAddTitleModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="font-bold text-base text-slate-900">Add New Book Title to Catalog</h3>
              <button
                onClick={() => setShowAddTitleModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBook} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Book Title *
                </label>
                <input
                  type="text"
                  required
                  value={newBook.title}
                  onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
                  placeholder="e.g. Introduction to Algorithms"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Author(s) *
                </label>
                <input
                  type="text"
                  required
                  value={newBook.author}
                  onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
                  placeholder="Thomas H. Cormen, et al."
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ISBN *
                  </label>
                  <input
                    type="text"
                    required
                    value={newBook.isbn}
                    onChange={(e) =>
                      setNewBook({ ...newBook, isbn: e.target.value.toUpperCase() })
                    }
                    placeholder="978-0262033848"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category *
                  </label>
                  <input
                    type="text"
                    required
                    value={newBook.category}
                    onChange={(e) => setNewBook({ ...newBook, category: e.target.value })}
                    placeholder="Computer Science"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Publisher
                  </label>
                  <input
                    type="text"
                    value={newBook.publisher}
                    onChange={(e) => setNewBook({ ...newBook, publisher: e.target.value })}
                    placeholder="MIT Press"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Edition
                  </label>
                  <input
                    type="text"
                    value={newBook.edition}
                    onChange={(e) => setNewBook({ ...newBook, edition: e.target.value })}
                    placeholder="3rd Edition"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description / Synopsis
                </label>
                <textarea
                  rows="2"
                  value={newBook.description}
                  onChange={(e) => setNewBook({ ...newBook, description: e.target.value })}
                  placeholder="Foundational textbook covering data structures and algorithms."
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddTitleModal(false)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded text-xs font-semibold"
                >
                  Save Title
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookManagement;

