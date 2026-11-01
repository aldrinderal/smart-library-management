import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AdminRoute, StudentRoute } from './components/ProtectedRoute';

// Layouts
import AdminLayout from './layouts/AdminLayout';
import StudentLayout from './layouts/StudentLayout';

// Public & Auth Pages
import PortalSelect from './pages/PortalSelect';
import AdminLogin from './pages/auth/AdminLogin';
import StudentLogin from './pages/auth/StudentLogin';
import StudentRegister from './pages/auth/StudentRegister';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import StudentManagement from './pages/admin/StudentManagement';
import BookManagement from './pages/admin/BookManagement';
import ScanStudentId from './pages/admin/ScanStudentId';
import ScanBookQr from './pages/admin/ScanBookQr';
import IssueBook from './pages/admin/IssueBook';
import ReturnBook from './pages/admin/ReturnBook';
import ActiveTransactions from './pages/admin/ActiveTransactions';
import OverdueBooks from './pages/admin/OverdueBooks';
import NotificationManagement from './pages/admin/NotificationManagement';
import Reports from './pages/admin/Reports';
import Settings from './pages/admin/Settings';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import MyBooks from './pages/student/MyBooks';
import BorrowingHistory from './pages/student/BorrowingHistory';
import StudentNotifications from './pages/student/StudentNotifications';
import StudentProfile from './pages/student/StudentProfile';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Portal Selection & Authentication */}
          <Route path="/" element={<PortalSelect />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/student/login" element={<StudentLogin />} />
          <Route path="/student/register" element={<StudentRegister />} />
          <Route path="/login" element={<Navigate to="/" replace />} />

          {/* Protected Admin Portal */}
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="students" element={<StudentManagement />} />
              <Route path="books" element={<BookManagement />} />
              <Route path="scan-id" element={<ScanStudentId />} />
              <Route path="scan-qr" element={<ScanBookQr />} />
              <Route path="issue-book" element={<IssueBook />} />
              <Route path="return-book" element={<ReturnBook />} />
              <Route path="transactions/active" element={<ActiveTransactions />} />
              <Route path="transactions/overdue" element={<OverdueBooks />} />
              <Route path="notifications" element={<NotificationManagement />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Route>

          {/* Protected Student Portal */}
          <Route element={<StudentRoute />}>
            <Route path="/student" element={<StudentLayout />}>
              <Route index element={<StudentDashboard />} />
              <Route path="books" element={<MyBooks />} />
              <Route path="history" element={<BorrowingHistory />} />
              <Route path="notifications" element={<StudentNotifications />} />
              <Route path="profile" element={<StudentProfile />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

