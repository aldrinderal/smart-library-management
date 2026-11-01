import React, { useState } from 'react';
import libraryService from '../../services/libraryService';
import { Bell, Play, CheckCircle2, AlertCircle, Clock, ShieldCheck, Mail } from 'lucide-react';

const NotificationManagement = () => {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleTriggerCron = async () => {
    setRunning(true);
    setError('');
    setResult(null);
    try {
      const res = await libraryService.triggerDueCheck();
      if (res.data.success) {
        setResult(res.data.result || { success: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to trigger scheduled check.');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center">
          <Bell className="h-6 w-6 mr-2 text-brand-600" />
          Automated Due-Date Notifications & Cron
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Review scheduler rules, deduplication criteria, and execute automated due checks on demand.
        </p>
      </div>

      {/* Scheduler Info Box */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-bold text-slate-800 flex items-center">
          <Clock className="h-4 w-4 mr-2 text-brand-600" />
          Scheduled Cron Engine Status
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-slate-400 block font-medium">Cron Schedule Pattern</span>
            <span className="text-sm font-bold font-mono text-slate-800">
              0 * * * * (Hourly)
            </span>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-slate-400 block font-medium">Configured Timezone</span>
            <span className="text-sm font-bold text-slate-800">Asia/Kolkata (IST)</span>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-slate-400 block font-medium">Notification Storage</span>
            <span className="text-sm font-bold text-emerald-700">MongoDB In-App</span>
          </div>
        </div>

        {/* Stages Explanation */}
        <div className="pt-2">
          <span className="text-xs font-bold text-slate-700 block mb-2">
            Automated Alert Stages & Deduplication:
          </span>
          <div className="space-y-2 text-xs text-slate-600">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start space-x-2">
              <span className="h-5 w-5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                1
              </span>
              <div>
                <strong className="text-blue-900 block">3-Day Prior Reminder</strong>
                <span>
                  Dispatched when exactly 3 days remain until the due date. Deduplication Key:{' '}
                  <code className="text-[11px] bg-blue-100 text-blue-900 px-1 py-0.5 rounded font-mono">
                    txId_DUE_3_DAYS
                  </code>
                </span>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start space-x-2">
              <span className="h-5 w-5 rounded-full bg-amber-600 text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                2
              </span>
              <div>
                <strong className="text-amber-900 block">Due Today Alert</strong>
                <span>
                  Dispatched on the due date morning: "Your book is due today. Please return it to the library."
                </span>
              </div>
            </div>

            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start space-x-2">
              <span className="h-5 w-5 rounded-full bg-rose-600 text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                3
              </span>
              <div>
                <strong className="text-rose-900 block">Overdue Warning Alert</strong>
                <span>
                  Dispatched for loans past the due date with calculated overdue days.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Trigger Button */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Run an immediate scan across all active MongoDB transactions now:
          </span>
          <button
            onClick={handleTriggerCron}
            disabled={running}
            className="px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-bold flex items-center space-x-2 shadow-sm disabled:opacity-50 transition-colors"
          >
            <Play className="h-4 w-4" />
            <span>{running ? 'Running Check...' : 'Trigger Due-Date Check Now'}</span>
          </button>
        </div>
      </div>

      {/* Result Card */}
      {result && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-5 text-xs text-emerald-950 space-y-2">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <h3 className="font-bold text-sm text-emerald-900">
              Due-Date Check Execution Completed Successfully
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
            <div className="bg-white p-2.5 rounded border border-emerald-200">
              <span className="text-slate-400 block">Transactions Checked</span>
              <strong className="text-base text-slate-800">{result.totalChecked ?? 0}</strong>
            </div>
            <div className="bg-white p-2.5 rounded border border-emerald-200">
              <span className="text-slate-400 block">3-Day Reminders</span>
              <strong className="text-base text-blue-700">{result.remindersCreated ?? 0}</strong>
            </div>
            <div className="bg-white p-2.5 rounded border border-emerald-200">
              <span className="text-slate-400 block">Due Today Alerts</span>
              <strong className="text-base text-amber-700">{result.dueTodayCreated ?? 0}</strong>
            </div>
            <div className="bg-white p-2.5 rounded border border-emerald-200">
              <span className="text-slate-400 block">Overdue Warnings</span>
              <strong className="text-base text-rose-700">{result.overdueCreated ?? 0}</strong>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default NotificationManagement;

