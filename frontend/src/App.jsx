import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUser } from './store/slices/authSlice';
import { connectSocket, disconnectSocket } from './utils/socket';
import { useSocketEvents } from './hooks/useSocketEvents';
import { useTheme } from './hooks/useTheme';
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoadingScreen from './components/ui/LoadingScreen';

// Lazy load pages
const Login = lazy(() => import('./pages/auth/Login'));
const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard'));
const MenuPage = lazy(() => import('./pages/student/MenuPage'));
const OrderTracking = lazy(() => import('./pages/student/OrderTracking'));
const OrderHistory = lazy(() => import('./pages/student/OrderHistory'));
const StaffDashboard = lazy(() => import('./pages/staff/StaffDashboard'));
const StaffInventory = lazy(() => import('./pages/staff/StaffInventory'));
const StaffOrders = lazy(() => import('./pages/staff/StaffOrders'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const MenuManagement = lazy(() => import('./pages/admin/MenuManagement'));
const UserManagement = lazy(() => import('./pages/admin/UserManagement'));
const SystemControls = lazy(() => import('./pages/admin/SystemControls'));
const AllOrders = lazy(() => import('./pages/admin/AllOrders'));
const AdminLiveOrders = lazy(() => import('./pages/admin/AdminLiveOrders'));
const AdminCounterOrder = lazy(() => import('./pages/admin/AdminCounterOrder'));
const PickupVerification = lazy(() => import('./pages/admin/PickupVerification'));
const StaffPickupVerification = lazy(() => import('./pages/staff/StaffPickupVerification'));

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, token } = useSelector((state) => state.auth);

  // Initialize theme
  useTheme();

  // Socket events hook
  useSocketEvents();

  // Fetch user on mount if token exists
  useEffect(() => {
    if (token && isAuthenticated) {
      dispatch(fetchUser());
    }
  }, [dispatch, token, isAuthenticated]);

  // Connect socket when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const socket = connectSocket();
      return () => disconnectSocket();
    }
  }, [isAuthenticated]);

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            {/* Student Routes */}
            <Route path="/" element={<StudentDashboard />} />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/orders/active" element={<OrderTracking />} />
            <Route path="/orders/history" element={<OrderHistory />} />

            {/* Staff Routes */}
            <Route path="/staff" element={<StaffDashboard />} />
            <Route path="/staff/orders" element={<StaffOrders />} />
            <Route path="/staff/inventory" element={<StaffInventory />} />
            <Route path="/staff/pickup" element={<StaffPickupVerification />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/counter" element={<AdminCounterOrder />} />
            <Route path="/admin/live-orders" element={<AdminLiveOrders />} />
            <Route path="/admin/menu" element={<MenuManagement />} />
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/admin/system" element={<SystemControls />} />
            <Route path="/admin/orders" element={<AllOrders />} />
            <Route path="/admin/pickup" element={<PickupVerification />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Suspense>
  );
}

export default App;
