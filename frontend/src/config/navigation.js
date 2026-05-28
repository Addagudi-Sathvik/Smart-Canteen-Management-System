import {
  LayoutDashboard,
  UtensilsCrossed,
  Clock,
  History,
  ClipboardList,
  Package,
  Users,
  Settings,
  ShoppingBag,
  BarChart3,
  QrCode,
} from 'lucide-react';

export const studentNav = [
  { to: '/', label: 'Home', icon: LayoutDashboard, mobileLabel: 'Home' },
  { to: '/menu', label: 'Menu', icon: UtensilsCrossed, mobileLabel: 'Menu' },
  { to: '/orders/active', label: 'My Order', icon: Clock, mobileLabel: 'Order' },
  { to: '/orders/history', label: 'History', icon: History, mobileLabel: 'History' },
];

export const staffNav = [
  { to: '/staff', label: 'Queue', icon: ClipboardList },
  { to: '/staff/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/staff/pickup', label: 'Pickup QR', icon: QrCode },
  { to: '/staff/inventory', label: 'Inventory', icon: Package },
];

export const adminNav = [
  { to: '/admin', label: 'Hub', icon: BarChart3 },
  { to: '/admin/live-orders', label: 'Live Queue', icon: ClipboardList },
  { to: '/admin/counter', label: 'Counter', icon: ShoppingBag },
  { to: '/admin/menu', label: 'Menu', icon: UtensilsCrossed },
  { to: '/admin/orders', label: 'Logs', icon: History },
  { to: '/admin/pickup', label: 'Pickup QR', icon: QrCode },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/system', label: 'System', icon: Settings },
];

export const getNavForRole = (role) => {
  if (role === 'staff') return staffNav;
  if (role === 'admin') return adminNav;
  return studentNav;
};

export const motionSpring = { type: 'spring', stiffness: 300, damping: 30 };

export const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

export const staggerItem = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};
