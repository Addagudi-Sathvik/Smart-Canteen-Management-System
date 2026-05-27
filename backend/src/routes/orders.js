const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrders,
  getOrder,
  getMyOrders,
  getActiveOrder,
  updateOrderStatus,
  reorder,
  cancelOrder,
} = require('../controllers/orderController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');

// All routes require authentication
router.use(authenticate);

// Student routes
router.post('/', validate(schemas.order), createOrder);
router.get('/my', getMyOrders);
router.get('/active', getActiveOrder);
router.post('/:id/reorder', reorder);
router.patch('/:id/cancel', cancelOrder);

// Staff/Admin routes
router.get('/', authorize('staff', 'admin'), getOrders);
router.get('/:id', getOrder);
router.patch('/:id/status', authorize('staff', 'admin'), validate(schemas.statusUpdate), updateOrderStatus);

module.exports = router;
