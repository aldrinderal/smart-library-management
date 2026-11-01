import React, { useState, useEffect } from 'react';
import libraryService from '../../services/libraryService';
import {
  Bell,
  Check,
  CheckCheck,
  Clock,
  AlertTriangle,
  RotateCcw,
  Info,
} from 'lucide-react';

const StudentNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const res = await libraryService.getMyNotifications();
      if (res.data.success) {
        setNotifications(res.data.data || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await libraryService.markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await libraryService.markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'OVERDUE':
        return <AlertTriangle className="h-5 w-5 text-rose-600" />;
      case 'DUE_TODAY':
      case 'REMINDER_DUE_SOON':
        return <Clock className="h-5 w-5 text-amber-600" />;
      case 'RETURN_CONFIRMATION':
        return <RotateCcw className="h-5 w-5 text-emerald-600" />;
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center">
            <Bell className="h-6 w-6 mr-2 text-emerald-600" />
            Library Notifications
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Automated alerts regarding book due dates, renewals, and return confirmations.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="inline-flex items-center px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 shadow-sm transition-colors self-start sm:self-auto"
          >
            <CheckCheck className="h-4 w-4 mr-1 text-emerald-600" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-xs">
            Loading notifications...
          </div>
        ) : notifications.length > 0 ? (
          notifications.map((n) => (
            <div
              key={n._id}
              className={`p-4 rounded-xl border transition-all duration-150 flex items-start space-x-3 ${
                n.isRead
                  ? 'bg-white border-slate-200'
                  : 'bg-emerald-50/50 border-emerald-200 shadow-xs'
              }`}
            >
              <div className="p-2 bg-white rounded-lg border border-slate-100 shadow-xs mt-0.5">
                {getIcon(n.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3
                    className={`text-sm tracking-tight ${
                      n.isRead ? 'font-semibold text-slate-800' : 'font-bold text-slate-900'
                    }`}
                  >
                    {n.title}
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    {new Date(n.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
              </div>

              {!n.isRead && (
                <button
                  onClick={() => handleMarkAsRead(n._id)}
                  title="Mark as read"
                  className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-100 rounded"
                >
                  <Check className="h-4 w-4" />
                </button>
              )}
            </div>
          ))
        ) : (
          <div className="py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
            <Bell className="h-10 w-10 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
            <p className="text-xs font-semibold text-slate-600">No notifications yet</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Automated reminders about upcoming due dates will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentNotifications;

