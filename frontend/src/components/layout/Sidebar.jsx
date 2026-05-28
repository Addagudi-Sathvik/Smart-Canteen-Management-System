import { useRef, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UtensilsCrossed } from 'lucide-react';
import { getNavForRole } from '../../config/navigation';
import { motionSpring } from '../../config/navigation';

const SWIPE_CLOSE_THRESHOLD = 56;

const Sidebar = ({ user, isOpen, onClose, isMobile = false }) => {
  const location = useLocation();
  const links = getNavForRole(user?.role);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const isActive = (path) => {
    if (path === '/' || path === '/admin' || path === '/staff') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const handleClose = useCallback(
    (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      onClose?.();
    },
    [onClose]
  );

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
    if (dy < 80 && dx < -SWIPE_CLOSE_THRESHOLD) {
      handleClose();
    }
  };

  const content = (
    <>
      <div className="flex items-center justify-between p-4 border-b border-brand-200/40 dark:border-brand-800/30 shrink-0">
        <Link
          to={links[0]?.to || '/'}
          className="flex items-center gap-2 text-brand-600 dark:text-brand-400 min-h-[44px]"
          onClick={handleClose}
        >
          <UtensilsCrossed className="w-6 h-6" />
          <span className="font-display font-bold text-lg">CanteenHub</span>
        </Link>
        {isMobile && (
          <button
            type="button"
            onClick={handleClose}
            onPointerUp={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleClose(e);
            }}
            className="relative z-[70] p-2.5 rounded-xl hover:bg-brand-50 dark:hover:bg-espresso-800 active:bg-brand-100 dark:active:bg-espresso-700 min-h-[48px] min-w-[48px] flex items-center justify-center touch-manipulation cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-6 h-6 text-espresso-700 dark:text-espresso-200 pointer-events-none" />
          </button>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto overscroll-contain" aria-label="Sidebar navigation">
        {links.map((link) => {
          const Icon = link.icon;
          const active = isActive(link.to);
          return (
            <Link
              key={link.to}
              to={link.to}
              onClick={handleClose}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all min-h-[48px] touch-manipulation ${
                active
                  ? 'nav-link-active shadow-soft'
                  : 'text-espresso-600 dark:text-espresso-400 hover:bg-brand-50/80 dark:hover:bg-espresso-800/80'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-brand-200/40 dark:border-brand-800/30 shrink-0">
        <div className="flex items-center gap-3 px-2">
          {user?.avatar ? (
            <img src={user.avatar} alt="" className="w-9 h-9 rounded-full ring-2 ring-brand-200 dark:ring-brand-800" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-900/50 flex items-center justify-center text-brand-700 font-semibold text-sm">
              {user?.name?.[0]}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate text-espresso-900 dark:text-espresso-100">{user?.name}</p>
            <p className="text-xs text-espresso-500 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
            <motion.button
              type="button"
              className="absolute inset-0 w-full h-full bg-espresso-950/60 backdrop-blur-sm border-0 cursor-default"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              onTouchEnd={(e) => {
                e.preventDefault();
                handleClose(e);
              }}
              aria-label="Close menu overlay"
            />
            <motion.aside
              className="absolute left-0 top-0 bottom-0 w-[min(288px,88vw)] glass-strong flex flex-col shadow-elevated"
              style={{ zIndex: 101 }}
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={motionSpring}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onClick={(e) => e.stopPropagation()}
            >
              {content}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <aside className="hidden lg:flex flex-col w-64 flex-shrink-0 glass border-r border-brand-200/40 dark:border-brand-800/30 min-h-[calc(100vh-4rem)] sticky top-16">
      {content}
    </aside>
  );
};

export default Sidebar;
