import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { fetchMenuItems } from '../../store/slices/menuSlice';
import { menuAPI } from '../../utils/api';
import Modal from '../../components/ui/Modal';
import PageHeader from '../../components/ui/PageHeader';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';
import {
  Plus, Edit2, Trash2, Search, Coffee, Package,
} from 'lucide-react';

const categories = ['Snacks', 'Meals', 'Drinks', 'Combos'];

const emptyForm = {
  name: '', category: 'Snacks', description: '', price: '',
  preparationTime: '', stock: '50', availability: true, isPopular: false,
};

const MenuManagement = () => {
  const dispatch = useDispatch();
  const { items, loading } = useSelector((state) => state.menu);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  useEffect(() => {
    dispatch(fetchMenuItems());
  }, [dispatch]);

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleEdit = (item) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      category: item.category,
      description: item.description || '',
      price: item.price.toString(),
      preparationTime: item.preparationTime.toString(),
      stock: item.stock.toString(),
      availability: item.availability,
      isPopular: item.isPopular,
    });
    setImageFile(null);
    setShowModal(true);
  };

  const handleNew = () => {
    setEditingItem(null);
    setForm(emptyForm);
    setImageFile(null);
    setShowModal(true);
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await menuAPI.delete(id);
      toast.success(`"${name}" deleted`);
      dispatch(fetchMenuItems());
    } catch (error) {
      toast.error('Failed to delete item');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('category', form.category);
      formData.append('description', form.description);
      formData.append('price', form.price);
      formData.append('preparationTime', form.preparationTime);
      formData.append('stock', form.stock);
      formData.append('availability', form.availability);
      formData.append('isPopular', form.isPopular);
      if (imageFile) formData.append('image', imageFile);

      if (editingItem) {
        await menuAPI.update(editingItem._id, formData);
        toast.success('Menu item updated!');
      } else {
        await menuAPI.create(formData);
        toast.success('Menu item created!');
      }

      setShowModal(false);
      dispatch(fetchMenuItems());
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save item');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Menu Management"
        subtitle="Add, edit, or remove menu items"
        action={
          <button type="button" onClick={handleNew} className="btn-primary">
            <Plus className="w-4 h-4" /> Add Item
          </button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input icon={Search} type="text" placeholder="Search items..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="input-field w-36">
          <option value="All">All</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Menu Items Table */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Item</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Price</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Stock</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Available</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredItems.map((item, i) => (
                <motion.tr key={item._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt="" className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <Coffee className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.preparationTime} min prep</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="badge-neutral">{item.category}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">₹{item.price}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-sm ${item.stock <= 5 ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
                      {item.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block w-2 h-2 rounded-full ${item.availability ? 'bg-green-500' : 'bg-red-500'}`} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => handleEdit(item)} className="btn-ghost p-1.5">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(item._id, item.name)} className="btn-ghost p-1.5 text-red-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {filteredItems.length === 0 && !loading && (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500">No items found</p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)}
        title={editingItem ? 'Edit Menu Item' : 'Add Menu Item'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Name</label>
              <input type="text" required value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input-field" placeholder="Item name" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="input-field">
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Price (₹)</label>
              <input type="number" required min="0" step="0.5" value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="input-field" placeholder="0" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Prep Time (min)</label>
              <input type="number" required min="1" value={form.preparationTime}
                onChange={(e) => setForm({ ...form, preparationTime: e.target.value })}
                className="input-field" placeholder="10" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Stock</label>
              <input type="number" min="0" value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                className="input-field" placeholder="50" />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="input-field" rows={2} placeholder="Short description..." />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Image</label>
              <input type="file" accept="image/*"
                onChange={(e) => setImageFile(e.target.files[0])}
                className="input-field" />
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.availability}
                  onChange={(e) => setForm({ ...form, availability: e.target.checked })}
                  className="rounded" />
                <span className="text-sm">Available</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.isPopular}
                  onChange={(e) => setForm({ ...form, isPopular: e.target.checked })}
                  className="rounded" />
                <span className="text-sm">Popular</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : editingItem ? 'Update Item' : 'Create Item'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MenuManagement;
