import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { fetchMyOrders, reorder } from '../../store/slices/orderSlice';
import toast from 'react-hot-toast';
import PageHeader from '../../components/ui/PageHeader';
import EmptyState from '../../components/ui/EmptyState';
import OrderStatusBadge from '../../components/orders/OrderStatusBadge';
import { ListSkeleton } from '../../components/ui/Skeleton';
import { History, RotateCcw, Clock } from 'lucide-react';

const OrderHistory = () => {
  const dispatch = useDispatch();
  const { orders, loading } = useSelector((state) => state.orders);

  useEffect(() => {
    dispatch(fetchMyOrders());
  }, [dispatch]);

  const handleReorder = async (orderId) => {
    try {
      const result = await dispatch(reorder(orderId)).unwrap();
      if (result.order) toast.success('Order placed again!');
    } catch (error) {
      toast.error(error || 'Failed to reorder');
    }
  };

  const formatDate = (date) => {
    const d = new Date(date);
    const diff = Date.now() - d;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader title="Order History" subtitle="View and reorder from your past orders" />

      {loading ? (
        <ListSkeleton count={4} />
      ) : orders.length === 0 ? (
        <EmptyState
          icon={History}
          title="No orders yet"
          description="Your order history will appear here after your first order"
        />
      ) : (
        <div className="space-y-3">
          {orders.map((order, index) => (
            <motion.div
              key={order._id}
              className="glass rounded-2xl p-4 sm:p-5 card-hover"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-lg font-display font-bold text-espresso-900 dark:text-espresso-50">{order.orderId}</span>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <p className="text-sm text-espresso-500 truncate">
                    {order.items?.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-espresso-500">
                    <span className="font-bold text-brand-600">₹{order.totalAmount}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(order.createdAt)}</span>
                    <span>{order.items?.length || 0} items</span>
                  </div>
                </div>
                {order.status !== 'cancelled' && (
                  <button
                    type="button"
                    onClick={() => handleReorder(order._id)}
                    className="btn-ghost shrink-0"
                    title="Reorder"
                    aria-label="Reorder"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
