import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { MapPin, Target, Layers, ArrowLeft, X, Library, Search, Check, Lightbulb, AlertTriangle, Ban, CheckCircle2, Radar, Shuffle, TrendingUp, Euro, Users, Building2, Vote, Briefcase, UserPlus, Sprout, Heart, Clock, CloudRain, Fingerprint, Activity } from 'lucide-react';
import { eventData, dataLibraryData } from '../constants';

declare const L: any;
declare const Chart: any;

interface WplanTabProps {
  isActive: boolean;
}

// --- Redesigned MultiSelect Dropdown ---
const MultiSelectDropdown: React.FC<{
  options: { value: string, label: string }[];
  selected: Set<string>;
  onSelectionChange: (value: string) => void;
  onClear: () => void;
  title: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}> = ({ options, selected, onSelectionChange, onClear, title, disabled = false, icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = useMemo(() => {
      return options.filter(opt => opt.label.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [options, searchTerm]);

  const selectedLabel = useMemo(() => {
      if (selected.size === 0) return title;
      if (selected.size === 1) {
          const val = Array.from(selected)[0];
          return options.find(o => o.value === val)?.label || val;
      }
      return `${selected.size} sélectionnés`;
  }, [selected, options, title]);

  return (
    <div className="relative z-50" ref={dropdownRef}>
      <button 
        onClick={() => !disabled && setIsOpen(!isOpen)} 
        disabled={disabled} 
        className={`w-full text-left px-4 py-3 rounded-xl border transition-all duration-200 flex justify-between items-center shadow-sm group relative z-10
        ${disabled
            ? 'bg-gray-100 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-400 cursor-not-allowed'
            : isOpen
                ? 'bg-white dark:bg-[var(--bg-card-solid)] border-orange-500 ring-2 ring-orange-500/20'
                : 'bg-white dark:bg-[var(--bg-card-solid)] border-gray-200 dark:border-slate-700 hover:border-orange-300 hover:shadow-md text-[var(--text-primary)]'
        }`}
      >
        <div className="flex items-center gap-3 overflow-hidden">
            <div className={`p-2 rounded-lg ${selected.size > 0 ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600' : 'bg-gray-100 dark:bg-slate-800 text-gray-500'}`}>
                {icon}
            </div>
            <div className="flex flex-col">
                <span className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${selected.size > 0 ? "text-orange-600" : "text-[var(--text-muted)]"}`}>
                    {selected.size > 0 ? "Filtre Actif" : "Filtrer par"}
                </span>
                <span className={`font-bold truncate text-sm ${selected.size > 0 ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}`}>
                    {selectedLabel}
                </span>
            </div>
        </div>
        <Layers size={18} className={`text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-orange-500' : 'group-hover:text-orange-500'}`} />
      </button>

      {isOpen && (
        <div className="absolute top-[calc(100%+8px)] left-0 w-full min-w-0 sm:min-w-[320px] bg-white dark:bg-[var(--bg-card-solid)] border border-[var(--border-subtle)] rounded-xl shadow-2xl z-[100] overflow-hidden animate-fade-in flex flex-col max-h-[400px] ring-1 ring-black/5">
            <div className="p-3 border-b border-[var(--border-subtle)] sticky top-0 bg-white dark:bg-[var(--bg-card-solid)] z-10">
                <div className="relative group">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors"/>
                    <input 
                        type="text" 
                        placeholder="Rechercher..." 
                        className="w-full pl-10 pr-3 py-2.5 bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text-primary)] focus:bg-white dark:focus:bg-slate-800 focus:border-orange-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoFocus
                    />
                </div>
            </div>
            <div className="overflow-y-auto p-2 custom-scrollbar flex-grow bg-white dark:bg-[var(--bg-card-solid)]">
                {filteredOptions.length > 0 ? (
                    filteredOptions.map(({ value, label }) => {
                        const isSelected = selected.has(value);
                        return (
                            <div 
                                key={value} 
                                onClick={() => onSelectionChange(value)}
                                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all mb-1 border border-transparent
                                ${isSelected ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 border-orange-100 dark:border-orange-800' : 'hover:bg-gray-50 dark:hover:bg-slate-800/50 text-[var(--text-secondary)] hover:border-gray-100 dark:hover:border-slate-700'}`}
                            >
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors flex-shrink-0
                                    ${isSelected ? 'bg-orange-600 border-orange-600' : 'border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800'}`}>
                                    {isSelected && <Check size={12} className="text-white stroke-[3]" />}
                                </div>
                                <span className="text-sm font-medium">{label}</span>
                            </div>
                        );
                    })
                ) : (
                    <div className="p-8 text-center">
                        <p className="text-sm text-gray-400 font-medium">Aucun résultat trouvé</p>
                    </div>
                )}
            </div>
            {selected.size > 0 && (
                <div className="p-3 bg-gray-50 dark:bg-slate-800/50 border-t border-[var(--border-subtle)] flex justify-between items-center">
                     <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide ml-1">
                        {selected.size} sélectionné(s)
                    </span>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onClear(); }}
                        className="text-xs font-bold text-red-500 hover:text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors"
                    >
                        Tout effacer
                    </button>
                </div>
            )}
        </div>
      )}
    </div>
  );
};

// --- DATA LAB WIDGETS ---
const GoldenHourWidget: React.FC = () => {
    return (
        <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700/50 flex flex-col items-center justify-center relative overflow-hidden group hover:border-orange-500/30 transition-all">
            <div className="absolute top-0 right-0 p-3 opacity-50 group-hover:opacity-100 transition-opacity">
                <Clock size={20} className="text-orange-400" />
            </div>
            <h4 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">Horloge Thermique</h4>
            <div className="relative w-32 h-32 flex items-center justify-center">
                {/* Mock Clock Visual */}
                <div className="absolute inset-0 rounded-full border-4 border-slate-700"></div>
                {/* Golden Segment */}
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-amber-400 border-r-amber-400 rotate-45 shadow-[0_0_15px_rgba(251,191,36,0.4)]"></div>
                <div className="text-center z-10">
                    <p className="text-2xl font-black text-white">17h45</p>
                    <p className="text-xs font-bold text-slate-400">-</p>
                    <p className="text-2xl font-black text-white">19h15</p>
                </div>
            </div>
            <p className="text-center text-xs text-orange-300 mt-3 font-medium">Pic de conversion (+24%)</p>
        </div>
    );
};

const WeatherCorrelatorWidget: React.FC = () => {
    return (
        <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700/50 flex flex-col relative overflow-hidden group hover:border-orange-500/30 transition-all">
            <div className="absolute top-0 right-0 p-3 opacity-50 group-hover:opacity-100 transition-opacity">
                <CloudRain size={20} className="text-orange-400" />
            </div>
            <h4 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Weather-Correlator</h4>
            <div className="flex-grow flex items-end gap-1 h-32 mt-2">
                {/* Mock Chart Bars */}
                {[40, 60, 30, 80, 20, 90, 50, 45].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col justify-end gap-1 h-full group/bar">
                         {/* Rain */}
                        <div style={{height: `${100-h}%`}} className="bg-orange-500/30 w-full rounded-t-sm relative"></div>
                         {/* Signatures */}
                        <div style={{height: `${h}%`}} className="bg-amber-400/80 w-full rounded-t-sm shadow-[0_0_10px_rgba(251,191,36,0.3)]"></div>
                    </div>
                ))}
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 mt-2 font-mono">
                <span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span><span>D</span>
            </div>
            <p className="text-xs text-slate-300 mt-3"><span className="text-red-400 font-bold">Alert:</span> Chute de 40% dès 3mm de pluie/h.</p>
        </div>
    );
};

const GenomeWidget: React.FC = () => {
    return (
        <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700/50 flex flex-col relative overflow-hidden group hover:border-orange-500/30 transition-all">
             <div className="absolute top-0 right-0 p-3 opacity-50 group-hover:opacity-100 transition-opacity">
                <Fingerprint size={20} className="text-orange-400" />
            </div>
            <h4 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">Génome Donateur (S42)</h4>
            <div className="flex items-center gap-4">
                 <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-purple-600 p-0.5 shadow-lg shadow-purple-500/20">
                     <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center">
                         <UserPlus size={28} className="text-white" />
                     </div>
                 </div>
                 <div className="space-y-1">
                     <div className="flex items-center gap-2">
                         <span className="text-xs font-bold bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">AGE</span>
                         <span className="text-lg font-black text-white">42 ans</span>
                     </div>
                     <div className="flex items-center gap-2">
                         <span className="text-xs font-bold bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">REV</span>
                         <span className="text-sm font-bold text-green-400">32k€ / an</span>
                     </div>
                     <div className="flex items-center gap-2">
                         <span className="text-xs font-bold bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">HAB</span>
                         <span className="text-sm font-medium text-slate-300">Maison Indiv.</span>
                     </div>
                 </div>
            </div>
            <div className="mt-4 w-full bg-slate-700/50 h-1.5 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-orange-400 to-purple-500 w-[75%] h-full"></div>
            </div>
            <p className="text-[10px] text-right text-slate-500 mt-1 font-mono">Match Index: 94%</p>
        </div>
    );
};

const SeismographWidget: React.FC = () => {
     return (
        <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700/50 flex flex-col relative overflow-hidden group hover:border-orange-500/30 transition-all">
            <div className="absolute top-0 right-0 p-3 opacity-50 group-hover:opacity-100 transition-opacity">
                <Activity size={20} className="text-red-400" />
            </div>
            <h4 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">Sismographe Objections</h4>
            <div className="flex flex-wrap gap-2 items-center justify-center h-full content-center">
                 <span className="text-2xl font-black text-white animate-pulse">POUVOIR D'ACHAT</span>
                 <span className="text-sm font-bold text-slate-500">Pas le temps</span>
                 <span className="text-base font-bold text-slate-400">Déjà donateur</span>
                 <span className="text-xs font-medium text-slate-600">Méfiance</span>
                 <span className="text-lg font-bold text-red-400">SCANDALE</span>
            </div>
        </div>
    );
};

const DataLibraryModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[200] animate-fade-in flex items-center justify-center p-4" onClick={onClose}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md"></div>
        
        <div className="relative bg-slate-900 w-full max-w-6xl h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-700/50" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <header className="flex justify-between items-center p-8 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
              <div className="flex items-center gap-4">
                  <div className="p-3 bg-orange-600 rounded-2xl shadow-[0_0_20px_rgba(37,99,235,0.5)]">
                    <Library className="text-white w-6 h-6" />
                  </div>
                  <div>
                      <h3 className="text-3xl font-black text-white tracking-tight">Data Lab <span className="text-orange-500">.</span></h3>
                      <p className="text-slate-400 text-sm font-medium">Observatoire de la donnée terrain & Intelligence Artificielle</p>
                  </div>
              </div>
              <button onClick={onClose} className="p-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"><X size={24} /></button>
            </header>

            <div className="overflow-y-auto custom-scrollbar p-8">
                
                {/* Section 1: Live Widgets */}
                <div className="mb-12">
                    <h4 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        Insights Temps Réel
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <GoldenHourWidget />
                        <WeatherCorrelatorWidget />
                        <GenomeWidget />
                        <SeismographWidget />
                    </div>
                </div>

                {/* Section 2: Catalogue (Original Data) */}
                <div className="mb-8">
                    <h4 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
                        <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                        Catalogue de Données
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {dataLibraryData.categories.map((category, idx) => (
                            <div key={category.nom} className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700 hover:border-orange-500/30 transition-colors group">
                                <h5 className="font-bold text-orange-400 mb-4 text-sm uppercase tracking-wider flex items-center justify-between">
                                    {category.nom}
                                    <span className="text-slate-600 text-[10px] bg-slate-800 px-2 py-1 rounded-full group-hover:text-white transition-colors">{category.items.length}</span>
                                </h5>
                                <div className="flex flex-wrap gap-2">
                                    {category.items.map(item => (
                                        <span key={item} className="bg-slate-900 text-slate-300 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-700 group-hover:border-slate-600 transition-colors cursor-default">
                                            {item}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    </div>
  );
};

// --- METRICS DEFINITIONS & LEGENDS ---
type MapMetric = 'density' | 'income' | 'donors' | 'visits' | 'politics' | 'unemployment' | 'age' | 'urbanity' | 'generosity_score';

interface MetricConfig {
    label: string;
    icon: React.ReactNode;
    colors: string[]; // Low to High
    labels: string[]; // Corresponding labels
    getValueColor: (val: number) => string; // Logic to map 0-100 value to color
}

const METRICS_CONFIG: Record<MapMetric, MetricConfig> = {
    density: {
        label: 'Densité Pop.',
        icon: <Users size={16}/>,
        colors: ['#ddd6fe', '#a78bfa', '#8b5cf6', '#6d28d9', '#4c1d95'],
        labels: ['< 50 hab/km²', '50-150', '150-500', '500-2000', '> 2000'],
        getValueColor: (val) => {
            if (val > 80) return '#4c1d95';
            if (val > 60) return '#6d28d9';
            if (val > 40) return '#8b5cf6';
            if (val > 20) return '#a78bfa';
            return '#ddd6fe';
        }
    },
    income: {
        label: 'Revenus Médian',
        icon: <Euro size={16}/>,
        colors: ['#a7f3d0', '#34d399', '#10b981', '#059669', '#064e3b'],
        labels: ['< 18k€', '18-22k€', '22-28k€', '28-35k€', '> 35k€'],
        getValueColor: (val) => {
            if (val > 80) return '#064e3b';
            if (val > 60) return '#059669';
            if (val > 40) return '#10b981';
            if (val > 20) return '#34d399';
            return '#a7f3d0';
        }
    },
    donors: {
        label: 'Donateurs / Hab.',
        icon: <Heart size={16}/>,
        colors: ['#bfdbfe', '#60a5fa', '#3b82f6', '#1d4ed8', '#1e3a8a'],
        labels: ['Très faible', 'Faible', 'Moyen', 'Élevé', 'Top performeur'],
        getValueColor: (val) => {
            if (val > 80) return '#1e3a8a';
            if (val > 60) return '#1d4ed8';
            if (val > 40) return '#3b82f6';
            if (val > 20) return '#60a5fa';
            return '#bfdbfe';
        }
    },
    visits: {
        label: 'Passages',
        icon: <TrendingUp size={16}/>,
        colors: ['#fed7aa', '#fb923c', '#ea580c', '#c2410c', '#7c2d12'],
        labels: ['Jamais visité', '1 passage', '2-3 passages', '4-5 passages', 'Saturé (>5)'],
        getValueColor: (val) => {
            if (val > 80) return '#7c2d12';
            if (val > 60) return '#c2410c';
            if (val > 40) return '#ea580c';
            if (val > 20) return '#fb923c';
            return '#fed7aa';
        }
    },
    politics: {
        label: 'Politique',
        icon: <Vote size={16}/>,
        colors: ['#1e40af', '#fbbf24', '#be185d'],
        labels: ['Dominante Droite', 'Centre / Indécis', 'Dominante Gauche'],
        getValueColor: (val) => {
            if (val < 33) return '#1e40af';
            if (val < 66) return '#fbbf24';
            return '#be185d';
        }
    },
    unemployment: {
        label: 'Chômage',
        icon: <Briefcase size={16}/>,
        colors: ['#fecaca', '#f87171', '#ef4444', '#b91c1c', '#7f1d1d'],
        labels: ['< 5%', '5-7%', '7-9%', '9-12%', '> 12%'],
        getValueColor: (val) => {
            if (val > 80) return '#7f1d1d';
            if (val > 60) return '#b91c1c';
            if (val > 40) return '#ef4444';
            if (val > 20) return '#f87171';
            return '#fecaca';
        }
    },
    age: {
        label: 'Âge Moyen',
        icon: <UserPlus size={16}/>,
        colors: ['#cffafe', '#22d3ee', '#0e7490', '#155e75', '#164e63'],
        labels: ['< 30 ans', '30-40 ans', '40-50 ans', '50-65 ans', '> 65 ans'],
        getValueColor: (val) => {
            if (val > 80) return '#164e63';
            if (val > 60) return '#155e75';
            if (val > 40) return '#0e7490';
            if (val > 20) return '#22d3ee';
            return '#cffafe';
        }
    },
    urbanity: {
        label: 'Rural / Urbain',
        icon: <Building2 size={16}/>,
        colors: ['#15803d', '#374151'],
        labels: ['Rural', 'Urbain'],
        getValueColor: (val) => {
            if (val > 50) return '#374151'; // Urban
            return '#15803d'; // Rural
        }
    },
    generosity_score: {
        label: 'Score Générosité',
        icon: <Sprout size={16}/>,
        colors: ['#fbcfe8', '#f472b6', '#db2777', '#be185d'],
        labels: ['C', 'B', 'A', 'A+'],
        getValueColor: (val) => {
            if (val > 80) return '#be185d';
            if (val > 60) return '#db2777';
            if (val > 40) return '#f472b6';
            return '#fbcfe8';
        }
    }
};


const WplanTab: React.FC<WplanTabProps> = ({ isActive }) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const geoJsonLayerRef = useRef<any>(null);
    const eventMarkersRef = useRef<any[]>([]);
    
    const chartRefs = {
        topDepts: useRef<HTMLCanvasElement>(null),
    };
    const chartInstances = useRef<Record<string, any>>({});

    // --- STATE MANAGEMENT ---
    const [regionGeoJSON, setRegionGeoJSON] = useState<any>(null);
    const [departmentGeoJSON, setDepartmentGeoJSON] = useState<any>(null);
    const [mapLevel, setMapLevel] = useState<'regions' | 'departments'>('regions');
    const [viewingRegion, setViewingRegion] = useState<any | null>(null);
    const [selectedItem, setSelectedItem] = useState<any | null>(null);
    const [comparisonItem, setComparisonItem] = useState<any | null>(null);
    const [isComparing, setIsComparing] = useState(false);
    const [showEvents, setShowEvents] = useState(false);
    const [isDataLibraryOpen, setIsDataLibraryOpen] = useState(false);
    const [activeMetric, setActiveMetric] = useState<MapMetric>('density');
    const [filters, setFilters] = useState({
        regions: new Set<string>(),
        departments: new Set<string>(),
    });
    const [chartTitle, setChartTitle] = useState("Top Départements (Signatures)");

    // --- DATA FETCHING ---
    useEffect(() => {
        Promise.all([
            fetch("https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/regions.geojson").then(res => res.json()),
            fetch("https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/departements.geojson").then(res => res.json())
        ]).then(([regionData, departmentData]) => {
            departmentData.features = departmentData.features.filter((f: any) => 
                parseInt(f.properties.code) < 96 || f.properties.code.startsWith('2A') || f.properties.code.startsWith('2B')
            );
            setRegionGeoJSON(regionData);
            setDepartmentGeoJSON(departmentData);
        });
    }, []);

    // --- DATA & MOCKING ---
    const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
    
    const getMockCommunesForDepartment = (deptCode: string) => {
        const hashCode = (str: string) => {
            let hash = 0;
            if (str.length === 0) return hash;
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash;
            }
            return hash;
        };
        const count = 5 + (Math.abs(hashCode(deptCode)) % 5);
        const communes = [];
        for (let i = 0; i < count; i++) {
            const name = `Commune ${deptCode}-${i + 1}`;
            const sigs = 5 + (Math.abs(hashCode(name)) % 45);
            communes.push({ name, sigs });
        }
        return communes.sort((a,b) => b.sigs - a.sigs);
    };

    // Used for Region Level stats
    const topRegionsData = useMemo(() => {
        if (!regionGeoJSON || !departmentGeoJSON) return [];
        const regionSigs: Record<string, number> = {};
        departmentGeoJSON.features.forEach((dept: any) => {
            const regionName = dept.properties.nomRegion;
            if (!regionSigs[regionName]) regionSigs[regionName] = 0;
            regionSigs[regionName] += rand(10, 80);
        });
        return Object.entries(regionSigs).map(([name, sigs]) => ({ name, sigs })).sort((a, b) => b.sigs - a.sigs).slice(0, 10);
    }, [regionGeoJSON, departmentGeoJSON]);

    const generateDataForItem = (item: any) => {
        if (!item) return { signatures: 412, contacts: 8420, conversion: 4.9, retention: [92, 86, 78], revenue: 27500 };
        const factor = item.properties.code ? (parseInt(item.properties.code.slice(0, 2)) / 95) : 0.5;
        const signatures = Math.floor(20 + factor * 100);
        const revenue = rand(19000, 38000);
        return {
            signatures,
            contacts: Math.floor(signatures * (18 + rand(0, 5))),
            conversion: parseFloat((signatures / (signatures * (18 + rand(0, 5))) * 100).toFixed(1)),
            retention: [rand(88, 95), rand(80, 87), rand(72, 79)],
            revenue,
        };
    };

    const data = useMemo(() => {
        const france = generateDataForItem(null);
        const selected = selectedItem ? generateDataForItem(selectedItem) : (viewingRegion ? generateDataForItem(viewingRegion) : france);
        const comparison = comparisonItem ? generateDataForItem(comparisonItem) : null;
        return { france, selected, comparison };
    }, [selectedItem, comparisonItem, viewingRegion]);
    
    const selectedRegionName = useMemo(() => selectedItem?.properties.nom || viewingRegion?.properties.nom, [selectedItem, viewingRegion]);

    // --- OPTIONS FOR FILTERS ---
    const regionOptions = useMemo(() => regionGeoJSON ? regionGeoJSON.features.map((f:any) => ({ value: f.properties.nom, label: f.properties.nom })).sort((a:any,b:any) => a.label.localeCompare(b.label)) : [], [regionGeoJSON]);
    const departmentOptions = useMemo(() => departmentGeoJSON ? departmentGeoJSON.features.map((f:any) => ({ value: f.properties.code, label: `${f.properties.code} - ${f.properties.nom}`})).sort((a:any,b:any) => a.label.localeCompare(b.label)) : [], [departmentGeoJSON]);

    const handleMultiSelectChange = (filterName: 'regions' | 'departments', value: string) => {
        setFilters(f => {
            const newSet = new Set(f[filterName]);
            if (newSet.has(value)) newSet.delete(value); else newSet.add(value);
            return { ...f, [filterName]: newSet };
        });
    };

    const handleClearFilter = (filterName: 'regions' | 'departments') => {
        setFilters(f => ({ ...f, [filterName]: new Set() }));
    };

    // --- MAP LOGIC ---
    const getMetricColor = useCallback((code: string, metric: MapMetric) => {
        let hash = 0;
        for (let i = 0; i < code.length; i++) hash = code.charCodeAt(i) + ((hash << 5) - hash);
        const val = Math.abs(hash) % 100;
        
        return METRICS_CONFIG[metric].getValueColor(val);
    }, []);

    useEffect(() => {
        if (mapContainerRef.current && !mapInstanceRef.current) {
            const map = L.map(mapContainerRef.current, { zoomControl: false, minZoom: 5, maxZoom: 10 }).setView([46.8, 2.8], 5.5);
            const isDark = document.documentElement.classList.contains('dark');
            const tileLayer = L.tileLayer.provider(isDark ? 'CartoDB.DarkMatter' : 'CartoDB.Positron').addTo(map);
            (map as any)._tileLayer = tileLayer;
            L.control.zoom({ position: 'topright' }).addTo(map);
            mapInstanceRef.current = map;
        }

        const map = mapInstanceRef.current;
        if (!map || !regionGeoJSON || !departmentGeoJSON) return;
        
        eventMarkersRef.current.forEach(m => map.removeLayer(m));
        eventMarkersRef.current = [];
        if (showEvents) {
            const eventIcon = L.divIcon({
                html: `<div class="relative flex items-center justify-center">
                           <div class="absolute w-4 h-4 bg-red-500 rounded-full animate-ping opacity-75"></div>
                           <div class="relative text-2xl z-10">📍</div>
                       </div>`,
                className: 'bg-transparent border-none',
                iconSize: [24, 24],
                iconAnchor: [12, 24], 
                popupAnchor: [0, -28]
            });

            eventData.forEach(event => {
                const popupContent = `
                    <div>
                        <h3 style="font-weight: 700; margin: 0 0 8px; color: var(--text-primary); font-size: 15px;">${event.name}</h3>
                        <p style="margin: 0; color: var(--text-secondary); font-size: 13px;"><strong>Lieu:</strong> ${event.location}</p>
                    </div>
                `;
                const marker = L.marker([event.lat, event.lng], { icon: eventIcon })
                    .addTo(map)
                    .bindPopup(popupContent);
                eventMarkersRef.current.push(marker);
            });
        }

        if (geoJsonLayerRef.current) map.removeLayer(geoJsonLayerRef.current);
        
        let geoJsonData;
        let features;

        if (viewingRegion) {
            const regionCode = viewingRegion.properties.code;
            features = departmentGeoJSON.features.filter((d: any) => d.properties.codeRegion === regionCode);
             if (filters.departments.size > 0) {
                features = features.filter((d: any) => filters.departments.has(d.properties.code));
            }
        } else if (mapLevel === 'regions') {
            features = regionGeoJSON.features;
            if (filters.regions.size > 0) {
                features = features.filter((f: any) => filters.regions.has(f.properties.nom));
            }
        } else { 
            features = departmentGeoJSON.features;
            if (filters.departments.size > 0) {
                features = features.filter((d: any) => filters.departments.has(d.properties.code));
            }
        }
        geoJsonData = { type: "FeatureCollection", features: features };

        const style = (feature: any) => {
            const code = feature.properties.code;
            const baseColor = getMetricColor(code, activeMetric);

            if (selectedItem?.properties.code === code) return { weight: 3, color: '#FF5B2B', fillOpacity: 0.9, fillColor: baseColor };
            if (comparisonItem?.properties.code === code) return { weight: 3, color: '#3b82f6', fillOpacity: 0.9, fillColor: baseColor };
            
            const isDark = document.documentElement.classList.contains('dark');
            return {
                fillColor: baseColor,
                weight: 1.2,
                opacity: 1,
                color: isDark ? 'rgba(30,33,48,0.8)' : 'rgba(255,255,255,0.8)',
                dashArray: '',
                fillOpacity: 0.75
            };
        };
        
        const highlightFeature = (e: any) => {
            const layer = e.target;
            layer.setStyle({ weight: 2, color: '#1a1a1a', fillOpacity: 0.9 });
            layer.bringToFront();
        };

        const resetHighlight = (e: any) => {
            geoJsonLayerRef.current.resetStyle(e.target);
        };
        
        const onEachFeature = (feature: any, layer: any) => {
            layer.bindPopup(
                `<div class="text-sm font-sans">
                    <b class="text-base">${feature.properties.nom}</b><br>
                    <span class="text-gray-500">${feature.properties.code || ''}</span>
                    <hr class="my-1 border-gray-200"/>
                    <div class="flex justify-between items-center">
                        <span>${METRICS_CONFIG[activeMetric].label}</span>
                        <b class="text-orange-600">${Math.floor(Math.random()*100)}</b>
                    </div>
                </div>`
            );
            layer.on({
                mouseover: highlightFeature,
                mouseout: resetHighlight,
                click: (e: any) => {
                    if (!isComparing) {
                        setSelectedItem(feature);
                    } else {
                        if (!selectedItem) setSelectedItem(feature);
                        else if (!comparisonItem) setComparisonItem(feature);
                        else { setSelectedItem(feature); setComparisonItem(null); }
                    }
                }
            });
        };
        
        geoJsonLayerRef.current = L.geoJSON(geoJsonData, { style, onEachFeature }).addTo(map);

    }, [mapLevel, viewingRegion, selectedItem, comparisonItem, isComparing, showEvents, filters, regionGeoJSON, departmentGeoJSON, activeMetric, getMetricColor]);
    
    useEffect(() => {
        if (isActive && mapInstanceRef.current) {
            setTimeout(() => mapInstanceRef.current.invalidateSize(), 150);
        }
    }, [isActive]);

    // --- DARK MODE TILE SWAP ---
    useEffect(() => {
        const observer = new MutationObserver(() => {
            const map = mapInstanceRef.current;
            if (!map) return;
            const isDark = document.documentElement.classList.contains('dark');
            const provider = isDark ? 'CartoDB.DarkMatter' : 'CartoDB.Positron';
            if ((map as any)._tileLayer) map.removeLayer((map as any)._tileLayer);
            (map as any)._tileLayer = L.tileLayer.provider(provider).addTo(map);
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    // --- CHARTS LOGIC ---
    useEffect(() => {
        const cleanupCharts = () => {
            Object.values(chartInstances.current).forEach((chart: any) => {
                if (chart && typeof chart.destroy === 'function') chart.destroy();
            });
            chartInstances.current = {};
        };
        cleanupCharts();

        if (!departmentGeoJSON || !regionGeoJSON) return;
        
        const textSecondary = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim();
        const borderColor = getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim();
        const genericOptions = {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, datalabels: { color: 'white', anchor: 'end', align: 'top', font: { weight: 'bold' } } },
            scales: { y: { beginAtZero: true, grid: { color: borderColor }, ticks: { color: textSecondary } }, x: { grid: { display: false }, ticks: { color: textSecondary } } }
        };
        Chart.register((window as any).ChartDataLabels);
        
        if (isComparing && selectedItem && comparisonItem) {
             setChartTitle(`Comparaison Profil`);
             const radarData = {
                labels: ['Volume Sigs', 'Revenu Moyen', 'Taux Conversion', 'Rétention 1m', 'Saturation'],
                datasets: [
                    {
                        label: selectedItem.properties.nom,
                        data: [85, 65, 90, 80, 40],
                        backgroundColor: 'rgba(255, 91, 43, 0.2)',
                        borderColor: '#FF5B2B',
                        pointBackgroundColor: '#FF5B2B',
                    },
                    {
                        label: comparisonItem.properties.nom,
                        data: [60, 85, 70, 60, 70],
                        backgroundColor: 'rgba(59, 130, 246, 0.2)',
                        borderColor: '#3b82f6',
                        pointBackgroundColor: '#3b82f6',
                    }
                ]
             };
             
             chartInstances.current.topDepts = new Chart(chartRefs.topDepts.current!, {
                type: 'radar',
                data: radarData,
                options: {
                    responsive: true, maintainAspectRatio: false,
                    scales: {
                        r: {
                            angleLines: { color: borderColor },
                            grid: { color: borderColor },
                            pointLabels: { color: textSecondary, font: { size: 11 } },
                            ticks: { display: false }
                        }
                    },
                    plugins: { legend: { display: true, labels: { color: textSecondary } }, datalabels: { display: false } }
                }
             });

        } else {
            let chartData: { labels: string[], values: number[] };
            let newTitle: string;
            let newClickHandler: (itemName: string) => void;
            
            const isSelectedDepartment = selectedItem && mapLevel === 'departments';
            const isSelectedRegion = selectedItem && mapLevel === 'regions';

            if (isSelectedDepartment) {
                const deptCode = selectedItem.properties.code;
                const deptName = selectedItem.properties.nom;
                newTitle = `Top Communes (${deptName})`;
                const communesData = getMockCommunesForDepartment(deptCode);
                chartData = { labels: communesData.map(c => c.name), values: communesData.map(c => c.sigs) };
                newClickHandler = (communeName) => console.log(`Commune clicked: ${communeName}`);
            } else if (isSelectedRegion || viewingRegion) {
                const regionFeature = isSelectedRegion ? selectedItem : viewingRegion;
                newTitle = `Top Départements (${regionFeature.properties.nom})`;
                const regionCode = regionFeature.properties.code;
                
                const deptsForRegion = departmentGeoJSON.features.filter((d: any) => String(d.properties.codeRegion) === String(regionCode));
                
                const deptsData = deptsForRegion.map((d: any) => ({ name: d.properties.nom, sigs: rand(10, 80) })).sort((a: any, b: any) => b.sigs - a.sigs).slice(0, 5);
                chartData = { labels: deptsData.map((d: any) => d.name), values: deptsData.map((d: any) => d.sigs) };
                newClickHandler = (deptName) => {
                    const deptFeature = departmentGeoJSON.features.find((f: any) => f.properties.nom === deptName);
                    if (deptFeature) setSelectedItem({ type: 'Feature', properties: deptFeature.properties });
                };
            } else {
                // NATIONAL LEVEL VIEW
                newTitle = "Top 10 Départements (National)";
                
                const allDepts = departmentGeoJSON.features.map((f: any) => ({
                    name: f.properties.nom,
                    code: f.properties.code,
                    sigs: rand(20, 100) // Mock data distribution
                })).sort((a:any, b:any) => b.sigs - a.sigs).slice(0, 10);

                chartData = { labels: allDepts.map((d:any) => d.name), values: allDepts.map((d:any) => d.sigs) };
                
                newClickHandler = (deptName) => {
                     const deptFeature = departmentGeoJSON.features.find((f: any) => f.properties.nom === deptName);
                     if (deptFeature) {
                         setMapLevel('departments'); // Switch to dept view so we can see it
                         setSelectedItem({ type: 'Feature', properties: deptFeature.properties });
                     }
                };
            }
            
            setChartTitle(newTitle);

            chartInstances.current.topDepts = new Chart(chartRefs.topDepts.current!, {
                type: 'bar',
                data: { labels: chartData.labels, datasets: [{ data: chartData.values, backgroundColor: ['#3b82f6'], borderRadius: 6 }] },
                options: { ...genericOptions, onClick: (e: any) => {
                    const active = chartInstances.current.topDepts.getElementsAtEventForMode(e, 'nearest', { intersect: true }, true)[0];
                    if(active) {
                        const itemName = chartInstances.current.topDepts.data.labels[active.index];
                        newClickHandler(itemName);
                    }
                }}
            });
        }
        
        return cleanupCharts;
    }, [data.selected, departmentGeoJSON, regionGeoJSON, viewingRegion, selectedItem, comparisonItem, isComparing, topRegionsData, mapLevel]);

    const handleBackToRegions = () => {
        setViewingRegion(null); setMapLevel('regions'); setSelectedItem(null); setComparisonItem(null); setFilters(f => ({...f, departments: new Set()}));
        mapInstanceRef.current?.setView([46.8, 2.8], 5.5);
    };

    return (
        <section>
            {isDataLibraryOpen && <DataLibraryModal onClose={() => setIsDataLibraryOpen(false)} />}
            <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4 md:mb-6">
                <h2 className="text-2xl md:text-3xl font-extrabold text-text-primary">DataWiz</h2>
                <div className="flex flex-wrap items-center gap-2 md:gap-3">
                    <div className="inline-flex gap-1 p-1 rounded-lg bg-gray-200 dark:bg-slate-800">
                        <button 
                            onClick={() => { setMapLevel('regions'); setViewingRegion(null); setSelectedItem(null); }}
                            className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${mapLevel === 'regions' && !viewingRegion ? 'bg-white dark:bg-[var(--bg-card-solid)] shadow-sm' : 'text-text-secondary hover:bg-gray-300/50 dark:hover:bg-slate-700/50'}`}
                        >
                            Régions
                        </button>
                        <button 
                            onClick={() => { setMapLevel('departments'); setViewingRegion(null); setSelectedItem(null); }}
                            className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${mapLevel === 'departments' && !viewingRegion ? 'bg-white dark:bg-[var(--bg-card-solid)] shadow-sm' : 'text-text-secondary hover:bg-gray-300/50 dark:hover:bg-slate-700/50'}`}
                        >
                            Départements
                        </button>
                    </div>
                    <button onClick={() => setIsDataLibraryOpen(true)} className="flex items-center gap-2 px-3 py-2 text-sm font-semibold bg-white dark:bg-[var(--bg-card-solid)] rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors shadow-sm border border-border-color"><Library size={16}/> Bibliothèque</button>
                    {viewingRegion && <button onClick={handleBackToRegions} className="flex items-center gap-2 px-3 py-2 text-sm font-semibold bg-gray-200 dark:bg-slate-800 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-700 transition-colors"><ArrowLeft size={16}/> Retour aux régions</button>}
                    <button onClick={() => { setIsComparing(p => !p); setSelectedItem(null); setComparisonItem(null); }} className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${isComparing ? 'bg-orange-500 text-white shadow-md' : 'bg-white dark:bg-[var(--bg-card-solid)] hover:bg-gray-50 dark:hover:bg-slate-800/50 border border-border-color'}`}><Shuffle size={16}/> {isComparing ? 'Mode Comparaison' : 'Comparer'}</button>
                </div>
            </header>

            {/* Filter Row - High Z-Index */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 relative z-50">
                <MultiSelectDropdown 
                    options={regionOptions} 
                    selected={filters.regions} 
                    onSelectionChange={(val) => handleMultiSelectChange('regions', val)}
                    onClear={() => handleClearFilter('regions')}
                    title="Toutes les Régions" 
                    icon={<MapPin size={18}/>}
                    disabled={mapLevel === 'departments' || !!viewingRegion} />
                <MultiSelectDropdown 
                    options={departmentOptions} 
                    selected={filters.departments} 
                    onSelectionChange={(val) => handleMultiSelectChange('departments', val)}
                    onClear={() => handleClearFilter('departments')}
                    title="Tous les Départements"
                    icon={<Target size={18}/>}
                    disabled={mapLevel === 'regions' && !viewingRegion}/>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-0">
                <div className="lg:col-span-2 glass-card p-4 flex flex-col">
                     <div className="flex flex-col gap-4 mb-3 border-b border-[var(--border-subtle)] pb-3">
                         <div className="flex justify-between items-center">
                            <h3 className="font-extrabold text-xl sm:text-2xl text-[var(--text-primary)] flex items-center gap-2 flex-wrap">
                                {isComparing ? (
                                    <>
                                        <span className={selectedItem ? "text-orange-600" : "text-gray-400"}>
                                            {selectedItem ? (
                                                <>
                                                    {selectedItem.properties.nom}
                                                    {mapLevel === 'departments' && <span className="text-base font-normal ml-1 opacity-75">({selectedItem.properties.code})</span>}
                                                </>
                                            ) : 'Sélection 1'}
                                        </span>
                                        <span className="text-sm text-[var(--text-muted)] font-bold uppercase bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">VS</span>
                                        <span className={comparisonItem ? "text-orange-600" : "text-gray-400"}>
                                            {comparisonItem ? (
                                                <>
                                                    {comparisonItem.properties.nom}
                                                    {mapLevel === 'departments' && <span className="text-base font-normal ml-1 opacity-75">({comparisonItem.properties.code})</span>}
                                                </>
                                            ) : 'Sélection 2'}
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <MapPin className="text-orange-600" />
                                        {selectedItem ? (
                                            <>
                                                {selectedItem.properties.nom}
                                                {mapLevel === 'departments' && <span className="text-xl text-[var(--text-secondary)] font-normal ml-2">({selectedItem.properties.code})</span>}
                                            </>
                                        ) : (
                                            viewingRegion ? viewingRegion.properties.nom : "France Entière"
                                        )}
                                    </>
                                )}
                            </h3>
                            <label className="flex items-center gap-2 text-sm cursor-pointer bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition h-[32px] border border-transparent">
                                <span className="text-text-secondary text-xs font-medium px-1">Events</span>
                                <input type="checkbox" checked={showEvents} onChange={e => setShowEvents(e.target.checked)} className="h-4 w-4 rounded accent-orange-500"/>
                            </label>
                         </div>

                         {/* METRIC SELECTOR (Wrapped) */}
                         <div className="flex flex-wrap gap-2 pb-2">
                             {Object.entries(METRICS_CONFIG).map(([key, config]) => (
                                 <button
                                    key={key}
                                    onClick={() => setActiveMetric(key as MapMetric)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border
                                    ${activeMetric === key
                                        ? 'bg-slate-800 dark:bg-orange-600 text-white border-slate-800 dark:border-orange-600 shadow-md transform scale-105'
                                        : 'bg-white dark:bg-[var(--bg-card-solid)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-600'}`}
                                 >
                                     {config.icon}
                                     {config.label}
                                 </button>
                             ))}
                         </div>
                    </div>
                    
                    <div className="relative flex-grow min-h-[350px] sm:min-h-[500px] rounded-xl overflow-hidden border border-border-color z-0">
                        <div id="wplan-map" ref={mapContainerRef} className="absolute inset-0 bg-gray-100 dark:bg-slate-800"></div>
                        {(!regionGeoJSON || !departmentGeoJSON) && <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-slate-900/80 z-10 text-[var(--text-primary)]">Chargement de la carte...</div>}
                        
                        {/* DYNAMIC LEGEND - TOP LEFT */}
                        <div className="absolute top-4 left-4 bg-white/90 dark:bg-[var(--bg-card-solid)] backdrop-blur-sm p-3 rounded-xl border border-[var(--border-subtle)] shadow-lg z-[500] min-w-[160px]">
                            <h4 className="text-xs font-extrabold text-[var(--text-primary)] uppercase mb-2 tracking-wider border-b border-[var(--border-subtle)] pb-1">
                                {METRICS_CONFIG[activeMetric].label}
                            </h4>
                            <div className="flex flex-col gap-1.5">
                                {METRICS_CONFIG[activeMetric].colors.map((color, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <span className="w-4 h-4 rounded shadow-sm border border-black/5" style={{ backgroundColor: color }}></span>
                                        <span className="text-xs text-[var(--text-secondary)] font-medium">
                                            {METRICS_CONFIG[activeMetric].labels[idx]}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {isComparing && !selectedItem && !comparisonItem && (
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-semibold z-[50] pointer-events-none">
                                Sélectionnez une première zone sur la carte
                            </div>
                        )}
                    </div>
                </div>
                <div className="space-y-6">
                    <div className="glass-card p-4">
                        <div className="flex justify-between items-center mb-2">
                             <h3 className="font-bold text-text-primary">{chartTitle}</h3>
                             {isComparing && <Radar size={16} className="text-orange-500"/>}
                        </div>
                        <div className="h-[200px]"><canvas ref={chartRefs.topDepts}></canvas></div>
                    </div>
                    {/* Placeholder for Retention Chart */}
                    <div className="glass-card p-4 flex flex-col items-center justify-center h-[250px] bg-gray-50 dark:bg-slate-800/50 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl">
                        <div className="p-4 bg-gray-100 dark:bg-slate-800 rounded-full mb-3">
                            <TrendingUp size={24} className="text-[var(--text-muted)]" />
                        </div>
                        <h3 className="font-semibold text-text-secondary">Chart possible</h3>
                        <p className="text-xs text-[var(--text-muted)] mt-1">Emplacement réservé</p>
                    </div>
                    {/* Placeholder for Correlation Chart */}
                    <div className="glass-card p-4 flex flex-col items-center justify-center h-[250px] bg-gray-50 dark:bg-slate-800/50 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl">
                        <div className="p-4 bg-gray-100 dark:bg-slate-800 rounded-full mb-3">
                            <Shuffle size={24} className="text-[var(--text-muted)]" />
                        </div>
                        <h3 className="font-semibold text-text-secondary">Chart possible</h3>
                        <p className="text-xs text-[var(--text-muted)] mt-1">Emplacement réservé</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 mt-6 relative z-0">
                 <div className="glass-card p-6 flex flex-col">
                    <h3 className="font-bold text-text-primary mb-4 flex items-center gap-2">
                        <Lightbulb className="text-yellow-500" size={20}/> 
                        Matrice SWOT : {selectedRegionName || 'France Entière'}
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-grow">
                        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-100 dark:border-green-800/30">
                            <h4 className="text-xs font-bold text-green-800 dark:text-green-400 uppercase mb-2 flex items-center gap-1"><CheckCircle2 size={12}/> Forces</h4>
                            <ul className="text-xs text-green-900 dark:text-green-300 space-y-1 list-disc list-inside">
                                <li>Forte conversion périurbaine</li>
                                <li>Anciens donateurs fidèles (+6m)</li>
                                <li>Image de marque positive locale</li>
                            </ul>
                        </div>
                        <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg border border-orange-100 dark:border-orange-800/30">
                            <h4 className="text-xs font-bold text-orange-800 dark:text-orange-400 uppercase mb-2 flex items-center gap-1"><AlertTriangle size={12}/> Faiblesses</h4>
                            <ul className="text-xs text-orange-900 dark:text-orange-300 space-y-1 list-disc list-inside">
                                <li>Saturation centre-ville</li>
                                <li>Coût par acquisition élevé</li>
                            </ul>
                        </div>
                        <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg border border-orange-100 dark:border-orange-800/30">
                            <h4 className="text-xs font-bold text-orange-800 dark:text-orange-400 uppercase mb-2 flex items-center gap-1"><TrendingUp size={12}/> Opportunités</h4>
                            <ul className="text-xs text-orange-900 dark:text-orange-300 space-y-1 list-disc list-inside">
                                <li>Marchés de Noël (Q4)</li>
                                <li>Nouvelles zones résidentielles Nord</li>
                            </ul>
                        </div>
                        <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-800/30">
                            <h4 className="text-xs font-bold text-red-800 dark:text-red-400 uppercase mb-2 flex items-center gap-1"><Ban size={12}/> Menaces</h4>
                            <ul className="text-xs text-red-900 dark:text-red-300 space-y-1 list-disc list-inside">
                                <li>Météo difficile en Janvier</li>
                                <li>Concurrence ONG accrue (S40-44)</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default WplanTab;