const User = require('../models/User');
const Order = require('../models/Order');

/**
 * GET /api/users
 * Get all users (Admin only)
 */
const getUsers = async (req, res) => {
  try {
    const { role, search } = req.query;
    const filter = {};

    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(filter).select('-__v').sort({ createdAt: -1 });
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users.', error: error.message });
  }
};

/**
 * GET /api/users/:id
 * Get a single user by ID (Admin only)
 */
const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-__v');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user.', error: error.message });
  }
};

/**
 * PATCH /api/users/:id/role
 * Update user role (Admin only)
 */
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { role }, {
      new: true,
      runValidators: true,
    }).select('-__v');

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json({ user, message: `User role updated to '${role}'.` });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update user role.', error: error.message });
  }
};

/**
 * PATCH /api/users/:id/toggle-active
 * Toggle user active status (Admin only)
 */
const toggleUserActive = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      user: { id: user._id, isActive: user.isActive },
      message: `User ${user.isActive ? 'activated' : 'deactivated'}.`,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to toggle user status.', error: error.message });
  }
};

module.exports = { getUsers, getUser, updateUserRole, toggleUserActive };
