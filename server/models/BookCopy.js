const mongoose = require('mongoose');

const bookCopySchema = new mongoose.Schema(
  {
    copyId: {
      type: String,
      required: [true, 'Copy ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: [true, 'Book reference is required'],
      index: true,
    },
    qrCodeValue: {
      type: String,
      required: [true, 'QR Code value is required'],
      unique: true,
      trim: true,
      index: true,
    },
    shelfBlock: {
      type: String,
      required: [true, 'Shelf Block is required'],
      trim: true,
      default: 'Block A',
    },
    shelfNumber: {
      type: String,
      required: [true, 'Shelf Number is required'],
      trim: true,
      default: 'Shelf 01',
    },
    rackNumber: {
      type: String,
      trim: true,
      default: 'Rack 01',
    },
    status: {
      type: String,
      enum: ['Available', 'Issued', 'Maintenance', 'Lost'],
      default: 'Available',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('BookCopy', bookCopySchema);

