import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, GraduationCap, Mail, Phone, Calendar, ShieldCheck } from 'lucide-react';

const StudentProfile = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center">
          <User className="h-6 w-6 mr-2 text-emerald-600" />
          My Student Profile
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Verified academic details linked to your college library account.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Profile Card Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 p-6 text-white flex items-center space-x-4">
          <div className="h-16 w-16 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/40 flex items-center justify-center text-xl font-bold text-white shadow-inner">
            {user?.name?.slice(0, 2).toUpperCase() || 'ST'}
          </div>
          <div>
            <h2 className="text-xl font-bold leading-tight">{user?.name}</h2>
            <p className="text-xs text-emerald-200 font-mono mt-0.5">
              Register No: {user?.registerNumber}
            </p>
            <span className="mt-2 inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-700/60 border border-emerald-400/40 text-emerald-100">
              Verified Student Account
            </span>
          </div>
        </div>

        {/* Detailed Fields */}
        <div className="p-6 divide-y divide-slate-100 text-xs">
          <div className="py-3 grid grid-cols-3">
            <span className="text-slate-500 font-medium flex items-center">
              <GraduationCap className="h-4 w-4 mr-2 text-slate-400" />
              Course
            </span>
            <span className="col-span-2 text-slate-900 font-semibold">{user?.course || user?.department || 'N/A'}</span>
          </div>

          <div className="py-3 grid grid-cols-3">
            <span className="text-slate-500 font-medium flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-slate-400" />
              Academic Year
            </span>
            <span className="col-span-2 text-slate-900 font-semibold">
              {user?.academicYear || (user?.startYear && user?.endYear ? `${user.startYear} – ${user.endYear}` : 'N/A')}
            </span>
          </div>

          <div className="py-3 grid grid-cols-3">
            <span className="text-slate-500 font-medium flex items-center">
              <Mail className="h-4 w-4 mr-2 text-slate-400" />
              Email Address
            </span>
            <span className="col-span-2 text-slate-900 font-semibold">{user?.email}</span>
          </div>

          <div className="py-3 grid grid-cols-3">
            <span className="text-slate-500 font-medium flex items-center">
              <Phone className="h-4 w-4 mr-2 text-slate-400" />
              Phone Number
            </span>
            <span className="col-span-2 text-slate-900 font-semibold">{user?.phone || 'Not provided'}</span>
          </div>

          <div className="py-3 grid grid-cols-3">
            <span className="text-slate-500 font-medium flex items-center">
              <ShieldCheck className="h-4 w-4 mr-2 text-slate-400" />
              Account Status
            </span>
            <span className="col-span-2">
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                  user?.isActive
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {user?.isActive ? 'Active Library Privileges' : 'Suspended'}
              </span>
            </span>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-[11px] text-slate-400">
          To update your register number, department, or legal name, please visit the central library helpdesk.
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;

