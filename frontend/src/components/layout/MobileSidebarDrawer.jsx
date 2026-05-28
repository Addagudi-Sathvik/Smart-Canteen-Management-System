import { useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { X, UtensilsCrossed } from 'lucide-react';
import { getNavForRole } from '../../config/navigation';
import { useSidebar } from '../../contexts/SidebarContext';

const SWIPE_CLOSE_THRESHOLD = 56;

const stopAndClose = (e, close) => {
  e.preventDefault();
  e.stopPropagation();
  close();
};

const MobileSidebarDrawer = ({ user }) => {
  const { isOpen, close } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const links = getNavForRole(user?.role);

  const closeBtnRef = useRef(null);
  const panelRef = useRef(null);
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
      if (e) stopAndClose(e, close);
      else close();
    },
    [close]
  );

  const handleNav = useCallback(
    (to) => (e) => {
      e.preventDefault();
      e.stopPropagation();
      close();
      if (location.pathname !== to) {
        navigate(to);
      }
    },
    [close, navigate, location.pathname]
  );

  const handleBackdropClose = useCallback(
    (e) => {
      if (panelRef.current?.contains(e.target)) return;
      handleClose(e);
    },
    [handleClose]
  );

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
    if (dy < 80 && dx < -SWIPE_CLOSE_THRESHOLD) {
      close();
    }
  };

  // Native capture listeners — survive React re-renders after navigation
  useEffect(() => {
    const btn = closeBtnRef.current;
    if (!btn || !isOpen) return undefined;

    const onCloseEvent = (e) => {
      e.preventDefault();
      e.stopPropagation();
      close();
    };

    btn.addEventListener('click', onCloseEvent, true);
    btn.addEventListener('touchend', onCloseEvent, { capture: true, passive: false });

    return () => {
      btn.removeEventListener('click', onCloseEvent, true);
      btn.removeEventListener('touchend', onCloseEvent, true);
    };
  }, [isOpen, close]);

  // Body scroll lock
  useEffect(() => {
    if (!isOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  // Escape key
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, close]);

  const homePath = links[0]?.to || '/';

  const linkClassName = (active) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors min-h-[48px] touch-manipulation pointer-events-auto ${
      active
        ? 'nav-link-active shadow-soft'
        : 'text-espresso-600 dark:text-espresso-400 hover:bg-brand-50/80 dark:hover:bg-espresso-800/80 active:bg-brand-100/80 dark:active:bg-espresso-800'
    }`;

  if (!isOpen) return null;

  const drawer = (
    <div
      className="fixed inset-0 z-[200] lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Navigation menu"
    >
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 z-0 bg-espresso-950/60 backdrop-blur-sm border-0 p-0 m-0 cursor-default pointer-events-auto animate-fade-in"
        aria-label="Close menu"
        onClick={handleBackdropClose}
        onTouchEnd={handleBackdropClose}
      />

      {/* Panel — CSS transform only (no Framer) for reliable Android hit-testing */}
      <aside
        ref={panelRef}
        className="absolute left-0 top-0 bottom-0 z-10 flex w-[min(288px,88vw)] max-w-full flex-col glass-strong shadow-elevated pointer-events-auto translate-x-0 transition-transform duration-300 ease-out"
        style={{ touchAction: 'manipulation' }}
      >
        <div className="relative z-30 flex shrink-0 items-center gap-2 border-b border-brand-200/40 p-4 dark:border-brand-800/30">
          <Link
            to={homePath}
            onClick={handleNav(homePath)}
            className="flex min-h-[44px] min-w-0 flex-1 items-center gap-2 overflow-hidden text-brand-600 touch-manipulation dark:text-brand-400 pointer-events-auto"
            style={{ touchAction: 'manipulation' }}
          >
            <UtensilsCrossed className="h-6 w-6 flex-shrink-0 pointer-events-none" />
            <span className="truncate font-display text-lg font-bold pointer-events-none">CanteenHub</span>
          </Link>

          <button
            ref={closeBtnRef}
            type="button"
            onClick={handleClose}
            onTouchEnd={handleClose}
            className="relative z-[130] flex h-12 w-12 min-h-[48px] min-w-[48px] flex-shrink-0 cursor-pointer items-center justify-center rounded-xl bg-espresso-100 p-3 active:scale-95 dark:bg-espresso-800 pointer-events-auto touch-manipulation select-none"
            style={{ touchAction: 'manipulation' }}
            aria-label="Close menu"
          >
            <X
              className="h-6 w-6 text-espresso-800 dark:text-espresso-100 pointer-events-none"
              strokeWidth={2.5}
            />
          </button>
        </div>

        <nav
          className="relative z-20 flex-1 space-y-1 overflow-y-auto overscroll-contain p-3 pointer-events-auto"
          style={{ touchAction: 'manipulation' }}
          aria-label="Sidebar navigation"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {links.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={handleNav(link.to)}
                className={linkClassName(active)}
                style={{ touchAction: 'manipulation' }}
              >
                <Icon className="h-5 w-5 flex-shrink-0 pointer-events-none" />
                <span className="pointer-events-none">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="relative z-20 shrink-0 border-t border-brand-200/40 p-4 safe-bottom dark:border-brand-800/30 pointer-events-auto">
          <div className="flex items-center gap-3 px-2">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt=""
                className="h-9 w-9 rounded-full ring-2 ring-brand-200 dark:ring-brand-800"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700 dark:bg-brand-900/50">
                {user?.name?.[0]}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-espresso-900 dark:text-espresso-100">
                {user?.name}
              </p>
              <p className="text-xs capitalize text-espresso-500">{user?.role}</p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );

  return createPortal(drawer, document.body);
};

export default MobileSidebarDrawer;
