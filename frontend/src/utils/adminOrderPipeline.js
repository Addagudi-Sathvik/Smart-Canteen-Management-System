/** Single next action for admin pipeline UI */
export const getAdminNextAction = (order) => {
  if (!order || order.status === 'completed' || order.status === 'cancelled') {
    return null;
  }

  const actions = {
    pending: {
      status: 'confirmed',
      label: 'Confirm Order',
      btnClass: 'bg-amber-500 hover:bg-amber-600 text-white',
    },
    confirmed: {
      status: 'preparing',
      label: 'Start Preparing',
      btnClass: 'bg-orange-500 hover:bg-orange-600 text-white',
    },
    preparing: {
      status: 'ready',
      label: 'Mark Ready for Pickup',
      btnClass: 'bg-emerald-500 hover:bg-emerald-600 text-white',
    },
  };

  const action = actions[order.status];
  if (!action) return null;

  if (order.status !== 'pending' && order.paymentStatus !== 'paid') {
    return null;
  }

  return action;
};
