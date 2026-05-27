const express = require('express');
const router  = express.Router();
const { createPaymentOrder, verifyPayment, paymentFailed } = require('../controllers/paymentController');
const { authenticate } = require('../middleware/auth');

router.post('/create-order', authenticate, createPaymentOrder);
router.post('/verify',       authenticate, verifyPayment);
router.post('/failed',       authenticate, paymentFailed);

module.exports = router;