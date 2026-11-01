import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GraduationCap, Lock, UserCheck, ArrowLeft, AlertCircle, Sparkles } from 'lucide-react';

const StudentLogin = () => {
  const [identifier, setIdentifier] = useState('');
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
      identifier,
      password,
      role: 'student',
    });

    setLoading(false);
    if (result.success) {
      navigate('/student');
    } else {
      setError(result.message || 'Invalid student credentials.');
    }
  };

  const handleFillDemo = (regNo) => {
    setIdentifier(regNo);
    setPassword('Student@123');
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
          <div className="h-14 w-14 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-xl shadow-emerald-500/20">
            <GraduationCap className="h-8 w-8" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-extrabold text-white tracking-tight">
          Student Portal Login
        </h2>
        <p className="mt-1 text-center text-xs text-slate-400">
          Access your borrowed books, due dates, and notifications
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-800/90 py-8 px-6 shadow-2xl border border-slate-700/80 rounded-2xl sm:px-10">
          {/* Quick Demo Fill Helper */}
          <div className="mb-6 p-3 bg-emerald-950/70 border border-emerald-800/60 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-emerald-300 flex items-center">
                <Sparkles className="h-3.5 w-3.5 mr-1 text-emerald-400" /> Demo Student Accounts:
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
             
              <button
                type="button"
                onClick={() => handleFillDemo('721924104045')}
                className="text-[11px] bg-emerald-800/60 hover:bg-emerald-700 text-emerald-100 font-medium px-2 py-1 rounded transition-colors"
              >
                Kathirvel E (721924104107)
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('721923105012')}
                className="text-[11px] bg-emerald-800/60 hover:bg-emerald-700 text-emerald-100 font-medium px-2 py-1 rounded transition-colors"
              >
                Rahul (Overdue)
              </button>
            </div>
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
                Register Number or Email
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <UserCheck className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. 721924104026 or email"
                  className="block w-full pl-9 pr-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors uppercase"
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
                  className="block w-full pl-9 pr-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-md text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Authenticating...' : 'Sign In to Student Account'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
            <Link to="/student/register" className="text-emerald-400 hover:text-emerald-300 font-medium">
              New Student? Register here
            </Link>
            <Link to="/admin/login" className="text-slate-400 hover:text-white font-medium">
              Admin Login &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentLogin;

