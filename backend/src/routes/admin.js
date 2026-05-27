const express = require('express');
const router = express.Router();
const {
  getDashboard,
  getAllOrders,
  getSystemState,
  updateSystemState,
} = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');

// All admin routes require authentication + admin role
router.use(authenticate, authorize('admin'));

// Dashboard & analytics
router.get('/dashboard', getDashboard);
router.get('/orders', getAllOrders);

// System controls
router.get('/system', getSystemState);
router.patch('/system', updateSystemState);

module.exports = router;
