import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { adminAPI } from '../../utils/api';
import { connectSocket } from '../../utils/socket';
import { updateOrderFromSocket, addOrderFromSocket } from '../../store/slices/orderSlice';
import { useDispatch } from 'react-redux';
import PageHeader from '../../components/ui/PageHeader';
import OrderStatusBadge from '../../components/orders/OrderStatusBadge';
import AdminOrderActionButton from '../../components/admin/AdminOrderActionButton';
import { getStatusTheme } from '../../utils/orderStatus';
import { ClipboardList, QrCode, RefreshCw } from 'lucide-react';

const AdminLiveOrders = () => {
  const dispatch = useDispatch();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = useCallback(async () => {
    try {
      const { data } = await adminAPI.getActiveOrders();
      setOrders(data.orders || []);
    } catch {
      toast.error('Failed to load active orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    const socket = connectSocket();
    socket.emit('join:role', 'admin');
    socket.emit('join:staff');

    const upsert = (order) => {
      if (!order) return;
      dispatch(updateOrderFromSocket(order));
      if (['pending', 'confirmed', 'preparing', 'ready'].includes(order.status)) {
        setOrders((prev) => {
          const idx = prev.findIndex((o) => o._id === order._id);
          if (idx === -1) return [...prev, order].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
          const next = [...prev];
          next[idx] = order;
          return next;
        });
      } else {
        setOrders((prev) => prev.filter((o) => o._id !== order._id));
      }
    };

    const onNew = (order) => {
      dispatch(addOrderFromSocket(order));
      upsert(order);
    };

    socket.on('order:statusUpdate', upsert);
    socket.on('order:new', onNew);
    socket.on('newOrderPlaced', onNew);

    return () => {
      socket.off('order:statusUpdate', upsert);
      socket.off('order:new', onNew);
      socket.off('newOrderPlaced', onNew);
    };
  }, [dispatch]);

  const mergeOrder = (order) => {
    if (!order) return;
    if (['pending', 'confirmed', 'preparing', 'ready'].includes(order.status)) {
      setOrders((prev) => {
        const idx = prev.findIndex((o) => o._id === order._id);
        if (idx === -1) {
          return [...prev, order].sort(
            (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
          );
        }
        const next = [...prev];
        next[idx] = order;
        return next;
      });
    } else {
      setOrders((prev) => prev.filter((o) => o._id !== order._id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <PageHeader
          title="Live Order Monitor"
          subtitle="Advance orders one step at a time — pickup completes via QR scan"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={loadOrders}
            className="btn-secondary flex items-center gap-2 min-h-[44px]"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link to="/admin/pickup" className="btn-primary flex items-center gap-2 min-h-[44px]">
            <QrCode className="w-4 h-4" />
            Scan pickup
          </Link>
        </div>
      </div>

      {loading && orders.length === 0 ? (
        <p className="text-center text-espresso-500 py-16">Loading queue…</p>
      ) : orders.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <ClipboardList className="w-12 h-12 mx-auto text-espresso-300 mb-3" />
          <p className="font-semibold text-espresso-700 dark:text-espresso-300">Kitchen clear</p>
          <p className="text-sm text-espresso-500 mt-1">No active orders in the queue</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {orders.map((order) => {
              const theme = getStatusTheme(order.status);
              const isReady = order.status === 'ready';

              return (
                <motion.div
                  key={order._id}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`glass rounded-2xl p-4 border-2 ${
                    isReady
                      ? 'border-emerald-400 dark:border-emerald-600 shadow-[0_0_20px_rgba(16,185,129,0.25)] animate-pulse-slow'
                      : order.status === 'confirmed'
                      ? 'border-amber-300 dark:border-amber-700'
                      : order.status === 'preparing'
                      ? 'border-orange-300 dark:border-orange-700'
                      : 'border-espresso-100 dark:border-espresso-800'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <div>
                      <p className="text-xl font-display font-bold">{order.orderId}</p>
                      <p className="text-sm text-espresso-500">
                        {order.userId?.name || 'Walk-in / Counter'}
                      </p>
                    </div>
                    <OrderStatusBadge status={order.status} />
                  </div>

                  <ul className="text-sm text-espresso-600 dark:text-espresso-400 space-y-0.5 mb-3">
                    {order.items?.map((item, i) => (
                      <li key={i}>
                        {item.quantity}× {item.name}
                      </li>
                    ))}
                  </ul>

                  <div className="flex justify-between text-sm mb-4">
                    <span className="text-espresso-500">Pickup {order.pickupSlot}</span>
                    <span className="font-bold text-brand-600">₹{order.totalAmount}</span>
                  </div>

                  {order.paymentStatus !== 'paid' && order.status === 'pending' && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mb-2 font-medium">
                      Awaiting payment before kitchen steps
                    </p>
                  )}

                  <AdminOrderActionButton order={order} onUpdated={mergeOrder} />

                  {isReady && (
                    <p className={`text-xs text-center mt-2 font-medium ${theme.iconColor}`}>
                      Use Pickup QR scan to complete collection
                    </p>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default AdminLiveOrders;
