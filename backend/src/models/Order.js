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
  // Pickup slot chosen by student at checkout (e.g. "12:00 PM", "12:15 PM")
  pickupSlot: {
    type: String,
    required: true,
    default: '12:00 PM',
  },
  counterNumber: {
    type: Number,
    default: 1,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending',
  },
  paymentMethod: {
    type: String,
    enum: ['online', 'counter'],
    default: 'online',
  },
  paymentId: {
    type: String,
    default: '',
  },
  razorpayOrderId: {
    type: String,
    default: '',
  },
  qrToken: {
    type: String,
    default: null,
    index: true,
    sparse: true,
  },
  qrUsed: {
    type: Boolean,
    default: false,
  },
  qrGeneratedAt: {
    type: Date,
    default: null,
  },
  pickupVerifiedAt: {
    type: Date,
    default: null,
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 300,
    default: '',
  },
  statusTimestamps: {
    placed:    { type: Date, default: Date.now },
    confirmed: Date,
    preparing: Date,
    ready:     Date,
    completed: Date,
    cancelled: Date,
  },
}, {
  timestamps: true,
});

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ pickupSlot: 1, status: 1 });
orderSchema.index({ orderId: 1, qrToken: 1 });

orderSchema.statics.generateOrderId = async function () {
  const count = await this.countDocuments();
  const nextNum = count + 1;
  const padded = String(nextNum).padStart(4, '0');
  return `ORD${padded}`;
};

module.exports = mongoose.model('Order', orderSchema);