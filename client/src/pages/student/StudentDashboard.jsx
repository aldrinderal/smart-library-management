import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import libraryService from '../../services/libraryService';
import {
  BookMarked,
  Clock,
  AlertTriangle,
  RotateCcw,
  Calendar,
  MapPin,
  ArrowRight,
  Bell,
} from 'lucide-react';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await libraryService.getStudentDashboard();
        if (res.data.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Error fetching student dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-slate-500">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mb-2"></div>
        <p className="text-xs">Loading your student library records...</p>
      </div>
    );
  }

  const stats = data?.stats || {
    currentlyBorrowed: 0,
    dueSoonCount: 0,
    overdueCount: 0,
    totalReturned: 0,
  };

  const statCards = [
    {
      label: 'Currently Borrowed',
      value: stats.currentlyBorrowed,
      icon: BookMarked,
      color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      link: '/student/books',
    },
    {
      label: 'Books Due Soon',
      value: stats.dueSoonCount,
      icon: Clock,
      color: 'bg-amber-50 text-amber-800 border-amber-200',
      link: '/student/books',
    },
    {
      label: 'Overdue Books',
      value: stats.overdueCount,
      icon: AlertTriangle,
      color: 'bg-rose-50 text-rose-800 border-rose-200',
      link: '/student/books',
    },
    {
      label: 'Total Books Returned',
      value: stats.totalReturned,
      icon: RotateCcw,
      color: 'bg-blue-50 text-blue-800 border-blue-200',
      link: '/student/history',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Student Welcome Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full mb-2 inline-block">
            {user?.department || 'Student'} &bull; Register No: {user?.registerNumber}
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track your borrowed library books, view return deadlines, and review scheduled reminders.
          </p>
        </div>

        <Link
          to="/student/books"
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-colors"
        >
          <span>View My Books</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* 4 Dashboard Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Link
              key={idx}
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

      {/* Active Borrowed Books Preview */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center">
            <BookMarked className="h-4 w-4 mr-2 text-emerald-600" />
            Currently Borrowed Books
          </h2>
          <Link
            to="/student/books"
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
          >
            See All &rarr;
          </Link>
        </div>

        {data?.currentBooks?.length > 0 ? (
          <div className="space-y-3">
            {data.currentBooks.map((item) => (
              <div
                key={item._id}
                className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">by {item.author}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-slate-500">
                    <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                      Copy: {item.copyId}
                    </span>
                    <span className="flex items-center">
                      <MapPin className="h-3 w-3 mr-1 text-slate-400" />
                      {item.shelfLocation}
                    </span>
                  </div>
                </div>

                <div className="text-right sm:text-right flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      item.badge === 'Overdue'
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : item.badge === 'Due Today'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : item.badge === 'Due Soon'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {item.badge}
                  </span>
                  <span className="text-xs font-semibold text-slate-700 mt-1">
                    Due: {new Date(item.dueDate).toLocaleDateString('en-IN')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center text-slate-400 text-xs">
            You do not currently have any books borrowed. Visit the library circulation counter to borrow books!
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;

