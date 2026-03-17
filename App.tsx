import React, { useState, useCallback, useRef, useEffect } from 'react';
import { TabName } from './types';
import DashboardTab from './components/DashboardTab';
import CommunesTab from './components/CommunesTab';
import MairieTab from './components/MairieTab';
import WplanTab from './components/WplanTab';
import ZonePlanner from './components/zone-maker/ZonePlanner';
import TeamPlannerApp from './components/team-planner/TeamPlannerApp';
import OperationsTab from './components/OperationsTab';
import UploadTab from './components/UploadTab';
import SettingsTab from './components/SettingsTab';
import { Home, Building, Mail, Database, Truck, Settings, Upload, Users, Compass, Menu, X, Moon, Sun, User, LogOut, ChevronDown } from 'lucide-react';

const tabConfig = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'communes', label: 'Nos Communes', icon: Building },
  { id: 'mairie', label: 'Relations Mairie', icon: Mail },
  { id: 'wplan', label: 'DataWiz', icon: Database },
  { id: 'zone-maker', label: 'Zone Maker', icon: Compass },
  { id: 'team-planner', label: 'Team Planner', icon: Users },
  { id: 'operations', label: 'Opérations', icon: Truck },
] as const;

const secondaryTabs = [
  { id: 'upload', label: 'Upload', icon: Upload },
  { id: 'settings', label: 'Settings', icon: Settings },
] as const;

// Bottom nav tabs for mobile - 5 most important tabs
const mobileBottomTabs = [
  { id: 'dashboard', label: 'Home', icon: Home },
  { id: 'communes', label: 'Communes', icon: Building },
  { id: 'operations', label: 'Ops', icon: Truck },
  { id: 'team-planner', label: 'Team', icon: Users },
  { id: 'settings', label: 'Plus', icon: Menu },
] as const;

function useTheme() {
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  const toggle = useCallback(() => {
    const html = document.documentElement;
    html.classList.add('theme-transition');
    if (isDark) {
      html.classList.remove('dark');
      localStorage.setItem('wesserplan-theme', 'light');
    } else {
      html.classList.add('dark');
      localStorage.setItem('wesserplan-theme', 'dark');
    }
    setIsDark(!isDark);
    setTimeout(() => html.classList.remove('theme-transition'), 350);
  }, [isDark]);

  const setTheme = useCallback((theme: 'light' | 'dark') => {
    const html = document.documentElement;
    html.classList.add('theme-transition');
    if (theme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
    localStorage.setItem('wesserplan-theme', theme);
    setIsDark(theme === 'dark');
    setTimeout(() => html.classList.remove('theme-transition'), 350);
  }, []);

  return { isDark, toggle, setTheme };
}

// ─── Top Navigation Bar (Desktop) ───────────────────────────
const TopNavbar: React.FC<{
  activeTab: TabName;
  onTabChange: (tab: TabName) => void;
  isDark: boolean;
  onToggleTheme: () => void;
}> = ({ activeTab, onTabChange, isDark, onToggleTheme }) => {
  const [showMore, setShowMore] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setShowMore(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="hidden md:block fixed top-0 left-0 right-0 z-50">
      <div className="bg-[var(--bg-main)]/80 backdrop-blur-2xl border-b border-[var(--border-subtle)]">
        <div className="max-w-[1920px] mx-auto flex items-center h-16 px-6 gap-6">

          {/* Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center text-white font-black text-lg shadow-lg shadow-[var(--accent-primary)]/20">
              W
            </div>
            <span className="font-extrabold text-lg tracking-tight text-[var(--text-primary)] whitespace-nowrap">
              Wesser Plan
            </span>
          </div>

          {/* Main Tabs - Pill Navigation */}
          <nav className="flex items-center bg-[var(--bg-card)]/60 backdrop-blur-xl rounded-2xl p-1.5 border border-[var(--border-color)] shadow-sm mx-auto">
            {tabConfig.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id as TabName)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-250 ease-out
                    ${isActive
                      ? 'bg-[var(--accent-primary)] text-white shadow-md shadow-[var(--accent-primary)]/25'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-solid)]/60'
                    }
                  `}
                >
                  <tab.icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Right Section: Secondary tabs, theme toggle, user */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Secondary tabs dropdown */}
            <div className="relative" ref={moreRef}>
              <button
                onClick={() => setShowMore(!showMore)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200
                  ${secondaryTabs.some(t => t.id === activeTab)
                    ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-solid)]'
                  }
                `}
              >
                <Settings size={16} />
                <ChevronDown size={14} className={`transition-transform duration-200 ${showMore ? 'rotate-180' : ''}`} />
              </button>

              {showMore && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-[var(--bg-card-solid)] border border-[var(--border-subtle)] rounded-2xl shadow-xl overflow-hidden z-50">
                  {secondaryTabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => { onTabChange(tab.id as TabName); setShowMore(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-colors
                          ${isActive
                            ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card)]/60 hover:text-[var(--text-primary)]'
                          }
                        `}
                      >
                        <tab.icon size={16} />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <button
              onClick={onToggleTheme}
              className="p-2.5 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-solid)] transition-all duration-200"
              title={isDark ? 'Mode clair' : 'Mode sombre'}
            >
              {isDark ? <Sun size={18} className="text-amber-500" /> : <Moon size={18} className="text-orange-400" />}
            </button>

            {/* User Avatar */}
            <div className="relative ml-1">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center text-white border-2 border-white/20 shadow-md cursor-pointer hover:scale-105 transition-transform">
                <User size={16} />
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-[var(--bg-main)] rounded-full"></span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

// ─── Mobile Sidebar (Full drawer) ───────────────────────────
const MobileSidebar: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  activeTab: TabName;
  onTabChange: (tab: TabName) => void;
  isDark: boolean;
  onToggleTheme: () => void;
}> = ({ isOpen, onClose, activeTab, onTabChange, isDark, onToggleTheme }) => {
  const allTabs = [...tabConfig, ...secondaryTabs];

  const handleTabChange = (tab: TabName) => {
    onTabChange(tab);
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
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as TabName)}
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
            onClick={onToggleTheme}
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
                <span className="text-sm font-bold text-[var(--text-primary)]">Gérard Larcher</span>
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

// ─── Mobile Bottom Navigation ───────────────────────────
const MobileBottomNav: React.FC<{
  activeTab: TabName;
  onTabChange: (tab: TabName) => void;
  onMorePress: () => void;
}> = ({ activeTab, onTabChange, onMorePress }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[var(--bg-main)]/95 backdrop-blur-xl border-t border-[var(--border-subtle)] safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {mobileBottomTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const isMore = tab.id === 'settings';
          return (
            <button
              key={tab.id}
              onClick={() => isMore ? onMorePress() : onTabChange(tab.id as TabName)}
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

// ─── Mobile Top Header ───────────────────────────
const MobileHeader: React.FC<{
  activeTab: TabName;
  onMenuPress: () => void;
}> = ({ activeTab, onMenuPress }) => {
  const allTabs = [...tabConfig, ...secondaryTabs];
  const tabLabel = allTabs.find(t => t.id === activeTab);
  const label = tabLabel ? tabLabel.label : 'Wesser Plan';

  return (
    <header className="fixed top-0 left-0 right-0 z-40 md:hidden bg-[var(--bg-main)]/90 backdrop-blur-xl border-b border-[var(--border-subtle)] safe-area-top">
      <div className="flex items-center h-14 px-4">
        <button
          onClick={onMenuPress}
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

// ─── Main App ───────────────────────────
const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabName>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isDark, toggle, setTheme } = useTheme();

  const handleTabChange = useCallback((tab: TabName) => {
    setActiveTab(tab);
  }, []);

  const isFullScreenTab = activeTab === 'team-planner';

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardTab isActive={activeTab === 'dashboard'} />;
      case 'communes':
        return <CommunesTab />;
      case 'mairie':
        return <MairieTab />;
      case 'wplan':
        return <WplanTab isActive={activeTab === 'wplan'} />;
      case 'zone-maker':
        return <ZonePlanner />;
      case 'team-planner':
        return <TeamPlannerApp />;
      case 'operations':
        return <OperationsTab isActive={activeTab === 'operations'} />;
      case 'upload':
        return <UploadTab />;
      case 'settings':
        return <SettingsTab isDark={isDark} onSetTheme={setTheme} />;
      default:
        return <div>Tab not found</div>;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] overflow-hidden relative">
      {/* Desktop Top Navigation */}
      <TopNavbar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        isDark={isDark}
        onToggleTheme={toggle}
      />

      {/* Mobile Header */}
      <MobileHeader activeTab={activeTab} onMenuPress={() => setIsMobileMenuOpen(true)} />

      {/* Mobile Sidebar Drawer */}
      <MobileSidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        isDark={isDark}
        onToggleTheme={toggle}
      />

      {/* Main Content */}
      <main
        className={`transition-all duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)] relative min-h-screen h-screen overflow-y-auto
          pl-0 pt-14 pb-20
          md:pt-16 md:pb-0 md:pl-0
        `}
      >
        {!isFullScreenTab && <div className="color-orb"></div>}

        <div className={isFullScreenTab ? 'h-full' : 'p-4 md:p-8 max-w-[1920px] mx-auto pb-24 md:pb-24'}>
          {renderTabContent()}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onMorePress={() => setIsMobileMenuOpen(true)}
      />
    </div>
  );
};

export default App;
