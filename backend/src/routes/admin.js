const express = require('express');
const router = express.Router();
const {
  getDashboard,
  getAllOrders,
  getActiveOrders,
  getSystemState,
  updateSystemState,
  updateAdminOrderStatus,
  verifyAdminPickup,
  createCounterOrder,
} = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');

router.use(authenticate, authorize('admin'));

router.get('/dashboard', getDashboard);
router.get('/orders', getAllOrders);
router.get('/orders/active', getActiveOrders);
router.post('/orders/counter', validate(schemas.counterOrder), createCounterOrder);
router.patch(
  '/orders/:orderId/status',
  validate(schemas.adminStatusUpdate),
  updateAdminOrderStatus
);
router.post('/verify-pickup', validate(schemas.adminVerifyPickup), verifyAdminPickup);

router.get('/system', getSystemState);
router.patch('/system', updateSystemState);

module.exports = router;
