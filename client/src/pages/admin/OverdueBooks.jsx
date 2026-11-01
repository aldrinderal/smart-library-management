import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import libraryService from '../../services/libraryService';
import { AlertTriangle, RotateCcw, Bell, Search, Mail } from 'lucide-react';

const OverdueBooks = () => {
  const navigate = useNavigate();
  const [overdueList, setOverdueList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const fetchOverdue = async () => {
    setLoading(true);
    try {
      const res = await libraryService.getOverdueTransactions();
      if (res.data.success) {
        setOverdueList(res.data.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch overdue books.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverdue();
  }, []);

  const calculateDaysOverdue = (dueDate) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diff = now.getTime() - due.getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const filtered = overdueList.filter((tx) => {
    const term = search.toLowerCase();
    return (
      tx.student?.name?.toLowerCase().includes(term) ||
      tx.student?.registerNumber?.toLowerCase().includes(term) ||
      tx.book?.title?.toLowerCase().includes(term) ||
      tx.bookCopy?.copyId?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center">
            <AlertTriangle className="h-6 w-6 mr-2 text-rose-600" />
            Overdue Books Monitor
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Tracking books past their scheduled return date. Automated alerts run continuously via node-cron.
          </p>
        </div>

        <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs px-3 py-1.5 rounded-lg font-semibold flex items-center">
          <span>{overdueList.length} book(s) currently overdue</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search overdue borrowers, register number, or book title..."
            className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-rose-50/50 text-slate-600 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Student Borrower</th>
                <th className="py-3 px-4">Book Title & Copy</th>
                <th className="py-3 px-4">Scheduled Due Date</th>
                <th className="py-3 px-4">Days Overdue</th>
                <th className="py-3 px-4">Student Email / Phone</th>
                <th className="py-3 px-4 text-right">Counter Return</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    Loading overdue list...
                  </td>
                </tr>
              ) : filtered.length > 0 ? (
                filtered.map((tx) => {
                  const days = calculateDaysOverdue(tx.dueDate);
                  return (
                    <tr key={tx._id} className="hover:bg-rose-50/30 transition-colors">
                      <td className="py-3 px-4">
                        <strong className="text-slate-900 block">{tx.student?.name}</strong>
                        <span className="font-mono text-slate-500 text-[11px]">
                          {tx.student?.registerNumber} ({tx.student?.department || 'Dept'})
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <span className="font-bold text-slate-800 block truncate">
                          {tx.book?.title}
                        </span>
                        <span className="font-mono text-brand-700 text-[11px]">
                          Copy: {tx.bookCopy?.copyId} &bull; Shelf: {tx.bookCopy?.shelfBlock},{' '}
                          {tx.bookCopy?.shelfNumber}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {new Date(tx.dueDate).toLocaleDateString('en-IN')}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-rose-100 text-rose-800">
                          {days} day{days > 1 ? 's' : ''} late
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        <div className="flex items-center space-x-1">
                          <Mail className="h-3.5 w-3.5 text-slate-400" />
                          <span>{tx.student?.email}</span>
                        </div>
                        {tx.student?.phone && (
                          <span className="text-[11px] block mt-0.5 text-slate-400">
                            {tx.student.phone}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() =>
                            navigate(`/admin/return-book?copyId=${tx.bookCopy?.copyId}`)
                          }
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded font-semibold text-[11px] inline-flex items-center space-x-1"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          <span>Check In</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    No overdue books currently detected in library records! All active loans are on schedule.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OverdueBooks;

