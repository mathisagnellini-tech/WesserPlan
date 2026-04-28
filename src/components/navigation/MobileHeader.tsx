import React from 'react';
import { useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { tabConfig, secondaryTabs } from './navConfig';

interface MobileHeaderProps {
  onMenuPress: () => void;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({ onMenuPress }) => {
  const location = useLocation();
  const allTabs = [...tabConfig, ...secondaryTabs];

  const currentTab = allTabs.find(t => {
    if (t.path === '/') return location.pathname === '/';
    return location.pathname.startsWith(t.path);
  });
  const label = currentTab ? currentTab.label : 'Wesser Plan';

  return (
    <header className="fixed top-0 left-0 right-0 z-40 md:hidden bg-[var(--bg-main)]/90 backdrop-blur-xl border-b border-[var(--border-subtle)] safe-area-top">
      <div className="flex items-center h-14 px-4">
        <button
          onClick={onMenuPress}
          aria-label="Ouvrir le menu"
          className="p-2 -ml-2 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-card-solid)] transition-colors"
        >
          <Menu size={22} />
        </button>
        <div className="flex items-center gap-2.5 ml-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center text-white font-black text-xs shadow-md">
            W
          </div>
          <span className="font-bold text-[var(--text-primary)] text-sm">{label}</span>
        </div>
      </div>
    </header>
  );
};

export default MobileHeader;
