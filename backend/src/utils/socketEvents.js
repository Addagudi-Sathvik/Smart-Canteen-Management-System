let io;

const setSocketIO = (socketIO) => {
  io = socketIO;
};

const getIO = () => io;

const toPayload = (order) => (order.toObject ? order.toObject() : order);

const emitNewOrderPlaced = (order) => {
  if (!io) return;
  const payload = toPayload(order);
  io.emit('order:new', payload);
  io.emit('newOrderPlaced', payload);
  io.to('staff').emit('newOrderPlaced', payload);
  io.to('staff').emit('order:new', payload);
  io.to('role:staff').emit('newOrderPlaced', payload);
  io.to('role:admin').emit('newOrderPlaced', payload);
  io.emit('notification', {
    type: 'new_order',
    message: `New order ${order.orderId} received`,
    orderId: order.orderId,
  });
};

const emitOrderStatusUpdate = (order, notificationMessage) => {
  if (!io) return;
  const payload = toPayload(order);
  const userId = payload.userId?._id || payload.userId;

  io.emit('order:statusUpdate', payload);
  io.to('staff').emit('order:statusUpdate', payload);
  io.to('role:staff').emit('order:statusUpdate', payload);
  io.to('role:admin').emit('order:statusUpdate', payload);

  if (userId) {
    io.to(`user:${userId}`).emit('order:statusUpdate', payload);
  }

  if (order.status === 'ready' && userId) {
    io.to(`user:${userId}`).emit(`orderReady_${userId}`, payload);
    io.to(`user:${userId}`).emit('order:ready', payload);
  }

  io.emit('notification', {
    type: 'status_update',
    message: notificationMessage || `Order ${order.orderId} is now ${order.status}`,
    orderId: order.orderId,
    status: order.status,
  });
};

module.exports = {
  setSocketIO,
  getIO,
  emitNewOrderPlaced,
  emitOrderStatusUpdate,
};
