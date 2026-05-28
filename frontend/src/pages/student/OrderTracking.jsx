import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import QRCode from 'qrcode';
import { fetchActiveOrder, fetchMyOrders } from '../../store/slices/orderSlice';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import PageHeader from '../../components/ui/PageHeader';
import { ShoppingBag, ChefHat, Package, CheckCircle2, ArrowLeft, Clock, QrCode } from 'lucide-react';

const statusFlow = ['confirmed', 'preparing', 'ready', 'completed'];

const statusConfig = {
  confirmed: {
    icon: ShoppingBag,
    label: 'Order Confirmed',
    description: 'Your order has been received',
    color: 'text-sky-500',
    bg: 'bg-sky-100 dark:bg-sky-900/30',
    line: 'bg-sky-500',
  },
  preparing: {
    icon: ChefHat,
    label: 'Preparing',
    description: 'Our chefs are cooking your food',
    color: 'text-brand-500',
    bg: 'bg-brand-100 dark:bg-brand-900/30',
    line: 'bg-brand-500',
  },
  ready: {
    icon: Package,
    label: 'Ready for Pickup',
    description: 'Show your QR code at the counter',
    color: 'text-accent-500',
    bg: 'bg-accent-100 dark:bg-accent-900/30',
    line: 'bg-accent-500',
  },
  completed: {
    icon: CheckCircle2,
    label: 'Completed',
    description: 'Enjoy your meal!',
    color: 'text-espresso-500',
    bg: 'bg-espresso-100 dark:bg-espresso-800',
    line: 'bg-espresso-400',
  },
};

// ✅ QR Code display component — generates a canvas QR from orderId
const OrderQRCode = ({ orderId }) => {
  const canvasRef = useRef(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!canvasRef.current || !orderId) return;
    QRCode.toCanvas(canvasRef.current, orderId, {
      width: 180,
      margin: 2,
      color: { dark: '#1a0a00', light: '#fffbf5' }, // espresso on cream
    }, (err) => {
      if (err) setError(true);
    });
  }, [orderId]);

  if (error) {
    return (
      <p className="text-sm text-espresso-400 text-center">
        QR unavailable — show Order ID: <span className="font-bold">{orderId}</span>
      </p>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <canvas
        ref={canvasRef}
        className="rounded-2xl border-4 border-white dark:border-espresso-800 shadow-elevated"
      />
      <p className="text-xs text-espresso-400 font-medium tracking-wider uppercase">
        Scan at counter to collect
      </p>
    </div>
  );
};

const OrderTracking = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { activeOrder, orders, loading } = useSelector((state) => state.orders);
  const [displayOrder, setDisplayOrder] = useState(null);

  useEffect(() => {
    dispatch(fetchActiveOrder());
    dispatch(fetchMyOrders());
  }, [dispatch]);

  useEffect(() => {
    if (activeOrder) setDisplayOrder(activeOrder);
    else if (orders.length > 0) {
      const latest = orders.find((o) =>
        ['confirmed', 'preparing', 'ready'].includes(o.status)
      );
      setDisplayOrder(latest || orders[0]);
    }
  }, [activeOrder, orders]);

  const order = displayOrder;
  const currentStatusIndex = order ? statusFlow.indexOf(order.status) : -1;

  if (loading && !order) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="skeleton h-8 w-48 rounded-xl" />
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto">
        <PageHeader title="My Order" subtitle="Track your active order" />
        <EmptyState
          icon={ShoppingBag}
          title="No orders yet"
          description="Place your first order from the menu!"
          actionLabel="Browse Menu"
          onAction={() => navigate('/menu')}
        />
      </div>
    );
  }

  const isActive = ['confirmed', 'preparing', 'ready'].includes(order.status);
  const progressPercent = Math.max(0, (currentStatusIndex / (statusFlow.length - 1)) * 100);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button type="button" onClick={() => navigate('/')} className="btn-ghost -ml-2">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Order ID + Pickup Slot */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="text-center">
          <p className="text-sm font-medium text-espresso-500">Order ID</p>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-espresso-900 dark:text-espresso-50 tracking-wider mt-1">
            {order.orderId}
          </h1>

          {/* ✅ Pickup slot badge */}
          {order.pickupSlot && (
            <div className="inline-flex items-center gap-1.5 mt-3 px-4 py-1.5 bg-brand-50 dark:bg-brand-900/30 rounded-full">
              <Clock className="w-3.5 h-3.5 text-brand-500" />
              <span className="text-sm font-semibold text-brand-600 dark:text-brand-400">
                Pickup at {order.pickupSlot}
              </span>
            </div>
          )}

          {isActive && (
            <motion.p
              className="text-sm text-espresso-500 dark:text-espresso-400 font-medium mt-2"
              animate={{ opacity: [1, 0.6, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {statusConfig[order.status]?.description}
            </motion.p>
          )}
        </Card>
      </motion.div>

      {/* ✅ QR Code card — only shown when order is 'ready' */}
      {order.status === 'ready' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        >
          <Card className="text-center bg-gradient-to-b from-accent-50/60 to-white dark:from-accent-900/20 dark:to-espresso-950">
            <div className="flex items-center justify-center gap-2 mb-4">
              <QrCode className="w-5 h-5 text-accent-500" />
              <h2 className="text-lg font-bold text-espresso-900 dark:text-espresso-50">
                Show this at the counter
              </h2>
            </div>
            <OrderQRCode orderId={order.orderId} />
            <p className="mt-4 text-sm text-espresso-500">
              Counter <span className="font-bold text-espresso-700 dark:text-espresso-300">{order.counterNumber || 1}</span>
              {order.pickupSlot && (
                <> · Slot <span className="font-bold text-brand-600">{order.pickupSlot}</span></>
              )}
            </p>
          </Card>
        </motion.div>
      )}

      {/* Progress Timeline */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <h2 className="text-lg font-bold text-espresso-900 dark:text-espresso-50 mb-6">Order Progress</h2>
          <div className="relative pl-2">
            <div className="absolute left-[23px] top-2 bottom-2 w-0.5 bg-espresso-200 dark:bg-espresso-800 rounded-full" />
            <motion.div
              className="absolute left-[23px] top-2 w-0.5 bg-gradient-to-b from-brand-500 to-accent-500 rounded-full origin-top"
              initial={{ height: 0 }}
              animate={{ height: `${progressPercent}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
            <div className="space-y-6">
              {statusFlow.map((status, index) => {
                const config = statusConfig[status];
                const Icon = config.icon;
                const isCompleted = currentStatusIndex >= index;
                const isCurrent = currentStatusIndex === index;

                return (
                  <motion.div
                    key={status}
                    className="relative flex items-start gap-4"
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + index * 0.08 }}
                  >
                    <div className={`relative z-10 w-12 h-12 rounded-2xl flex items-center justify-center ${isCompleted ? config.bg : 'bg-espresso-100 dark:bg-espresso-800'}`}>
                      <Icon className={`w-5 h-5 ${isCompleted ? config.color : 'text-espresso-400'}`} />
                    </div>
                    <div className="flex-1 pt-1">
                      <div className="flex items-center gap-2">
                        <h3 className={`font-semibold ${isCompleted ? 'text-espresso-900 dark:text-espresso-100' : 'text-espresso-400'}`}>
                          {config.label}
                        </h3>
                        {isCurrent && (
                          <motion.span
                            className="w-2.5 h-2.5 bg-brand-500 rounded-full"
                            animate={{ scale: [1, 1.4, 1] }}
                            transition={{ duration: 1.2, repeat: Infinity }}
                          />
                        )}
                      </div>
                      <p className={`text-sm mt-0.5 ${isCompleted ? 'text-espresso-500' : 'text-espresso-300 dark:text-espresso-600'}`}>
                        {config.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Order Details */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card>
          <h2 className="text-lg font-bold mb-4">Order Details</h2>
          <div className="space-y-3">
            {order.items?.map((item, i) => (
              <div
                key={i}
                className="flex justify-between py-2 border-b border-espresso-100 dark:border-espresso-800 last:border-0"
              >
                <span className="text-sm font-medium">
                  <span className="text-espresso-500">{item.quantity}×</span> {item.name}
                </span>
                <span className="text-sm font-semibold">₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between pt-4 mt-2 border-t border-espresso-200 dark:border-espresso-800">
            <span className="font-bold">Total</span>
            <span className="text-xl font-bold text-brand-600">₹{order.totalAmount}</span>
          </div>
          {/* ✅ Show pickup slot here too, removed estimatedPrepTime */}
          {order.pickupSlot && (
            <div className="flex items-center gap-2 mt-3 text-sm text-espresso-500">
              <Clock className="w-4 h-4" />
              Pickup slot: <span className="font-semibold text-brand-600">{order.pickupSlot}</span>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
};

export default OrderTracking;