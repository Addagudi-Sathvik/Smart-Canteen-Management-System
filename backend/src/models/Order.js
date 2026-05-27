const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: true,
  },
  name: String,
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
  },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'],
    default: 'pending',
  },
  estimatedPrepTime: {
    type: Number,
    default: 10,
  },
  pickupSlot: {
    type: String,
    default: '',
  },
  counterNumber: {
    type: Number,
    default: 1,
  },
  // ✅ Updated payment fields
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],  // changed 'success' → 'paid'
    default: 'pending',
  },
  paymentMethod: {
    type: String,
    enum: ['online', 'counter'],
    default: 'online',
  },
  // ✅ New Razorpay fields
  paymentId: {
    type: String,
    default: '',
  },
  razorpayOrderId: {
    type: String,
    default: '',
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 300,
    default: '',
  },
  statusTimestamps: {
    placed:     { type: Date, default: Date.now },
    confirmed:  Date,
    preparing:  Date,
    ready:      Date,
    completed:  Date,
    cancelled:  Date,
  },
}, {
  timestamps: true,
});

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

orderSchema.statics.generateOrderId = async function () {
  const count = await this.countDocuments();
  const nextNum = count + 1;
  const padded = String(nextNum).padStart(4, '0');
  return `ORD${padded}`;
};

module.exports = mongoose.model('Order', orderSchema);