const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    registerNumber: {
      type: String,
      trim: true,
      uppercase: true,
    },
    department: {
      type: String,
      trim: true,
      default: '',
    },
    course: {
      type: String,
      trim: true,
      default: '',
    },
    academicYear: {
      type: String,
      trim: true,
      default: '',
    },
    startYear: {
      type: Number,
    },
    endYear: {
      type: Number,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
    },
    role: {
      type: String,
      enum: ['admin', 'student'],
      default: 'student',
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Method to verify password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

// Ensure registerNumber is unique among non-null/non-empty values
userSchema.index(
  { registerNumber: 1 },
  { unique: true, partialFilterExpression: { registerNumber: { $type: 'string' } } }
);

module.exports = mongoose.model('User', userSchema);
