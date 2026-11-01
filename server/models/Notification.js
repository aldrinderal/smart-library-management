const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student recipient is required'],
      index: true,
    },
    transaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BorrowTransaction',
      index: true,
    },
    type: {
      type: String,
      enum: ['INFO', 'REMINDER_DUE_SOON', 'DUE_TODAY', 'OVERDUE', 'RETURN_CONFIRMATION', 'SYSTEM'],
      default: 'INFO',
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    reminderKey: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ student: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);

