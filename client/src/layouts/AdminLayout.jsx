import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Camera,
  QrCode,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  AlertTriangle,
  Bell,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  BookMarked,
  ShieldAlert,
} from 'lucide-react';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const navItems = [
    { name: 'Overview', path: '/admin', icon: LayoutDashboard },
    { name: 'Student Management', path: '/admin/students', icon: Users },
    { name: 'Book Management', path: '/admin/books', icon: BookOpen },
    { name: 'Scan Student ID (OCR)', path: '/admin/scan-id', icon: Camera },
    { name: 'Scan Book QR Code', path: '/admin/scan-qr', icon: QrCode },
    { name: 'Issue Book', path: '/admin/issue-book', icon: ArrowUpRight },
    { name: 'Return Book', path: '/admin/return-book', icon: ArrowDownLeft },
    { name: 'Active Transactions', path: '/admin/transactions/active', icon: Clock },
    { name: 'Overdue Books', path: '/admin/transactions/overdue', icon: AlertTriangle },
    { name: 'Notifications & Cron', path: '/admin/notifications', icon: Bell },
    { name: 'Reports & Export', path: '/admin/reports', icon: BarChart3 },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden bg-navy-900 text-white p-4 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center space-x-2">
          <BookMarked className="h-6 w-6 text-brand-400" />
          <span className="font-bold text-base tracking-tight">Smart Library Admin</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1 rounded-md text-slate-300 hover:text-white hover:bg-navy-800"
        >
          {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </header>

      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen z-50 w-64 bg-navy-950 text-slate-300 flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Logo & Name */}
        <div className="p-5 border-b border-navy-800 flex items-center space-x-3">
          <div className="h-10 w-10 rounded-lg bg-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
            <BookMarked className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-bold text-white text-base tracking-tight leading-tight">
              Smart Library
            </h1>
            <span className="text-xs text-brand-300 font-medium tracking-wide">
              ADMIN PORTAL
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Core Modules
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/admin'}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-navy-900 hover:text-white'
                  }`
                }
              >
                <Icon className="h-4 w-4 mr-3 flex-shrink-0" />
                <span className="truncate">{item.name}</span>
              </NavLink>
            );
          })}
        </div>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-navy-800 bg-navy-900/60">
          <div className="flex items-center space-x-3 mb-3">
            <div className="h-9 w-9 rounded-full bg-slate-700 flex items-center justify-center text-white text-xs font-semibold">
              {user?.name?.slice(0, 2).toUpperCase() || 'AD'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.name || 'Librarian'}</p>
              <p className="text-[11px] text-slate-400 truncate">{user?.email || 'admin@college.edu'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-lg text-xs font-medium text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-900/40 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 overflow-y-auto p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;

