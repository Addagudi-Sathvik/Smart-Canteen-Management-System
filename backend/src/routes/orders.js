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
  verifyPickup,             // ✅ added
} = require('../controllers/orderController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');

router.use(authenticate);

// Student routes
router.post('/', validate(schemas.order), createOrder);
router.get('/my', getMyOrders);
router.get('/active', getActiveOrder);
router.post('/:id/reorder', reorder);
router.patch('/:id/cancel', cancelOrder);
router.post('/:id/verify-pickup', authorize('staff', 'admin'), verifyPickup);  // ✅ added

// Staff/Admin routes
router.get('/', authorize('staff', 'admin'), getOrders);
router.get('/:id', getOrder);
router.patch('/:id/status', authorize('staff', 'admin'), validate(schemas.statusUpdate), updateOrderStatus);

module.exports = router;