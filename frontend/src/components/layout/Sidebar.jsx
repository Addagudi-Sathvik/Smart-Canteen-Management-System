import { useRef, useCallback, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UtensilsCrossed } from 'lucide-react';
import { getNavForRole, motionSpring } from '../../config/navigation';

const SWIPE_CLOSE_THRESHOLD = 56;

const Sidebar = ({ user, isOpen = false, onClose, isMobile = false }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const links = getNavForRole(user?.role);

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const prevPathRef = useRef(location.pathname);
  const onCloseRef = useRef(onClose);

  onCloseRef.current = onClose;

  const closeMenu = useCallback(() => {
    onCloseRef.current?.();
  }, []);

  const isActive = (path) => {
    if (path === '/' || path === '/admin' || path === '/staff') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const handleCloseInteraction = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeMenu();
    },
    [closeMenu]
  );

  const handleNavTo = useCallback(
    (to) => (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeMenu();
      if (location.pathname !== to) {
        navigate(to);
      }
    },
    [closeMenu, navigate, location.pathname]
  );

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
    if (dy < 80 && dx < -SWIPE_CLOSE_THRESHOLD) {
      closeMenu();
    }
  };

  const linkClassName = (active) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all min-h-[48px] touch-manipulation ${
      active
        ? 'nav-link-active shadow-soft'
        : 'text-espresso-600 dark:text-espresso-400 hover:bg-brand-50/80 dark:hover:bg-espresso-800/80 active:bg-brand-100/80 dark:active:bg-espresso-800'
    }`;

  // Lock body scroll while mobile drawer is open
  useEffect(() => {
    if (!isMobile || !isOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isMobile, isOpen]);

  // Escape closes drawer
  useEffect(() => {
    if (!isMobile || !isOpen) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') closeMenu();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isMobile, isOpen, closeMenu]);

  // Auto-close after route change (before paint to avoid ghost overlays on Android)
  useLayoutEffect(() => {
    if (!isMobile) return;
    const prev = prevPathRef.current;
    prevPathRef.current = location.pathname;
    if (isOpen && prev !== location.pathname) {
      closeMenu();
    }
  }, [location.pathname, isMobile, isOpen, closeMenu]);

  const homePath = links[0]?.to || '/';

  const content = (
    <>
      <div className="relative z-20 grid grid-cols-[1fr_auto] items-center gap-2 p-4 border-b border-brand-200/40 dark:border-brand-800/30 shrink-0">
        {isMobile ? (
          <a
            href={homePath}
            onClick={handleNavTo(homePath)}
            className="flex items-center gap-2 text-brand-600 dark:text-brand-400 min-h-[44px] min-w-0 overflow-hidden touch-manipulation"
          >
            <UtensilsCrossed className="w-6 h-6 flex-shrink-0 pointer-events-none" />
            <span className="font-display font-bold text-lg truncate pointer-events-none">CanteenHub</span>
          </a>
        ) : (
          <Link
            to={homePath}
            className="flex items-center gap-2 text-brand-600 dark:text-brand-400 min-h-[44px] min-w-0 overflow-hidden"
          >
            <UtensilsCrossed className="w-6 h-6 flex-shrink-0" />
            <span className="font-display font-bold text-lg truncate">CanteenHub</span>
          </Link>
        )}

        {isMobile && (
          <button
            type="button"
            onClick={handleCloseInteraction}
            onTouchEnd={handleCloseInteraction}
            className="relative z-[120] flex-shrink-0 p-2.5 rounded-xl bg-espresso-100 dark:bg-espresso-800 hover:bg-brand-50 dark:hover:bg-espresso-700 active:scale-95 min-h-[48px] min-w-[48px] flex items-center justify-center touch-manipulation cursor-pointer select-none"
            style={{ touchAction: 'manipulation' }}
            aria-label="Close menu"
          >
            <X
              className="w-6 h-6 text-espresso-800 dark:text-espresso-100 pointer-events-none"
              strokeWidth={2.5}
            />
          </button>
        )}
      </div>

      <nav
        className="flex-1 p-3 space-y-1 overflow-y-auto overscroll-contain touch-manipulation"
        style={isMobile ? { touchAction: 'manipulation' } : undefined}
        aria-label="Sidebar navigation"
        onTouchStart={isMobile ? handleTouchStart : undefined}
        onTouchEnd={isMobile ? handleTouchEnd : undefined}
      >
        {links.map((link) => {
          const Icon = link.icon;
          const active = isActive(link.to);

          if (isMobile) {
            return (
              <a
                key={link.to}
                href={link.to}
                role="link"
                onClick={handleNavTo(link.to)}
                className={linkClassName(active)}
              >
                <Icon className="w-5 h-5 flex-shrink-0 pointer-events-none" />
                <span className="pointer-events-none">{link.label}</span>
              </a>
            );
          }

          return (
            <Link key={link.to} to={link.to} className={linkClassName(active)}>
              <Icon className="w-5 h-5 flex-shrink-0 pointer-events-none" />
              <span className="pointer-events-none">{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-brand-200/40 dark:border-brand-800/30 shrink-0 safe-bottom">
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

  const mobileDrawer = (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          key="mobile-sidebar"
          className="fixed inset-0 z-[200] lg:hidden touch-manipulation"
          style={{ touchAction: 'manipulation' }}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.button
            type="button"
            className="absolute inset-0 z-0 bg-espresso-950/60 backdrop-blur-sm cursor-default border-0 p-0 m-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCloseInteraction}
            onTouchEnd={handleCloseInteraction}
            aria-label="Close menu"
          />

          <motion.aside
            className="absolute left-0 top-0 bottom-0 z-10 w-[min(288px,88vw)] max-w-full glass-strong flex flex-col shadow-elevated pointer-events-auto"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={motionSpring}
            style={{ willChange: 'transform' }}
          >
            {content}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (isMobile) {
    return createPortal(mobileDrawer, document.body);
  }

  return (
    <aside className="hidden lg:flex flex-col w-64 flex-shrink-0 glass border-r border-brand-200/40 dark:border-brand-800/30 min-h-[calc(100vh-4rem)] sticky top-16">
      {content}
    </aside>
  );
};

export default Sidebar;
