import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { connectSocket } from '../utils/socket';
import { updateOrderFromSocket, addOrderFromSocket } from '../store/slices/orderSlice';
import toast from 'react-hot-toast';

export const useSocketEvents = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!isAuthenticated) return;

    const socket = connectSocket();

    // Join role-specific room
    if (user?.role) {
      socket.emit('join:role', user.role);
    }

    // Join staff room for staff/admin
    if (user?.role === 'staff' || user?.role === 'admin') {
      socket.emit('join:staff');
    }

    // Listen for new orders (staff/admin)
    const handleNewOrder = (order) => {
      dispatch(addOrderFromSocket(order));
      if (user?.role !== 'student') {
        toast.success(`New order ${order.orderId} received!`, {
          duration: 4000,
        });
      }
    };

    // Listen for status updates
    const handleStatusUpdate = (order) => {
      dispatch(updateOrderFromSocket(order));

      // Show notification based on status
      const messages = {
        confirmed: 'Order confirmed!',
        preparing: 'Your order is being prepared!',
        ready: '🎉 Your order is ready for pickup! Show your QR at the counter.',
        completed: order.qrUsed
          ? '✅ Pickup verified! Enjoy your meal!'
          : 'Order completed. Enjoy your meal!',
      };

      if (messages[order.status]) {
        toast.success(messages[order.status], { duration: 5000 });
      }
    };

    // Listen for general notifications
    const handleNotification = (notification) => {
      if (notification.type === 'new_order' && user?.role !== 'student') {
        // Already handled by handleNewOrder
      } else {
        toast(notification.message, {
          icon: '🔔',
          duration: 3000,
        });
      }
    };

    socket.on('order:new', handleNewOrder);
    socket.on('order:statusUpdate', handleStatusUpdate);
    socket.on('notification', handleNotification);

    return () => {
      socket.off('order:new', handleNewOrder);
      socket.off('order:statusUpdate', handleStatusUpdate);
      socket.off('notification', handleNotification);
    };
  }, [dispatch, isAuthenticated, user?.role]);
};
