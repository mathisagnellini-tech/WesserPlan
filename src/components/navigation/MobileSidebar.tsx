import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X, Moon, Sun, User, LogOut } from 'lucide-react';
import { useThemeStore } from '@/stores/themeStore';
import { tabConfig, secondaryTabs } from './navConfig';

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileSidebar: React.FC<MobileSidebarProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, toggle } = useThemeStore();
  const allTabs = [...tabConfig, ...secondaryTabs];

  const isActivePath = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleTabChange = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full z-50 w-72 bg-[var(--bg-main)]/95 backdrop-blur-xl border-r border-[var(--border-subtle)] flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)] shadow-2xl md:hidden
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="h-20 px-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center text-white font-black text-lg shadow-lg">
              W
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg text-[var(--text-primary)]">Wesser Plan</span>
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Suite v5.0</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-solid)]">
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-grow px-4 space-y-1 overflow-y-auto custom-scrollbar">
          {allTabs.map((tab) => {
            const isActive = isActivePath(tab.path);
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.path)}
                className={`
                  w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all duration-300
                  ${isActive
                    ? 'bg-[var(--accent-primary)] text-white shadow-lg shadow-[var(--accent-primary)]/25'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-solid)] hover:text-[var(--text-primary)]'
                  }
                `}
              >
                <tab.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-sm font-bold">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 mt-auto space-y-3">
          <button
            onClick={toggle}
            className="w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-[var(--text-secondary)] hover:bg-[var(--bg-card-solid)] hover:text-[var(--text-primary)]"
          >
            {isDark ? <Sun size={20} className="text-amber-500" /> : <Moon size={20} className="text-orange-400" />}
            <span className="text-sm font-bold">{isDark ? 'Mode Clair' : 'Mode Sombre'}</span>
          </button>

          <div className="rounded-2xl p-3 bg-[var(--bg-card-solid)] border border-[var(--border-subtle)] shadow-lg">
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center text-white border-2 border-white/20 shadow-md">
                  <User size={18} />
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[var(--bg-card-solid)] rounded-full"></span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-[var(--text-primary)]">G\u00e9rard Larcher</span>
                <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase">Administrateur</span>
              </div>
              <button className="ml-auto p-1.5 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default MobileSidebar;
