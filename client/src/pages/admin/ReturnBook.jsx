import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import libraryService from '../../services/libraryService';
import {
  ArrowDownLeft,
  Search,
  BookOpen,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Printer,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

const ReturnBook = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTx, setActiveTx] = useState(null);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);

  // Return Parameters
  const todayStr = new Date().toISOString().split('T')[0];
  const [returnDate, setReturnDate] = useState(todayStr);
  const [remarks, setRemarks] = useState('');

  // Check URL query param
  useEffect(() => {
    const preCopyId = searchParams.get('copyId');
    if (preCopyId) {
      setSearchInput(preCopyId);
      lookupActiveTransaction(preCopyId);
    }
  }, [searchParams]);

  const lookupActiveTransaction = async (identifier) => {
    if (!identifier) return;
    setLoading(true);
    setError('');
    setActiveTx(null);
    setSuccessData(null);

    try {
      // First check if copy exists
      const copyRes = await libraryService.getBookCopyByIdOrQr(identifier.trim());
      if (copyRes.data.success && copyRes.data.data) {
        if (copyRes.data.data.status !== 'Issued') {
          setError(
            `Book copy ${copyRes.data.data.copyId} is currently "${copyRes.data.data.status}". It does not have an active borrowing transaction.`
          );
          return;
        }

        if (copyRes.data.activeTransaction) {
          // Construct full transaction object
          setActiveTx({
            _id: copyRes.data.activeTransaction._id,
            student: copyRes.data.activeTransaction.student,
            book: copyRes.data.data.book,
            bookCopy: copyRes.data.data,
            issueDate: copyRes.data.activeTransaction.issueDate,
            dueDate: copyRes.data.activeTransaction.dueDate,
          });
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || `No active borrowing record found for "${identifier}".`);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    lookupActiveTransaction(searchInput);
  };

  // Calculate Overdue status
  const calculateOverdue = () => {
    if (!activeTx) return { isOverdue: false, days: 0, fine: 0 };
    const due = new Date(activeTx.dueDate);
    due.setHours(23, 59, 59, 999);
    const ret = new Date(returnDate);

    if (ret > due) {
      const diffMs = ret.getTime() - due.getTime();
      const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      return { isOverdue: true, days, fine: days * 0 }; // fine per day default 0
    }
    return { isOverdue: false, days: 0, fine: 0 };
  };

  const overdueInfo = calculateOverdue();

  const handleConfirmReturn = async (e) => {
    e.preventDefault();
    if (!activeTx) return;

    setSubmitting(true);
    setError('');

    try {
      const res = await libraryService.returnBook({
        transactionId: activeTx._id,
        returnDate,
        remarks,
      });

      if (res.data.success) {
        setSuccessData(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process book return.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSuccessData(null);
    setActiveTx(null);
    setSearchInput('');
    setRemarks('');
    setError('');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center">
          <ArrowDownLeft className="h-6 w-6 mr-2 text-brand-600" />
          Return Book Workflow
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Scan book QR code or search by Copy ID to check books back into the library inventory and notify students.
        </p>
      </div>

      {/* Success Confirmation Card */}
      {successData && (
        <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="h-12 w-12 rounded-full bg-emerald-600 text-white flex items-center justify-center">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-emerald-950">
                Book Returned Successfully!
              </h2>
              <p className="text-xs text-emerald-700">
                Physical copy status restored to "Available" &bull; In-app confirmation sent to student.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-emerald-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block">Book Title:</span>
              <p className="text-sm font-bold text-slate-900">{successData.bookTitle}</p>
              <p className="font-mono text-slate-600">Copy ID: {successData.copyId}</p>
            </div>
            <div>
              <span className="text-slate-400 block">Student:</span>
              <p className="text-sm font-bold text-slate-900">{successData.studentName}</p>
              <p className="font-mono text-slate-600">{successData.registerNumber}</p>
            </div>
            <div>
              <span className="text-slate-400 block">Return Date:</span>
              <p className="font-medium text-slate-800">
                {new Date(successData.returnDate).toLocaleDateString('en-IN')}
              </p>
            </div>
            <div>
              <span className="text-slate-400 block">Status on Return:</span>
              <p
                className={`font-bold ${
                  successData.isOverdue ? 'text-rose-700' : 'text-emerald-700'
                }`}
              >
                {successData.isOverdue
                  ? `Returned Late (${successData.overdueDays} days overdue)`
                  : 'Returned On Time'}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-sm"
            >
              <Printer className="h-4 w-4" />
              <span>Print Return Slip</span>
            </button>
            <button
              onClick={resetForm}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm"
            >
              Return Another Book
            </button>
          </div>
        </div>
      )}

      {!successData && (
        <div className="space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2.5">
              <AlertTriangle className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold">Lookup Error</p>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Search Box */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-200 mb-4">
              <h2 className="text-sm font-bold text-slate-900">
                Locate Active Transaction by Book Copy
              </h2>
              <button
                type="button"
                onClick={() => navigate('/admin/scan-qr')}
                className="text-xs text-brand-600 hover:text-brand-800 font-semibold"
              >
                Scan Book QR with Camera &rarr;
              </button>
            </div>

            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
                placeholder="Enter Copy ID or QR value (e.g. COPY001 or BOOK_COPY:COPY001)"
                className="flex-1 text-xs sm:text-sm px-3.5 py-2.5 border border-slate-300 rounded-lg uppercase font-mono focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={loading || !searchInput}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 disabled:opacity-50"
              >
                <Search className="h-4 w-4" />
                <span>{loading ? 'Searching...' : 'Find Record'}</span>
              </button>
            </form>
          </div>

          {/* Active Borrow Details & Return Execution */}
          {activeTx && (
            <form onSubmit={handleConfirmReturn} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
              <div className="pb-4 border-b border-slate-200">
                <span className="text-[11px] font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full inline-block mb-1">
                  Active Borrowing Record Verified
                </span>
                <h3 className="text-lg font-bold text-slate-900">{activeTx.book?.title}</h3>
                <p className="text-xs text-slate-600">by {activeTx.book?.author}</p>
              </div>

              {/* Grid with Student and Loan Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                  <span className="font-bold text-slate-700 block text-xs uppercase tracking-wider mb-2">
                    Borrower Details
                  </span>
                  <p>
                    <span className="text-slate-400">Name:</span> <strong>{activeTx.student?.name}</strong>
                  </p>
                  <p>
                    <span className="text-slate-400">Register No:</span>{' '}
                    <strong className="font-mono">{activeTx.student?.registerNumber}</strong>
                  </p>
                  <p>
                    <span className="text-slate-400">Department:</span> {activeTx.student?.department}
                  </p>
                  <p>
                    <span className="text-slate-400">Email:</span> {activeTx.student?.email}
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                  <span className="font-bold text-slate-700 block text-xs uppercase tracking-wider mb-2">
                    Physical Copy & Loan Dates
                  </span>
                  <p>
                    <span className="text-slate-400">Copy ID:</span>{' '}
                    <strong className="font-mono">{activeTx.bookCopy?.copyId}</strong>
                  </p>
                  <p>
                    <span className="text-slate-400">Shelf Location:</span>{' '}
                    {activeTx.bookCopy?.shelfBlock}, {activeTx.bookCopy?.shelfNumber}
                  </p>
                  <p>
                    <span className="text-slate-400">Issue Date:</span>{' '}
                    {new Date(activeTx.issueDate).toLocaleDateString('en-IN')}
                  </p>
                  <p>
                    <span className="text-slate-400">Scheduled Due Date:</span>{' '}
                    <strong className="text-brand-800 font-semibold">
                      {new Date(activeTx.dueDate).toLocaleDateString('en-IN')}
                    </strong>
                  </p>
                </div>
              </div>

              {/* Overdue Calculation Banner */}
              {overdueInfo.isOverdue ? (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-rose-600 flex-shrink-0" />
                    <div>
                      <p className="font-bold">Book is Overdue by {overdueInfo.days} day(s)</p>
                      <p className="text-[11px] text-rose-700">
                        Configured Fine Amount: Rs. {overdueInfo.fine} (Configured at 0/day)
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-rose-200 text-rose-800 rounded font-bold">
                    Overdue
                  </span>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center space-x-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                  <span>The book is being returned on time before the due date.</span>
                </div>
              )}

              {/* Return Parameters Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Confirmed Return Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Condition / Remarks
                  </label>
                  <input
                    type="text"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="e.g. Good condition, returned at Counter A"
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Submit Return */}
              <div className="pt-4 border-t border-slate-200 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-bold flex items-center space-x-2 shadow-md disabled:opacity-50 transition-colors"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>{submitting ? 'Confirming Return...' : 'Confirm Return & Restock Book'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default ReturnBook;

