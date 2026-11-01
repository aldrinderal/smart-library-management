import React, { useState, useEffect } from 'react';
import libraryService from '../../services/libraryService';
import { BarChart3, Download, FileText, CheckCircle } from 'lucide-react';

const Reports = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReportData = async () => {
      try {
        const res = await libraryService.getAdminDashboard();
        if (res.data.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadReportData();
  }, []);

  const handleExportJson = () => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `smart_library_report_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const handleExportCsv = () => {
    if (!data?.recentTransactions) return;
    const headers = 'Transaction ID,Student Name,Register No,Book Title,Copy ID,Due Date,Status\n';
    const rows = data.recentTransactions
      .map(
        (t) =>
          `"${t._id}","${t.student?.name || ''}","${t.student?.registerNumber || ''}","${
            t.book?.title || ''
          }","${t.bookCopy?.copyId || ''}","${t.dueDate}","${t.status}"`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `smart_library_transactions_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center">
            <BarChart3 className="h-6 w-6 mr-2 text-brand-600" />
            Library Reports & Export
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Generate summary reports and export transaction records for institutional audits.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-sm"
          >
            <Download className="h-4 w-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleExportJson}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-sm"
          >
            <FileText className="h-4 w-4" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-bold text-slate-800 pb-2 border-b border-slate-200">
          Executive Summary
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-400 block">Total Students</span>
            <span className="text-lg font-bold text-slate-900">
              {data?.stats?.totalStudents || 0}
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-400 block">Book Titles</span>
            <span className="text-lg font-bold text-slate-900">
              {data?.stats?.totalTitles || 0}
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-400 block">Physical Copies</span>
            <span className="text-lg font-bold text-slate-900">
              {data?.stats?.totalCopies || 0}
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-400 block">Circulation Rate</span>
            <span className="text-lg font-bold text-brand-600">
              {data?.stats?.totalCopies
                ? Math.round(
                    ((data?.stats?.issuedCopies || 0) / (data?.stats?.totalCopies || 1)) * 100
                  )
                : 0}
              %
            </span>
          </div>
        </div>

        <div className="pt-4">
          <h3 className="text-xs font-bold text-slate-700 uppercase mb-3">
            Top Categories by Inventory
          </h3>
          <div className="space-y-2">
            {data?.categoryDistribution?.map((cat, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded"
              >
                <span className="font-medium text-slate-700">{cat._id}</span>
                <span className="font-bold text-slate-900">{cat.count} titles</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;

