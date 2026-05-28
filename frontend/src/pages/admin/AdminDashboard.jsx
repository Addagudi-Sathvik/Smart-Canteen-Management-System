import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { adminAPI } from '../../utils/api';
import { connectSocket } from '../../utils/socket';
import { playOrderAlert } from '../../utils/playOrderAlert';
import toast from 'react-hot-toast';
import { StatsSkeleton } from '../../components/ui/Skeleton';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';
import OrderStatusBadge from '../../components/orders/OrderStatusBadge';
import { staggerContainer, staggerItem } from '../../config/navigation';
import {
  ShoppingBag,
  Clock,
  Package,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  UtensilsCrossed,
  History,
  Monitor,
  Store,
  ChevronRight,
} from 'lucide-react';

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
};

const hubCards = [
  {
    label: 'New Counter Order',
    description: 'Walk-in cash POS checkout',
    icon: Store,
    to: '/admin/counter',
    gradient: 'from-brand-500 to-amber-600',
    emoji: '🛒',
  },
  {
    label: 'Live Order Monitor',
    description: 'Real-time kitchen queue',
    icon: Monitor,
    to: '/admin/live-orders',
    gradient: 'from-orange-500 to-red-500',
    emoji: '👨‍🍳',
  },
  {
    label: 'Menu Manager',
    description: 'Inventory & pricing',
    icon: UtensilsCrossed,
    to: '/admin/menu',
    gradient: 'from-amber-500 to-orange-600',
    emoji: '📋',
  },
  {
    label: 'Past Order Logs',
    description: 'Searchable sales ledger',
    icon: History,
    to: '/admin/orders',
    gradient: 'from-espresso-600 to-espresso-800',
    emoji: '📊',
  },
];

const formatTime = (date) =>
  new Date(date).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const AdminDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data: result } = await adminAPI.getDashboard();
      setData(result);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    const socket = connectSocket();
    socket.emit('join:role', 'admin');
    socket.emit('join:staff');

    let debounceTimer;
    const scheduleRefresh = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => fetchDashboard(true), 400);
    };

    const onNewOrder = (order) => {
      playOrderAlert();
      scheduleRefresh();
      toast(
        (t) => (
          <div className="flex flex-col gap-2 max-w-sm">
            <p className="font-bold text-espresso-900 dark:text-espresso-50">
              New order — accept now
            </p>
            <p className="text-sm text-espresso-600 dark:text-espresso-400">
              <strong>{order.orderId}</strong>
              {order.totalAmount != null && ` · ₹${order.totalAmount}`}
            </p>
            <Link
              to="/admin/live-orders"
              className="text-sm font-semibold text-brand-600 hover:underline"
              onClick={() => toast.dismiss(t.id)}
            >
              Open live monitor →
            </Link>
          </div>
        ),
        { id: `admin-new-${order.orderId}`, duration: 12000 }
      );
    };

    socket.on('order:new', onNewOrder);
    socket.on('newOrderPlaced', onNewOrder);
    socket.on('order:statusUpdate', scheduleRefresh);

    return () => {
      clearTimeout(debounceTimer);
      socket.off('order:new', onNewOrder);
      socket.off('newOrderPlaced', onNewOrder);
      socket.off('order:statusUpdate', scheduleRefresh);
    };
  }, [fetchDashboard]);

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="h-28 rounded-3xl bg-brand-50/50 dark:bg-espresso-900/50 animate-pulse" />
        <StatsSkeleton />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-16 text-espresso-500">
        Failed to load dashboard data
      </div>
    );
  }

  const { metrics, recentOrders = [], systemState } = data;
  const firstName = user?.name?.split(' ')[0] || 'Admin';

  const kpiCards = [
    {
      label: "Today's Revenue",
      value: `₹${metrics.revenueToday ?? 0}`,
      icon: TrendingUp,
      color: 'text-brand-600',
      bg: 'bg-brand-50 dark:bg-brand-900/25',
    },
    {
      label: 'Active Orders',
      value: metrics.activeOrders ?? metrics.pendingOrders ?? 0,
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-900/25',
    },
    {
      label: 'Ready for Pickup',
      value: metrics.readyForPickup ?? 0,
      icon: Package,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 dark:bg-emerald-900/25',
    },
    {
      label: 'Menu Items',
      value: metrics.activeMenuItems ?? metrics.totalMenuItems ?? 0,
      icon: UtensilsCrossed,
      color: 'text-sky-600',
      bg: 'bg-sky-50 dark:bg-sky-900/25',
    },
  ];

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Greeting — admin hub */}
      <motion.div variants={staggerItem}>
        <div
          className="relative rounded-3xl overflow-hidden p-6 sm:p-8"
          style={{
            background:
              'linear-gradient(135deg, #FEF3C7 0%, #FFFBEB 55%, #ECFDF5 100%)',
          }}
        >
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-brand-200/50 blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-brand-600 uppercase tracking-[0.18em] mb-1">
                {getGreeting()}
              </p>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-espresso-900">
                Hey, {firstName}!
              </h1>
              <p className="text-sm text-espresso-600 mt-1 flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-espresso-900/10 text-xs font-semibold">
                  Admin
                </span>
                Canteen operations hub
              </p>
            </div>
            {systemState?.orderingOpen ? (
              <span className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-100 text-emerald-800 text-sm font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                Ordering open
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-red-100 text-red-800 text-sm font-semibold">
                <AlertCircle className="w-4 h-4" />
                Ordering closed
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Hub grid */}
      <motion.div variants={staggerItem}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {hubCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.to}
                to={card.to}
                className="group relative rounded-2xl overflow-hidden min-h-[130px] p-4 card-hover"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-95`}
                />
                <div className="relative text-white h-full flex flex-col">
                  <span className="text-2xl mb-2">{card.emoji}</span>
                  <Icon className="w-5 h-5 mb-1 opacity-90" />
                  <p className="font-bold text-sm sm:text-base leading-tight">{card.label}</p>
                  <p className="text-xs text-white/80 mt-1 flex-1">{card.description}</p>
                  <ChevronRight className="w-4 h-4 mt-2 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </motion.div>

      {/* KPI strip */}
      <motion.div
        variants={staggerItem}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
      >
        {kpiCards.map((card, i) => (
          <StatCard key={card.label} {...card} index={i} />
        ))}
      </motion.div>

      {/* Recent orders */}
      <motion.div variants={staggerItem}>
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="text-lg font-bold text-espresso-900 dark:text-espresso-50">
            Recent orders
          </h2>
          <Link
            to="/admin/live-orders"
            className="text-sm font-semibold text-brand-600 flex items-center gap-1"
          >
            Live monitor
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <Card className="p-0 overflow-hidden">
          {recentOrders.length === 0 ? (
            <p className="text-center text-espresso-500 py-10">No orders yet</p>
          ) : (
            <div className="divide-y divide-espresso-100 dark:divide-espresso-800">
              {recentOrders.slice(0, 6).map((order) => (
                <div
                  key={order._id}
                  className="flex items-center justify-between gap-3 p-4 hover:bg-brand-50/20 dark:hover:bg-espresso-800/20"
                >
                  <div className="min-w-0">
                    <p className="font-bold">{order.orderId}</p>
                    <p className="text-sm text-espresso-500 truncate">
                      {order.userId?.name || '—'} · {formatTime(order.createdAt)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-brand-600">₹{order.totalAmount}</p>
                    <OrderStatusBadge status={order.status} size="sm" className="mt-1" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default AdminDashboard;
