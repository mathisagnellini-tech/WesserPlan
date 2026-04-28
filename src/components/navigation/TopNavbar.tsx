import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Settings, Moon, Sun, User } from 'lucide-react';
import { useThemeStore } from '@/stores/themeStore';
import { useAuth } from '@/hooks/useAuth';
import { tabConfig } from './navConfig';

const TopNavbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, toggle } = useThemeStore();
  const { userName } = useAuth();

  const userInitials = userName
    ? userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '';

  const isActivePath = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="hidden md:block fixed top-0 left-0 right-0 z-50">
      <div className="bg-[var(--bg-main)]/80 backdrop-blur-2xl border-b border-[var(--border-subtle)]">
        <div className="max-w-[1920px] mx-auto flex items-center h-16 px-4 lg:px-6 gap-3 lg:gap-6">

          {/* Logo */}
          <div className="flex items-center gap-2 lg:gap-3 shrink-0">
            <img src="/logo.png" alt="Wesser Plan" className="w-8 h-8 lg:w-9 lg:h-9 object-contain" />
            <span className="font-extrabold text-base lg:text-lg tracking-tight text-[var(--text-primary)] whitespace-nowrap hidden lg:inline">
              Wesser Plan
            </span>
          </div>

          {/* Main Tabs - Pill Navigation */}
          <nav className="flex items-center bg-[var(--bg-card)]/80 backdrop-blur-xl rounded-2xl p-1 lg:p-1.5 border border-[var(--border-color)] shadow-sm mx-auto overflow-x-auto scrollbar-none">
            {tabConfig.map((tab) => {
              const isActive = isActivePath(tab.path);
              return (
                <button
                  key={tab.id}
                  onClick={() => navigate(tab.path)}
                  title={tab.label}
                  className={`
                    flex items-center gap-1.5 lg:gap-2 px-2.5 lg:px-4 py-2 rounded-xl text-xs lg:text-sm font-semibold whitespace-nowrap transition-all duration-250 ease-out shrink-0 focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:outline-none
                    ${isActive
                      ? 'bg-[var(--accent-primary)] text-white shadow-md shadow-[var(--accent-primary)]/25'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-solid)]/60'
                    }
                  `}
                >
                  <tab.icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="hidden xl:inline">{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Section: Settings, theme toggle, user */}
          <div className="flex items-center gap-1.5 lg:gap-2 shrink-0">
            {/* Settings */}
            <button
              type="button"
              onClick={() => navigate('/settings')}
              aria-label="Paramètres"
              title="Paramètres"
              className={`flex items-center gap-1.5 px-2.5 lg:px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:outline-none
                ${isActivePath('/settings')
                  ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-solid)]'
                }
              `}
            >
              <Settings size={16} />
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggle}
              className="p-2 lg:p-2.5 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-solid)] transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:outline-none"
              title={isDark ? 'Mode clair' : 'Mode sombre'}
              aria-label={isDark ? 'Activer le mode clair' : 'Activer le mode sombre'}
            >
              {isDark ? <Sun size={18} className="text-amber-500" /> : <Moon size={18} className="text-slate-500 dark:text-slate-400" />}
            </button>

            {/* User Avatar */}
            <button
              type="button"
              onClick={() => navigate('/settings')}
              aria-label={userName ? `Paramètres — ${userName}` : 'Paramètres du compte'}
              title="Paramètres"
              className="relative ml-0.5 lg:ml-1 group cursor-pointer rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
            >
              <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center text-white border-2 border-white/20 shadow-md hover:scale-105 transition-transform">
                {userInitials ? (
                  <span className="text-xs lg:text-sm font-bold">{userInitials}</span>
                ) : (
                  <>
                    <User size={14} className="lg:hidden" />
                    <User size={16} className="hidden lg:block" />
                  </>
                )}
              </div>
              <span aria-hidden="true" className="absolute bottom-0 right-0 w-2 h-2 lg:w-2.5 lg:h-2.5 bg-green-500 border-2 border-[var(--bg-card-solid)] rounded-full"></span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopNavbar;
