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
  getOrderQr,
  lookupOrderForPickup,
  verifyQrPickup,
  verifyPickup,
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

// Staff/Admin — QR pickup (must be before /:id)
router.post(
  '/verify-qr',
  authorize('staff', 'admin'),
  validate(schemas.verifyQr),
  verifyQrPickup
);
router.post(
  '/pickup-lookup',
  authorize('staff', 'admin'),
  validate(schemas.pickupLookup),
  lookupOrderForPickup
);

router.post(
  '/:id/verify-pickup',
  authorize('staff', 'admin'),
  validate(schemas.verifyPickup),
  verifyPickup
);
router.get('/:id/qr', getOrderQr);

// Staff/Admin routes
router.get('/', authorize('staff', 'admin'), getOrders);
router.get('/:id', getOrder);
router.patch('/:id/status', authorize('staff', 'admin'), validate(schemas.statusUpdate), updateOrderStatus);

module.exports = router;
