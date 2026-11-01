import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import libraryService from '../services/libraryService';
import {
  LayoutDashboard,
  BookMarked,
  History,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  GraduationCap,
} from 'lucide-react';

const StudentLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await libraryService.getMyNotifications();
        if (res.data?.success) {
          setUnreadCount(res.data.unreadCount || 0);
        }
      } catch (err) {
        // quiet ignore
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000); // 30s poll for notifications
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/student/login');
  };

  const navLinks = [
    { name: 'Dashboard', path: '/student', icon: LayoutDashboard },
    { name: 'My Books', path: '/student/books', icon: BookMarked },
    { name: 'Borrowing History', path: '/student/history', icon: History },
    { name: 'Notifications', path: '/student/notifications', icon: Bell, badge: unreadCount },
    { name: 'My Profile', path: '/student/profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo & Student Info */}
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-sm">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div>
                <span className="font-bold text-slate-900 text-base tracking-tight block">
                  Smart Library
                </span>
                <span className="text-xs text-emerald-700 font-semibold tracking-wide">
                  STUDENT PORTAL
                </span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-1 lg:space-x-2 items-center">
              {navLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/student'}
                    className={({ isActive }) =>
                      `relative inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-700 font-semibold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`
                    }
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    <span>{item.name}</span>
                    {item.badge > 0 && (
                      <span className="ml-2 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-rose-500 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>

            {/* User Profile & Logout (Desktop) */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-800 leading-tight">{user?.name}</p>
                <p className="text-xs text-slate-500 font-mono">{user?.registerNumber}</p>
              </div>
              <button
                onClick={handleLogout}
                title="Logout"
                className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1 shadow-lg">
            <div className="py-2 border-b border-slate-100 mb-2">
              <p className="text-sm font-bold text-slate-900">{user?.name}</p>
              <p className="text-xs text-emerald-600 font-mono font-medium">{user?.registerNumber}</p>
            </div>
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/student'}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`
                  }
                >
                  <div className="flex items-center">
                    <Icon className="h-4 w-4 mr-3" />
                    <span>{item.name}</span>
                  </div>
                  {item.badge > 0 && (
                    <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold text-white bg-rose-500 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
            <button
              onClick={handleLogout}
              className="w-full mt-2 flex items-center justify-center space-x-2 py-2 px-3 rounded-lg text-sm font-medium text-rose-600 bg-rose-50 hover:bg-rose-100"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default StudentLayout;

