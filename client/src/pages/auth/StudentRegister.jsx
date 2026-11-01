import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GraduationCap, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react';

const StudentRegister = () => {
  const [formData, setFormData] = useState({
    name: '',
    registerNumber: '',
    department: 'B.E. CSE',
    startYear: '2024',
    endYear: '2028',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match.');
    }

    if (formData.password.length < 6) {
      return setError('Password must be at least 6 characters long.');
    }

    setLoading(true);

    const result = await register({
      name: formData.name,
      registerNumber: formData.registerNumber.toUpperCase().trim(),
      department: formData.department,
      startYear: parseInt(formData.startYear, 10),
      endYear: parseInt(formData.endYear, 10),
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
    });

    setLoading(false);

    if (result.success) {
      navigate('/student');
    } else {
      setError(result.message || 'Registration failed.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
        <Link
          to="/student/login"
          className="inline-flex items-center text-xs font-medium text-slate-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Student Login
        </Link>

        <div className="flex justify-center">
          <div className="h-12 w-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-xl shadow-emerald-500/20">
            <GraduationCap className="h-7 w-7" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-extrabold text-white tracking-tight">
          Create Student Account
        </h2>
        <p className="mt-1 text-center text-xs text-slate-400">
          Enter your college registration details to access the smart library
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-slate-800/90 py-8 px-6 shadow-2xl border border-slate-700/80 rounded-2xl sm:px-10">
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Aldrin Deral"
                  className="block w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Register Number *
                </label>
                <input
                  type="text"
                  name="registerNumber"
                  required
                  value={formData.registerNumber}
                  onChange={handleChange}
                  placeholder="e.g. 721924104026"
                  className="block w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Department *
              </label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="block w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="B.E. CSE">B.E. Computer Science & Engineering</option>
                <option value="B.Tech IT">B.Tech Information Technology</option>
                <option value="B.Tech AI & DS">B.Tech Artificial Intelligence & Data Science</option>
                <option value="B.E. ECE">B.E. Electronics & Communication Engineering</option>
                <option value="B.E. EEE">B.E. Electrical & Electronics Engineering</option>
                <option value="B.E. Mechanical">B.E. Mechanical Engineering</option>
                <option value="B.E. Civil">B.E. Civil Engineering</option>
                <option value="MBA">Master of Business Administration</option>
                <option value="MCA">Master of Computer Applications</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Start Year
                </label>
                <input
                  type="number"
                  name="startYear"
                  value={formData.startYear}
                  onChange={handleChange}
                  min="2020"
                  max="2030"
                  className="block w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  End Year
                </label>
                <input
                  type="number"
                  name="endYear"
                  value={formData.endYear}
                  onChange={handleChange}
                  min="2020"
                  max="2035"
                  className="block w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  College Email *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="student@college.edu"
                  className="block w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                  className="block w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min 6 characters"
                  className="block w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repeat password"
                  className="block w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-md text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Creating Student Account...' : 'Complete Student Registration'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-700/60 text-center">
            <p className="text-xs text-slate-400">
              Already have an account?{' '}
              <Link to="/student/login" className="text-emerald-400 hover:text-emerald-300 font-medium">
                Log in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentRegister;

