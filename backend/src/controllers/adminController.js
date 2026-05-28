const Order = require('../models/Order');
const User = require('../models/User');
const MenuItem = require('../models/MenuItem');

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
        readyForPickup: ordersByStatus.ready,
        completedToday: ordersByStatus.completed,
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

module.exports = { getDashboard, getAllOrders, getSystemState, updateSystemState };