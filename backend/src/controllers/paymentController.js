const Razorpay = require('razorpay');
const crypto   = require('crypto');
const Order    = require('../models/Order');
const { generateQrToken, buildQrPayloadString } = require('../utils/qrService');

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

let io;
const setSocketIO = (socketIO) => { io = socketIO; };

/**
 * POST /api/payments/create-order
 */
const createPaymentOrder = async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    // Only allow payment for pending orders
    if (order.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'Order already paid.' });
    }

    const razorpayOrder = await razorpay.orders.create({
      amount:   Math.round(order.totalAmount * 100), // convert to paise
      currency: 'INR',
      receipt:  `receipt_${orderId}`,
      notes: {
        orderId: orderId.toString(),
        userId:  req.user._id.toString(),
      },
    });

    res.json({
      razorpayOrderId: razorpayOrder.id,
      amount:          razorpayOrder.amount,
      currency:        razorpayOrder.currency,
      keyId:           process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create payment order.', error: error.message });
  }
};

/**
 * POST /api/payments/verify
 */
const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
    } = req.body;

    // Verify Razorpay signature
    const body     = razorpay_order_id + '|' + razorpay_payment_id;
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expected !== razorpay_signature) {
      return res.status(400).json({ message: 'Payment verification failed. Invalid signature.' });
    }

    const qrToken = generateQrToken();
    const qrGeneratedAt = new Date();

    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        paymentStatus:   'paid',
        paymentId:       razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
        status:          'confirmed',
        'statusTimestamps.confirmed': new Date(),
        qrToken,
        qrUsed:          false,
        qrGeneratedAt,
      },
      { new: true }
    ).populate('userId', 'name email avatar');

    const qrPayload = buildQrPayloadString(order);
    console.log('[QR] Generated after payment', {
      orderId: order.orderId,
      qrGeneratedAt,
    });

    const orderResponse = order.toObject();
    orderResponse.qrPayload = qrPayload;

    // Emit real-time event to staff
    if (io) {
      io.emit('order:new', order.toObject());
      io.emit('notification', {
        type:    'new_order',
        message: `New order ${order.orderId} received`,
        orderId: order.orderId,
      });
    }

    res.json({ message: 'Payment verified successfully.', order: orderResponse });
  } catch (error) {
    res.status(500).json({ message: 'Payment verification failed.', error: error.message });
  }
};

/**
 * POST /api/payments/failed
 */
const paymentFailed = async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    // ✅ Mark payment failed + cancel order + restore stock
    order.paymentStatus = 'failed';
    order.status        = 'cancelled';
    order.statusTimestamps.cancelled = new Date();
    await order.save();

    // Restore stock
    const MenuItem = require('../models/MenuItem');
    for (const item of order.items) {
      await MenuItem.findByIdAndUpdate(item.menuItem, {
        $inc: { stock: item.quantity },
      });
    }

    res.json({ message: 'Payment failure recorded. Order cancelled.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update payment status.', error: error.message });
  }
};

module.exports = { setSocketIO, createPaymentOrder, verifyPayment, paymentFailed };