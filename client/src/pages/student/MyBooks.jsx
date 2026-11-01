import React, { useState, useEffect } from 'react';
import libraryService from '../../services/libraryService';
import {
  BookMarked,
  Clock,
  Calendar,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Info,
} from 'lucide-react';

const MyBooks = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMyBooks = async () => {
      try {
        const res = await libraryService.getMyBooks();
        if (res.data.success) {
          setBooks(res.data.data || []);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch your books.');
      } finally {
        setLoading(false);
      }
    };
    fetchMyMyBooks();
    fetchMyBooks();
  }, []);

  const fetchMyMyBooks = () => {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center">
          <BookMarked className="h-6 w-6 mr-2 text-emerald-600" />
          My Borrowed Books
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Review your active library loans, days remaining until due date, and physical copy details.
        </p>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-500">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mb-2"></div>
          <p className="text-xs">Loading your borrowed books...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
          {error}
        </div>
      ) : books.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {books.map((book) => {
            const isOverdue = book.borrowingStatus === 'Overdue';
            const isDueToday = book.borrowingStatus === 'Due Today';
            const isDueSoon = book.borrowingStatus === 'Due Soon';

            return (
              <div
                key={book._id}
                className={`p-5 rounded-2xl border transition-shadow bg-white shadow-sm flex flex-col justify-between ${
                  isOverdue
                    ? 'border-rose-200 ring-1 ring-rose-200'
                    : isDueToday
                    ? 'border-amber-200 ring-1 ring-amber-200'
                    : 'border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                      {book.category}
                    </span>
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        isOverdue
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : isDueToday
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : isDueSoon
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {book.borrowingStatus}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 leading-snug">{book.bookTitle}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">by {book.author}</p>

                  <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-600">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Copy ID</span>
                      <strong className="font-mono text-slate-800">{book.copyId}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Shelf Location</span>
                      <span className="text-slate-800 flex items-center">
                        <MapPin className="h-3 w-3 mr-1 text-slate-400" />
                        {book.shelfLocation}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Issued On</span>
                      <span className="text-slate-800">
                        {new Date(book.issueDate).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Due Date</span>
                      <strong className={isOverdue ? 'text-rose-700' : 'text-slate-900'}>
                        {new Date(book.dueDate).toLocaleDateString('en-IN')}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Days Remaining / Overdue Footer Banner */}
                <div
                  className={`mt-4 pt-3 border-t text-xs flex items-center justify-between ${
                    isOverdue
                      ? 'border-rose-100 text-rose-800'
                      : isDueToday
                      ? 'border-amber-100 text-amber-800 font-semibold'
                      : 'border-slate-100 text-slate-500'
                  }`}
                >
                  <span className="flex items-center">
                    <Clock className="h-3.5 w-3.5 mr-1" />
                    {isOverdue
                      ? `Overdue by ${book.daysOverdue} day(s)`
                      : isDueToday
                      ? 'Due today! Please return to the library counter.'
                      : `${book.daysRemaining} days remaining`}
                  </span>
                  <span className="text-[11px] text-slate-400">Counter Desk Return</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          <BookMarked className="h-12 w-12 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
          <p className="text-sm font-semibold text-slate-700">No active books borrowed</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            You currently have 0 books checked out. When you borrow a book using your student ID card, it will appear here.
          </p>
        </div>
      )}
    </div>
  );
};

export default MyBooks;

