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

export const STATUS_PIPELINE = ['pending', 'confirmed', 'preparing', 'ready', 'completed'];

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
