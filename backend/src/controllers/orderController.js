const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const User = require('../models/User');
const {
  generateQrToken,
  buildQrPayloadString,
  parseQrPayload,
} = require('../utils/qrService');
const {
  setSocketIO,
  emitNewOrderPlaced,
  emitOrderStatusUpdate,
} = require('../utils/socketEvents');

const STATUS_PIPELINE = ['pending', 'confirmed', 'preparing', 'ready', 'completed'];

const isForwardStatus = (from, to) => {
  const fromIdx = STATUS_PIPELINE.indexOf(from);
  const toIdx = STATUS_PIPELINE.indexOf(to);
  return fromIdx !== -1 && toIdx !== -1 && toIdx > fromIdx;
};

/** Never expose raw qrToken to students. */
const sanitizeOrderForStudent = (order) => {
  if (!order) return order;
  const o = order.toObject ? order.toObject() : { ...order };
  delete o.qrToken;
  return o;
};

/**
 * POST /api/orders
 * Creates order with paymentStatus: 'pending'
 * Payment is completed separately via /api/payments
 */
const createOrder = async (req, res) => {
  try {
    const { items, notes, pickupSlot } = req.body; // ✅ pickupSlot from CartDrawer

    // Validate pickupSlot is provided
    if (!pickupSlot) {
      return res.status(400).json({ message: 'Please select a pickup time slot.' });
    }

    // Check for existing active order
    const existingOrder = await Order.findOne({
      userId: req.user._id,
      status: { $in: ['pending', 'confirmed', 'preparing'] },
    });

    if (existingOrder) {
      return res.status(409).json({
        message: 'You already have an active order. Please wait for it to complete.',
        order: existingOrder,
      });
    }

    // Validate items and calculate total
    let totalAmount = 0;
    const validatedItems = [];

    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menuItem);
      if (!menuItem) {
        return res.status(404).json({ message: `Menu item ${item.name} not found.` });
      }
      if (!menuItem.availability) {
        return res.status(400).json({ message: `${menuItem.name} is currently unavailable.` });
      }
      if (menuItem.stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${menuItem.name}.` });
      }

      totalAmount += menuItem.price * item.quantity;

      validatedItems.push({
        menuItem: menuItem._id,
        name:     menuItem.name,
        quantity: item.quantity,
        price:    menuItem.price,
      });

      // Reduce stock
      menuItem.stock -= item.quantity;
      await menuItem.save();
    }

    // Generate order ID
    const orderId = await Order.generateOrderId();

    // ✅ Create order — pickupSlot saved, estimatedPrepTime removed
    const order = await Order.create({
      orderId,
      userId:           req.user._id,
      items:            validatedItems,
      totalAmount,
      status:           'pending',
      pickupSlot,                        // ✅ saved from request body
      notes,
      paymentStatus:    'pending',
      paymentMethod:    'online',
      statusTimestamps: { placed: new Date() },
    });

    // Add to user's order history
    await User.findByIdAndUpdate(req.user._id, {
      $push: { orderHistory: order._id },
    });

    await order.populate('userId', 'name email avatar');

    res.status(201).json({ order, message: 'Order created. Proceed to payment.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create order.', error: error.message });
  }
};

/**
 * GET /api/orders
 */
const getOrders = async (req, res) => {
  try {
    const { status, search, filter: listFilter } = req.query;
    const filter = {};

    if (req.user.role === 'student') {
      filter.userId = req.user._id;
    }

    if (listFilter === 'pending') {
      filter.status = { $in: ['pending', 'confirmed', 'preparing'] };
    } else if (listFilter === 'ready') {
      filter.status = 'ready';
    } else if (listFilter === 'completed') {
      filter.status = 'completed';
    } else if (status) {
      if (status === 'active') {
        filter.status = { $in: ['confirmed', 'preparing', 'ready'] };
      } else {
        filter.status = status;
      }
    }

    if (search) {
      filter.$or = [{ orderId: { $regex: search, $options: 'i' } }];
    }

    const orders = await Order.find(filter)
      .populate('userId', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(listFilter || status === 'active' ? 100 : 50);

    res.json({ orders });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch orders.', error: error.message });
  }
};

/**
 * GET /api/orders/:id
 */
const getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('userId', 'name email avatar')
      .populate('items.menuItem');

    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    if (req.user.role === 'student' && order.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const payload =
      req.user.role === 'student' ? sanitizeOrderForStudent(order) : order;
    res.json({ order: payload });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch order.', error: error.message });
  }
};

/**
 * GET /api/orders/my
 */
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id })
      .populate('items.menuItem')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ orders: orders.map(sanitizeOrderForStudent) });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch orders.', error: error.message });
  }
};

/**
 * GET /api/orders/active
 */
const getActiveOrder = async (req, res) => {
  try {
    const order = await Order.findOne({
      userId: req.user._id,
      status: { $in: ['confirmed', 'preparing', 'ready'] },
    }).populate('items.menuItem');

    res.json({ order });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch active order.', error: error.message });
  }
};

/**
 * PATCH /api/orders/:id/status
 */
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    if (order.status === 'cancelled') {
      return res.status(400).json({ message: 'Cancelled orders cannot be updated.' });
    }

    if (order.status === 'completed') {
      return res.status(400).json({ message: 'Order is already completed.' });
    }

    if (!isForwardStatus(order.status, status)) {
      return res.status(400).json({
        message: `Cannot change status from '${order.status}' to '${status}'. Only forward updates are allowed.`,
      });
    }

    const needsPayment =
      STATUS_PIPELINE.indexOf(status) >= STATUS_PIPELINE.indexOf('confirmed');
    if (needsPayment && order.paymentStatus !== 'paid') {
      return res.status(400).json({
        message: 'Order must be paid before it can move to kitchen / pickup stages.',
      });
    }

    order.status = status;
    if (!order.statusTimestamps[status]) {
      order.statusTimestamps[status] = new Date();
    }

    if (status === 'completed') {
      order.pickupVerifiedAt = order.pickupVerifiedAt || new Date();
    }

    await order.save();
    await order.populate('userId', 'name email avatar');

    emitOrderStatusUpdate(order, `Order ${order.orderId} is now ${status}`);

    res.json({ order, message: `Order status updated to '${status}'.` });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update order status.', error: error.message });
  }
};

/**
 * POST /api/orders/:id/reorder
 */
const reorder = async (req, res) => {
  try {
    const previousOrder = await Order.findById(req.params.id);
    if (!previousOrder) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    req.body.items = previousOrder.items.map(item => ({
      menuItem: item.menuItem,
      name:     item.name,
      quantity: item.quantity,
      price:    item.price,
    }));

    // ✅ Carry forward the pickupSlot from previous order on reorder
    req.body.pickupSlot = previousOrder.pickupSlot || '12:00 PM';

    return createOrder(req, res);
  } catch (error) {
    res.status(500).json({ message: 'Failed to reorder.', error: error.message });
  }
};

/**
 * PATCH /api/orders/:id/cancel
 */
const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    if (order.userId.toString() !== req.user._id.toString() && req.user.role === 'student') {
      return res.status(403).json({ message: 'Access denied.' });
    }

    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({ message: 'Order cannot be cancelled at this stage.' });
    }

    order.status = 'cancelled';
    order.statusTimestamps.cancelled = new Date();

    if (order.paymentStatus === 'paid') {
      order.paymentStatus = 'failed';
    }

    await order.save();

    // Restore stock
    for (const item of order.items) {
      await MenuItem.findByIdAndUpdate(item.menuItem, {
        $inc: { stock: item.quantity },
      });
    }

    if (io) {
      io.emit('order:cancelled', order.toObject());
    }

    res.json({ order, message: 'Order cancelled.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to cancel order.', error: error.message });
  }
};

const emitPickupVerified = (order) => {
  emitOrderStatusUpdate(
    order,
    `Order ${order.orderId} successfully marked as Completed & Collected`
  );
};

/**
 * Atomic QR pickup verification — single use only.
 */
const completePickupByQr = async (order, verifiedBy) => {
  if (order.qrUsed) {
    return { error: 'QR already used', status: 409, order };
  }
  if (order.paymentStatus !== 'paid') {
    return { error: 'Order is not paid.', status: 400, order };
  }
  if (order.status !== 'ready') {
    return {
      error: `Order is '${order.status}', not ready for pickup yet.`,
      status: 400,
      order,
    };
  }

  const updated = await Order.findOneAndUpdate(
    { _id: order._id, qrUsed: false, status: 'ready' },
    {
      qrUsed: true,
      pickupVerifiedAt: new Date(),
      status: 'completed',
      'statusTimestamps.completed': new Date(),
    },
    { new: true }
  ).populate('userId', 'name email avatar');

  if (!updated) {
    const current = await Order.findById(order._id).populate('userId', 'name email avatar');
    if (current?.qrUsed) {
      return { error: 'QR already used', status: 409, order: current };
    }
    return { error: 'Could not verify pickup. Please try again.', status: 400, order: current };
  }

  console.log('[QR] Pickup verified', {
    orderId: updated.orderId,
    verifiedBy: verifiedBy?.toString?.(),
  });

  emitPickupVerified(updated);
  return { order: updated };
};

/**
 * GET /api/orders/:id/qr — student fetches secure QR payload for paid order
 */
const getOrderQr = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    if (
      req.user.role === 'student' &&
      order.userId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    if (order.paymentStatus !== 'paid') {
      return res.status(400).json({ message: 'QR code is not available until payment is complete.' });
    }

    // Backfill QR for paid legacy orders (no token yet)
    if (!order.qrToken && !order.qrUsed) {
      order.qrToken = generateQrToken();
      order.qrGeneratedAt = new Date();
      await order.save();
      console.log('[QR] Backfilled token for legacy order', { orderId: order.orderId });
    }

    if (!order.qrToken) {
      return res.status(400).json({ message: 'QR code is not available for this order.' });
    }

    if (order.qrUsed) {
      return res.status(410).json({
        message: 'QR already used',
        qrUsed: true,
        order: {
          orderId: order.orderId,
          status: order.status,
          pickupSlot: order.pickupSlot,
          qrUsed: true,
          pickupVerifiedAt: order.pickupVerifiedAt,
        },
      });
    }

    const qrPayload = buildQrPayloadString(order);
    if (!qrPayload) {
      return res.status(500).json({ message: 'Failed to build QR payload.' });
    }

    res.json({
      qrPayload,
      order: {
        _id: order._id,
        orderId: order.orderId,
        status: order.status,
        paymentStatus: order.paymentStatus,
        pickupSlot: order.pickupSlot,
        qrUsed: order.qrUsed,
        qrGeneratedAt: order.qrGeneratedAt,
        totalAmount: order.totalAmount,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load QR code.', error: error.message });
  }
};

/**
 * POST /api/orders/pickup-lookup — staff/admin preview order before verify
 */
const lookupOrderForPickup = async (req, res) => {
  try {
    const { orderId, token } = req.body;
    const filter = {};

    if (orderId) {
      filter.orderId = { $regex: new RegExp(`^${orderId.trim()}$`, 'i') };
    }
    if (token) {
      filter.qrToken = token.trim();
    }

    if (!Object.keys(filter).length) {
      return res.status(400).json({ message: 'Provide order ID or QR token.' });
    }

    const order = await Order.findOne(filter).populate('userId', 'name email avatar');

    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    console.log('[QR] Lookup', { orderId: order.orderId, by: req.user.role });

    res.json({
      order: {
        _id: order._id,
        orderId: order.orderId,
        status: order.status,
        paymentStatus: order.paymentStatus,
        pickupSlot: order.pickupSlot,
        totalAmount: order.totalAmount,
        items: order.items,
        qrUsed: order.qrUsed,
        qrGeneratedAt: order.qrGeneratedAt,
        pickupVerifiedAt: order.pickupVerifiedAt,
        user: order.userId
          ? { name: order.userId.name, email: order.userId.email }
          : null,
        qrToken: order.qrToken || null,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Lookup failed.', error: error.message });
  }
};

/**
 * POST /api/orders/verify-qr — verify scanned QR (staff/admin)
 */
const verifyQrPickup = async (req, res) => {
  try {
    const { qrPayload, orderId, token } = req.body;

    let parsed = null;
    if (qrPayload) {
      parsed = parseQrPayload(qrPayload);
      if (!parsed) {
        console.warn('[QR] Invalid payload format');
        return res.status(400).json({ message: 'Invalid QR code format.' });
      }
    } else if (orderId && token) {
      parsed = { orderId: orderId.trim(), token: token.trim() };
    } else {
      return res.status(400).json({
        message: 'Provide scanned QR payload or order ID with verification token.',
      });
    }

    const order = await Order.findOne({
      orderId: { $regex: new RegExp(`^${parsed.orderId}$`, 'i') },
      qrToken: parsed.token,
    }).populate('userId', 'name email avatar');

    if (!order) {
      console.warn('[QR] Token mismatch', { orderId: parsed.orderId });
      return res.status(404).json({ message: 'Invalid QR code. Order not found.' });
    }

    const result = await completePickupByQr(order, req.user._id);

    if (result.error) {
      return res.status(result.status).json({
        message: result.error,
        qrUsed: result.status === 409,
        order: result.order,
      });
    }

    res.json({
      order: result.order,
      message: 'Order successfully marked as Completed & Collected',
    });
  } catch (error) {
    console.error('[QR] verify-qr error', error.message);
    res.status(500).json({ message: 'Failed to verify pickup.', error: error.message });
  }
};

/**
 * POST /api/orders/:id/verify-pickup
 * Manual verify with matching qrToken (staff/admin)
 */
const verifyPickup = async (req, res) => {
  try {
    const { qrToken } = req.body;
    const order = await Order.findById(req.params.id).populate('userId', 'name email avatar');

    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    if (!qrToken || order.qrToken !== qrToken) {
      return res.status(403).json({ message: 'Invalid verification token.' });
    }

    const result = await completePickupByQr(order, req.user._id);

    if (result.error) {
      return res.status(result.status).json({
        message: result.error,
        qrUsed: result.status === 409,
        order: result.order,
      });
    }

    res.json({
      order: result.order,
      message: 'Order successfully marked as Completed & Collected',
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to verify pickup.', error: error.message });
  }
};

module.exports = {
  setSocketIO,
  createOrder,
  getOrders,
  getOrder,
  getMyOrders,
  getActiveOrder,
  updateOrderStatus,
  reorder,
  cancelOrder,
  getOrderQr,
  lookupOrderForPickup,
  verifyQrPickup,
  verifyPickup,
};