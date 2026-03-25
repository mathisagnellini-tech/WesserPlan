import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import TopNavbar from '@/components/navigation/TopNavbar';
import MobileHeader from '@/components/navigation/MobileHeader';
import MobileSidebar from '@/components/navigation/MobileSidebar';
import MobileBottomNav from '@/components/navigation/MobileBottomNav';
import { useUiStore } from '@/stores/uiStore';

const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center h-64">
    <div className="w-8 h-8 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin"></div>
  </div>
);

export const MainLayout: React.FC = () => {
  const { isMobileMenuOpen, openMobileMenu, closeMobileMenu } = useUiStore();

  return (
    <div className="min-h-screen bg-[var(--bg-main)] overflow-hidden relative">
      {/* Desktop Top Navigation */}
      <TopNavbar />

      {/* Mobile Header */}
      <MobileHeader onMenuPress={openMobileMenu} />

      {/* Mobile Sidebar Drawer */}
      <MobileSidebar
        isOpen={isMobileMenuOpen}
        onClose={closeMobileMenu}
      />

      {/* Main Content */}
      <main
        className="transition-all duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)] relative min-h-screen h-screen overflow-y-auto
          pl-0 pt-14 pb-20
          md:pt-16 md:pb-0 md:pl-0
        "
      >
        <div className="color-orb"></div>

        <div className="p-4 md:p-8 max-w-[1920px] mx-auto pb-24 md:pb-24">
          <Suspense fallback={<LoadingSpinner />}>
            <Outlet />
          </Suspense>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
};
