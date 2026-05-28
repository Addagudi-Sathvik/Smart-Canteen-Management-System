import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { fetchAllOrders, updateOrderStatus } from '../../store/slices/orderSlice';
import { connectSocket } from '../../utils/socket';
import PageHeader from '../../components/ui/PageHeader';
import Input from '../../components/ui/Input';
import OrderStatusBadge from '../../components/orders/OrderStatusBadge';
import {
  getSelectableStatuses,
  STATUS_LABELS,
  STAFF_STATUS_OPTIONS,
} from '../../utils/orderStatus';
import { Search, RefreshCw, ShoppingBag, Clock } from 'lucide-react';

const FILTER_TABS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'ready', label: 'Ready for Pickup' },
  { value: 'completed', label: 'Completed' },
];

const formatOrderTime = (date) =>
  new Date(date).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const itemsSummary = (items) =>
  items?.map((i) => `${i.quantity}× ${i.name}`).join(', ') || '—';

const StaffOrders = () => {
  const dispatch = useDispatch();
  const { allOrders, loading } = useSelector((state) => state.orders);
  const [search, setSearch] = useState('');
  const [listFilter, setListFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);

  const loadOrders = useCallback(() => {
    const params = listFilter === 'all' ? {} : { filter: listFilter };
    dispatch(fetchAllOrders(params));
  }, [dispatch, listFilter]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    const socket = connectSocket();
    socket.emit('join:staff');

    const onStatusUpdate = () => loadOrders();
    const onNewOrder = () => loadOrders();

    socket.on('order:statusUpdate', onStatusUpdate);
    socket.on('order:new', onNewOrder);

    return () => {
      socket.off('order:statusUpdate', onStatusUpdate);
      socket.off('order:new', onNewOrder);
    };
  }, [loadOrders]);

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      await dispatch(updateOrderStatus({ id: orderId, status: newStatus })).unwrap();
      toast.success(`Status updated to ${STATUS_LABELS[newStatus] || newStatus}`);
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = allOrders.filter((order) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      order.orderId?.toLowerCase().includes(q) ||
      order.userId?.name?.toLowerCase().includes(q)
    );
  });

  const renderStatusSelect = (order) => {
    const options = getSelectableStatuses(order);
    const isUpdating = updatingId === order._id;

    if (order.status === 'completed' || order.status === 'cancelled') {
      return <OrderStatusBadge status={order.status} />;
    }

    if (order.paymentStatus !== 'paid') {
      return (
        <span className="text-xs font-medium text-espresso-500 dark:text-espresso-400">
          Awaiting payment
        </span>
      );
    }

    if (options.length === 0) {
      return <OrderStatusBadge status={order.status} />;
    }

    return (
      <select
        value={order.status}
        disabled={isUpdating}
        onChange={(e) => {
          const next = e.target.value;
          if (next !== order.status) {
            handleStatusChange(order._id, next);
          }
        }}
        className="input-field text-sm py-2 min-h-[40px] w-full max-w-[180px] disabled:opacity-60"
        aria-label={`Update status for ${order.orderId}`}
      >
        <option value={order.status} disabled>
          {STATUS_LABELS[order.status]} (current)
        </option>
        {STAFF_STATUS_OPTIONS.filter((opt) =>
          options.some((o) => o.value === opt.value)
        ).map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <PageHeader
          title="Orders"
          subtitle="Manage order status and pickup lifecycle"
        />
        <button
          type="button"
          onClick={loadOrders}
          disabled={loading}
          className="btn-secondary text-sm self-start sm:self-center flex items-center gap-2 min-h-[44px]"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setListFilter(tab.value)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold min-h-[40px] transition-colors ${
              listFilter === tab.value
                ? 'bg-brand-500 text-white shadow-soft'
                : 'bg-white dark:bg-espresso-900 text-espresso-600 dark:text-espresso-400 border border-espresso-100 dark:border-espresso-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="max-w-md">
        <Input
          icon={Search}
          placeholder="Search Order ID or student name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Desktop table */}
      <div className="hidden md:block glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-brand-200/40 dark:border-brand-800/30 bg-brand-50/40 dark:bg-espresso-900/40">
                <th className="text-left px-4 py-3 text-xs font-semibold text-espresso-500 uppercase">
                  Order ID
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-espresso-500 uppercase">
                  Student
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-espresso-500 uppercase">
                  Items
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-espresso-500 uppercase">
                  Total
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-espresso-500 uppercase">
                  Order Time
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-espresso-500 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-espresso-100 dark:divide-espresso-800">
              {loading && filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-espresso-500">
                    Loading orders…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-espresso-500">
                    No orders found
                  </td>
                </tr>
              ) : (
                filtered.map((order, i) => (
                  <motion.tr
                    key={order._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="hover:bg-brand-50/30 dark:hover:bg-espresso-800/30"
                  >
                    <td className="px-4 py-3 font-bold text-espresso-900 dark:text-espresso-100">
                      {order.orderId}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {order.userId?.name || 'Unknown'}
                    </td>
                    <td className="px-4 py-3 text-sm text-espresso-600 dark:text-espresso-400 max-w-[220px] truncate">
                      {itemsSummary(order.items)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-brand-600">
                      ₹{order.totalAmount}
                    </td>
                    <td className="px-4 py-3 text-sm text-espresso-500">
                      {formatOrderTime(order.createdAt)}
                    </td>
                    <td className="px-4 py-3">{renderStatusSelect(order)}</td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {loading && filtered.length === 0 && (
          <p className="text-center text-espresso-500 py-8">Loading orders…</p>
        )}
        {!loading && filtered.length === 0 && (
          <p className="text-center text-espresso-500 py-8">No orders found</p>
        )}
        {filtered.map((order) => (
          <div
            key={order._id}
            className="glass rounded-2xl p-4 border border-espresso-100 dark:border-espresso-800"
          >
            <div className="flex justify-between items-start gap-2 mb-2">
              <div>
                <p className="font-display font-bold text-lg">{order.orderId}</p>
                <p className="text-sm text-espresso-600 dark:text-espresso-400">
                  {order.userId?.name || 'Unknown'}
                </p>
              </div>
              <p className="font-bold text-brand-600">₹{order.totalAmount}</p>
            </div>

            <p className="text-sm text-espresso-600 dark:text-espresso-400 mb-2 flex items-start gap-1">
              <ShoppingBag className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {itemsSummary(order.items)}
            </p>

            <p className="text-xs text-espresso-500 mb-3 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formatOrderTime(order.createdAt)}
              {order.pickupSlot && (
                <span className="ml-2 text-brand-600">· Pickup {order.pickupSlot}</span>
              )}
            </p>

            <div className="pt-2 border-t border-espresso-100 dark:border-espresso-800">
              <p className="text-xs font-semibold text-espresso-500 uppercase mb-2">
                Status
              </p>
              {renderStatusSelect(order)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StaffOrders;
