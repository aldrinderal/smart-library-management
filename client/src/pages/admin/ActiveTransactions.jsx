import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import libraryService from '../../services/libraryService';
import { Clock, Search, RotateCcw, AlertTriangle, ArrowRight } from 'lucide-react';

const ActiveTransactions = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const fetchActive = async () => {
    setLoading(true);
    try {
      const res = await libraryService.getActiveTransactions();
      if (res.data.success) {
        setTransactions(res.data.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch active transactions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActive();
  }, []);

  const filtered = transactions.filter((tx) => {
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
            <Clock className="h-6 w-6 mr-2 text-brand-600" />
            Active Lending Transactions
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            All physical book copies currently checked out by registered students.
          </p>
        </div>

        <button
          onClick={() => navigate('/admin/issue-book')}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold shadow-sm self-start sm:self-auto"
        >
          Issue Another Book
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by student name, register number, title, or copy ID..."
            className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Borrower Student</th>
                <th className="py-3 px-4">Book Title & Copy</th>
                <th className="py-3 px-4">Shelf Location</th>
                <th className="py-3 px-4">Issue Date</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    Loading active transactions...
                  </td>
                </tr>
              ) : filtered.length > 0 ? (
                filtered.map((tx) => {
                  const isOverdue = new Date(tx.dueDate) < new Date();
                  return (
                    <tr key={tx._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <strong className="text-slate-900 block">{tx.student?.name}</strong>
                        <span className="font-mono text-slate-500 text-[11px]">
                          {tx.student?.registerNumber}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <span className="font-bold text-slate-800 block truncate">
                          {tx.book?.title}
                        </span>
                        <span className="font-mono text-brand-700 text-[11px]">
                          Copy: {tx.bookCopy?.copyId}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {tx.bookCopy?.shelfBlock}, {tx.bookCopy?.shelfNumber}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {new Date(tx.issueDate).toLocaleDateString('en-IN')}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-semibold ${
                            isOverdue ? 'text-rose-700 font-bold' : 'text-slate-800'
                          }`}
                        >
                          {new Date(tx.dueDate).toLocaleDateString('en-IN')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isOverdue
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isOverdue ? 'Overdue' : 'Active Loan'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() =>
                            navigate(`/admin/return-book?copyId=${tx.bookCopy?.copyId}`)
                          }
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-[11px] inline-flex items-center space-x-1"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          <span>Return</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">
                    No active borrowing transactions found.
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

export default ActiveTransactions;

