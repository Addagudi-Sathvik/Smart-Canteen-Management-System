import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { fetchActiveOrder } from '../../store/slices/orderSlice';
import { fetchMenuItems } from '../../store/slices/menuSlice';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { staggerContainer, staggerItem } from '../../config/navigation';
import {
  ShoppingBag,
  Clock,
  Utensils,
  History,
  ChevronRight,
  Coffee,
  Pizza,
  CupSoda,
  Sandwich,
  Flame,
} from 'lucide-react';

const statusVariant = {
  confirmed: 'info',
  preparing: 'warning',
  ready: 'success',
  completed: 'neutral',
};

const StudentDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { activeOrder } = useSelector((state) => state.orders);
  const { items: menuItems } = useSelector((state) => state.menu);

  useEffect(() => {
    dispatch(fetchActiveOrder());
    dispatch(fetchMenuItems({ availability: 'true' }));
  }, [dispatch]);

  const quickActions = [
    { label: 'Order Food', icon: ShoppingBag, to: '/menu', gradient: 'from-brand-500 to-brand-600' },
    { label: 'Track Order', icon: Clock, to: '/orders/active', gradient: 'from-accent-500 to-accent-600' },
    { label: 'View Menu', icon: Utensils, to: '/menu', gradient: 'from-amber-500 to-orange-500' },
    { label: 'History', icon: History, to: '/orders/history', gradient: 'from-espresso-500 to-espresso-700' },
  ];

  const categories = [
    { name: 'Snacks', icon: Pizza, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
    { name: 'Meals', icon: Coffee, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { name: 'Drinks', icon: CupSoda, color: 'text-sky-500', bg: 'bg-sky-50 dark:bg-sky-900/20' },
    { name: 'Combos', icon: Sandwich, color: 'text-accent-600', bg: 'bg-accent-50 dark:bg-accent-900/20' },
  ];

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={staggerItem}>
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-brand-200/30 dark:bg-brand-800/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-brand-600 dark:text-brand-400">Good to see you</p>
              <h1 className="text-2xl sm:text-3xl font-bold text-espresso-900 dark:text-espresso-50 mt-1">
                Hey, {user?.name?.split(' ')[0]}!
              </h1>
              <p className="text-espresso-500 dark:text-espresso-400 mt-1">What would you like to eat today?</p>
            </div>
            {user?.avatar && (
              <img
                src={user.avatar}
                alt=""
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ring-2 ring-brand-200 dark:ring-brand-800 object-cover"
              />
            )}
          </div>
        </Card>
      </motion.div>

      {activeOrder && (
        <motion.div variants={staggerItem}>
          <Link to="/orders/active" className="block group">
            <div className="relative rounded-2xl p-6 bg-gradient-to-r from-brand-600 via-brand-500 to-brand-700 text-white shadow-elevated overflow-hidden card-hover">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NDEgMC0xOCA4LjA1OS0xOCAxOHM4LjA1OSAxOCAxOCAxOCAxOC04LjA1OSAxOC0xOC04LjA1OS0xOC0xOC0xOHoiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLW9wYWNpdHk9Ii4wNSIvPjwvZz48L3N2Zz4=')] opacity-30" />
              <div className="relative flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-brand-100">Active Order</span>
                <Badge variant={statusVariant[activeOrder.status] || 'info'}>{activeOrder.status}</Badge>
              </div>
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-3xl sm:text-4xl font-display font-bold tracking-wide">{activeOrder.orderId}</p>
                  <p className="text-brand-100 text-sm mt-1">
                    {activeOrder.items?.length} item{activeOrder.items?.length !== 1 ? 's' : ''} · ₹{activeOrder.totalAmount}
                  </p>
                </div>
                <ChevronRight className="w-6 h-6 text-white/70 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        </motion.div>
      )}

      <motion.div variants={staggerItem}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <Link key={action.label} to={action.to}>
              <motion.div className="glass rounded-2xl p-4 text-center card-hover" whileTap={{ scale: 0.98 }}>
                <div className={`w-11 h-11 bg-gradient-to-br ${action.gradient} rounded-xl flex items-center justify-center mx-auto mb-2 shadow-soft`}>
                  <action.icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-semibold text-espresso-700 dark:text-espresso-300">{action.label}</span>
              </motion.div>
            </Link>
          ))}
        </div>
      </motion.div>

      <motion.div variants={staggerItem}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-espresso-900 dark:text-espresso-50">Browse Categories</h2>
          <Link to="/menu" className="text-sm text-brand-600 dark:text-brand-400 font-semibold hover:underline">
            View All
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {categories.map((cat) => (
            <Link key={cat.name} to={`/menu?category=${cat.name}`}>
              <motion.div className={`${cat.bg} rounded-2xl p-4 card-hover border border-transparent hover:border-brand-200/50 dark:hover:border-brand-800/30`} whileTap={{ scale: 0.98 }}>
                <cat.icon className={`w-8 h-8 ${cat.color} mb-2`} />
                <h3 className="font-semibold text-espresso-900 dark:text-espresso-100">{cat.name}</h3>
                <p className="text-xs text-espresso-500 mt-1">
                  {menuItems.filter((i) => i.category === cat.name && i.availability).length} items
                </p>
              </motion.div>
            </Link>
          ))}
        </div>
      </motion.div>

      {menuItems.filter((i) => i.isPopular).length > 0 && (
        <motion.div variants={staggerItem}>
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-5 h-5 text-brand-500" />
            <h2 className="text-lg font-bold text-espresso-900 dark:text-espresso-50">Popular Items</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {menuItems.filter((i) => i.isPopular).slice(0, 4).map((menuItem) => (
              <Link key={menuItem._id} to="/menu">
                <Card hover padding="p-0" className="overflow-hidden">
                  <div className="h-28 bg-espresso-100 dark:bg-espresso-800 overflow-hidden">
                    {menuItem.imageUrl && (
                      <img src={menuItem.imageUrl} alt={menuItem.name} className="w-full h-full object-cover" loading="lazy" />
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-espresso-900 dark:text-espresso-100 text-sm truncate">{menuItem.name}</h3>
                    <p className="text-brand-600 dark:text-brand-400 font-bold mt-1">₹{menuItem.price}</p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default StudentDashboard;
