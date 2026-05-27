import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { fetchMenuItems, toggleItemAvailability } from '../../store/slices/menuSlice';
import toast from 'react-hot-toast';
import PageHeader from '../../components/ui/PageHeader';
import Input from '../../components/ui/Input';
import EmptyState from '../../components/ui/EmptyState';
import { Package, Search, ToggleLeft, ToggleRight, Coffee } from 'lucide-react';

const StaffInventory = () => {
  const dispatch = useDispatch();
  const { items, loading } = useSelector((state) => state.menu);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    dispatch(fetchMenuItems());
  }, [dispatch]);

  const handleToggle = async (id, name) => {
    try {
      await dispatch(toggleItemAvailability(id)).unwrap();
      toast.success(`"${name}" availability toggled`);
    } catch (error) {
      toast.error(error || 'Failed to toggle availability');
    }
  };

  const filtered = items.filter(
    (item) => !searchQuery || item.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader title="Inventory" subtitle="Manage menu item availability" />

      <div className="glass rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-brand-200/40 dark:border-brand-800/30">
          <Input
            icon={Search}
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="divide-y divide-espresso-100 dark:divide-espresso-800">
          {filtered.map((item, index) => (
            <motion.div
              key={item._id}
              className="flex items-center justify-between gap-4 p-4 hover:bg-brand-50/30 dark:hover:bg-espresso-800/30 transition-colors"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.02 }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 bg-espresso-100 dark:bg-espresso-800 rounded-xl overflow-hidden flex-shrink-0">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Coffee className="w-5 h-5 text-espresso-400" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-espresso-900 dark:text-espresso-100 truncate">{item.name}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-espresso-500 mt-0.5">
                    <span className="bg-brand-100 dark:bg-brand-900/30 px-2 py-0.5 rounded-lg font-medium">{item.category}</span>
                    <span>₹{item.price}</span>
                    <span>{item.stock} in stock</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleToggle(item._id, item.name)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all min-h-[44px] shrink-0 ${
                  item.availability
                    ? 'bg-accent-100 text-accent-800 dark:bg-accent-900/30 dark:text-accent-300'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}
              >
                {item.availability ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                {item.availability ? 'Available' : 'Off'}
              </button>
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && !loading && (
          <EmptyState icon={Package} title="No menu items found" description="Try a different search term" />
        )}
      </div>
    </div>
  );
};

export default StaffInventory;
