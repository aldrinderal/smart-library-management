import api from './api';

export const libraryService = {
  // --- Dashboard ---
  getAdminDashboard: () => api.get('/dashboard/admin'),
  getStudentDashboard: () => api.get('/dashboard/student'),
  triggerDueCheck: () => api.post('/dashboard/admin/trigger-check'),

  // --- Students (Admin) ---
  getStudents: (params) => api.get('/students', { params }),
  getStudentById: (id) => api.get(`/students/${id}`),
  getStudentByRegNo: (regNo) => api.get(`/students/search/regno/${regNo}`),
  createStudent: (data) => api.post('/students', data),
  updateStudent: (id, data) => api.patch(`/students/${id}`, data),
  updateStudentStatus: (id, isActive) => api.patch(`/students/${id}/status`, { isActive }),

  // --- Books ---
  getBooks: (params) => api.get('/books', { params }),
  getBookById: (id) => api.get(`/books/${id}`),
  createBook: (data) => api.post('/books', data),
  updateBook: (id, data) => api.patch(`/books/${id}`, data),
  deleteBook: (id) => api.delete(`/books/${id}`),

  // --- Book Copies ---
  getBookCopies: (params) => api.get('/book-copies', { params }),
  getBookCopyByIdOrQr: (copyIdOrQr) => api.get(`/book-copies/${encodeURIComponent(copyIdOrQr)}`),
  createBookCopies: (data) => api.post('/book-copies', data),
  updateBookCopy: (copyId, data) => api.patch(`/book-copies/${encodeURIComponent(copyId)}`, data),
  deleteBookCopy: (copyId) => api.delete(`/book-copies/${encodeURIComponent(copyId)}`),

  // --- Transactions (Admin) ---
  issueBook: (data) => api.post('/transactions/issue', data),
  returnBook: (data) => api.post('/transactions/return', data),
  getTransactions: (params) => api.get('/transactions', { params }),
  getActiveTransactions: () => api.get('/transactions/active'),
  getOverdueTransactions: () => api.get('/transactions/overdue'),
  getStudentTransactions: (studentId) => api.get(`/transactions/student/${studentId}`),

  // --- Student Self-Service ---
  getMyBooks: () => api.get('/student/me/books'),
  getMyHistory: () => api.get('/student/me/history'),
  getMyNotifications: () => api.get('/student/me/notifications'),
  markNotificationAsRead: (id) => api.patch(`/student/me/notifications/${id}/read`),
  markAllNotificationsAsRead: () => api.patch('/student/me/notifications/read-all'),
  getMyProfile: () => api.get('/student/me/profile'),
};

export default libraryService;

