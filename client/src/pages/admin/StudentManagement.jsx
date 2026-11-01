import React, { useState, useEffect } from 'react';
import libraryService from '../../services/libraryService';
import {
  Users,
  Search,
  Filter,
  UserPlus,
  UserCheck,
  Eye,
  Edit,
  Power,
  X,
  BookMarked,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedStudentDetail, setSelectedStudentDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // New Student Form
  const [newStudent, setNewStudent] = useState({
    name: '',
    registerNumber: '',
    department: 'B.E. CSE',
    startYear: 2024,
    endYear: 2028,
    email: '',
    phone: '',
    password: 'Student@123',
  });
  const [formSubmitting, setFormSubmitting] = useState(false);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (departmentFilter) params.department = departmentFilter;
      if (statusFilter) params.status = statusFilter;

      const res = await libraryService.getStudents(params);
      if (res.data.success) {
        setStudents(res.data.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch student directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [departmentFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchStudents();
  };

  // Toggle active status
  const handleToggleStatus = async (studentId, currentStatus) => {
    try {
      const res = await libraryService.updateStudentStatus(studentId, !currentStatus);
      if (res.data.success) {
        fetchStudents();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update student account status.');
    }
  };

  // View Student Details and Borrowings Modal
  const handleViewDetails = async (studentId) => {
    setShowDetailModal(true);
    setDetailLoading(true);
    try {
      const res = await libraryService.getStudentById(studentId);
      if (res.data.success) {
        setSelectedStudentDetail(res.data.data);
      }
    } catch (err) {
      alert('Failed to retrieve student details: ' + (err.response?.data?.message || err.message));
      setShowDetailModal(false);
    } finally {
      setDetailLoading(false);
    }
  };

  // Create Student
  const handleCreateStudent = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setError('');

    try {
      const res = await libraryService.createStudent(newStudent);
      if (res.data.success) {
        setShowAddModal(false);
        setNewStudent({
          name: '',
          registerNumber: '',
          department: 'B.E. CSE',
          startYear: 2024,
          endYear: 2028,
          email: '',
          phone: '',
          password: 'Student@123',
        });
        fetchStudents();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create student account.');
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center">
            <Users className="h-6 w-6 mr-2 text-brand-600" />
            Student Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Directory of registered students, enrollment status, active borrows, and account permissions.
          </p>
        </div>

        <button
          onClick={() => {
            setError('');
            setShowAddModal(true);
          }}
          className="inline-flex items-center px-4 py-2.5 rounded-lg text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 transition-colors shadow-sm self-start sm:self-auto"
        >
          <UserPlus className="h-4 w-4 mr-1.5" />
          <span>Register New Student</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex gap-2">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student name, register number, or email..."
              className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold"
          >
            Search
          </button>
        </form>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-slate-700"
          >
            <option value="">All Departments</option>
            <option value="B.E. CSE">B.E. CSE</option>
            <option value="B.Tech IT">B.Tech IT</option>
            <option value="B.E. ECE">B.E. ECE</option>
            <option value="B.E. EEE">B.E. EEE</option>
            <option value="B.E. Mechanical">B.E. Mechanical</option>
            <option value="B.E. Civil">B.E. Civil</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-slate-700"
          >
            <option value="">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="false">Deactivated Only</option>
          </select>
        </div>
      </div>

      {/* Student Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Register No</th>
                <th className="py-3 px-4">Full Name</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Academic Year</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-500">
                    <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Loading student directory...
                  </td>
                </tr>
              ) : students.length > 0 ? (
                students.map((student) => (
                  <tr key={student._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {student.registerNumber}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{student.name}</td>
                    <td className="py-3 px-4 text-slate-600">{student.department || 'N/A'}</td>
                    <td className="py-3 px-4 text-slate-600">
                      {student.startYear && student.endYear
                        ? `${student.startYear}–${student.endYear}`
                        : 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-slate-500">{student.email}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          student.isActive
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {student.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleViewDetails(student._id)}
                        className="p-1.5 text-slate-600 hover:text-brand-600 hover:bg-slate-100 rounded"
                        title="View Full Profile & Borrowings"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(student._id, student.isActive)}
                        className={`p-1.5 rounded transition-colors ${
                          student.isActive
                            ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                            : 'text-emerald-600 hover:bg-emerald-50'
                        }`}
                        title={student.isActive ? 'Deactivate Account' : 'Activate Account'}
                      >
                        <Power className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">
                    No students found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Student Details Modal */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-base text-slate-900">Student Borrowing Record</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {detailLoading || !selectedStudentDetail ? (
              <div className="py-12 text-center text-slate-500">Loading student details...</div>
            ) : (
              <div className="mt-4 space-y-5">
                {/* Profile Snapshot */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block">Name:</span>
                    <strong className="text-sm text-slate-800">
                      {selectedStudentDetail.student?.name}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Register Number:</span>
                    <strong className="text-sm font-mono text-slate-800">
                      {selectedStudentDetail.student?.registerNumber}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Department:</span>
                    <span className="text-slate-700">
                      {selectedStudentDetail.student?.department || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Academic Year:</span>
                    <span className="text-slate-700">
                      {selectedStudentDetail.student?.startYear}–{selectedStudentDetail.student?.endYear}
                    </span>
                  </div>
                </div>

                {/* Currently Borrowed Books */}
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center">
                    <BookMarked className="h-4 w-4 mr-1 text-brand-600" />
                    Currently Borrowed Books ({selectedStudentDetail.activeBorrows?.length || 0})
                  </h4>

                  {selectedStudentDetail.activeBorrows?.length > 0 ? (
                    <div className="space-y-2">
                      {selectedStudentDetail.activeBorrows.map((tx) => (
                        <div
                          key={tx._id}
                          className="p-3 bg-white border border-slate-200 rounded-lg text-xs flex justify-between items-center"
                        >
                          <div>
                            <p className="font-bold text-slate-800">{tx.book?.title}</p>
                            <p className="text-[11px] text-slate-500">
                              Copy ID: {tx.bookCopy?.copyId} &bull; Shelf: {tx.bookCopy?.shelfBlock},{' '}
                              {tx.bookCopy?.shelfNumber}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-[11px] text-slate-400 block">Due Date</span>
                            <span className="font-semibold text-rose-700">
                              {new Date(tx.dueDate).toLocaleDateString('en-IN')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 p-3 bg-slate-50 rounded border border-slate-200">
                      No books currently borrowed.
                    </p>
                  )}
                </div>

                {/* Past Borrowing History */}
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                    Past Returned Books History
                  </h4>
                  {selectedStudentDetail.history?.length > 0 ? (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {selectedStudentDetail.history.map((tx) => (
                        <div
                          key={tx._id}
                          className="p-2.5 bg-slate-50 border border-slate-100 rounded text-xs flex justify-between items-center"
                        >
                          <span className="text-slate-700 font-medium truncate max-w-[280px]">
                            {tx.book?.title}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            Returned {new Date(tx.returnDate).toLocaleDateString('en-IN')}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 p-3 bg-slate-50 rounded border border-slate-200">
                      No historical transactions found.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add New Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="font-bold text-base text-slate-900">Register New Student</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateStudent} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newStudent.name}
                    onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                    placeholder="Aldrin Deral"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Register Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={newStudent.registerNumber}
                    onChange={(e) =>
                      setNewStudent({ ...newStudent, registerNumber: e.target.value.toUpperCase() })
                    }
                    placeholder="721924104026"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded uppercase font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department *
                </label>
                <input
                  type="text"
                  required
                  value={newStudent.department}
                  onChange={(e) => setNewStudent({ ...newStudent, department: e.target.value })}
                  placeholder="e.g. B.E. CSE"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Start Year
                  </label>
                  <input
                    type="number"
                    value={newStudent.startYear}
                    onChange={(e) =>
                      setNewStudent({ ...newStudent, startYear: parseInt(e.target.value, 10) })
                    }
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    End Year
                  </label>
                  <input
                    type="number"
                    value={newStudent.endYear}
                    onChange={(e) =>
                      setNewStudent({ ...newStudent, endYear: parseInt(e.target.value, 10) })
                    }
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={newStudent.email}
                    onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                    placeholder="student@college.edu"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={newStudent.phone}
                    onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Default Password
                </label>
                <input
                  type="text"
                  value={newStudent.password}
                  onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded text-xs font-semibold"
                >
                  {formSubmitting ? 'Registering...' : 'Register Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagement;

