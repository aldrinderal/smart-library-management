const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../utils/jwt');

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, registerNumber, password, role } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required.',
      });
    }

    // Identify user by email OR registerNumber
    let query = {};
    if (email) {
      query.email = email.toLowerCase().trim();
    } else if (registerNumber) {
      query.registerNumber = registerNumber.toUpperCase().trim();
    } else {
      return res.status(400).json({
        success: false,
        message: 'Please provide either email or register number.',
      });
    }

    if (role) {
      query.role = role;
    }

    const user = await User.findOne(query);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. User not found.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account is deactivated. Please contact the library administrator.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Password incorrect.',
      });
    }

    const token = generateToken(user._id, user.role);

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        registerNumber: user.registerNumber,
        department: user.department,
        startYear: user.startYear,
        endYear: user.endYear,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error('[AuthController.login] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during login.',
      error: error.message,
    });
  }
};

// POST /api/auth/register (Student registration)
const register = async (req, res) => {
  try {
    // Check if student public registration is allowed
    const allowPublicReg = process.env.ALLOW_STUDENT_REGISTRATION !== 'false';
    if (!allowPublicReg) {
      return res.status(403).json({
        success: false,
        message: 'Public registration is disabled. Please contact the librarian for account creation.',
      });
    }

    const { name, registerNumber, course, department, year, academicYear, startYear, endYear, email, phone, password } = req.body;

    if (!name || !registerNumber || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, Register Number, Email, and Password are required.',
      });
    }

    const finalCourse = (course || department || '').trim();
    const finalYear = (year || academicYear || (startYear && endYear ? `${startYear}–${endYear}` : '') || '').trim();

    let sYear = startYear ? parseInt(startYear, 10) : undefined;
    let eYear = endYear ? parseInt(endYear, 10) : undefined;
    if ((!sYear || !eYear) && finalYear) {
      const ym = finalYear.match(/(\d{4})\s*[\–\-\/]\s*(\d{4})/);
      if (ym) {
        sYear = parseInt(ym[1], 10);
        eYear = parseInt(ym[2], 10);
      }
    }

    // Ensure no admin role can be self-assigned
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedRegNo = registerNumber.toUpperCase().trim();

    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { registerNumber: normalizedRegNo }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A student with this Email or Register Number already exists.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name: name.trim(),
      registerNumber: normalizedRegNo,
      department: finalCourse,
      course: finalCourse,
      academicYear: finalYear,
      startYear: sYear,
      endYear: eYear,
      email: normalizedEmail,
      phone: phone ? phone.trim() : '',
      passwordHash,
      role: 'student', // ALWAYS forced to student
      isActive: true,
    });

    const token = generateToken(user._id, user.role);

    return res.status(201).json({
      success: true,
      message: 'Student account registered successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        registerNumber: user.registerNumber,
        department: user.department,
        course: user.course,
        academicYear: user.academicYear,
        startYear: user.startYear,
        endYear: user.endYear,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error('[AuthController.register] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during registration.',
      error: error.message,
    });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving user data.',
    });
  }
};

module.exports = {
  login,
  register,
  getMe,
};

