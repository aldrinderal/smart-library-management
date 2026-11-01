import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Lock, Mail, ArrowLeft, AlertCircle, Sparkles } from 'lucide-react';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login({
      identifier: email,
      password,
      role: 'admin',
    });

    setLoading(false);
    if (result.success) {
      navigate('/admin');
    } else {
      setError(result.message || 'Invalid administrator credentials.');
    }
  };

  const handleFillDemo = () => {
    setEmail('admin@smartlibrary.edu');
    setPassword('Admin@Password123!');
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link
          to="/"
          className="inline-flex items-center text-xs font-medium text-slate-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Portal Selection
        </Link>

        <div className="flex justify-center">
          <div className="h-14 w-14 rounded-2xl bg-brand-600 flex items-center justify-center text-white shadow-xl shadow-brand-500/20">
            <ShieldCheck className="h-8 w-8" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-extrabold text-white tracking-tight">
          Librarian & Admin Login
        </h2>
        <p className="mt-1 text-center text-xs text-slate-400">
          Smart Library Counter Management Desk
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-800/90 py-8 px-6 shadow-2xl border border-slate-700/80 rounded-2xl sm:px-10">
          {/* Quick Demo Fill Helper */}
          <div className="mb-6 p-3 bg-brand-950/70 border border-brand-800/60 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-brand-300 flex items-center">
                <Sparkles className="h-3.5 w-3.5 mr-1 text-brand-400" /> Demo Admin Account
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">admin@smartlibrary.edu</p>
            </div>
            <button
              type="button"
              onClick={handleFillDemo}
              className="text-xs bg-brand-600 hover:bg-brand-500 text-white font-medium px-2.5 py-1 rounded-md transition-colors shadow-sm"
            >
              Autofill
            </button>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Admin Email Address
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@smartlibrary.edu"
                  className="block w-full pl-9 pr-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Password
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-9 pr-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-md text-sm font-semibold text-white bg-brand-600 hover:bg-brand-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Authenticating...' : 'Sign in as Administrator'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-700/60 text-center">
            <p className="text-xs text-slate-400">
              Are you a student?{' '}
              <Link to="/student/login" className="text-brand-400 hover:text-brand-300 font-medium">
                Switch to Student Portal
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;

