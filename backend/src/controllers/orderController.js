const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const User = require('../models/User');

let io;
const setSocketIO = (socketIO) => { io = socketIO; };

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

    // Emit real-time event
    if (io) {
      io.emit('order:new', order.toObject());
      io.emit('notification', {
        type:    'new_order',
        message: `New order ${order.orderId} received`,
        orderId: order.orderId,
      });
    }

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
    const { status, search } = req.query;
    const filter = {};

    if (req.user.role === 'student') {
      filter.userId = req.user._id;
    }

    if (status) {
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
      .limit(50);

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

    res.json({ order });
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

    res.json({ orders });
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
    const validTransitions = {
      confirmed: 'preparing',
      preparing: 'ready',
      ready:     'completed',
    };

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    if (!validTransitions[order.status] || validTransitions[order.status] !== status) {
      return res.status(400).json({
        message: `Cannot transition from '${order.status}' to '${status}'.`,
        allowedTransition: validTransitions[order.status] || 'none',
      });
    }

    order.status = status;
    order.statusTimestamps[status] = new Date();
    await order.save();

    await order.populate('userId', 'name email avatar');

    if (io) {
      io.emit('order:statusUpdate', order.toObject());
      io.emit('notification', {
        type:    'status_update',
        message: `Order ${order.orderId} is now ${status}`,
        orderId: order.orderId,
        status,
      });
    }

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

/**
 * ✅ POST /api/orders/:id/verify-pickup
 * Staff scans QR code — marks order as completed (collected by student)
 * Only staff/admin can call this route
 */
const verifyPickup = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    // Only orders in 'ready' state can be picked up
    if (order.status !== 'ready') {
      return res.status(400).json({
        message: `Order is '${order.status}', not ready for pickup.`,
      });
    }

    order.status = 'completed';
    order.statusTimestamps.completed = new Date();
    await order.save();

    await order.populate('userId', 'name email avatar');

    // Notify student in real-time that their order was collected
    if (io) {
      io.emit('order:statusUpdate', order.toObject());
      io.emit('notification', {
        type:    'status_update',
        message: `Order ${order.orderId} collected successfully`,
        orderId: order.orderId,
        status:  'completed',
      });
    }

    res.json({ order, message: 'Pickup verified. Order marked as completed.' });
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
  verifyPickup,   // ✅ export new function
};