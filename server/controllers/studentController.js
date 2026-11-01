const User = require('../models/User');
const BorrowTransaction = require('../models/BorrowTransaction');
const bcrypt = require('bcryptjs');

// GET /api/students (Admin only)
const getStudents = async (req, res) => {
  try {
    const { search, department, startYear, endYear, status, page = 1, limit = 20 } = req.query;

    const query = { role: 'student' };

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: searchRegex }, { registerNumber: searchRegex }, { email: searchRegex }];
    }

    if (department) {
      query.department = new RegExp(department.trim(), 'i');
    }

    if (startYear) {
      query.startYear = parseInt(startYear, 10);
    }

    if (endYear) {
      query.endYear = parseInt(endYear, 10);
    }

    if (status !== undefined && status !== '') {
      query.isActive = status === 'active' || status === 'true';
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [students, total] = await Promise.all([
      User.find(query)
        .select('-passwordHash')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      User.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: students,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum,
      },
    });
  } catch (error) {
    console.error('[StudentController.getStudents] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch students.',
      error: error.message,
    });
  }
};

// GET /api/students/search/regno/:regNo (Admin only - lookup for ID scan)
const getStudentByRegNo = async (req, res) => {
  try {
    const regNo = req.params.regNo.toUpperCase().trim();
    const student = await User.findOne({ registerNumber: regNo, role: 'student' }).select('-passwordHash');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: `No registered student found with register number: ${regNo}`,
      });
    }

    // Get active borrows count
    const activeBorrowsCount = await BorrowTransaction.countDocuments({
      student: student._id,
      status: { $in: ['Issued', 'Overdue'] },
    });

    return res.status(200).json({
      success: true,
      data: student,
      activeBorrowsCount,
    });
  } catch (error) {
    console.error('[StudentController.getStudentByRegNo] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error searching student by register number.',
      error: error.message,
    });
  }
};

// GET /api/students/:id (Admin only)
const getStudentById = async (req, res) => {
  try {
    const student = await User.findById(req.params.id).select('-passwordHash');

    if (!student || student.role !== 'student') {
      return res.status(404).json({
        success: false,
        message: 'Student not found.',
      });
    }

    // Fetch active borrowings
    const activeBorrows = await BorrowTransaction.find({
      student: student._id,
      status: { $in: ['Issued', 'Overdue'] },
    })
      .populate('book')
      .populate('bookCopy')
      .sort({ dueDate: 1 });

    // Fetch borrowing history (returned)
    const history = await BorrowTransaction.find({
      student: student._id,
      status: 'Returned',
    })
      .populate('book')
      .populate('bookCopy')
      .sort({ returnDate: -1 })
      .limit(20);

    return res.status(200).json({
      success: true,
      data: {
        student,
        activeBorrows,
        history,
      },
    });
  } catch (error) {
    console.error('[StudentController.getStudentById] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve student details.',
      error: error.message,
    });
  }
};

// POST /api/students (Admin only - create student)
const createStudent = async (req, res) => {
  try {
    const {
      name,
      registerNumber,
      course,
      department,
      year,
      academicYear,
      startYear,
      endYear,
      email,
      phone,
      password,
    } = req.body;

    if (!name || !registerNumber || !email) {
      return res.status(400).json({
        success: false,
        message: 'Name, Register Number, and Email are required.',
      });
    }

    const normalizedRegNo = registerNumber.toUpperCase().trim();
    const normalizedEmail = email.toLowerCase().trim();

    const existing = await User.findOne({
      $or: [{ registerNumber: normalizedRegNo }, { email: normalizedEmail }],
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A user with this Register Number or Email already exists.',
      });
    }

    const finalCourse = (course || department || '').trim();
    const finalYearStr = (year || academicYear || (startYear && endYear ? `${startYear}–${endYear}` : '') || '').trim();

    let sYear = startYear ? parseInt(startYear, 10) : undefined;
    let eYear = endYear ? parseInt(endYear, 10) : undefined;
    if ((!sYear || !eYear) && finalYearStr) {
      const ym = finalYearStr.match(/(\d{4})\s*[\–\-\/]\s*(\d{4})/);
      if (ym) {
        sYear = parseInt(ym[1], 10);
        eYear = parseInt(ym[2], 10);
      }
    }

    // Default temporary password if not provided
    const defaultPassword = password || 'Student@123';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(defaultPassword, salt);

    const newStudent = await User.create({
      name: name.trim(),
      registerNumber: normalizedRegNo,
      department: finalCourse,
      course: finalCourse,
      academicYear: finalYearStr,
      startYear: sYear,
      endYear: eYear,
      email: normalizedEmail,
      phone: phone ? phone.trim() : '',
      passwordHash,
      role: 'student',
      isActive: true,
    });

    const studentData = newStudent.toObject();
    delete studentData.passwordHash;

    return res.status(201).json({
      success: true,
      message: 'Student created successfully.',
      data: studentData,
      initialPassword: defaultPassword,
    });
  } catch (error) {
    console.error('[StudentController.createStudent] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create student.',
      error: error.message,
    });
  }
};

// PATCH /api/students/:id (Admin only)
const updateStudent = async (req, res) => {
  try {
    const { name, department, course, year, academicYear, startYear, endYear, phone, email, password } = req.body;

    const student = await User.findById(req.params.id);
    if (!student || student.role !== 'student') {
      return res.status(404).json({
        success: false,
        message: 'Student not found.',
      });
    }

    if (name) student.name = name.trim();
    if (course !== undefined) {
      student.course = course.trim();
      student.department = course.trim();
    } else if (department !== undefined) {
      student.department = department.trim();
      student.course = department.trim();
    }

    if (year !== undefined || academicYear !== undefined) {
      const yVal = (year || academicYear || '').trim();
      student.academicYear = yVal;
      const ym = yVal.match(/(\d{4})\s*[\–\-\/]\s*(\d{4})/);
      if (ym) {
        student.startYear = parseInt(ym[1], 10);
        student.endYear = parseInt(ym[2], 10);
      }
    }
    if (startYear !== undefined) student.startYear = parseInt(startYear, 10);
    if (endYear !== undefined) student.endYear = parseInt(endYear, 10);
    if (phone !== undefined) student.phone = phone.trim();

    if (email && email.toLowerCase().trim() !== student.email) {
      const emailExists = await User.findOne({
        email: email.toLowerCase().trim(),
        _id: { $ne: student._id },
      });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Email is already used by another account.',
        });
      }
      student.email = email.toLowerCase().trim();
    }

    if (password) {
      const salt = await bcrypt.genSalt(10);
      student.passwordHash = await bcrypt.hash(password, salt);
    }

    await student.save();

    const studentData = student.toObject();
    delete studentData.passwordHash;

    return res.status(200).json({
      success: true,
      message: 'Student updated successfully.',
      data: studentData,
    });
  } catch (error) {
    console.error('[StudentController.updateStudent] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update student.',
      error: error.message,
    });
  }
};

// PATCH /api/students/:id/status (Admin only - toggle active)
const updateStudentStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    const student = await User.findById(req.params.id);

    if (!student || student.role !== 'student') {
      return res.status(404).json({
        success: false,
        message: 'Student not found.',
      });
    }

    student.isActive = isActive !== undefined ? Boolean(isActive) : !student.isActive;
    await student.save();

    return res.status(200).json({
      success: true,
      message: `Student account ${student.isActive ? 'activated' : 'deactivated'} successfully.`,
      isActive: student.isActive,
    });
  } catch (error) {
    console.error('[StudentController.updateStudentStatus] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update student status.',
      error: error.message,
    });
  }
};

module.exports = {
  getStudents,
  getStudentByRegNo,
  getStudentById,
  createStudent,
  updateStudent,
  updateStudentStatus,
};

