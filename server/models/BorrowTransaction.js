const mongoose = require('mongoose');

const borrowTransactionSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student is required'],
      index: true,
    },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: [true, 'Book is required'],
      index: true,
    },
    bookCopy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BookCopy',
      required: [true, 'Book copy is required'],
      index: true,
    },
    issueDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
      index: true,
    },
    returnDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['Issued', 'Returned', 'Overdue'],
      default: 'Issued',
      index: true,
    },
    fineAmount: {
      type: Number,
      default: 0,
    },
    finePaid: {
      type: Boolean,
      default: false,
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    returnedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    remarks: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Composite indexes for fast queries
borrowTransactionSchema.index({ status: 1, dueDate: 1 });
borrowTransactionSchema.index({ student: 1, status: 1 });

module.exports = mongoose.model('BorrowTransaction', borrowTransactionSchema);

