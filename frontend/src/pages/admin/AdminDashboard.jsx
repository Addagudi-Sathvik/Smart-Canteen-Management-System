import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { adminAPI } from '../../utils/api';
import { connectSocket } from '../../utils/socket';
import { StatsSkeleton } from '../../components/ui/Skeleton';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { STATUS_LABELS } from '../../utils/orderStatus';
import { staggerContainer, staggerItem } from '../../config/navigation';
import {
  ShoppingBag,
  Clock,
  Package,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  QrCode,
  UtensilsCrossed,
  Users,
  ChevronRight,
  ClipboardList,
} from 'lucide-react';

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
};

const statusVariant = {
  pending: 'neutral',
  confirmed: 'info',
  preparing: 'warning',
  ready: 'success',
  completed: 'neutral',
  cancelled: 'danger',
};

const quickActions = [
  {
    label: 'View All Orders',
    description: 'Browse and filter every order',
    icon: ClipboardList,
    to: '/admin/orders',
    gradient: 'from-brand-500 to-brand-600',
  },
  {
    label: 'Pickup Verification',
    description: 'Scan student QR at counter',
    icon: QrCode,
    to: '/admin/pickup',
    gradient: 'from-accent-500 to-emerald-600',
  },
  {
    label: 'Manage Menu',
    description: 'Items, prices & availability',
    icon: UtensilsCrossed,
    to: '/admin/menu',
    gradient: 'from-amber-500 to-orange-600',
  },
  {
    label: 'User Management',
    description: 'Students, staff & roles',
    icon: Users,
    to: '/admin/users',
    gradient: 'from-sky-500 to-indigo-600',
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

  // Real-time refresh when orders change
  useEffect(() => {
    const socket = connectSocket();
    socket.emit('join:role', 'admin');
    socket.emit('join:staff');

    let debounceTimer;
    const scheduleRefresh = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => fetchDashboard(true), 400);
    };

    socket.on('order:new', scheduleRefresh);
    socket.on('order:statusUpdate', scheduleRefresh);

    return () => {
      clearTimeout(debounceTimer);
      socket.off('order:new', scheduleRefresh);
      socket.off('order:statusUpdate', scheduleRefresh);
    };
  }, [fetchDashboard]);

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="h-24 rounded-3xl bg-brand-50/50 dark:bg-espresso-900/50 animate-pulse" />
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

  const { metrics, ordersByStatus, recentOrders = [], systemState } = data;
  const firstName = user?.name?.split(' ')[0] || 'Admin';

  const statCards = [
    {
      label: 'Total Orders Today',
      value: metrics.totalOrdersToday ?? 0,
      icon: ShoppingBag,
    },
    {
      label: 'Pending Orders',
      value: metrics.pendingOrders ?? 0,
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-900/25',
    },
    {
      label: 'Ready for Pickup',
      value: metrics.readyForPickup ?? ordersByStatus?.ready ?? 0,
      icon: Package,
      color: 'text-accent-600',
      bg: 'bg-accent-50 dark:bg-accent-900/25',
    },
    {
      label: 'Completed Today',
      value: metrics.completedToday ?? ordersByStatus?.completed ?? 0,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 dark:bg-emerald-900/25',
    },
    {
      label: 'Revenue Today',
      value: `₹${metrics.revenueToday ?? 0}`,
      icon: TrendingUp,
      color: 'text-brand-600',
      bg: 'bg-brand-50 dark:bg-brand-900/25',
    },
  ];

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Welcome */}
      <motion.div variants={staggerItem}>
        <div
          className="relative rounded-3xl overflow-hidden p-6 sm:p-8 border border-brand-200/50 dark:border-brand-800/30"
          style={{
            background:
              'linear-gradient(135deg, rgba(28,24,20,0.95) 0%, rgba(41,37,36,0.92) 50%, rgba(120,53,15,0.35) 100%)',
          }}
        >
          <div className="absolute top-0 right-0 w-56 h-56 rounded-full bg-brand-500/20 blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full bg-accent-500/15 blur-2xl translate-y-1/2 pointer-events-none" />

          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-brand-400 uppercase tracking-[0.2em] mb-1">
                {getGreeting()}
              </p>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">
                {firstName}!
              </h1>
              <p className="text-sm text-espresso-300 mt-1 flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 text-xs font-semibold border border-brand-500/30">
                  Admin
                </span>
                Canteen operations at a glance
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              {systemState?.orderingOpen ? (
                <span className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-accent-500/20 text-accent-300 border border-accent-500/30">
                  <CheckCircle2 className="w-4 h-4" />
                  Ordering open
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-tomato-500/20 text-tomato-300 border border-tomato-500/30">
                  <AlertCircle className="w-4 h-4" />
                  Ordering closed
                </span>
              )}
            </div>
          </div>
          {systemState?.message && (
            <p className="relative text-sm text-espresso-400 mt-4 border-t border-white/10 pt-4">
              {systemState.message}
            </p>
          )}
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        variants={staggerItem}
        className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4"
      >
        {statCards.map((card, i) => (
          <StatCard key={card.label} {...card} index={i} />
        ))}
      </motion.div>

      {/* Quick actions */}
      <motion.div variants={staggerItem}>
        <h2 className="text-lg font-bold text-espresso-900 dark:text-espresso-50 mb-3">
          Quick actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {quickActions.map((action, i) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.to}
                to={action.to}
                className="group glass rounded-2xl p-5 card-hover min-h-[120px] flex flex-col"
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center shadow-soft mb-3 group-hover:scale-105 transition-transform`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <p className="font-bold text-espresso-900 dark:text-espresso-50 flex items-center gap-1">
                  {action.label}
                  <ChevronRight className="w-4 h-4 text-espresso-400 group-hover:translate-x-0.5 transition-transform" />
                </p>
                <p className="text-sm text-espresso-500 dark:text-espresso-400 mt-1">
                  {action.description}
                </p>
              </Link>
            );
          })}
        </div>
      </motion.div>

      {/* Recent orders */}
      <motion.div variants={staggerItem}>
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="text-lg font-bold text-espresso-900 dark:text-espresso-50">
            Recent orders
          </h2>
          <Link
            to="/admin/orders"
            className="text-sm font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
          >
            View all
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <Card className="p-0 overflow-hidden">
          {recentOrders.length === 0 ? (
            <p className="text-center text-espresso-500 py-12">No orders yet</p>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-espresso-100 dark:border-espresso-800 bg-brand-50/30 dark:bg-espresso-900/40">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-espresso-500 uppercase">
                        Order
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-espresso-500 uppercase">
                        Student
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-espresso-500 uppercase">
                        Total
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-espresso-500 uppercase">
                        Time
                      </th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-espresso-500 uppercase">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-espresso-100 dark:divide-espresso-800">
                    {recentOrders.map((order, i) => (
                      <motion.tr
                        key={order._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className="hover:bg-brand-50/20 dark:hover:bg-espresso-800/30"
                      >
                        <td className="px-4 py-3 font-bold text-espresso-900 dark:text-espresso-100">
                          {order.orderId}
                        </td>
                        <td className="px-4 py-3 text-sm text-espresso-600 dark:text-espresso-400">
                          {order.userId?.name || '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-brand-600">
                          ₹{order.totalAmount}
                        </td>
                        <td className="px-4 py-3 text-sm text-espresso-500">
                          {formatTime(order.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={statusVariant[order.status] || 'neutral'}>
                            {STATUS_LABELS[order.status] || order.status}
                          </Badge>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile list */}
              <div className="md:hidden divide-y divide-espresso-100 dark:divide-espresso-800">
                {recentOrders.map((order) => (
                  <div key={order._id} className="p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-espresso-900 dark:text-espresso-100">
                        {order.orderId}
                      </p>
                      <p className="text-sm text-espresso-500 truncate">
                        {order.userId?.name || 'Unknown'} · {formatTime(order.createdAt)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-brand-600">₹{order.totalAmount}</p>
                      <Badge variant={statusVariant[order.status] || 'neutral'} className="mt-1">
                        {STATUS_LABELS[order.status] || order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default AdminDashboard;
