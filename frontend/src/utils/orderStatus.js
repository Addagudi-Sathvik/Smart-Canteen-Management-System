/** Backend status values */
export const ORDER_STATUSES = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  READY: 'ready',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

/** Staff-selectable forward statuses (paid orders) */
export const STAFF_STATUS_OPTIONS = [
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'ready', label: 'Ready for Pickup' },
  { value: 'completed', label: 'Completed' },
];

export const STATUS_LABELS = {
  pending: 'Pending Payment',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready for Pickup',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

/** Student order progress steps */
export const PROGRESS_STEPS = ['confirmed', 'preparing', 'ready', 'completed'];

export const STATUS_PIPELINE = ['pending', 'confirmed', 'preparing', 'ready', 'completed'];

/**
 * Color scheme (app-wide):
 * - Confirmed → Yellow / Amber
 * - Preparing → Orange
 * - Ready for Pickup → Green
 * - Completed → Slate / Blue-gray
 */
export const STATUS_THEME = {
  pending: {
    badge: 'badge-status-pending',
    dot: 'bg-espresso-400',
    iconBg: 'bg-espresso-100 dark:bg-espresso-800',
    iconColor: 'text-espresso-500 dark:text-espresso-400',
    line: 'bg-espresso-300 dark:bg-espresso-600',
    pulse: 'bg-espresso-400',
    ring: 'ring-espresso-200 dark:ring-espresso-700',
  },
  confirmed: {
    badge: 'badge-status-confirmed',
    dot: 'bg-amber-500',
    iconBg: 'bg-amber-100 dark:bg-amber-900/45',
    iconColor: 'text-amber-700 dark:text-amber-300',
    line: 'bg-amber-500',
    pulse: 'bg-amber-500',
    ring: 'ring-amber-200 dark:ring-amber-800',
  },
  preparing: {
    badge: 'badge-status-preparing',
    dot: 'bg-orange-500',
    iconBg: 'bg-orange-100 dark:bg-orange-900/45',
    iconColor: 'text-orange-700 dark:text-orange-300',
    line: 'bg-orange-500',
    pulse: 'bg-orange-500',
    ring: 'ring-orange-200 dark:ring-orange-800',
  },
  ready: {
    badge: 'badge-status-ready',
    dot: 'bg-emerald-500',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/45',
    iconColor: 'text-emerald-700 dark:text-emerald-300',
    line: 'bg-emerald-500',
    pulse: 'bg-emerald-500',
    ring: 'ring-emerald-200 dark:ring-emerald-800',
  },
  completed: {
    badge: 'badge-status-completed',
    dot: 'bg-slate-400',
    iconBg: 'bg-slate-100 dark:bg-slate-800/60',
    iconColor: 'text-slate-600 dark:text-slate-300',
    line: 'bg-slate-400',
    pulse: 'bg-slate-500',
    ring: 'ring-slate-200 dark:ring-slate-700',
  },
  cancelled: {
    badge: 'badge-danger',
    dot: 'bg-red-500',
    iconBg: 'bg-red-100 dark:bg-red-900/40',
    iconColor: 'text-red-600 dark:text-red-400',
    line: 'bg-red-400',
    pulse: 'bg-red-500',
    ring: 'ring-red-200 dark:ring-red-800',
  },
};

export const PROGRESS_STEP_CONFIG = {
  confirmed: {
    label: 'Confirmed',
    description: 'Your order has been received',
  },
  preparing: {
    label: 'Preparing',
    description: 'Our chefs are cooking your food',
  },
  ready: {
    label: 'Ready for Pickup',
    description: 'Show your QR code at the counter',
  },
  completed: {
    label: 'Completed',
    description: 'Enjoy your meal!',
  },
};

export const getStatusLabel = (status) => STATUS_LABELS[status] || status;

export const getStatusTheme = (status) => STATUS_THEME[status] || STATUS_THEME.pending;

export const getStatusBadgeClass = (status) => getStatusTheme(status).badge;

/** @deprecated Use OrderStatusBadge — kept for gradual migration */
export const statusToBadgeVariant = {
  pending: 'neutral',
  confirmed: 'warning',
  preparing: 'warning',
  ready: 'success',
  completed: 'neutral',
  cancelled: 'danger',
};

export const canSelectStatus = (currentStatus, targetStatus) => {
  const fromIdx = STATUS_PIPELINE.indexOf(currentStatus);
  const toIdx = STATUS_PIPELINE.indexOf(targetStatus);
  return fromIdx !== -1 && toIdx !== -1 && toIdx > fromIdx;
};

export const getSelectableStatuses = (order) => {
  if (!order || order.status === 'cancelled' || order.status === 'completed') {
    return [];
  }
  if (order.paymentStatus !== 'paid') {
    return [];
  }
  return STAFF_STATUS_OPTIONS.filter((opt) => canSelectStatus(order.status, opt.value));
};

export const PICKUP_SUCCESS_MESSAGE = 'Order successfully marked as Completed & Collected';

/** Resolve order owner id from populated or raw userId */
export const getOrderUserId = (order) => {
  if (!order?.userId) return null;
  return String(order.userId._id || order.userId);
};
