const MenuItem = require('../models/MenuItem');

// ✅ Helper to parse FormData types correctly
const parseItemData = (body) => {
  const itemData = { ...body };

  if (typeof itemData.availability === 'string') {
    itemData.availability = itemData.availability === 'true';
  }
  if (typeof itemData.isPopular === 'string') {
    itemData.isPopular = itemData.isPopular === 'true';
  }
  if (itemData.price !== undefined)           itemData.price           = Number(itemData.price);
  if (itemData.stock !== undefined)           itemData.stock           = Number(itemData.stock);
  if (itemData.preparationTime !== undefined) itemData.preparationTime = Number(itemData.preparationTime);

  return itemData;
};

/**
 * GET /api/menu
 * Get all available menu items with optional filters
 */
const getMenuItems = async (req, res) => {
  try {
    const { category, search, availability } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (availability !== undefined) filter.availability = availability === 'true';
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const items = await MenuItem.find(filter).sort({ category: 1, name: 1 });
    res.json({ items });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch menu items.', error: error.message });
  }
};

/**
 * GET /api/menu/:id
 * Get a single menu item by ID
 */
const getMenuItem = async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Menu item not found.' });
    }
    res.json({ item });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch menu item.', error: error.message });
  }
};

/**
 * POST /api/menu
 * Create a new menu item (Admin only)
 */
const createMenuItem = async (req, res) => {
  try {
    const itemData = parseItemData(req.body);

    if (req.file) {
      itemData.imageUrl = `/uploads/${req.file.filename}`;
    }

    const item = await MenuItem.create(itemData);
    res.status(201).json({ item, message: 'Menu item created successfully.' });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Failed to create menu item.', error: error.message });
  }
};

/**
 * PUT /api/menu/:id
 * Update a menu item (Admin only)
 */
const updateMenuItem = async (req, res) => {
  try {
    const itemData = parseItemData(req.body);

    if (req.file) {
      itemData.imageUrl = `/uploads/${req.file.filename}`;
    }

    const item = await MenuItem.findByIdAndUpdate(req.params.id, itemData, {
      new: true,
      runValidators: true,
    });

    if (!item) {
      return res.status(404).json({ message: 'Menu item not found.' });
    }

    res.json({ item, message: 'Menu item updated successfully.' });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Failed to update menu item.', error: error.message });
  }
};

/**
 * DELETE /api/menu/:id
 * Delete a menu item (Admin only)
 */
const deleteMenuItem = async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Menu item not found.' });
    }
    res.json({ message: 'Menu item deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete menu item.', error: error.message });
  }
};

/**
 * PATCH /api/menu/:id/toggle
 * Toggle menu item availability (Staff/Admin)
 */
const toggleAvailability = async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Menu item not found.' });
    }

    item.availability = !item.availability;
    await item.save();

    res.json({ item, message: `Item ${item.availability ? 'available' : 'unavailable'} now.` });
  } catch (error) {
    res.status(500).json({ message: 'Failed to toggle availability.', error: error.message });
  }
};

module.exports = {
  getMenuItems,
  getMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleAvailability,
};