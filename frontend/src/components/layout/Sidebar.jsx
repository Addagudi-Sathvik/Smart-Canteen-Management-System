import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UtensilsCrossed } from 'lucide-react';
import { getNavForRole } from '../../config/navigation';
import { motionSpring } from '../../config/navigation';

const Sidebar = ({ user, isOpen, onClose, isMobile = false }) => {
  const location = useLocation();
  const links = getNavForRole(user?.role);

  const isActive = (path) => {
    if (path === '/' || path === '/admin' || path === '/staff') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const content = (
    <>
      <div className="flex items-center justify-between p-4 border-b border-brand-200/40 dark:border-brand-800/30">
        <Link to={links[0]?.to || '/'} className="flex items-center gap-2 text-brand-600 dark:text-brand-400" onClick={onClose}>
          <UtensilsCrossed className="w-6 h-6" />
          <span className="font-display font-bold text-lg">CanteenHub</span>
        </Link>
        {isMobile && (
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-brand-50 dark:hover:bg-espresso-800 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto" aria-label="Sidebar navigation">
        {links.map((link) => {
          const Icon = link.icon;
          const active = isActive(link.to);
          return (
            <Link
              key={link.to}
              to={link.to}
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all min-h-[44px] ${
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

      <div className="p-4 border-t border-brand-200/40 dark:border-brand-800/30">
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
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-espresso-950/50 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />
            <motion.aside
              className="fixed left-0 top-0 bottom-0 z-50 w-72 max-w-[85vw] glass-strong flex flex-col lg:hidden"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={motionSpring}
            >
              {content}
            </motion.aside>
          </>
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
