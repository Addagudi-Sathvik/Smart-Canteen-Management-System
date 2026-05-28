import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { connectSocket } from '../utils/socket';
import { updateOrderFromSocket, addOrderFromSocket } from '../store/slices/orderSlice';
import { getOrderUserId, getStatusLabel } from '../utils/orderStatus';
import { playOrderAlert } from '../utils/playOrderAlert';
import toast from 'react-hot-toast';

const STUDENT_READY_MESSAGE =
  'Your food is fresh and waiting at the counter! Please show your pickup QR code.';

export const useSocketEvents = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const userIdRef = useRef(user?._id);

  userIdRef.current = user?._id;

  useEffect(() => {
    if (!isAuthenticated) return;

    const socket = connectSocket();

    if (user?.role) {
      socket.emit('join:role', user.role);
    }

    if (user?._id) {
      socket.emit('join:user', user._id);
    }

    if (user?.role === 'staff' || user?.role === 'admin') {
      socket.emit('join:staff');
    }

    const handleNewOrder = (order) => {
      dispatch(addOrderFromSocket(order));

      if (user?.role === 'staff' || user?.role === 'admin') {
        playOrderAlert();
        const amount =
          order.totalAmount != null ? ` · ₹${order.totalAmount}` : '';
        toast.success(`New order ${order.orderId}${amount}`, {
          id: `new-order-${order.orderId}`,
          duration: 8000,
        });
      }
    };

    const handleStudentReady = (order) => {
      dispatch(updateOrderFromSocket(order));
      const orderUserId = getOrderUserId(order);
      const isMyOrder =
        orderUserId && userIdRef.current && orderUserId === String(userIdRef.current);
      if (!isMyOrder) return;

      toast.success(`${STUDENT_READY_MESSAGE}\n\nOrder: ${order.orderId}`, {
        id: `order-ready-${order.orderId}`,
        duration: 10000,
        style: {
          border: '2px solid rgba(16, 185, 129, 0.5)',
          background: 'rgba(16, 185, 129, 0.12)',
          maxWidth: '360px',
        },
      });
    };

    const handleStatusUpdate = (order) => {
      dispatch(updateOrderFromSocket(order));

      const orderUserId = getOrderUserId(order);
      const isMyOrder =
        orderUserId && userIdRef.current && orderUserId === String(userIdRef.current);

      if (user?.role === 'student') {
        if (!isMyOrder) return;

        if (order.status === 'ready') {
          handleStudentReady(order);
          return;
        }

        const studentMessages = {
          confirmed: '✓ Order confirmed — we received your order!',
          preparing: '👨‍🍳 Your order is being prepared!',
          completed: order.qrUsed
            ? '✅ Pickup verified! Enjoy your meal!'
            : 'Order completed. Enjoy your meal!',
        };

        if (studentMessages[order.status]) {
          toast.success(studentMessages[order.status], {
            id: `status-${order.orderId}-${order.status}`,
            duration: 5000,
          });
        }
        return;
      }

      if (user?.role === 'staff' || user?.role === 'admin') {
        if (order.status === 'ready') {
          toast.success(`Order ${order.orderId} — ${getStatusLabel(order.status)}`, {
            id: `staff-ready-${order.orderId}`,
            duration: 4000,
          });
        }
      }
    };

    const handleNotification = (notification) => {
      if (notification.type === 'new_order' && user?.role !== 'student') {
        return;
      }
      if (notification.type === 'status_update' && user?.role === 'student') {
        return;
      }

      toast(notification.message, {
        icon: '🔔',
        duration: 3500,
        id: notification.orderId
          ? `notif-${notification.orderId}-${notification.status || ''}`
          : undefined,
      });
    };

    socket.on('order:new', handleNewOrder);
    socket.on('newOrderPlaced', handleNewOrder);
    socket.on('order:statusUpdate', handleStatusUpdate);
    socket.on('order:ready', handleStudentReady);
    socket.on('notification', handleNotification);

    if (user?._id) {
      socket.on(`orderReady_${user._id}`, handleStudentReady);
    }

    return () => {
      socket.off('order:new', handleNewOrder);
      socket.off('newOrderPlaced', handleNewOrder);
      socket.off('order:statusUpdate', handleStatusUpdate);
      socket.off('order:ready', handleStudentReady);
      socket.off('notification', handleNotification);
      if (user?._id) {
        socket.off(`orderReady_${user._id}`, handleStudentReady);
      }
    };
  }, [dispatch, isAuthenticated, user?.role, user?._id]);
};
