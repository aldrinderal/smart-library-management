import React, { useState } from 'react';
import { Settings as SettingsIcon, Shield, Server, Bell, Database, CheckCircle2 } from 'lucide-react';

const Settings = () => {
  const [saved, setSaved] = useState(false);
  const [config, setConfig] = useState({
    maxBorrowLimit: '3',
    finePerDay: '0',
    cronSchedule: '0 * * * * (Once every hour)',
    timezone: 'Asia/Kolkata (IST)',
    allowStudentReg: true,
  });

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center">
          <SettingsIcon className="h-6 w-6 mr-2 text-brand-600" />
          Library System Settings & Policies
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Lending policies, overdue fine parameters, scheduler intervals, and system environment details.
        </p>
      </div>

      {saved && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs rounded-lg flex items-center space-x-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>Settings saved successfully.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div>
          <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-200 mb-4 flex items-center">
            <Shield className="h-4 w-4 mr-2 text-brand-600" />
            Lending Rules & Constraints
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Maximum Borrowing Limit (Books per Student)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={config.maxBorrowLimit}
                onChange={(e) => setConfig({ ...config, maxBorrowLimit: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-brand-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Standard college limit is 3 books concurrently.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Default Overdue Fine per Day (INR)
              </label>
              <input
                type="number"
                min="0"
                value={config.finePerDay}
                onChange={(e) => setConfig({ ...config, finePerDay: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-brand-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Default is 0 as per college policy.
              </span>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-200 mb-4 flex items-center">
            <Server className="h-4 w-4 mr-2 text-brand-600" />
            Environment & Scheduler Parameters
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-slate-400 block font-medium">Scheduler Cron Pattern</span>
              <span className="font-mono font-bold text-slate-800">{config.cronSchedule}</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-slate-400 block font-medium">Server Timezone</span>
              <span className="font-bold text-slate-800">{config.timezone}</span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 flex justify-end">
          <button
            type="submit"
            className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
          >
            Save Library Policy
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;

