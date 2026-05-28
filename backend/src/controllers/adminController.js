const Order = require('../models/Order');
const User = require('../models/User');
const MenuItem = require('../models/MenuItem');
const { generateQrToken, parseQrPayload } = require('../utils/qrService');
const { emitNewOrderPlaced, emitOrderStatusUpdate } = require('../utils/socketEvents');

const ALLOWED_ADMIN_STATUSES = ['confirmed', 'preparing', 'ready', 'completed', 'cancelled'];
const ADMIN_PIPELINE_NEXT = {
  pending: 'confirmed',
  confirmed: 'preparing',
  preparing: 'ready',
};

// System state (in-memory for simplicity; use DB for production)
let systemState = {
  orderingOpen: true,
  message: 'Welcome to the Canteen!',
};

/**
 * GET /api/admin/dashboard
 * Get admin dashboard metrics and analytics
 */
const getDashboard = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Today's orders
    const todayOrders = await Order.find({
      createdAt: { $gte: today, $lt: tomorrow },
    });

    const totalOrdersToday = todayOrders.length;
    const revenueToday = todayOrders
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    // Average prep time (for completed orders today)
    const completedToday = todayOrders.filter(o => o.status === 'completed');
    const avgPrepTime = completedToday.length > 0
      ? completedToday.reduce((sum, o) => {
          if (o.statusTimestamps.placed && o.statusTimestamps.completed) {
            const diff = (new Date(o.statusTimestamps.completed) - new Date(o.statusTimestamps.placed)) / 60000;
            return sum + diff;
          }
          return sum;
        }, 0) / completedToday.length
      : 0;

    // Orders by status
    const ordersByStatus = {
      pending: todayOrders.filter(o => o.status === 'pending').length,
      confirmed: todayOrders.filter(o => o.status === 'confirmed').length,
      preparing: todayOrders.filter(o => o.status === 'preparing').length,
      ready: todayOrders.filter(o => o.status === 'ready').length,
      completed: todayOrders.filter(o => o.status === 'completed').length,
      cancelled: todayOrders.filter(o => o.status === 'cancelled').length,
    };

    // Popular items (aggregate from all orders in last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    // FIX: Renamed from recentOrders to recentWeekOrders to prevent duplicate declaration error
    const recentWeekOrders = await Order.find({
      createdAt: { $gte: weekAgo },
      status: { $ne: 'cancelled' },
    });

    const itemCounts = {};
    for (const order of recentWeekOrders) {
      for (const item of order.items) {
        itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity;
      }
    }

    const popularItems = Object.entries(itemCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    // Daily orders for chart (last 7 days)
    const dailyOrders = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayOrders = await Order.countDocuments({
        createdAt: { $gte: date, $lt: nextDate },
        status: { $ne: 'cancelled' },
      });

      const dayRevenue = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: date, $lt: nextDate },
            status: { $ne: 'cancelled' },
          },
        },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]);

      dailyOrders.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        orders: dayOrders,
        revenue: dayRevenue.length > 0 ? dayRevenue[0].total : 0,
      });
    }

    // Total counts
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalStaff = await User.countDocuments({ role: 'staff' });
    const totalMenuItems = await MenuItem.countDocuments();
    const activeMenuItems = await MenuItem.countDocuments({ availability: true });
    const activeOrders =
      ordersByStatus.pending + ordersByStatus.confirmed + ordersByStatus.preparing;

    // Keeps the primary variable name required by your frontend payload
    const recentOrders = await Order.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();

    const pendingOrders =
      ordersByStatus.pending +
      ordersByStatus.confirmed +
      ordersByStatus.preparing;

    res.json({
      metrics: {
        totalOrdersToday,
        revenueToday: Math.round(revenueToday * 100) / 100,
        avgPrepTime: Math.round(avgPrepTime * 10) / 10,
        totalUsers,
        totalStudents,
        totalStaff,
        totalMenuItems,
        pendingOrders,
        activeOrders,
        readyForPickup: ordersByStatus.ready,
        completedToday: ordersByStatus.completed,
        activeMenuItems,
      },
      ordersByStatus,
      popularItems,
      dailyOrders,
      recentOrders,
      systemState,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch dashboard data.', error: error.message });
  }
};

/**
 * GET /api/admin/orders
 * Get all orders with pagination and filters (Admin view)
 */
const getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const orders = await Order.find(filter)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(filter);

    res.json({ orders, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch orders.', error: error.message });
  }
};

/**
 * GET /api/admin/system
 * Get system state
 */
const getSystemState = async (req, res) => {
  res.json({ systemState });
};

/**
 * PATCH /api/admin/system
 * Update system controls
 */
const updateSystemState = async (req, res) => {
  try {
    const { orderingOpen, message } = req.body;
    if (orderingOpen !== undefined) systemState.orderingOpen = orderingOpen;
    if (message !== undefined) systemState.message = message;
    res.json({ systemState, message: 'System settings updated.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update system settings.', error: error.message });
  }
};

/**
 * GET /api/admin/orders/active — live kitchen queue
 */
const getActiveOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      status: { $in: ['pending', 'confirmed', 'preparing', 'ready'] },
    })
      .populate('userId', 'name email avatar')
      .sort({ createdAt: 1 });

    res.json({ orders });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch active orders.', error: error.message });
  }
};

/**
 * PATCH /api/admin/orders/:orderId/status — admin-only pipeline (no ready→completed)
 */
const updateAdminOrderStatus = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden. Admin access required.' });
    }

    const { status } = req.body;
    if (!ALLOWED_ADMIN_STATUSES.includes(status)) {
      return res.status(400).json({
        message: `Status must be one of: ${ALLOWED_ADMIN_STATUSES.join(', ')}`,
      });
    }

    if (status === 'completed') {
      return res.status(400).json({
        message: 'Use POST /api/admin/verify-pickup to mark orders as collected.',
      });
    }

    const order = await Order.findById(req.params.orderId).populate(
      'userId',
      'name email avatar'
    );

    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    if (order.status === 'completed' || order.status === 'cancelled') {
      return res.status(400).json({ message: `Cannot update a ${order.status} order.` });
    }

    if (status === 'cancelled') {
      order.status = 'cancelled';
      order.statusTimestamps.cancelled = new Date();
      await order.save();
      emitOrderStatusUpdate(order, `Order ${order.orderId} was cancelled`);
      return res.json({ order, message: 'Order cancelled.' });
    }

    const expectedNext = ADMIN_PIPELINE_NEXT[order.status];
    if (expectedNext !== status) {
      return res.status(400).json({
        message: `Cannot transition from '${order.status}' to '${status}'.`,
        allowedNext: expectedNext || null,
      });
    }

    if (order.paymentStatus !== 'paid') {
      return res.status(400).json({
        message: 'Order must be paid before advancing kitchen status.',
      });
    }

    order.status = status;
    if (!order.statusTimestamps[status]) {
      order.statusTimestamps[status] = new Date();
    }
    await order.save();

    const message =
      status === 'ready'
        ? `Order ${order.orderId} is ready for pickup`
        : `Order ${order.orderId} is now ${status}`;

    emitOrderStatusUpdate(order, message);

    res.json({ order, message: `Order status updated to '${status}'.` });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update order status.', error: error.message });
  }
};

/**
 * POST /api/admin/verify-pickup — QR or order ID → completed
 */
const verifyAdminPickup = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden. Admin access required.' });
    }

    const { orderId, qrPayload } = req.body;
    let filter = {};

    if (qrPayload) {
      const parsed = parseQrPayload(qrPayload);
      if (!parsed) {
        return res.status(400).json({ message: 'Invalid QR code format.' });
      }
      filter = {
        orderId: { $regex: new RegExp(`^${parsed.orderId}$`, 'i') },
        qrToken: parsed.token,
      };
    } else {
      filter = { orderId: { $regex: new RegExp(`^${orderId.trim()}$`, 'i') } };
    }

    const order = await Order.findOne(filter).populate('userId', 'name email avatar');

    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    if (order.status === 'completed') {
      return res.status(409).json({
        message: 'Order already completed.',
        order,
      });
    }

    if (order.status !== 'ready') {
      return res.status(400).json({
        message: `Order must be ready for pickup. Current status: ${order.status}`,
        order,
      });
    }

    order.status = 'completed';
    order.qrUsed = true;
    order.pickupVerifiedAt = order.pickupVerifiedAt || new Date();
    order.statusTimestamps.completed = new Date();
    await order.save();

    emitOrderStatusUpdate(order, 'Order successfully marked as Completed & Collected');

    res.json({
      order,
      message: 'Order successfully marked as Completed & Collected',
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to verify pickup.', error: error.message });
  }
};

/**
 * POST /api/admin/orders/counter — walk-in cash order
 */
const createCounterOrder = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden. Admin access required.' });
    }

    const { items, pickupSlot, notes, customerName } = req.body;

    let totalAmount = 0;
    const validatedItems = [];

    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menuItem);
      if (!menuItem) {
        return res.status(404).json({ message: 'Menu item not found.' });
      }
      if (!menuItem.availability) {
        return res.status(400).json({ message: `${menuItem.name} is unavailable.` });
      }
      if (menuItem.stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${menuItem.name}.` });
      }

      totalAmount += menuItem.price * item.quantity;
      validatedItems.push({
        menuItem: menuItem._id,
        name: menuItem.name,
        quantity: item.quantity,
        price: menuItem.price,
      });

      menuItem.stock -= item.quantity;
      await menuItem.save();
    }

    const orderId = await Order.generateOrderId();
    const walkInNote = customerName
      ? `Walk-in: ${customerName}${notes ? ` — ${notes}` : ''}`
      : notes || 'Counter order';

    const order = await Order.create({
      orderId,
      userId: req.user._id,
      items: validatedItems,
      totalAmount,
      status: 'confirmed',
      pickupSlot,
      notes: walkInNote,
      paymentStatus: 'paid',
      paymentMethod: 'counter',
      qrToken: generateQrToken(),
      qrGeneratedAt: new Date(),
      statusTimestamps: {
        placed: new Date(),
        confirmed: new Date(),
      },
    });

    await order.populate('userId', 'name email avatar');
    emitNewOrderPlaced(order);

    res.status(201).json({
      order,
      message: 'Counter order created and confirmed.',
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create counter order.', error: error.message });
  }
};

module.exports = {
  getDashboard,
  getAllOrders,
  getActiveOrders,
  getSystemState,
  updateSystemState,
  updateAdminOrderStatus,
  verifyAdminPickup,
  createCounterOrder,
};