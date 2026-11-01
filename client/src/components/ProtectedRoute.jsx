import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const AdminRoute = () => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-500">Verifying administrator credentials...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
};

export const StudentRoute = () => {
  const { isAuthenticated, isStudent, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-500">Loading student session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isStudent) {
    return <Navigate to="/student/login" replace />;
  }

  return <Outlet />;
};

