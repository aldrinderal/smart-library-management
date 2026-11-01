import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import libraryService from '../../services/libraryService';
import {
  ArrowUpRight,
  UserCheck,
  BookOpen,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Search,
  MapPin,
  Clock,
  Printer,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

const IssueBook = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Search Inputs
  const [regNoInput, setRegNoInput] = useState('');
  const [copyIdInput, setCopyIdInput] = useState('');

  // Selected State
  const [student, setStudent] = useState(null);
  const [bookCopy, setBookCopy] = useState(null);
  const [activeBorrowsCount, setActiveBorrowsCount] = useState(0);

  // Form Details
  const todayStr = new Date().toISOString().split('T')[0];
  const defaultDueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [issueDate, setIssueDate] = useState(todayStr);
  const [dueDate, setDueDate] = useState(defaultDueDate);
  const [remarks, setRemarks] = useState('');

  // UI state
  const [loadingStudent, setLoadingStudent] = useState(false);
  const [loadingCopy, setLoadingCopy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);

  // Pre-load from URL query params (e.g. redirected from ID scanner or QR scanner)
  useEffect(() => {
    const preRegNo = searchParams.get('regNo');
    const preCopyId = searchParams.get('copyId');

    if (preRegNo) {
      setRegNoInput(preRegNo);
      fetchStudent(preRegNo);
    }
    if (preCopyId) {
      setCopyIdInput(preCopyId);
      fetchBookCopy(preCopyId);
    }
  }, [searchParams]);

  const fetchStudent = async (regNo) => {
    if (!regNo) return;
    setLoadingStudent(true);
    setError('');
    try {
      const res = await libraryService.getStudentByRegNo(regNo.trim().toUpperCase());
      if (res.data.success && res.data.data) {
        setStudent(res.data.data);
        setActiveBorrowsCount(res.data.activeBorrowsCount || 0);
      }
    } catch (err) {
      setError(err.response?.data?.message || `Student with register number "${regNo}" not found.`);
      setStudent(null);
    } finally {
      setLoadingStudent(false);
    }
  };

  const fetchBookCopy = async (identifier) => {
    if (!identifier) return;
    setLoadingCopy(true);
    setError('');
    try {
      const res = await libraryService.getBookCopyByIdOrQr(identifier.trim());
      if (res.data.success && res.data.data) {
        if (res.data.data.status !== 'Available') {
          setError(
            `Book copy ${res.data.data.copyId} is currently ${res.data.data.status}. Only "Available" copies can be issued.`
          );
          setBookCopy(null);
        } else {
          setBookCopy(res.data.data);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || `Book copy "${identifier}" not found in inventory.`);
      setBookCopy(null);
    } finally {
      setLoadingCopy(false);
    }
  };

  const handleIssueSubmit = async (e) => {
    e.preventDefault();
    if (!student) {
      setError('Please select and verify a student first.');
      return;
    }
    if (!bookCopy) {
      setError('Please select an available book copy.');
      return;
    }

    if (new Date(dueDate) < new Date(issueDate)) {
      setError('Due date cannot be earlier than the issue date.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await libraryService.issueBook({
        studentId: student._id,
        copyId: bookCopy.copyId,
        dueDate,
        remarks,
      });

      if (res.data.success) {
        setSuccessData(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete book issue transaction.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSuccessData(null);
    setStudent(null);
    setBookCopy(null);
    setRegNoInput('');
    setCopyIdInput('');
    setDueDate(defaultDueDate);
    setRemarks('');
    setError('');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center">
          <ArrowUpRight className="h-6 w-6 mr-2 text-brand-600" />
          Issue Book Workflow
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Complete the library counter lending transaction with student verification, physical copy check, and automated due-date scheduling.
        </p>
      </div>

      {/* Success Modal / Banner */}
      {successData && (
        <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="h-12 w-12 rounded-full bg-emerald-600 text-white flex items-center justify-center">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-emerald-950">
                Book Successfully Issued!
              </h2>
              <p className="text-xs text-emerald-700">
                Transaction recorded in MongoDB &bull; In-app notification delivered to student.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-emerald-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block">Student:</span>
              <p className="text-sm font-bold text-slate-900">{successData.student?.name}</p>
              <p className="font-mono text-slate-600">{successData.student?.registerNumber}</p>
            </div>
            <div>
              <span className="text-slate-400 block">Book Title:</span>
              <p className="text-sm font-bold text-slate-900">{successData.book?.title}</p>
              <p className="font-mono text-slate-600">Copy ID: {successData.bookCopy?.copyId}</p>
            </div>
            <div>
              <span className="text-slate-400 block">Issue Date:</span>
              <p className="font-medium text-slate-800">
                {new Date(successData.issueDate).toLocaleDateString('en-IN')}
              </p>
            </div>
            <div>
              <span className="text-slate-400 block">Scheduled Due Date:</span>
              <p className="font-bold text-brand-700 text-sm">
                {new Date(successData.dueDate).toLocaleDateString('en-IN')}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-sm"
            >
              <Printer className="h-4 w-4" />
              <span>Print Issue Slip</span>
            </button>
            <button
              onClick={resetForm}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm"
            >
              Issue Another Book
            </button>
          </div>
        </div>
      )}

      {!successData && (
        <form onSubmit={handleIssueSubmit} className="space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2.5">
              <AlertCircle className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold">Validation Error</p>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Step 1 & 2: Student Identification & Verification */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-200 mb-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center">
                <span className="h-6 w-6 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center mr-2">
                  1
                </span>
                Verify Student
              </h2>
              <button
                type="button"
                onClick={() => navigate('/admin/scan-id')}
                className="text-xs text-brand-600 hover:text-brand-800 font-semibold flex items-center"
              >
                Scan Student ID with Camera &rarr;
              </button>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={regNoInput}
                onChange={(e) => setRegNoInput(e.target.value.toUpperCase())}
                placeholder="Enter Student Register Number (e.g. 721924104026)"
                className="flex-1 text-xs sm:text-sm px-3.5 py-2.5 border border-slate-300 rounded-lg uppercase font-mono focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => fetchStudent(regNoInput)}
                disabled={loadingStudent || !regNoInput}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 disabled:opacity-50"
              >
                <Search className="h-4 w-4" />
                <span>{loadingStudent ? 'Checking...' : 'Lookup Student'}</span>
              </button>
            </div>

            {/* Display Selected Student Record */}
            {student && (
              <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <UserCheck className="h-5 w-5 text-emerald-600" />
                    <h3 className="font-bold text-sm text-slate-900">{student.name}</h3>
                    <span className="text-xs font-mono bg-slate-200 px-2 py-0.5 rounded text-slate-700">
                      {student.registerNumber}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    {student.department} &bull; Batch {student.startYear || '2024'}–{student.endYear || '2028'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{student.email}</p>
                </div>

                <div className="text-right flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto">
                  <span
                    className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold ${
                      student.isActive
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {student.isActive ? 'Active Account' : 'Deactivated'}
                  </span>
                  <span className="text-xs text-slate-500 mt-1">
                    Currently Borrowed: <strong>{activeBorrowsCount} / 3 books</strong>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Step 3 & 4: Book Copy Selection */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-200 mb-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center">
                <span className="h-6 w-6 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center mr-2">
                  2
                </span>
                Select Book Copy
              </h2>
              <button
                type="button"
                onClick={() => navigate('/admin/scan-qr')}
                className="text-xs text-brand-600 hover:text-brand-800 font-semibold flex items-center"
              >
                Scan Book QR with Camera &rarr;
              </button>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={copyIdInput}
                onChange={(e) => setCopyIdInput(e.target.value.toUpperCase())}
                placeholder="Enter Copy ID or QR value (e.g. COPY002 or BOOK_COPY:COPY002)"
                className="flex-1 text-xs sm:text-sm px-3.5 py-2.5 border border-slate-300 rounded-lg uppercase font-mono focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => fetchBookCopy(copyIdInput)}
                disabled={loadingCopy || !copyIdInput}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 disabled:opacity-50"
              >
                <Search className="h-4 w-4" />
                <span>{loadingCopy ? 'Checking...' : 'Check Copy'}</span>
              </button>
            </div>

            {/* Display Selected Book Copy Details */}
            {bookCopy && (
              <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <BookOpen className="h-5 w-5 text-brand-600" />
                    <h3 className="font-bold text-sm text-slate-900">{bookCopy.book?.title}</h3>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">by {bookCopy.book?.author}</p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    ISBN: {bookCopy.book?.isbn} &bull; Category: {bookCopy.book?.category}
                  </p>
                </div>

                <div className="text-right flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[11px] font-mono font-bold text-brand-700 block">
                    Copy ID: {bookCopy.copyId}
                  </span>
                  <span className="text-xs text-slate-600 flex items-center mt-0.5">
                    <MapPin className="h-3 w-3 mr-1 text-slate-400" />
                    {bookCopy.shelfBlock}, {bookCopy.shelfNumber} ({bookCopy.rackNumber || 'Rack 01'})
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Step 5: Loan Dates & Confirmation */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h2 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-200 mb-4 flex items-center">
              <span className="h-6 w-6 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center mr-2">
                3
              </span>
              Lending Schedule & Confirmation
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Issue Date (Automatic Today)
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-700 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Due Date (Configurable) *
                </label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  min={issueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-slate-300 rounded-lg text-slate-900 font-semibold focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Librarian Remarks (Optional)
              </label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="e.g. Clean copy, issued for semester mini-project"
                className="w-full text-xs px-3.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            {/* Final Issue Button */}
            <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-end">
              <button
                type="submit"
                disabled={submitting || !student || !bookCopy}
                className="px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-sm font-bold flex items-center space-x-2 shadow-md disabled:opacity-50 transition-colors"
              >
                <span>{submitting ? 'Creating Transaction...' : 'Confirm & Issue Book'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default IssueBook;

