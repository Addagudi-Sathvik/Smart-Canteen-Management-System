import { Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import MobileSidebarDrawer from './MobileSidebarDrawer';
import MobileNav from './MobileNav';
import PageTransition from '../ui/PageTransition';
import CartDrawer from '../cart/CartDrawer';
import { SidebarProvider } from '../../contexts/SidebarContext';

const MainLayout = () => {
  const { user } = useSelector((state) => state.auth);

  const isStudent = user?.role === 'student';
  const showSidebar = user?.role === 'staff' || user?.role === 'admin';

  return (
    <SidebarProvider>
      <div className="min-h-screen mesh-bg flex flex-col">
        <Navbar />

        <div className="flex flex-1 max-w-[1600px] mx-auto w-full">
          {showSidebar && (
            <>
              <MobileSidebarDrawer user={user} />
              <Sidebar user={user} />
            </>
          )}

          <main
            className={`flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-6 ${
              isStudent ? 'pb-24 md:pb-6' : 'pb-6'
            }`}
          >
            <PageTransition>
              <Outlet />
            </PageTransition>
          </main>
        </div>

        {isStudent && <MobileNav />}
        {isStudent && <CartDrawer />}
      </div>
    </SidebarProvider>
  );
};

export default MainLayout;
