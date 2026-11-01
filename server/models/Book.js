const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
  {
    bookTitleId: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Book title is required'],
      trim: true,
      index: true,
    },
    author: {
      type: String,
      required: [true, 'Author is required'],
      trim: true,
      index: true,
    },
    isbn: {
      type: String,
      required: [true, 'ISBN is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    publisher: {
      type: String,
      trim: true,
      default: '',
    },
    edition: {
      type: String,
      trim: true,
      default: '1st Edition',
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for copies
bookSchema.virtual('copies', {
  ref: 'BookCopy',
  localField: '_id',
  foreignField: 'book',
});

module.exports = mongoose.model('Book', bookSchema);

