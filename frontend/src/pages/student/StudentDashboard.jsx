import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { fetchActiveOrder } from '../../store/slices/orderSlice';
import { fetchMenuItems } from '../../store/slices/menuSlice';
import Card from '../../components/ui/Card';
import OrderStatusBadge from '../../components/orders/OrderStatusBadge';
import { staggerContainer, staggerItem } from '../../config/navigation';
import {
  ShoppingBag, Clock, Utensils, History,
  ChevronRight, Coffee, Pizza, CupSoda, Sandwich, Flame,
} from 'lucide-react';

// Maps status to a friendly message shown on the active order banner
const statusMessages = {
  confirmed: 'Your order has been received ✓',
  preparing: 'Chefs are cooking your food 🍳',
  ready:     'Ready for pickup — show your QR! 🎉',
};

const quickActions = [
  { label: 'Order Food',   icon: ShoppingBag, to: '/menu',            gradient: 'from-brand-500 to-brand-600',     emoji: '🛒' },
  { label: 'Track Order',  icon: Clock,       to: '/orders/active',   gradient: 'from-accent-500 to-accent-600',   emoji: '📍' },
  { label: 'View Menu',    icon: Utensils,    to: '/menu',            gradient: 'from-amber-500 to-orange-500',    emoji: '🍽️' },
  { label: 'History',      icon: History,     to: '/orders/history',  gradient: 'from-espresso-500 to-espresso-700', emoji: '📋' },
];

const categories = [
  { name: 'Snacks', emoji: '🍕', color: 'text-red-500',    bg: 'bg-red-50    dark:bg-red-900/20',    border: 'hover:border-red-200    dark:hover:border-red-800/40' },
  { name: 'Meals',  emoji: '🍛', color: 'text-amber-600',  bg: 'bg-amber-50  dark:bg-amber-900/20',  border: 'hover:border-amber-200  dark:hover:border-amber-800/40' },
  { name: 'Drinks', emoji: '🧃', color: 'text-sky-500',    bg: 'bg-sky-50    dark:bg-sky-900/20',    border: 'hover:border-sky-200    dark:hover:border-sky-800/40' },
  { name: 'Combos', emoji: '🥪', color: 'text-accent-600', bg: 'bg-accent-50 dark:bg-accent-900/20', border: 'hover:border-accent-200 dark:hover:border-accent-800/40' },
];

// Greeting based on time of day
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const StudentDashboard = () => {
  const dispatch = useDispatch();
  const { user }                    = useSelector((s) => s.auth);
  const { activeOrder }             = useSelector((s) => s.orders);
  const { items: menuItems }        = useSelector((s) => s.menu);

  useEffect(() => {
    dispatch(fetchActiveOrder());
    dispatch(fetchMenuItems({ availability: 'true' }));
  }, [dispatch]);

  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-6">

      {/* ── Greeting card ──────────────────────────────────────── */}
      <motion.div variants={staggerItem}>
        <div className="relative rounded-3xl overflow-hidden p-6 sm:p-8"
          style={{ background: 'linear-gradient(135deg, #FEF3C7 0%, #FFFBEB 60%, #ECFDF5 100%)' }}
        >
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-brand-200/40 blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-32 h-32 rounded-full bg-accent-200/30 blur-2xl translate-y-1/2 pointer-events-none" />

          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-brand-600 uppercase tracking-[0.18em] mb-1">
                {getGreeting()}
              </p>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-espresso-900 leading-tight">
                Hey, {firstName}! 👋
              </h1>
              <p className="text-espresso-500 text-sm mt-2">
                What are you craving today?
              </p>
            </div>
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt=""
                className="w-14 h-14 rounded-2xl ring-2 ring-brand-300 ring-offset-2 ring-offset-brand-50 object-cover shadow-soft flex-shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-brand-100 flex items-center justify-center text-2xl flex-shrink-0 shadow-soft">
                😊
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── Active order banner ─────────────────────────────────── */}
      {activeOrder && (
        <motion.div
          variants={staggerItem}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Link to="/orders/active" className="block group">
            <div
              className="relative rounded-3xl p-5 sm:p-6 text-white overflow-hidden shadow-elevated card-hover"
              style={{ background: 'linear-gradient(135deg, #B45309 0%, #D97706 50%, #F59E0B 100%)' }}
            >
              {/* Animated shimmer */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-700" />
              </div>

              {/* Dot pattern */}
              <div
                className="absolute inset-0 opacity-[0.07] pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }}
              />

              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <motion.div
                      className="w-2 h-2 bg-white rounded-full"
                      animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <span className="text-xs font-bold text-brand-100 uppercase tracking-widest">Active Order</span>
                  </div>
                  <OrderStatusBadge status={activeOrder.status} />
                </div>

                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-3xl sm:text-4xl font-display font-bold tracking-wide">
                      {activeOrder.orderId}
                    </p>
                    <p className="text-brand-100 text-sm mt-1">
                      {activeOrder.items?.length} item{activeOrder.items?.length !== 1 ? 's' : ''} · ₹{activeOrder.totalAmount}
                      {activeOrder.pickupSlot && (
                        <> · <span className="font-semibold text-white">🕐 {activeOrder.pickupSlot}</span></>
                      )}
                    </p>
                    {statusMessages[activeOrder.status] && (
                      <p className="text-brand-200 text-xs mt-1.5 font-medium">
                        {statusMessages[activeOrder.status]}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="w-6 h-6 text-white/60 group-hover:translate-x-1.5 transition-transform duration-200 flex-shrink-0" />
                </div>
              </div>
            </div>
          </Link>
        </motion.div>
      )}

      {/* ── Quick actions ───────────────────────────────────────── */}
      <motion.div variants={staggerItem}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((action, i) => (
            <Link key={action.label} to={action.to}>
              <motion.div
                className="glass rounded-2xl p-4 text-center card-hover border border-transparent hover:border-brand-200/50 dark:hover:border-brand-800/30 group"
                whileTap={{ scale: 0.96 }}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.06 }}
              >
                <div className={`w-12 h-12 bg-gradient-to-br ${action.gradient} rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-soft group-hover:scale-110 transition-transform duration-200`}>
                  <span className="text-xl">{action.emoji}</span>
                </div>
                <span className="text-sm font-semibold text-espresso-700 dark:text-espresso-300">
                  {action.label}
                </span>
              </motion.div>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* ── Browse categories ───────────────────────────────────── */}
      <motion.div variants={staggerItem}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-display font-bold text-espresso-900 dark:text-espresso-50">Browse Categories</h2>
          <Link
            to="/menu"
            className="text-sm text-brand-600 dark:text-brand-400 font-semibold hover:text-brand-700 transition-colors flex items-center gap-1"
          >
            View All <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {categories.map((cat, i) => (
            <Link key={cat.name} to={`/menu?category=${cat.name}`}>
              <motion.div
                className={`${cat.bg} rounded-2xl p-4 card-hover border border-transparent ${cat.border} transition-colors`}
                whileTap={{ scale: 0.97 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.07 }}
              >
                <span className="text-3xl mb-2 block">{cat.emoji}</span>
                <h3 className="font-display font-bold text-espresso-900 dark:text-espresso-100">{cat.name}</h3>
                <p className="text-xs text-espresso-500 mt-0.5">
                  {menuItems.filter((item) => item.category === cat.name && item.availability).length} available
                </p>
              </motion.div>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* ── Popular items ───────────────────────────────────────── */}
      {menuItems.filter((i) => i.isPopular).length > 0 && (
        <motion.div variants={staggerItem}>
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-5 h-5 text-brand-500" />
            <h2 className="text-lg font-display font-bold text-espresso-900 dark:text-espresso-50">Popular Today</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {menuItems.filter((i) => i.isPopular).slice(0, 4).map((menuItem, idx) => (
              <Link key={menuItem._id} to="/menu">
                <motion.div
                  className="glass rounded-2xl overflow-hidden card-hover"
                  whileTap={{ scale: 0.97 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * idx }}
                >
                  <div className="h-28 bg-espresso-100 dark:bg-espresso-800 overflow-hidden relative">
                    {menuItem.imageUrl ? (
                      <img
                        src={menuItem.imageUrl}
                        alt={menuItem.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-4xl">🍽️</div>
                    )}
                    <span className="absolute top-2 left-2 text-[10px] bg-brand-500 text-white px-2 py-0.5 rounded-full font-bold shadow">
                      Popular
                    </span>
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-espresso-900 dark:text-espresso-100 text-sm truncate">
                      {menuItem.name}
                    </h3>
                    <p className="text-brand-600 dark:text-brand-400 font-bold text-sm mt-1">
                      ₹{menuItem.price}
                    </p>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default StudentDashboard;