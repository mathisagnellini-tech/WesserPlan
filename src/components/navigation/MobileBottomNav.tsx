import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUiStore } from '@/stores/uiStore';
import { mobileBottomTabs } from './navConfig';

const MobileBottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const openMobileMenu = useUiStore((s) => s.openMobileMenu);

  const isActivePath = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[var(--bg-main)]/95 backdrop-blur-xl border-t border-[var(--border-subtle)] safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {mobileBottomTabs.map((tab) => {
          const isActive = isActivePath(tab.path);
          const isMore = tab.id === 'settings';
          return (
            <button
              key={tab.id}
              onClick={() => isMore ? openMobileMenu() : navigate(tab.path)}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 rounded-xl transition-all duration-200
                ${isActive && !isMore ? 'text-[var(--accent-primary)]' : 'text-[var(--text-muted)]'}
              `}
            >
              <tab.icon size={22} strokeWidth={isActive && !isMore ? 2.5 : 1.8} />
              <span className={`text-[10px] font-bold ${isActive && !isMore ? 'text-[var(--accent-primary)]' : 'text-[var(--text-muted)]'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
