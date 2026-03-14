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
import { Home, Building, Mail, Database, Map, Truck, Settings, Upload, ChevronLeft, User, Star, History, Zap, Pin, PinOff, LogOut, Users, Compass } from 'lucide-react';

const tabConfig = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'communes', label: 'Nos Communes', icon: Building },
  { id: 'mairie', label: 'Relations Mairie', icon: Mail },
  { id: 'wplan', label: 'DataWiz', icon: Database },
  { id: 'zone-maker', label: 'Zone Maker', icon: Compass },
  { id: 'team-planner', label: 'Team Planner', icon: Users },
  { id: 'operations', label: 'Opérations', icon: Truck },
  { type: 'divider' },
  { id: 'upload', label: 'Upload', icon: Upload },
  { id: 'settings', label: 'Settings', icon: Settings },
] as const;

const Sidebar: React.FC<{
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  activeTab: TabName;
  onTabChange: (tab: TabName) => void;
}> = ({ isOpen, setIsOpen, activeTab, onTabChange }) => {
  const [isHovered, setIsHovered] = useState(false);
  const closeTimerRef = useRef<any>(null);

  const isExpanded = isOpen || isHovered;

  const handleMouseEnter = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (isOpen) {
        closeTimerRef.current = setTimeout(() => {
            setIsOpen(false);
        }, 3000);
    }
  };

  const togglePin = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsOpen(!isOpen);
  };

  return (
    <aside
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`fixed top-0 left-0 h-full z-50 bg-[#F8F9FE]/90 backdrop-blur-xl border-r border-white/50 flex flex-col transition-all duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)] shadow-2xl ${isExpanded ? 'w-72' : 'w-[88px]'}`}
    >
      {/* Header with Logo */}
      <div className="h-24 px-6 flex items-center justify-between shrink-0 relative">
         <div className="flex items-center gap-4 overflow-hidden w-full">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-xl shrink-0 shadow-lg shadow-blue-500/30">
                W
            </div>
            <div className={`flex flex-col transition-all duration-300 ${isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
                <span className="font-extrabold text-xl tracking-tight text-slate-800 whitespace-nowrap">Wesser Plan</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Suite v5.0</span>
            </div>
         </div>

         <button
          onClick={togglePin}
          className={`absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all duration-200 ${
              isExpanded
                ? 'opacity-100 text-slate-400 hover:text-blue-600 hover:bg-blue-50'
                : 'opacity-0 pointer-events-none'
          }`}
          title={isOpen ? "Détacher la barre" : "Épingler la barre"}
        >
          {isOpen ? <Pin size={18} className="fill-current"/> : <PinOff size={18}/>}
        </button>
      </div>

      {/* Content Container */}
      <div className="flex-grow flex flex-col px-4 gap-6 overflow-y-auto custom-scrollbar overflow-x-hidden">

          {/* Quick Access Section */}
          <div className={`transition-all duration-300 ease-in-out ${isExpanded ? 'opacity-100 max-h-40' : 'opacity-0 max-h-0 overflow-hidden'}`}>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 px-2 flex items-center gap-2">
                    <Zap size={12} className="text-amber-500 fill-current"/>
                    Accès Rapide
                </div>
                <div className="space-y-2">
                    <button className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all group">
                        <div className="p-1.5 bg-amber-50 rounded-lg text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                            <Star size={14} fill="currentColor"/>
                        </div>
                        <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900">Zone Alsace (S48)</span>
                    </button>
                    <button className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-purple-200 transition-all group">
                        <div className="p-1.5 bg-purple-50 rounded-lg text-purple-600 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                            <History size={14} />
                        </div>
                        <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900">Rapport Hebdo</span>
                    </button>
                </div>
          </div>

          {/* Main Navigation */}
          <nav className="space-y-1.5">
            {tabConfig.map((tab, index) => {
                if ('id' in tab) {
                    const isActive = activeTab === tab.id;
                    return (
                        <li key={tab.id} className="list-none">
                        <button
                            onClick={() => onTabChange(tab.id as TabName)}
                            className={`
                                group relative w-full flex items-center p-3.5 rounded-2xl transition-all duration-300 ease-out
                                ${isActive
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                                    : 'text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-md hover:shadow-slate-200/50'
                                }
                            `}
                            title={!isExpanded ? tab.label : undefined}
                        >
                            <div className={`
                                flex items-center justify-center shrink-0 transition-transform duration-300
                                ${isActive ? 'scale-110' : 'group-hover:scale-110'}
                            `}>
                                <tab.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                            </div>

                            <span className={`
                                ml-4 text-sm font-bold whitespace-nowrap overflow-hidden transition-all duration-300
                                ${isExpanded ? 'opacity-100 w-auto translate-x-0' : 'opacity-0 w-0 -translate-x-4'}
                            `}>
                                {tab.label}
                            </span>

                            {!isExpanded && isActive && (
                                <div className="absolute right-2 w-1.5 h-1.5 bg-blue-600 rounded-full ring-2 ring-white shadow-sm"></div>
                            )}
                        </button>
                        </li>
                    );
                } else {
                    return <div key={`divider-${index}`} className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent my-4 mx-2"></div>;
                }
            })}
          </nav>
      </div>

      {/* User Profile Footer */}
      <div className="p-4 mt-auto">
         <div className={`
            rounded-2xl p-3 transition-all duration-300 border border-transparent
            ${isExpanded ? 'bg-white border-slate-100 shadow-lg shadow-slate-200/50' : 'bg-transparent'}
         `}>
            <div className="flex items-center gap-3">
                <div className="relative shrink-0 cursor-pointer group">
                    <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white border-2 border-white shadow-md group-hover:scale-105 transition-transform">
                        <User size={20} />
                    </div>
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                </div>

                <div className={`flex flex-col overflow-hidden transition-all duration-300 ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
                    <span className="text-sm font-bold text-slate-800 truncate">Gérard Larcher</span>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase truncate">Administrateur</span>
                </div>

                {isExpanded && (
                    <button className="ml-auto p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <LogOut size={16} />
                    </button>
                )}
            </div>
         </div>
      </div>
    </aside>
  );
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabName>('dashboard');
  const [isSidebarPinned, setIsSidebarPinned] = useState(true);

  const handleTabChange = useCallback((tab: TabName) => {
    setActiveTab(tab);
  }, []);

  // For full-screen tabs like team-planner and zone-maker, use different layout
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
        return <SettingsTab />;
      default:
        return <div>Tab not found</div>;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FE] overflow-hidden relative">
      <Sidebar
        isOpen={isSidebarPinned}
        setIsOpen={setIsSidebarPinned}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
      <main
        className={`transition-all duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)] relative min-h-screen h-screen overflow-y-auto
          ${isSidebarPinned ? 'pl-[19rem]' : 'pl-[7.5rem]'}
        `}
      >
        {!isFullScreenTab && <div className="color-orb"></div>}

        <div className={isFullScreenTab ? 'h-full' : 'p-8 max-w-[1920px] mx-auto pb-24'}>
            {renderTabContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
