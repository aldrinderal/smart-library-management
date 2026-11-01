import React, { useState, useEffect } from 'react';
import libraryService from '../../services/libraryService';
import { History, CheckCircle2, Calendar } from 'lucide-react';

const BorrowingHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await libraryService.getMyHistory();
        if (res.data.success) {
          setHistory(res.data.data || []);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch borrowing history.');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center">
          <History className="h-6 w-6 mr-2 text-emerald-600" />
          Borrowing History
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Complete archive of previously borrowed books and returned dates.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Book Title & Author</th>
                <th className="py-3 px-4">Copy ID</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Issue Date</th>
                <th className="py-3 px-4">Return Date</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    Loading your borrowing history...
                  </td>
                </tr>
              ) : history.length > 0 ? (
                history.map((tx) => (
                  <tr key={tx._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <strong className="text-slate-900 block">{tx.bookTitle}</strong>
                      <span className="text-slate-500 text-[11px]">{tx.author}</span>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-700">{tx.copyId}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]">
                        {tx.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {new Date(tx.issueDate).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-slate-800 font-semibold">
                      {new Date(tx.returnDate).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[11px] font-bold">
                        <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" />
                        Returned
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    No past borrowing records found.
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

export default BorrowingHistory;

