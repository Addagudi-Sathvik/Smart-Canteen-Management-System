import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import QRCode from 'qrcode';
import { fetchActiveOrder, fetchMyOrders } from '../../store/slices/orderSlice';
import { ordersAPI } from '../../utils/api';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import PageHeader from '../../components/ui/PageHeader';
import {
  ShoppingBag,
  ChefHat,
  Package,
  CheckCircle2,
  ArrowLeft,
  Clock,
  QrCode,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

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

const SecureOrderQR = ({ qrPayload, orderId, disabled }) => {
  const canvasRef = useRef(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!canvasRef.current || !qrPayload || disabled) return;
    QRCode.toCanvas(
      canvasRef.current,
      qrPayload,
      {
        width: 200,
        margin: 2,
        errorCorrectionLevel: 'M',
        color: { dark: '#1c1917', light: '#fffbeb' },
      },
      (err) => {
        if (err) setError(true);
        else setError(false);
      }
    );
  }, [qrPayload, disabled]);

  if (disabled) {
    return (
      <div className="flex flex-col items-center gap-2 py-6 opacity-60">
        <AlertCircle className="w-10 h-10 text-tomato-500" />
        <p className="text-sm font-semibold text-tomato-600 dark:text-tomato-400">
          QR already used
        </p>
        <p className="text-xs text-espresso-500">This code cannot be scanned again.</p>
      </div>
    );
  }

  if (error || !qrPayload) {
    return (
      <p className="text-sm text-espresso-400 text-center py-4">
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
      <div className="flex items-center gap-1.5 text-xs text-espresso-500">
        <ShieldCheck className="w-3.5 h-3.5 text-accent-500" />
        Secure single-use pickup code
      </div>
    </div>
  );
};

const OrderTracking = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { activeOrder, orders, loading } = useSelector((state) => state.orders);
  const [displayOrder, setDisplayOrder] = useState(null);
  const [qrPayload, setQrPayload] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);

  const refreshOrders = useCallback(() => {
    dispatch(fetchActiveOrder());
    dispatch(fetchMyOrders());
  }, [dispatch]);

  useEffect(() => {
    refreshOrders();
    const interval = setInterval(refreshOrders, 15000);
    return () => clearInterval(interval);
  }, [refreshOrders]);

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

  const loadQr = useCallback(async () => {
    if (!order?._id || order.paymentStatus !== 'paid') return;
    if (order.qrUsed) {
      setQrPayload(null);
      return;
    }

    if (order.qrPayload) {
      setQrPayload(order.qrPayload);
      return;
    }

    setQrLoading(true);
    try {
      const { data } = await ordersAPI.getQr(order._id);
      setQrPayload(data.qrPayload);
    } catch (err) {
      if (err.response?.status === 410) {
        setQrPayload(null);
        refreshOrders();
      }
    } finally {
      setQrLoading(false);
    }
  }, [order?._id, order?.paymentStatus, order?.qrUsed, order?.qrPayload, refreshOrders]);

  useEffect(() => {
    loadQr();
  }, [loadQr]);

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
  const showQr =
    order.paymentStatus === 'paid' &&
    !order.qrUsed &&
    order.status !== 'cancelled' &&
    order.status !== 'completed';
  const qrDisabled = order.qrUsed || order.status === 'completed';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button type="button" onClick={() => navigate('/')} className="btn-ghost -ml-2">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="text-center">
          <p className="text-sm font-medium text-espresso-500">Order ID</p>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-espresso-900 dark:text-espresso-50 tracking-wider mt-1">
            {order.orderId}
          </h1>

          {order.pickupSlot && (
            <div className="inline-flex items-center gap-1.5 mt-3 px-4 py-1.5 bg-brand-50 dark:bg-brand-900/30 rounded-full">
              <Clock className="w-3.5 h-3.5 text-brand-500" />
              <span className="text-sm font-semibold text-brand-600 dark:text-brand-400">
                Pickup at {order.pickupSlot}
              </span>
            </div>
          )}

          <p className="text-xs font-semibold uppercase tracking-wide text-espresso-400 mt-2">
            {order.status.replace('_', ' ')}
            {order.paymentStatus === 'paid' && ' · Paid'}
          </p>

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

      {showQr && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        >
          <Card className="text-center bg-gradient-to-b from-brand-50/80 to-white dark:from-brand-900/20 dark:to-espresso-950 border border-brand-200/40 dark:border-brand-800/30">
            <div className="flex items-center justify-center gap-2 mb-1">
              <QrCode className="w-5 h-5 text-brand-600" />
              <h2 className="text-lg font-bold text-espresso-900 dark:text-espresso-50">
                Show this QR at counter
              </h2>
            </div>
            <p className="text-sm text-espresso-500 mb-4">
              {order.status === 'ready'
                ? 'Staff will scan this to complete your pickup'
                : 'Keep this ready — valid once your order is marked Ready'}
            </p>

            {qrLoading ? (
              <div className="py-12 flex justify-center">
                <span className="w-8 h-8 border-2 border-brand-300 border-t-brand-600 rounded-full animate-spin" />
              </div>
            ) : (
              <SecureOrderQR
                qrPayload={qrPayload}
                orderId={order.orderId}
                disabled={qrDisabled}
              />
            )}

            <p className="mt-4 text-sm text-espresso-500">
              Order <span className="font-bold">{order.orderId}</span>
              {order.pickupSlot && (
                <>
                  {' '}
                  · Pickup{' '}
                  <span className="font-bold text-brand-600">{order.pickupSlot}</span>
                </>
              )}
            </p>
          </Card>
        </motion.div>
      )}

      {order.qrUsed && order.status === 'completed' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center gap-2 p-4 rounded-2xl bg-accent-50 dark:bg-accent-900/20 text-accent-700 dark:text-accent-300 text-sm font-semibold"
        >
          <CheckCircle2 className="w-5 h-5" />
          Pickup verified — enjoy your meal!
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <h2 className="text-lg font-bold text-espresso-900 dark:text-espresso-50 mb-6">
            Order Progress
          </h2>
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
                    <div
                      className={`relative z-10 w-12 h-12 rounded-2xl flex items-center justify-center ${
                        isCompleted ? config.bg : 'bg-espresso-100 dark:bg-espresso-800'
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 ${isCompleted ? config.color : 'text-espresso-400'}`}
                      />
                    </div>
                    <div className="flex-1 pt-1">
                      <div className="flex items-center gap-2">
                        <h3
                          className={`font-semibold ${
                            isCompleted
                              ? 'text-espresso-900 dark:text-espresso-100'
                              : 'text-espresso-400'
                          }`}
                        >
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
                      <p
                        className={`text-sm mt-0.5 ${
                          isCompleted
                            ? 'text-espresso-500'
                            : 'text-espresso-300 dark:text-espresso-600'
                        }`}
                      >
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
          {order.pickupSlot && (
            <div className="flex items-center gap-2 mt-3 text-sm text-espresso-500">
              <Clock className="w-4 h-4" />
              Pickup slot:{' '}
              <span className="font-semibold text-brand-600">{order.pickupSlot}</span>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
};

export default OrderTracking;
