import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, GraduationCap, BookOpen, QrCode, Bell, Camera, ArrowRight } from 'lucide-react';

const PortalSelect = () => {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between selection:bg-brand-500 selection:text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-lg shadow-brand-500/30">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <span className="font-bold text-lg text-white tracking-tight block">
                Smart Library System
              </span>
              <span className="text-xs text-brand-400 font-medium tracking-wide">
                College Prototype Development Lab
              </span>
            </div>
          </div>
          <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-400 bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700/60">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>QR & OCR Online</span>
          </div>
        </div>
      </header>

      {/* Hero Content */}
      <main className="max-w-6xl mx-auto px-6 py-12 flex-1 flex flex-col justify-center items-center text-center">
        <div className="inline-flex items-center space-x-2 bg-brand-950/80 text-brand-300 border border-brand-800/60 px-3.5 py-1 rounded-full text-xs font-semibold mb-6">
          <Camera className="h-3.5 w-3.5 text-brand-400" />
          <span>Integrated Camera OCR & Book QR Scanning</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight max-w-3xl leading-tight">
          Smart Library Management System
        </h1>
        <p className="mt-4 text-base sm:text-lg text-slate-400 max-w-2xl">
          Automated due-date notifications, student ID card OCR recognition, and real-time physical book copy inventory tracking.
        </p>

        {/* Portal Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl mt-12 text-left">
          {/* Admin Card */}
          <Link
            to="/admin/login"
            className="group relative bg-slate-800/90 border border-slate-700 rounded-2xl p-7 hover:border-brand-500 transition-all duration-300 hover:shadow-xl hover:shadow-brand-500/10 flex flex-col justify-between"
          >
            <div>
              <div className="h-12 w-12 rounded-xl bg-brand-600/20 text-brand-400 border border-brand-500/30 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-brand-300 transition-colors">
                Admin Portal
              </h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                For librarians and staff: Student ID OCR scanner, Book QR scanner, issue/return desk, inventory, and due-date alerts.
              </p>
            </div>
            <div className="mt-6 flex items-center text-sm font-semibold text-brand-400 group-hover:text-brand-300">
              <span>Open Admin Desk</span>
              <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Student Card */}
          <Link
            to="/student/login"
            className="group relative bg-slate-800/90 border border-slate-700 rounded-2xl p-7 hover:border-emerald-500 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10 flex flex-col justify-between"
          >
            <div>
              <div className="h-12 w-12 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                <GraduationCap className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-emerald-300 transition-colors">
                Student Portal
              </h3>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                For registered students: View borrowed books, track due dates, check borrowing history, and receive automated return alerts.
              </p>
            </div>
            <div className="mt-6 flex items-center text-sm font-semibold text-emerald-400 group-hover:text-emerald-300">
              <span>Enter Student Portal</span>
              <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>

        {/* System Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12 w-full max-w-3xl text-left border-t border-slate-800 pt-8">
          <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800">
            <Camera className="h-4 w-4 text-brand-400 mb-1" />
            <h4 className="text-xs font-semibold text-slate-200">Tesseract OCR</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Live ID camera scan</p>
          </div>
          <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800">
            <QrCode className="h-4 w-4 text-emerald-400 mb-1" />
            <h4 className="text-xs font-semibold text-slate-200">QR Code Tech</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Physical copy tracking</p>
          </div>
          <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800">
            <Bell className="h-4 w-4 text-amber-400 mb-1" />
            <h4 className="text-xs font-semibold text-slate-200">Node-Cron</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Scheduled due checks</p>
          </div>
          <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800">
            <ShieldCheck className="h-4 w-4 text-purple-400 mb-1" />
            <h4 className="text-xs font-semibold text-slate-200">Role-Based JWT</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Strict authorization</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-400">
        <p>Smart Library Management System &bull; MERN Prototype Development Lab</p>
      </footer>
    </div>
  );
};

export default PortalSelect;

