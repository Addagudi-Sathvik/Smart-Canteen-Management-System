import { Link, useLocation } from 'react-router-dom';
import { UtensilsCrossed } from 'lucide-react';
import { getNavForRole } from '../../config/navigation';

/** Desktop sidebar only — mobile drawer is MobileSidebarDrawer.jsx */
const Sidebar = ({ user }) => {
  const location = useLocation();
  const links = getNavForRole(user?.role);

  const isActive = (path) => {
    if (path === '/' || path === '/admin' || path === '/staff') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const homePath = links[0]?.to || '/';

  const linkClassName = (active) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all min-h-[48px] ${
      active
        ? 'nav-link-active shadow-soft'
        : 'text-espresso-600 dark:text-espresso-400 hover:bg-brand-50/80 dark:hover:bg-espresso-800/80 active:bg-brand-100/80 dark:active:bg-espresso-800'
    }`;

  return (
    <aside className="hidden lg:flex flex-col w-64 flex-shrink-0 glass border-r border-brand-200/40 dark:border-brand-800/30 min-h-[calc(100vh-4rem)] sticky top-16">
      <div className="grid grid-cols-[1fr_auto] items-center gap-2 p-4 border-b border-brand-200/40 dark:border-brand-800/30 shrink-0">
        <Link
          to={homePath}
          className="flex items-center gap-2 text-brand-600 dark:text-brand-400 min-h-[44px] min-w-0 overflow-hidden"
        >
          <UtensilsCrossed className="w-6 h-6 flex-shrink-0" />
          <span className="font-display font-bold text-lg truncate">CanteenHub</span>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto overscroll-contain" aria-label="Sidebar navigation">
        {links.map((link) => {
          const Icon = link.icon;
          const active = isActive(link.to);
          return (
            <Link key={link.to} to={link.to} className={linkClassName(active)}>
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{link.label}</span>
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
    </aside>
  );
};

export default Sidebar;
