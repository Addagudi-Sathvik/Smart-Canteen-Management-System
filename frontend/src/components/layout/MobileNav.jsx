import { Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { openCart, selectCartCount } from '../../store/slices/cartSlice';
import { studentNav } from '../../config/navigation';
import { ShoppingCart } from 'lucide-react';

const MobileNav = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const cartCount = useSelector(selectCartCount);

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-strong border-t border-brand-200/50 dark:border-brand-800/30 safe-bottom"
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around px-2 py-2">
        {studentNav.map((link) => {
          const Icon = link.icon;
          const active = isActive(link.to);
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[52px] gap-0.5 rounded-xl transition-colors ${
                active ? 'text-brand-600 dark:text-brand-400' : 'text-espresso-500 dark:text-espresso-400'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className={`w-5 h-5 ${active ? 'text-brand-600 scale-110' : ''} transition-transform`} />
              <span className="text-[10px] font-semibold">{link.mobileLabel || link.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => dispatch(openCart())}
          className="relative flex flex-col items-center justify-center min-w-[56px] min-h-[52px] gap-0.5 rounded-xl text-espresso-500 dark:text-espresso-400"
          aria-label="Open cart"
        >
          <ShoppingCart className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Cart</span>
          {cartCount > 0 && (
            <span className="absolute top-1 right-2 w-4 h-4 bg-brand-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {cartCount > 9 ? '9+' : cartCount}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
};

export default MobileNav;
