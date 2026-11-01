import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import libraryService from '../../services/libraryService';
import {
  Users,
  BookOpen,
  BookCopy,
  Clock,
  AlertTriangle,
  RotateCcw,
  CheckCircle,
  Camera,
  QrCode,
  ArrowUpRight,
  ArrowDownLeft,
  Bell,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cronRunning, setCronRunning] = useState(false);
  const [cronFeedback, setCronFeedback] = useState(null);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await libraryService.getAdminDashboard();
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleManualCronCheck = async () => {
    setCronRunning(true);
    setCronFeedback(null);
    try {
      const res = await libraryService.triggerDueCheck();
      if (res.data.success) {
        setCronFeedback(res.data.message || 'Due-date check completed.');
        fetchDashboard(); // refresh stats
      }
    } catch (err) {
      setCronFeedback('Failed to execute due-date check: ' + (err.response?.data?.message || err.message));
    } finally {
      setCronRunning(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-slate-500">
        <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm font-medium">Loading real-time library analytics from MongoDB...</p>
      </div>
    );
  }

  const stats = data?.stats || {
    totalStudents: 0,
    totalTitles: 0,
    totalCopies: 0,
    availableCopies: 0,
    issuedCopies: 0,
    overdueCount: 0,
    returnedTodayCount: 0,
  };

  const statCards = [
    {
      label: 'Registered Students',
      value: stats.totalStudents,
      icon: Users,
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      link: '/admin/students',
    },
    {
      label: 'Book Titles Catalog',
      value: stats.totalTitles,
      icon: BookOpen,
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      link: '/admin/books',
    },
    {
      label: 'Physical Book Copies',
      value: stats.totalCopies,
      icon: BookCopy,
      color: 'bg-slate-100 text-slate-800 border-slate-200',
      link: '/admin/books',
    },
    {
      label: 'Currently Issued',
      value: stats.issuedCopies,
      icon: Clock,
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      link: '/admin/transactions/active',
    },
    {
      label: 'Available Copies',
      value: stats.availableCopies,
      icon: CheckCircle,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      link: '/admin/books',
    },
    {
      label: 'Overdue Books',
      value: stats.overdueCount,
      icon: AlertTriangle,
      color: 'bg-rose-50 text-rose-700 border-rose-200',
      link: '/admin/transactions/overdue',
    },
    {
      label: 'Returned Today',
      value: stats.returnedTodayCount,
      icon: RotateCcw,
      color: 'bg-teal-50 text-teal-700 border-teal-200',
      link: '/admin/transactions/active',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Library Operations Overview
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time catalog analytics, physical inventory status, and automated counter actions.
          </p>
        </div>

        {/* Cron Quick Trigger & Refresh */}
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchDashboard}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg shadow-sm"
            title="Refresh statistics"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={handleManualCronCheck}
            disabled={cronRunning}
            className="px-3.5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-sm disabled:opacity-50 transition-colors"
          >
            <Bell className="h-4 w-4" />
            <span>{cronRunning ? 'Checking...' : 'Run Scheduled Due Check'}</span>
          </button>
        </div>
      </div>

      {cronFeedback && (
        <div className="p-3 bg-brand-50 border border-brand-200 text-brand-900 text-xs rounded-lg flex items-center justify-between">
          <span>{cronFeedback}</span>
          <button
            onClick={() => setCronFeedback(null)}
            className="text-brand-600 hover:text-brand-800 font-bold ml-2"
          >
            &times;
          </button>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg">
          {error}
        </div>
      )}

      {/* Primary Statistics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <Link
              key={i}
              to={card.link}
              className={`p-4 rounded-xl border ${card.color} transition-all duration-200 hover:shadow-md flex flex-col justify-between`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold opacity-90">{card.label}</span>
                <Icon className="h-4 w-4 opacity-75" />
              </div>
              <div className="text-2xl font-extrabold tracking-tight">{card.value}</div>
            </Link>
          );
        })}
      </div>

      {/* Quick Action Counter Bar */}
      <div className="bg-navy-950 text-white rounded-2xl p-5 shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight">
            Fast Library Circulation Counter
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Quickly jump into camera scanning for student ID cards, physical book QR codes, or issue/return workflows.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <Link
            to="/admin/scan-id"
            className="flex-1 md:flex-initial inline-flex items-center justify-center px-3.5 py-2 rounded-lg text-xs font-semibold bg-white text-navy-950 hover:bg-slate-100 transition-colors shadow-sm"
          >
            <Camera className="h-4 w-4 mr-1.5 text-brand-600" />
            <span>Scan Student ID</span>
          </Link>
          <Link
            to="/admin/scan-qr"
            className="flex-1 md:flex-initial inline-flex items-center justify-center px-3.5 py-2 rounded-lg text-xs font-semibold bg-white text-navy-950 hover:bg-slate-100 transition-colors shadow-sm"
          >
            <QrCode className="h-4 w-4 mr-1.5 text-emerald-600" />
            <span>Scan Book QR</span>
          </Link>
          <Link
            to="/admin/issue-book"
            className="flex-1 md:flex-initial inline-flex items-center justify-center px-3.5 py-2 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white transition-colors shadow-sm"
          >
            <ArrowUpRight className="h-4 w-4 mr-1" />
            <span>Issue Book</span>
          </Link>
          <Link
            to="/admin/return-book"
            className="flex-1 md:flex-initial inline-flex items-center justify-center px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors shadow-sm"
          >
            <ArrowDownLeft className="h-4 w-4 mr-1" />
            <span>Return Book</span>
          </Link>
        </div>
      </div>

      {/* Two Column Layout: Recent Transactions & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Recent Transactions Table (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center">
              <Clock className="h-4 w-4 mr-2 text-brand-600" />
              Recent Circulation Transactions
            </h3>
            <Link
              to="/admin/transactions/active"
              className="text-xs text-brand-600 hover:text-brand-800 font-semibold"
            >
              View All &rarr;
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Student</th>
                  <th className="py-2.5 px-3">Book</th>
                  <th className="py-2.5 px-3">Copy ID</th>
                  <th className="py-2.5 px-3">Due Date</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.recentTransactions?.length > 0 ? (
                  data.recentTransactions.map((tx) => (
                    <tr key={tx._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-800 block">
                          {tx.student?.name || 'Unknown Student'}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {tx.student?.registerNumber}
                        </span>
                      </td>
                      <td className="py-3 px-3 max-w-[200px] truncate font-medium text-slate-700">
                        {tx.book?.title}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">
                        {tx.bookCopy?.copyId}
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {new Date(tx.dueDate).toLocaleDateString('en-IN')}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            tx.status === 'Returned'
                              ? 'bg-slate-100 text-slate-700'
                              : tx.status === 'Overdue'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-400">
                      No recent transactions recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Book Category Distribution (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center">
                <BookOpen className="h-4 w-4 mr-2 text-brand-600" />
                Category Distribution
              </h3>
              <Link
                to="/admin/books"
                className="text-xs text-brand-600 hover:text-brand-800 font-semibold"
              >
                Browse &rarr;
              </Link>
            </div>

            <div className="space-y-3">
              {data?.categoryDistribution?.length > 0 ? (
                data.categoryDistribution.map((cat, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-slate-700 font-medium truncate max-w-[180px]">
                      {cat._id || 'Uncategorized'}
                    </span>
                    <span className="font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-full font-mono">
                      {cat.count} titles
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 py-4 text-center">No categories recorded.</p>
              )}
            </div>
          </div>

          {/* Quick System Note */}
          <div className="mt-6 pt-4 border-t border-slate-200 text-[11px] text-slate-400">
            Automated node-cron checks due dates every hour. In-app notifications are delivered 3 days before, on due date, and when overdue.
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

