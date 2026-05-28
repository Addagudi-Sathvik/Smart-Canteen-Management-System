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
import { Search, ShoppingCart, Check, X, UtensilsCrossed } from 'lucide-react';

const categories = [
  { name: 'All',    emoji: '✨' },
  { name: 'Snacks', emoji: '🍕' },
  { name: 'Meals',  emoji: '🍛' },
  { name: 'Drinks', emoji: '🧃' },
  { name: 'Combos', emoji: '🥪' },
];

// Food card image with graceful fallback
const FoodImage = ({ src, alt }) => {
  const [hasError, setHasError] = useState(false);
  if (!src || hasError) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-brand-50 to-brand-100 dark:from-espresso-800 dark:to-espresso-900">
        <span className="text-4xl opacity-40">🍽️</span>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
      loading="lazy"
      onError={() => setHasError(true)}
    />
  );
};

// Individual food card
const FoodCard = ({ menuItem, isAdded, onAdd }) => {
  const unavailable = !menuItem.availability || menuItem.stock <= 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.93 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.93 }}
      className={`group glass rounded-2xl overflow-hidden card-hover ${unavailable ? 'opacity-60' : ''}`}
    >
      {/* Image */}
      <div className="h-32 sm:h-36 relative overflow-hidden bg-espresso-100 dark:bg-espresso-800">
        <FoodImage src={menuItem.imageUrl} alt={menuItem.name} />

        {/* Overlay badges */}
        {unavailable && (
          <div className="absolute inset-0 bg-espresso-950/50 flex items-center justify-center">
            <span className="text-white font-semibold text-xs bg-tomato-500 px-3 py-1 rounded-full shadow">
              {menuItem.stock <= 0 ? 'Out of Stock' : 'Unavailable'}
            </span>
          </div>
        )}
        {menuItem.isPopular && !unavailable && (
          <div className="absolute top-2 left-2">
            <span className="text-[10px] bg-brand-500 text-white px-2.5 py-1 rounded-full font-bold shadow-soft">
              🔥 Popular
            </span>
          </div>
        )}
        {menuItem.stock <= 5 && menuItem.stock > 0 && menuItem.availability && (
          <div className="absolute top-2 right-2">
            <span className="text-[10px] bg-espresso-900/80 text-white px-2 py-0.5 rounded-full font-medium">
              {menuItem.stock} left
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 sm:p-4 space-y-2">
        <h3 className="font-display font-semibold text-espresso-900 dark:text-espresso-100 text-sm truncate leading-snug">
          {menuItem.name}
        </h3>
        {menuItem.description && (
          <p className="text-xs text-espresso-400 line-clamp-1 leading-relaxed">
            {menuItem.description}
          </p>
        )}

        {/* Price + Add button */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <span className="text-lg font-display font-bold text-brand-600 dark:text-brand-400">
              ₹{menuItem.price}
            </span>
          </div>

          <motion.button
            type="button"
            onClick={() => onAdd(menuItem)}
            disabled={unavailable}
            whileTap={!unavailable ? { scale: 0.85 } : {}}
            animate={isAdded ? { scale: [1, 1.25, 1] } : {}}
            className={`min-h-[44px] min-w-[44px] p-2.5 rounded-xl transition-all duration-200 flex items-center justify-center ${
              isAdded
                ? 'bg-accent-500 text-white shadow-soft'
                : unavailable
                ? 'bg-espresso-100 dark:bg-espresso-800 text-espresso-300 cursor-not-allowed'
                : 'bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 hover:bg-brand-500 hover:text-white'
            }`}
            aria-label={`Add ${menuItem.name} to cart`}
          >
            {isAdded
              ? <Check className="w-5 h-5" />
              : <ShoppingCart className="w-5 h-5" />
            }
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

const MenuPage = () => {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const { items, loading } = useSelector((s) => s.menu);
  const [localSearch, setLocalSearch]     = useState('');
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || 'All');
  const [addedItems, setAddedItems]       = useState({});

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
    if (!menuItem.availability) { toast.error(`${menuItem.name} is currently unavailable`); return; }
    if (menuItem.stock <= 0)    { toast.error(`${menuItem.name} is out of stock`); return; }

    dispatch(addToCart({ menuItem: menuItem._id, name: menuItem.name, price: menuItem.price }));
    setAddedItems((prev) => ({ ...prev, [menuItem._id]: true }));
    setTimeout(() => setAddedItems((prev) => ({ ...prev, [menuItem._id]: false })), 1500);
    toast.success(`${menuItem.name} added!`, { duration: 2000 });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Menu" subtitle="Choose from our delicious selection" />

      {/* Search bar */}
      <div className="relative">
        <Input
          icon={Search}
          type="text"
          placeholder="Search menu items..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="pr-10"
        />
        <AnimatePresence>
          {localSearch && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              type="button"
              onClick={() => setLocalSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-espresso-400 hover:text-espresso-700 dark:hover:text-espresso-200 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-espresso-100 dark:hover:bg-espresso-800 transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
        {categories.map((cat) => {
          const active = activeCategory === cat.name;
          return (
            <motion.button
              key={cat.name}
              type="button"
              onClick={() => setActiveCategory(cat.name)}
              whileTap={{ scale: 0.94 }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all min-h-[44px] border ${
                active
                  ? 'bg-brand-600 text-white border-brand-600 shadow-soft'
                  : 'glass text-espresso-600 dark:text-espresso-400 border-transparent hover:border-brand-200/60 dark:hover:border-brand-800/40 hover:bg-brand-50 dark:hover:bg-espresso-800'
              }`}
            >
              <span className="text-base leading-none">{cat.emoji}</span>
              {cat.name}
              {cat.name !== 'All' && !active && (
                <span className="text-xs bg-espresso-100 dark:bg-espresso-800 text-espresso-500 px-1.5 py-0.5 rounded-full font-medium">
                  {items.filter((i) => i.category === cat.name).length}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Grid */}
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
        <>
          {/* Result count */}
          <AnimatePresence mode="wait">
            <motion.p
              key={`${activeCategory}-${localSearch}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xs text-espresso-400 font-medium"
            >
              {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
              {activeCategory !== 'All' && ` in ${activeCategory}`}
              {localSearch && ` for "${localSearch}"`}
            </motion.p>
          </AnimatePresence>

          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
            initial="hidden"
            animate="visible"
            variants={{
              hidden:  { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
            }}
          >
            <AnimatePresence mode="popLayout">
              {filteredItems.map((menuItem) => (
                <FoodCard
                  key={menuItem._id}
                  menuItem={menuItem}
                  isAdded={!!addedItems[menuItem._id]}
                  onAdd={handleAddToCart}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </div>
  );
};

export default MenuPage;