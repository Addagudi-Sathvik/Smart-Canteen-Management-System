import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { logout } from '../../store/slices/authSlice';
import { useTheme } from '../../hooks/useTheme';
import { selectCartCount, openCart } from '../../store/slices/cartSlice';
import { getNavForRole } from '../../config/navigation';
import { useSidebar } from '../../contexts/SidebarContext';
import {
  LogOut,
  User,
  Sun,
  Moon,
  ShoppingCart,
  ChevronDown,
  UtensilsCrossed,
  Menu,
} from 'lucide-react';

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { open: openSidebar } = useSidebar();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const cartCount = useSelector(selectCartCount);
  const { theme, toggleTheme } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  if (!isAuthenticated) return null;

  const links = getNavForRole(user?.role);
  const isStudent = user?.role === 'student';
  const homePath = links[0]?.to || '/';

  const isActive = (path) => {
    if (path === '/' || path === '/admin' || path === '/staff') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="sticky top-0 z-40 glass-strong border-b border-brand-200/50 dark:border-brand-800/30">
      <div className="px-4 h-16 flex items-center justify-between max-w-[1600px] mx-auto">
        <div className="flex items-center gap-3 sm:gap-6">
          {(user?.role === 'staff' || user?.role === 'admin') && (
            <button
              type="button"
              onClick={openSidebar}
              className="lg:hidden p-2.5 rounded-xl hover:bg-brand-50 dark:hover:bg-espresso-800 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5 text-espresso-600 dark:text-espresso-300" />
            </button>
          )}

          <Link to={homePath} className="flex items-center gap-2 text-brand-600 dark:text-brand-400">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-soft">
              <UtensilsCrossed className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-lg hidden sm:block text-espresso-900 dark:text-espresso-50">
              CanteenHub
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-2 text-sm font-medium rounded-xl transition-all min-h-[40px] flex items-center ${
                  isActive(link.to)
                    ? 'nav-link-active'
                    : 'text-espresso-600 dark:text-espresso-400 hover:bg-brand-50/80 dark:hover:bg-espresso-800/80'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          {isStudent && (
            <button
              type="button"
              onClick={() => dispatch(openCart())}
              className="relative hidden md:flex p-2.5 rounded-xl hover:bg-brand-50 dark:hover:bg-espresso-800 transition-colors min-h-[44px] min-w-[44px] items-center justify-center"
              aria-label={`Cart, ${cartCount} items`}
            >
              <ShoppingCart className="w-5 h-5 text-espresso-600 dark:text-espresso-400" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 w-5 h-5 bg-brand-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={toggleTheme}
            className="p-2.5 rounded-xl hover:bg-brand-50 dark:hover:bg-espresso-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-brand-400" />
            ) : (
              <Moon className="w-5 h-5 text-espresso-600" />
            )}
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-brand-50 dark:hover:bg-espresso-800 transition-colors min-h-[44px]"
              aria-expanded={showUserMenu}
              aria-haspopup="true"
            >
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="w-8 h-8 rounded-full ring-2 ring-brand-200 dark:ring-brand-800" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/50 flex items-center justify-center">
                  <User className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                </div>
              )}
              <span className="text-sm font-medium text-espresso-700 dark:text-espresso-300 hidden sm:block max-w-[100px] truncate">
                {user?.name?.split(' ')[0]}
              </span>
              <ChevronDown className="w-4 h-4 text-espresso-400 hidden sm:block" />
            </button>

            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  className="absolute right-0 top-full mt-2 w-52 glass-strong rounded-2xl shadow-elevated overflow-hidden z-50"
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                >
                  <div className="p-3 border-b border-brand-200/40 dark:border-brand-800/30">
                    <p className="text-sm font-semibold text-espresso-900 dark:text-espresso-100 truncate">{user?.name}</p>
                    <p className="text-xs text-espresso-500 capitalize">{user?.role}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setShowUserMenu(false); handleLogout(); }}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-tomato-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors min-h-[44px]"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
