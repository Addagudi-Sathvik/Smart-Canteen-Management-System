import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { fetchAllOrders, updateOrderStatus } from '../../store/slices/orderSlice';
import { ordersAPI } from '../../utils/api';
import toast from 'react-hot-toast';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import Input from '../../components/ui/Input';
import { ClipboardList, ChefHat, Package, Search, Clock, User, QrCode, CheckCircle2 } from 'lucide-react';

const queueColumns = [
  { status: 'confirmed', label: 'Incoming',  icon: ClipboardList, border: 'border-sky-500',    btn: 'bg-sky-500 hover:bg-sky-600' },
  { status: 'preparing', label: 'Preparing', icon: ChefHat,       border: 'border-brand-500',  btn: 'bg-brand-500 hover:bg-brand-600' },
  { status: 'ready',     label: 'Ready',     icon: Package,       border: 'border-accent-500', btn: 'bg-accent-500 hover:bg-accent-600' },
];

const statusActions = {
  confirmed: { next: 'preparing', label: 'Accept' },
  preparing: { next: 'ready',     label: 'Mark Ready' },
  // ✅ 'ready' has NO statusAction here — it uses verifyPickup instead
};

// ─── Slot grouping helpers ──────────────────────────────────────────────────

const parseSlotTime = (slot) => {
  if (!slot) return 0;
  const [time, period] = slot.split(' ');
  let [hours, minutes] = time.split(':').map(Number);
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
};

const groupBySlot = (orders) => {
  const map = {};
  for (const order of orders) {
    const slot = order.pickupSlot || 'Unassigned';
    if (!map[slot]) map[slot] = [];
    map[slot].push(order);
  }
  return Object.entries(map).sort(([a], [b]) => parseSlotTime(a) - parseSlotTime(b));
};

// ─── Order Card ─────────────────────────────────────────────────────────────

const OrderCard = ({ order, column, onStatusUpdate, onVerifyPickup }) => {
  const action = statusActions[column.status];
  const isReady = column.status === 'ready';
  const [verifying, setVerifying] = useState(false);

  const handleVerify = async () => {
    setVerifying(true);
    try {
      await onVerifyPickup(order);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white dark:bg-espresso-900 rounded-2xl p-4 border border-espresso-100 dark:border-espresso-800 shadow-soft"
    >
      <div className="flex justify-between mb-2">
        <div>
          <p className="text-lg font-display font-bold">{order.orderId}</p>
          <p className="flex items-center gap-1 text-xs text-espresso-500 mt-0.5">
            <User className="w-3 h-3" />
            {order.userId?.name || 'Unknown'}
          </p>
        </div>
        <span className="text-xs text-espresso-400 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      <div className="space-y-0.5 mb-3">
        {order.items?.map((item, i) => (
          <p key={i} className="text-sm text-espresso-600 dark:text-espresso-400">
            {item.quantity}× {item.name}
          </p>
        ))}
      </div>

      <p className="text-sm font-bold text-brand-600 mb-3">₹{order.totalAmount}</p>

      {/* Normal status advance button (confirmed → preparing) */}
      {action && (
        <button
          type="button"
          onClick={() => onStatusUpdate(order._id, action.next)}
          className={`w-full py-2.5 rounded-xl text-white text-sm font-semibold transition-all min-h-[44px] ${column.btn}`}
        >
          {action.label} →
        </button>
      )}

      {/* ✅ Verify Pickup button — only on Ready column */}
      {isReady && (
        <button
          type="button"
          onClick={handleVerify}
          disabled={verifying}
          className="w-full py-2.5 rounded-xl text-white text-sm font-semibold transition-all min-h-[44px] bg-accent-500 hover:bg-accent-600 disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {verifying ? (
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <QrCode className="w-4 h-4" />
              Verify Pickup
            </>
          )}
        </button>
      )}
    </motion.div>
  );
};

// ─── Slot Section ────────────────────────────────────────────────────────────

const SlotSection = ({ slot, orders, column, onStatusUpdate, onVerifyPickup }) => (
  <div className="mb-4">
    <div className="flex items-center gap-2 mb-2 px-1">
      <Clock className="w-3.5 h-3.5 text-brand-500" />
      <span className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wide">
        {slot}
      </span>
      <span className="text-xs font-semibold bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 px-2 py-0.5 rounded-full">
        {orders.length} {orders.length === 1 ? 'order' : 'orders'}
      </span>
      <div className="flex-1 h-px bg-brand-100 dark:bg-brand-900/30" />
    </div>
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {orders.map((order) => (
          <OrderCard
            key={order._id}
            order={order}
            column={column}
            onStatusUpdate={onStatusUpdate}
            onVerifyPickup={onVerifyPickup}
          />
        ))}
      </AnimatePresence>
    </div>
  </div>
);

// ─── Main Component ──────────────────────────────────────────────────────────

const StaffDashboard = () => {
  const dispatch = useDispatch();
  const { allOrders, loading } = useSelector((state) => state.orders);
  const [searchQuery, setSearchQuery]   = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    dispatch(fetchAllOrders({ status: 'active' }));
  }, [dispatch]);

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await dispatch(updateOrderStatus({ id: orderId, status: newStatus })).unwrap();
      toast.success(`Order updated to ${newStatus}`);
    } catch (error) {
      toast.error(error || 'Failed to update status');
    }
  };

  // ✅ Verify pickup — calls the new backend route, then refreshes orders
  const handleVerifyPickup = async (order) => {
    if (!order.qrToken) {
      toast.error('No QR token on this order. Use Pickup QR page to scan.');
      return;
    }
    try {
      await ordersAPI.verifyPickup(order._id, { qrToken: order.qrToken });
      toast.success(
        <span className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-accent-500" />
          Order <strong>{order.orderId}</strong> collected ✓
        </span>
      );
      // Refresh the queue
      dispatch(fetchAllOrders({ status: 'active' }));
    } catch (error) {
      const msg = error?.response?.data?.message || 'Failed to verify pickup';
      toast.error(msg);
    }
  };

  const filteredOrders = allOrders.filter((order) => {
    const matchesSearch =
      order.orderId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.userId?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeCount = allOrders.filter((o) =>
    ['confirmed', 'preparing', 'ready'].includes(o.status)
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <PageHeader title="Staff Queue" subtitle="Manage incoming orders in real-time" />
        <Link to="/staff/pickup" className="btn-secondary text-sm self-start sm:self-center shrink-0">
          <QrCode className="w-4 h-4 inline mr-1" />
          Scan pickup QR
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Active Orders"  value={activeCount}                                               icon={ClipboardList} index={0} />
        <StatCard label="Total in Queue" value={allOrders.length}                                          icon={ChefHat}       color="text-brand-600" index={1} />
        <StatCard label="Ready"          value={filteredOrders.filter((o) => o.status === 'ready').length} icon={Package}       color="text-accent-600" bg="bg-accent-50 dark:bg-accent-900/25" index={2} />
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            icon={Search}
            placeholder="Search by Order ID or student..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-field sm:w-44"
          aria-label="Filter by status"
        >
          <option value="all">All Status</option>
          <option value="confirmed">Incoming</option>
          <option value="preparing">Preparing</option>
          <option value="ready">Ready</option>
        </select>
      </div>

      {/* Kanban columns grouped by pickup slot */}
      <div className="flex md:grid md:grid-cols-3 gap-4 overflow-x-auto pb-2 md:overflow-visible snap-x snap-mandatory md:snap-none -mx-4 px-4 md:mx-0 md:px-0">
        {queueColumns.map((column) => {
          const columnOrders = filteredOrders.filter((o) => o.status === column.status);
          const slotGroups   = groupBySlot(columnOrders);
          const Icon         = column.icon;

          return (
            <div
              key={column.status}
              className="glass rounded-2xl overflow-hidden flex-shrink-0 w-[min(100%,320px)] md:w-auto snap-center"
            >
              {/* Column header */}
              <div className={`px-4 py-3 border-b-2 ${column.border} flex items-center gap-2 bg-brand-50/30 dark:bg-espresso-900/30`}>
                <Icon className="w-5 h-5 text-espresso-700 dark:text-espresso-300" />
                <h3 className="font-bold text-espresso-900 dark:text-espresso-100">{column.label}</h3>
                <span className="ml-auto text-xs font-bold bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 px-2.5 py-0.5 rounded-full">
                  {columnOrders.length}
                </span>
              </div>

              {/* Scrollable body */}
              <div className="p-3 max-h-[55vh] md:max-h-[60vh] overflow-y-auto min-h-[120px]">
                {slotGroups.length > 0 ? (
                  slotGroups.map(([slot, orders]) => (
                    <SlotSection
                      key={slot}
                      slot={slot}
                      orders={orders}
                      column={column}
                      onStatusUpdate={handleStatusUpdate}
                      onVerifyPickup={handleVerifyPickup}
                    />
                  ))
                ) : (
                  !loading && (
                    <p className="text-center text-sm text-espresso-400 py-8">No orders</p>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StaffDashboard;