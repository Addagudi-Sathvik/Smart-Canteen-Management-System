const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUser,
  updateUserRole,
  toggleUserActive,
} = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');

// All user management routes require authentication + admin
router.use(authenticate, authorize('admin'));

router.get('/', getUsers);
router.get('/:id', getUser);
router.patch('/:id/role', validate(schemas.userRole), updateUserRole);
router.patch('/:id/toggle-active', toggleUserActive);

module.exports = router;
