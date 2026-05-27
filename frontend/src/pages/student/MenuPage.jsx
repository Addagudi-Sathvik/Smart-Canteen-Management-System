import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchMenuItems } from '../../store/slices/menuSlice';
import { addToCart } from '../../store/slices/cartSlice';
import { CardSkeleton } from '../../components/ui/Skeleton';
import PageHeader from '../../components/ui/PageHeader';
import Input from '../../components/ui/Input';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';
import {
  Search,
  ShoppingCart,
  Clock,
  Check,
  Pizza,
  Coffee,
  CupSoda,
  Sandwich,
  X,
  UtensilsCrossed,
} from 'lucide-react';

const categories = [
  { name: 'All', icon: null },
  { name: 'Snacks', icon: Pizza },
  { name: 'Meals', icon: Coffee },
  { name: 'Drinks', icon: CupSoda },
  { name: 'Combos', icon: Sandwich },
];

const FoodImage = ({ src, alt }) => {
  const [hasError, setHasError] = useState(false);
  if (!src || hasError) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-brand-50 to-brand-100 dark:from-espresso-800 dark:to-espresso-900">
        <Coffee className="w-10 h-10 text-brand-300 dark:text-brand-700" />
      </div>
    );
  }
  return (
    <img src={src} alt={alt} className="w-full h-full object-cover" loading="lazy" onError={() => setHasError(true)} />
  );
};

const MenuPage = () => {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const { items, loading } = useSelector((state) => state.menu);
  const [localSearch, setLocalSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || 'All');
  const [addedItems, setAddedItems] = useState({});

  useEffect(() => {
    const params = {};
    if (activeCategory && activeCategory !== 'All') params.category = activeCategory;
    if (localSearch) params.search = localSearch;
    dispatch(fetchMenuItems(params));
  }, [dispatch, activeCategory, localSearch]);

  const filteredItems = items.filter((item) => {
    if (activeCategory !== 'All' && item.category !== activeCategory) return false;
    if (localSearch) {
      const q = localSearch.toLowerCase();
      return item.name.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q);
    }
    return true;
  });

  const handleAddToCart = (menuItem) => {
    if (!menuItem.availability) {
      toast.error(`${menuItem.name} is currently unavailable`);
      return;
    }
    if (menuItem.stock <= 0) {
      toast.error(`${menuItem.name} is out of stock`);
      return;
    }

    dispatch(addToCart({
      menuItem: menuItem._id,
      name: menuItem.name,
      price: menuItem.price,
    }));

    setAddedItems((prev) => ({ ...prev, [menuItem._id]: true }));
    setTimeout(() => setAddedItems((prev) => ({ ...prev, [menuItem._id]: false })), 1500);
    toast.success(`${menuItem.name} added to cart!`, { duration: 2000 });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Menu" subtitle="Choose from our delicious selection" />

      <div className="relative">
        <Input
          icon={Search}
          type="text"
          placeholder="Search menu items..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="pr-10"
        />
        {localSearch && (
          <button
            type="button"
            onClick={() => setLocalSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-espresso-400 hover:text-espresso-600 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const active = activeCategory === cat.name;
          return (
            <button
              key={cat.name}
              type="button"
              onClick={() => setActiveCategory(cat.name)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all min-h-[44px] ${
                active
                  ? 'bg-brand-600 text-white shadow-soft'
                  : 'glass text-espresso-600 dark:text-espresso-400 hover:bg-brand-50 dark:hover:bg-espresso-800'
              }`}
            >
              {Icon && <Icon className="w-4 h-4" />}
              {cat.name}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : filteredItems.length === 0 ? (
        <EmptyState
          icon={UtensilsCrossed}
          title="No items found"
          description="Try a different category or search term"
          actionLabel="View All Menu"
          onAction={() => { setActiveCategory('All'); setLocalSearch(''); }}
        />
      ) : (
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
          }}
        >
          <AnimatePresence mode="popLayout">
            {filteredItems.map((menuItem) => (
              <motion.div
                key={menuItem._id}
                layout
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                className={`glass rounded-2xl overflow-hidden card-hover ${!menuItem.availability ? 'opacity-60' : ''}`}
              >
                <div className="h-32 sm:h-36 relative overflow-hidden">
                  <FoodImage src={menuItem.imageUrl} alt={menuItem.name} />
                  {!menuItem.availability && (
                    <div className="absolute inset-0 bg-espresso-950/50 flex items-center justify-center">
                      <span className="text-white font-semibold text-xs bg-tomato-500 px-2.5 py-1 rounded-lg">Unavailable</span>
                    </div>
                  )}
                  {menuItem.isPopular && menuItem.availability && (
                    <span className="absolute top-2 left-2 text-[10px] bg-brand-500 text-white px-2 py-0.5 rounded-full font-bold">Popular</span>
                  )}
                </div>

                <div className="p-3 sm:p-4 space-y-2">
                  <h3 className="font-semibold text-espresso-900 dark:text-espresso-100 text-sm truncate">{menuItem.name}</h3>
                  {menuItem.description && (
                    <p className="text-xs text-espresso-500 line-clamp-1">{menuItem.description}</p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-espresso-500">
                    <Clock className="w-3 h-3" />
                    <span>{menuItem.preparationTime} min</span>
                    {menuItem.stock <= 5 && menuItem.stock > 0 && (
                      <span className="text-brand-600 font-medium">· {menuItem.stock} left</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-lg font-bold text-brand-600 dark:text-brand-400">₹{menuItem.price}</span>
                    <motion.button
                      type="button"
                      onClick={() => handleAddToCart(menuItem)}
                      disabled={!menuItem.availability || menuItem.stock <= 0}
                      whileTap={{ scale: 0.88 }}
                      animate={addedItems[menuItem._id] ? { scale: [1, 1.2, 1] } : {}}
                      className={`min-h-[44px] min-w-[44px] p-2.5 rounded-xl transition-colors flex items-center justify-center ${
                        addedItems[menuItem._id]
                          ? 'bg-accent-500 text-white'
                          : menuItem.availability && menuItem.stock > 0
                          ? 'bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 hover:bg-brand-200'
                          : 'bg-espresso-100 dark:bg-espresso-800 text-espresso-400 cursor-not-allowed'
                      }`}
                      aria-label={`Add ${menuItem.name} to cart`}
                    >
                      {addedItems[menuItem._id] ? <Check className="w-5 h-5" /> : <ShoppingCart className="w-5 h-5" />}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};

export default MenuPage;
