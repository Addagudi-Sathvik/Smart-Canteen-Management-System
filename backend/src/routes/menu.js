const express = require('express');
const router = express.Router();
const {
  getMenuItems,
  getMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleAvailability,
} = require('../controllers/menuController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');
const upload = require('../middleware/upload');

// Public route - browse menu
router.get('/', getMenuItems);
router.get('/:id', getMenuItem);

// Admin routes - manage menu
router.post('/',
  authenticate,
  authorize('admin'),
  upload.single('image'),
  validate(schemas.menuItem),
  createMenuItem
);

router.put('/:id',
  authenticate,
  authorize('admin'),
  upload.single('image'),
  updateMenuItem
);

router.delete('/:id',
  authenticate,
  authorize('admin'),
  deleteMenuItem
);

// Staff/Admin route - toggle availability
router.patch('/:id/toggle',
  authenticate,
  authorize('staff', 'admin'),
  toggleAvailability
);

module.exports = router;
