import React, { Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import TopNavbar from '@/components/navigation/TopNavbar';
import MobileHeader from '@/components/navigation/MobileHeader';
import MobileSidebar from '@/components/navigation/MobileSidebar';
import MobileBottomNav from '@/components/navigation/MobileBottomNav';
import { LoadingState } from '@/components/ui/LoadingState';
import { useUiStore } from '@/stores/uiStore';

const TITLES: Record<string, string> = {
  '/': 'Tableau de bord',
  '/communes': 'Communes',
  '/mairie': 'Relations Mairie',
  '/wplan': 'Wplan',
  '/zone-maker': 'Zone Maker',
  '/operations': 'Opérations',
  '/upload': 'Importer',
  '/settings': 'Paramètres',
};

export const MainLayout: React.FC = () => {
  const { isMobileMenuOpen, openMobileMenu, closeMobileMenu } = useUiStore();
  const location = useLocation();

  useEffect(() => {
    const title = TITLES[location.pathname] ?? 'WesserPlan';
    document.title = `${title} · Wesser Plan`;
  }, [location.pathname]);

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
          <Suspense fallback={<LoadingState fullHeight />}>
            <Outlet />
          </Suspense>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
};
