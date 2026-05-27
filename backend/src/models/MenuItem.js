const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true,
    minlength: 2,
    maxlength: 100,
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Snacks', 'Meals', 'Drinks', 'Combos'],
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500,
    default: '',
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
  },
  preparationTime: {
    type: Number, // in minutes
    required: [true, 'Preparation time is required'],
    min: [1, 'Preparation time must be at least 1 minute'],
  },
  stock: {
    type: Number,
    default: 50,
    min: 0,
  },
  availability: {
    type: Boolean,
    default: true,
  },
  imageUrl: {
    type: String,
    default: '',
  },
  isPopular: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Indexes
menuItemSchema.index({ category: 1, availability: 1 });
menuItemSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('MenuItem', menuItemSchema);
