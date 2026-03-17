
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Commune, Organization, CommuneStatus } from '../types';
import { communesData, departmentMap, statusMap, departmentToRegionMap } from '../constants';
import { Search, Info, MapPin, Users, Euro, CheckCircle2, XCircle, Clock, Car, Check, Phone, Mail, Edit2, Save, History, Calendar, ChevronDown, Map as MapIcon, List as ListIcon, Filter, Loader2, MousePointer2, Eraser, Brush, ArrowRight, Send, AlertTriangle, X, Layers, CalendarDays, Move } from 'lucide-react';

declare const L: any;

// --- TYPES ---
interface ProspectHistoryItem {
    id: string;
    date: Date;
    communeCount: number;
    totalPop: number;
    zoneCount: string;
    communesList: { nom: string; lat: number; lng: number }[]; // Minimal data for mini-map
}

// --- SUB-COMPONENTS ---

const StatusBadge: React.FC<{ status: CommuneStatus, interactive?: boolean, onClick?: (e: React.MouseEvent) => void }> = ({ status, interactive, onClick }) => {
  const config = statusMap[status] || { text: status, color: 'text-[var(--text-secondary)]', bg: 'bg-slate-100 dark:bg-slate-800' };
  
  const getIcon = () => {
    switch(status) {
        case 'pas_demande': return Clock;
        case 'informe': return Info;
        case 'refuse': return XCircle;
        case 'telescope': return Car;
        case 'fait': return CheckCircle2;
        default: return Info;
    }
  };
  const Icon = getIcon();

  return (
    <span 
        onClick={onClick}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${config.bg} ${config.color} ${interactive ? 'cursor-pointer hover:brightness-95 hover:ring-1 hover:ring-black/5 transition-all group/badge' : ''}`}
    >
      <Icon size={12} />
      {config.text}
      {interactive && <ChevronDown size={10} className="opacity-0 group-hover/badge:opacity-100 transition-opacity ml-1"/>}
    </span>
  );
};

const QuickStatusDropdown: React.FC<{ 
    currentStatus: CommuneStatus; 
    onSelect: (s: CommuneStatus) => void;
}> = ({ currentStatus, onSelect }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isOpen) {
            setIsOpen(false);
            return;
        }

        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setCoords({ 
                top: rect.bottom + 4, 
                left: rect.left 
            });
            setIsOpen(true);
        }
    };

    useEffect(() => {
        if (!isOpen) return;
        const closeMenu = () => setIsOpen(false);
        const handleScroll = () => setIsOpen(false);
        document.addEventListener("mousedown", closeMenu);
        window.addEventListener("scroll", handleScroll, true);
        window.addEventListener("resize", handleScroll);
        return () => {
            document.removeEventListener("mousedown", closeMenu);
            window.removeEventListener("scroll", handleScroll, true);
            window.removeEventListener("resize", handleScroll);
        };
    }, [isOpen]);

    return (
        <>
            <div ref={triggerRef} className="inline-block">
                <StatusBadge 
                    status={currentStatus} 
                    interactive={true} 
                    onClick={handleToggle} 
                />
            </div>
            
            {isOpen && createPortal(
                <div 
                    className="fixed z-[9999] bg-white dark:bg-[var(--bg-card-solid)] rounded-xl shadow-2xl border border-[var(--border-subtle)] overflow-hidden min-w-[160px] animate-fade-in"
                    style={{ 
                        top: coords.top, 
                        left: coords.left 
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {Object.entries(statusMap).map(([key, conf]) => (
                        <button
                            key={key}
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                onSelect(key as CommuneStatus); 
                                setIsOpen(false); 
                            }}
                            className={`w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center justify-between transition-colors border-b border-slate-50 last:border-0
                            ${key === currentStatus ? 'bg-orange-50 text-orange-600' : 'text-[var(--text-secondary)]'}`}
                        >
                            <span>{conf.text}</span>
                            {key === currentStatus && <Check size={12}/>}
                        </button>
                    ))}
                </div>,
                document.body
            )}
        </>
    );
};

const MultiSelectFilter: React.FC<{
    label: string;
    options: { value: string, label: string }[];
    selected: Set<string>;
    onChange: (newSet: Set<string>) => void;
}> = ({ label, options, selected, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    const toggleOption = (val: string) => {
        const newSet = new Set(selected);
        if (newSet.has(val)) newSet.delete(val);
        else newSet.add(val);
        onChange(newSet);
    };

    const filteredOptions = options.filter(o => o.label.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="relative min-w-[140px]" ref={containerRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm border rounded-xl bg-white dark:bg-[var(--bg-card-solid)] transition-all
                ${selected.size > 0 ? 'border-orange-300 ring-1 ring-orange-100 text-orange-700' : 'border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-orange-300'}`}
            >
                <div className="flex items-center gap-2 truncate">
                    <span className="font-bold truncate">
                        {selected.size === 0 ? label : `${selected.size} ${label}`}
                    </span>
                </div>
                <ChevronDown size={14} className={`text-[var(--text-muted)] transition-transform ${isOpen ? 'rotate-180' : ''}`}/>
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 max-h-64 flex flex-col bg-white dark:bg-[var(--bg-card-solid)] rounded-xl shadow-xl border border-[var(--border-subtle)] z-50 overflow-hidden">
                    <div className="p-2 border-b border-[var(--border-subtle)] sticky top-0 bg-white dark:bg-[var(--bg-card-solid)] z-10">
                        <input 
                            type="text" 
                            placeholder={`Chercher ${label}...`}
                            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-[var(--border-subtle)] rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-orange-400"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <div className="overflow-y-auto p-1 custom-scrollbar">
                        {filteredOptions.length > 0 ? filteredOptions.map(opt => {
                            const isSelected = selected.has(opt.value);
                            return (
                                <div 
                                    key={opt.value} 
                                    onClick={() => toggleOption(opt.value)}
                                    className={`flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer text-xs font-medium mb-0.5
                                    ${isSelected ? 'bg-orange-50 text-orange-700' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-[var(--text-primary)]'}`}
                                >
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors
                                        ${isSelected ? 'bg-orange-600 border-orange-600' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-[var(--bg-card-solid)]'}`}>
                                        {isSelected && <Check size={10} className="text-white" strokeWidth={3}/>}
                                    </div>
                                    <span className="truncate">{opt.label}</span>
                                </div>
                            )
                        }) : (
                            <div className="p-4 text-center text-xs text-[var(--text-muted)]">Aucun résultat</div>
                        )}
                    </div>
                    {selected.size > 0 && (
                        <div className="p-2 border-t border-[var(--border-subtle)] bg-slate-50 dark:bg-slate-800/50">
                            <button 
                                onClick={() => onChange(new Set())}
                                className="w-full py-1.5 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                                Réinitialiser
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const EditableField: React.FC<{ 
    value: string; 
    icon: React.ElementType; 
    onSave: (val: string) => void; 
    type?: string 
}> = ({ value, icon: Icon, onSave, type = "text" }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempValue, setTempValue] = useState(value);

    useEffect(() => { setTempValue(value); }, [value]);

    if (isEditing) {
        return (
            <div className="flex items-center gap-2 animate-fade-in w-full">
                <Icon size={16} className="text-[var(--text-muted)]"/>
                <input 
                    type={type} 
                    className="flex-1 min-w-0 bg-white dark:bg-[var(--bg-card-solid)] border border-orange-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    autoFocus
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') { onSave(tempValue); setIsEditing(false); }
                        if (e.key === 'Escape') { setTempValue(value); setIsEditing(false); }
                    }}
                />
                <button onClick={() => { onSave(tempValue); setIsEditing(false); }} className="p-1 bg-orange-100 text-orange-600 rounded hover:bg-orange-200"><Save size={14}/></button>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-between group w-full cursor-pointer p-1 -ml-1 rounded hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors" onClick={() => setIsEditing(true)}>
             <div className="flex items-center gap-2 min-w-0">
                <Icon size={16} className="text-[var(--text-muted)]"/>
                <span className="text-[var(--text-primary)] font-medium truncate">{value || 'Non renseigné'}</span>
             </div>
             <Edit2 size={12} className="text-slate-300 dark:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
    );
};

// --- MINI MAP VISUALIZER FOR HISTORY ---
const MiniZoneVisualizer: React.FC<{ points: {lat: number, lng: number}[] }> = ({ points }) => {
    if (!points || points.length === 0) return <div className="w-full h-full bg-slate-100 dark:bg-slate-800 rounded-lg"></div>;

    // Calculate bounds
    const lats = points.map(p => p.lat);
    const lngs = points.map(p => p.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    // Normalize and plot
    return (
        <div className="w-full h-24 bg-slate-100 dark:bg-slate-800 rounded-lg relative overflow-hidden border border-[var(--border-subtle)]">
            {points.map((p, idx) => {
                // Simple linear normalization to 10-90% range to keep padding
                const y = 90 - ((p.lat - minLat) / (maxLat - minLat || 1)) * 80; // Invert Y for CSS top
                const x = 10 + ((p.lng - minLng) / (maxLng - minLng || 1)) * 80;
                return (
                    <div 
                        key={idx} 
                        className="absolute w-1.5 h-1.5 bg-orange-500 rounded-full opacity-60"
                        style={{ top: `${y}%`, left: `${x}%` }}
                    />
                );
            })}
            <div className="absolute bottom-1 right-1 text-[8px] font-bold text-[var(--text-muted)] uppercase">Mini-Map</div>
        </div>
    );
};

// --- VALIDATION MODAL ---
const ProspectValidationModal: React.FC<{ 
    isOpen: boolean; 
    onClose: () => void; 
    onConfirm: () => void; 
    communes: MapCommuneFeature[]; 
    stats: { count: number; pop: number; zones: string };
}> = ({ isOpen, onClose, onConfirm, communes, stats }) => {
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
             <div className="relative bg-white dark:bg-[var(--bg-card-solid)] rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] animate-fade-in overflow-hidden">
                
                {/* Header */}
                <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-b border-[var(--border-subtle)] flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-black text-[var(--text-primary)] flex items-center gap-2">
                            <Send className="text-orange-600" size={24}/>
                            Validation de la Prospection
                        </h2>
                        <p className="text-sm text-[var(--text-secondary)]">Récapitulatif de votre demande de zone</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"><X size={20} /></button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                    
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 text-center">
                            <span className="block text-2xl font-black text-orange-700">{stats.count}</span>
                            <span className="text-xs font-bold text-orange-400 uppercase">Communes</span>
                        </div>
                        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 dark:border-emerald-500/20 text-center">
                            <span className="block text-2xl font-black text-emerald-700">{(stats.pop / 1000).toFixed(1)}k</span>
                            <span className="text-xs font-bold text-emerald-400 uppercase">Habitants</span>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 dark:border-purple-500/20 text-center">
                            <span className="block text-2xl font-black text-purple-700 dark:text-purple-400">{stats.zones}</span>
                            <span className="text-xs font-bold text-purple-400 uppercase">Zones Estimées</span>
                        </div>
                    </div>

                    {/* Warning Box */}
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                        <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={20}/>
                        <div>
                            <h4 className="font-bold text-amber-800 dark:text-amber-300 text-sm uppercase mb-1">Confirmation d'envoi automatique</h4>
                            <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
                                En cliquant sur valider, <span className="font-bold underline">dans 15 min un mail s'enverra automatiquement</span> à toutes les mairies sélectionnées ci-dessous pour initier la prise de contact.
                            </p>
                        </div>
                    </div>

                    {/* Commune List */}
                    <div>
                        <h4 className="font-bold text-[var(--text-primary)] mb-2 text-sm flex items-center gap-2">
                            <ListIcon size={16}/> Liste des communes ciblées
                        </h4>
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-[var(--border-subtle)] max-h-48 overflow-y-auto p-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {communes.map((c) => (
                                <div key={c.properties.code} className="bg-white dark:bg-[var(--bg-card-solid)] px-3 py-2 rounded-lg border border-[var(--border-subtle)] shadow-sm flex justify-between items-center text-xs">
                                    <span className="font-bold text-[var(--text-primary)]">{c.properties.nom}</span>
                                    <span className="text-[var(--text-muted)]">{c.properties.population.toLocaleString()} hab.</span>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-[var(--border-subtle)] flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2.5 text-[var(--text-secondary)] hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-bold text-sm transition-colors">
                        Annuler
                    </button>
                    <button onClick={onConfirm} className="px-6 py-2.5 bg-orange-600 text-white hover:bg-orange-700 rounded-xl font-bold text-sm shadow-lg shadow-orange-200 dark:shadow-orange-900/50 transition-all flex items-center gap-2">
                        <Send size={16}/> Confirmer & Envoyer
                    </button>
                </div>
             </div>
        </div>,
        document.body
    );
};


// --- PROSPECTION MAP COMPONENT ---
interface MapCommuneFeature {
    type: "Feature";
    geometry: any;
    properties: {
        nom: string;
        code: string;
        population: number;
        revenue: number; // Simulated
        lat?: number; // Approximation for mini-map
        lng?: number;
        history?: Record<string, string>; // organization -> last_visit_date (YYYY-MM-DD)
    };
}

const ProspectionMap: React.FC<{ 
    departments: Set<string>;
    onValidationRequest: (selectedCommunes: MapCommuneFeature[]) => void;
}> = ({ departments, onValidationRequest }) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const geoJsonLayerRef = useRef<any>(null);
    const hasCenteredRef = useRef<boolean>(false);

    const [isLoading, setIsLoading] = useState(false);
    const [features, setFeatures] = useState<MapCommuneFeature[]>([]);
    const [filteredFeatures, setFilteredFeatures] = useState<MapCommuneFeature[]>([]);
    
    // Selection State
    const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());
    const [tool, setTool] = useState<'move' | 'brush' | 'eraser'>('move');
    const [isMouseDown, setIsMouseDown] = useState(false);

    // Filters
    const [minPop, setMinPop] = useState(1000);
    const [minRevenue, setMinRevenue] = useState(20000);
    
    // History Layer State
    const [saturationOrg, setSaturationOrg] = useState<Organization | 'none'>('none');

    // Fetch Geometry based on selected departments
    useEffect(() => {
        const loadGeometry = async () => {
            if (departments.size === 0) return;
            setIsLoading(true);
            hasCenteredRef.current = false; // Reset zooming capability when depts change
            const deptsArray = Array.from(departments);
            let allFeatures: any[] = [];

            try {
                for (const deptCode of deptsArray) {
                    const res = await fetch(`https://geo.api.gouv.fr/departements/${deptCode}/communes?geometry=contour&format=geojson&type=commune-actuelle`);
                    if (res.ok) {
                        const data = await res.json();
                        // Enrich with mock revenue, centroid, and history
                        const enriched = data.features.map((f: any) => {
                            // Rough centroid
                            const coords = f.geometry.coordinates[0][0]; 
                            const lng = Array.isArray(coords) ? coords[0] : 0;
                            const lat = Array.isArray(coords) ? coords[1] : 0;
                            
                            // Mock History Generation
                            const mockHistory: Record<string, string> = {};
                            ['msf', 'unicef', 'wwf', 'mdm'].forEach(org => {
                                // 40% chance of having been visited
                                if (Math.random() > 0.6) {
                                    // Date within last 2 years
                                    const daysAgo = Math.floor(Math.random() * 730);
                                    const d = new Date();
                                    d.setDate(d.getDate() - daysAgo);
                                    mockHistory[org] = d.toISOString().split('T')[0];
                                }
                            });

                            return {
                                ...f,
                                properties: {
                                    ...f.properties,
                                    revenue: Math.floor(Math.random() * (45000 - 16000) + 16000),
                                    lat,
                                    lng,
                                    history: mockHistory
                                }
                            };
                        });
                        allFeatures = [...allFeatures, ...enriched];
                    }
                }
                setFeatures(allFeatures);
            } catch (e) {
                console.error("Failed to load map data", e);
            } finally {
                setIsLoading(false);
            }
        };

        loadGeometry();
    }, [departments]);

    // Apply demographic filters
    useEffect(() => {
        const filtered = features.filter(f => 
            f.properties.population >= minPop && 
            f.properties.revenue >= minRevenue
        );
        setFilteredFeatures(filtered);
    }, [features, minPop, minRevenue]);

    // Handle Map Interactions (Painting)
    const handleInteraction = (code: string) => {
        if (!isMouseDown) return;
        if (tool === 'move') return;
        
        setSelectedCodes(prev => {
            const next = new Set(prev);
            if (tool === 'brush') next.add(code);
            else next.delete(code);
            return next;
        });
    };

    // Render Map
    useEffect(() => {
        if (!mapContainerRef.current) return;
        
        if (!mapInstanceRef.current) {
            const map = L.map(mapContainerRef.current, { zoomControl: false }).setView([46.6, 1.8], 6);
            const isDark = document.documentElement.classList.contains('dark');
            L.tileLayer.provider(isDark ? 'CartoDB.DarkMatter' : 'CartoDB.Positron').addTo(map);
            L.control.zoom({ position: 'topright' }).addTo(map);
            mapInstanceRef.current = map;

            // Global mouse listeners for brushing
            map.on('mousedown', () => setIsMouseDown(true));
            map.on('mouseup', () => setIsMouseDown(false));
            document.addEventListener('mouseup', () => setIsMouseDown(false));
        }

        const map = mapInstanceRef.current;

        // Toggle map dragging based on tool to allow "painting" without panning
        if (tool === 'brush' || tool === 'eraser') {
            map.dragging.disable();
        } else {
            map.dragging.enable();
        }

        if (geoJsonLayerRef.current) {
            map.removeLayer(geoJsonLayerRef.current);
        }

        if (filteredFeatures.length > 0) {
            const layer = L.geoJSON({ type: "FeatureCollection", features: filteredFeatures }, {
                style: (feature: any) => {
                    const isSelected = selectedCodes.has(feature.properties.code);
                    
                    // Base style
                    let fillColor = '#94a3b8'; // Grey (default)
                    let fillOpacity = 0.3;

                    // History/Saturation Coloring Logic
                    if (saturationOrg !== 'none') {
                        const lastVisit = feature.properties.history?.[saturationOrg];
                        if (lastVisit) {
                            const date = new Date(lastVisit);
                            const now = new Date();
                            const diffMonths = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
                            
                            if (diffMonths < 6) {
                                fillColor = '#ef4444'; // Red (Saturated / Recent)
                                fillOpacity = 0.6;
                            } else if (diffMonths < 12) {
                                fillColor = '#f97316'; // Orange (Warning)
                                fillOpacity = 0.5;
                            } else {
                                fillColor = '#22c55e'; // Green (Safe / Old)
                                fillOpacity = 0.4;
                            }
                        } else {
                            fillColor = '#22c55e'; // Green (Never visited)
                            fillOpacity = 0.4;
                        }
                    }

                    // Selection override (Blue)
                    if (isSelected) {
                        fillColor = '#3b82f6';
                        fillOpacity = 0.8;
                    }

                    return {
                        fillColor: fillColor,
                        color: 'white',
                        weight: 0.5,
                        opacity: 1,
                        fillOpacity: fillOpacity
                    };
                },
                onEachFeature: (feature: any, layer: any) => {
                    const lastVisit = saturationOrg !== 'none' ? feature.properties.history?.[saturationOrg] : null;
                    const dateStr = lastVisit ? new Date(lastVisit).toLocaleDateString() : 'Jamais';
                    
                    layer.bindTooltip(`
                        <div class="text-center font-sans">
                            <b>${feature.properties.nom}</b><br/>
                            ${feature.properties.population.toLocaleString()} hab.<br/>
                            <span class="text-xs text-emerald-600 font-bold">${feature.properties.revenue.toLocaleString()} €</span><br/>
                            ${saturationOrg !== 'none' ? `<span class="text-xs ${lastVisit ? 'text-[var(--text-secondary)]' : 'text-green-600'}">Dernier passage (${saturationOrg.toUpperCase()}): <b>${dateStr}</b></span>` : ''}
                        </div>
                    `, { sticky: true, direction: 'top' });

                    layer.on('mouseover', () => {
                        handleInteraction(feature.properties.code);
                    });
                    layer.on('mousedown', () => {
                        setIsMouseDown(true);
                        // Immediate click/interaction
                        if (tool !== 'move') {
                            setSelectedCodes(prev => {
                                const next = new Set(prev);
                                const code = feature.properties.code;
                                if (tool === 'eraser') next.delete(code);
                                else next.add(code);
                                return next;
                            });
                        }
                    });
                }
            }).addTo(map);
            
            geoJsonLayerRef.current = layer;
            
            // Only fit bounds ONCE per department load to prevent zooming in/out when filtering
            if (!hasCenteredRef.current) {
                 if (map.getBounds().contains(layer.getBounds())) {
                     // Do nothing if already visible
                 } else {
                     map.fitBounds(layer.getBounds());
                 }
                 hasCenteredRef.current = true;
            }
        }
    }, [filteredFeatures, selectedCodes, tool, isMouseDown, saturationOrg]);


    // Stats for Selection
    const selectedStats = useMemo(() => {
        let pop = 0;
        const selectedList: MapCommuneFeature[] = [];
        filteredFeatures.forEach(f => {
            if (selectedCodes.has(f.properties.code)) {
                pop += f.properties.population;
                selectedList.push(f);
            }
        });
        return { count: selectedList.length, pop, list: selectedList };
    }, [selectedCodes, filteredFeatures]);

    const zonesCount = (selectedStats.pop / 8000).toFixed(1);

    if (departments.size === 0) {
        return (
            <div className="h-full flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-[var(--border-subtle)]">
                <div className="text-center text-[var(--text-muted)]">
                    <Filter size={48} className="mx-auto mb-4 opacity-50"/>
                    <p className="text-lg font-bold">Sélectionnez un ou plusieurs départements</p>
                    <p className="text-sm">Utilisez les filtres à gauche pour charger la carte.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative h-full w-full rounded-2xl overflow-hidden shadow-sm border border-[var(--border-subtle)]">
            {isLoading && (
                 <div className="absolute inset-0 z-[50] bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex items-center justify-center flex-col">
                     <Loader2 size={48} className="text-orange-600 animate-spin mb-4"/>
                     <p className="font-bold text-[var(--text-primary)]">Chargement de la topographie...</p>
                 </div>
            )}
            
            {/* Toolbar - Top Left (Brush Tools) */}
            <div className="absolute top-4 left-4 z-[40] bg-white dark:bg-[var(--bg-card-solid)] p-3 rounded-xl shadow-lg border border-[var(--border-subtle)] flex flex-col gap-4 w-52 md:w-64">
                <h4 className="text-xs font-black text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
                    <Filter size={14}/> Critères de Cinglage
                </h4>
                
                <div>
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-[var(--text-secondary)] font-bold">Pop. Min</span>
                        <span className="text-orange-600 font-bold">{minPop} hab.</span>
                    </div>
                    <input 
                        type="range" min="0" max="5000" step="100" 
                        value={minPop} onChange={(e) => setMinPop(Number(e.target.value))}
                        className="w-full accent-orange-600 h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                    />
                </div>

                {/* Revenu Filter Restored */}
                <div>
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-[var(--text-secondary)] font-bold">Rev. Min</span>
                        <span className="text-emerald-600 font-bold">{minRevenue / 1000}k €</span>
                    </div>
                    <input 
                        type="range" min="15000" max="45000" step="1000" 
                        value={minRevenue} onChange={(e) => setMinRevenue(Number(e.target.value))}
                        className="w-full accent-emerald-600 h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                    />
                </div>

                <div className="h-px bg-slate-100 dark:bg-slate-800 my-1"></div>

                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                     <button 
                        onClick={() => setTool('move')}
                        className={`flex-1 flex items-center justify-center py-2 rounded-md transition-all ${tool === 'move' ? 'bg-white dark:bg-[var(--bg-card-solid)] shadow text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                        title="Naviguer"
                    >
                        <Move size={16} />
                    </button>
                    <button 
                        onClick={() => setTool('brush')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-bold transition-all ${tool === 'brush' ? 'bg-white dark:bg-[var(--bg-card-solid)] shadow text-orange-600' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                        title="Sélectionner"
                    >
                        <Brush size={16} />
                    </button>
                    <button 
                        onClick={() => setTool('eraser')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-bold transition-all ${tool === 'eraser' ? 'bg-white dark:bg-[var(--bg-card-solid)] shadow text-red-600' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                        title="Effacer"
                    >
                        <Eraser size={16} />
                    </button>
                </div>
                {tool !== 'move' && <p className="text-[10px] text-center text-[var(--text-muted)]">Le déplacement carte est désactivé en mode Pinceau</p>}
            </div>

            {/* Toolbar - Top Right (History/Layer) */}
            <div className="absolute top-4 right-4 z-[40] bg-white dark:bg-[var(--bg-card-solid)] p-2 rounded-xl shadow-lg border border-[var(--border-subtle)]">
                <div className="flex items-center gap-2 px-2 pb-2 mb-2 border-b border-[var(--border-subtle)]">
                    <Layers size={14} className="text-[var(--text-muted)]"/>
                    <span className="text-xs font-bold text-[var(--text-primary)] uppercase">Calque de Saturation</span>
                </div>
                <div className="flex flex-col gap-1">
                    <button 
                        onClick={() => setSaturationOrg('none')}
                        className={`px-3 py-2 text-xs font-bold rounded-lg text-left transition-colors ${saturationOrg === 'none' ? 'bg-slate-100 dark:bg-slate-800 text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                    >
                        Aucun (Neutre)
                    </button>
                    {['msf', 'unicef', 'wwf', 'mdm'].map(org => (
                        <button 
                            key={org}
                            onClick={() => setSaturationOrg(org as Organization)}
                            className={`px-3 py-2 text-xs font-bold rounded-lg text-left uppercase transition-colors flex justify-between items-center ${saturationOrg === org ? 'bg-orange-50 text-orange-700 border border-orange-100' : 'text-[var(--text-secondary)] hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                        >
                            <span>Historique {org}</span>
                            {saturationOrg === org && <Check size={12}/>}
                        </button>
                    ))}
                </div>
            </div>

            {/* Legend - Bottom Left */}
            {saturationOrg !== 'none' && (
                <div className="absolute bottom-6 left-6 z-[40] bg-white/90 dark:bg-[var(--bg-card-solid)]/90 backdrop-blur p-3 rounded-xl shadow-lg border border-[var(--border-subtle)] animate-fade-in">
                    <h5 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2">Légende Historique</h5>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-red-500 shadow-sm"></span>
                            <span className="text-xs font-bold text-[var(--text-primary)]">&lt; 6 Mois (Saturé)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-orange-500 shadow-sm"></span>
                            <span className="text-xs font-bold text-[var(--text-primary)]">6 - 12 Mois (Attention)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-green-500 shadow-sm"></span>
                            <span className="text-xs font-bold text-[var(--text-primary)]">&gt; 1 An / Jamais (Libre)</span>
                        </div>
                        <div className="flex items-center gap-2 pt-1 mt-1 border-t border-[var(--border-subtle)]">
                            <span className="w-3 h-3 rounded-full bg-orange-500 shadow-sm border border-white"></span>
                            <span className="text-xs font-bold text-orange-600">Votre Sélection</span>
                        </div>
                    </div>
                </div>
            )}

            <div ref={mapContainerRef} className="h-full w-full z-0 bg-slate-100 dark:bg-slate-800"></div>

            {/* Validation Bar - Bottom Center */}
            {selectedStats.count > 0 && (
                <div className="absolute bottom-6 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 z-[40] bg-slate-900/95 backdrop-blur text-white p-3 md:p-4 rounded-2xl shadow-2xl flex flex-wrap md:flex-nowrap items-center gap-4 md:gap-8 animate-fade-in">
                    <div>
                        <p className="text-slate-400 text-xs font-bold uppercase">Sélection</p>
                        <p className="text-xl font-black">{selectedStats.count} <span className="text-sm font-medium text-slate-400">communes</span></p>
                    </div>
                    <div className="hidden md:block w-px bg-white/20 h-8 self-center"></div>
                    <div>
                        <p className="text-slate-400 text-xs font-bold uppercase">Potentiel Hab.</p>
                        <p className="text-xl font-black text-orange-400">{(selectedStats.pop / 1000).toFixed(1)}k</p>
                    </div>

                    <button
                        onClick={() => onValidationRequest(selectedStats.list)}
                        className="bg-orange-600 hover:bg-orange-500 text-white px-6 py-2 rounded-xl font-bold text-sm shadow-lg shadow-orange-900/50 transition-all flex items-center gap-2 w-full md:w-auto md:ml-4 justify-center"
                    >
                        Valider <ArrowRight size={18}/>
                    </button>
                </div>
            )}
        </div>
    );
};


// --- MAIN TAB ---
const CommunesTab: React.FC = () => {
  const [selectedOrg, setSelectedOrg] = useState<Organization>('msf');
  const [search, setSearch] = useState('');
  
  // Navigation Mode
  const [mode, setMode] = useState<'list' | 'map'>('list');

  // Filters
  const [selectedRegions, setSelectedRegions] = useState<Set<string>>(new Set());
  const [selectedDepts, setSelectedDepts] = useState<Set<string>>(new Set());
  const [selectedStatuses, setSelectedStatuses] = useState<Set<CommuneStatus>>(new Set());
  
  // Data
  const [localCommunes, setLocalCommunes] = useState<Commune[]>([]);
  const [selectedCommune, setSelectedCommune] = useState<Commune | null>(null);
  const [pastRequests, setPastRequests] = useState<ProspectHistoryItem[]>([
      { 
          id: 'req-1', 
          date: new Date(Date.now() - 86400000 * 2), // 2 days ago
          communeCount: 12, 
          totalPop: 45000, 
          zoneCount: "5.6",
          communesList: [
              { nom: 'Saverne', lat: 48.74, lng: 7.36 }, 
              { nom: 'Marmoutier', lat: 48.69, lng: 7.38 },
              { nom: 'Wasselonne', lat: 48.63, lng: 7.44 }
          ]
      }
  ]);
  const [validationData, setValidationData] = useState<{ communes: MapCommuneFeature[], stats: any } | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  // Init local data on mount or org change
  useEffect(() => {
      setLocalCommunes(communesData[selectedOrg]);
      setSelectedCommune(null);
  }, [selectedOrg]);

  // Update selected commune if local data changes
  useEffect(() => {
      if (selectedCommune) {
          const updated = localCommunes.find(c => c.id === selectedCommune.id);
          if (updated) setSelectedCommune(updated);
      }
  }, [localCommunes]);

  const handleUpdateCommune = (id: number, updates: Partial<Commune>) => {
      setLocalCommunes(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const handleMapValidationRequest = (selectedFeatures: MapCommuneFeature[]) => {
      const pop = selectedFeatures.reduce((acc, f) => acc + f.properties.population, 0);
      setValidationData({
          communes: selectedFeatures,
          stats: {
              count: selectedFeatures.length,
              pop: pop,
              zones: (pop / 8000).toFixed(1)
          }
      });
  };

  const handleConfirmValidation = () => {
      if (!validationData) return;
      
      const { communes, stats } = validationData;

      // 1. Convert features to communes and add/update them
      const newCommunes: Commune[] = communes.map((f, idx) => ({
          id: Date.now() + idx,
          nom: f.properties.nom,
          departement: f.properties.code.substring(0, 2),
          population: f.properties.population,
          passage: 'Jamais',
          statut: 'pas_demande',
          maire: 'Non renseigné',
          revenue: `${Math.floor(f.properties.revenue)} €`,
          lat: 0, 
          lng: 0,
          email: '',
          phone: ''
      }));
      
      setLocalCommunes(prev => [...prev, ...newCommunes]);

      // 2. Add to History
      const newHistoryItem: ProspectHistoryItem = {
          id: `req-${Date.now()}`,
          date: new Date(),
          communeCount: stats.count,
          totalPop: stats.pop,
          zoneCount: stats.zones,
          communesList: communes.map(c => ({
              nom: c.properties.nom,
              lat: c.properties.lat || 0, // Fallback if lat missing
              lng: c.properties.lng || 0
          }))
      };
      setPastRequests(prev => [newHistoryItem, ...prev]);

      // 3. Close & Reset
      setValidationData(null);
      alert(`Demande validée ! Email automatique programmé pour ${stats.count} mairies.`);
      // Optional: switch back to list or stay on map
  };

  // Compute Options for filters
  const availableDeptsOptions = useMemo(() => {
      const uniqueDepts = Array.from(new Set(localCommunes.map(c => c.departement))).sort();
      // Add more depts for the map mode simulation if needed, or stick to list
      // For map mode, let's use all depts in constant
      const allDepts = Object.keys(departmentMap).sort();
      return allDepts.map(code => ({ value: code, label: `${code} - ${departmentMap[code] || ''}` }));
  }, [localCommunes]);

  const availableRegionsOptions = useMemo(() => {
      const regions = new Set<string>(Object.values(departmentToRegionMap));
      return Array.from(regions).sort().map(r => ({ value: r, label: r }));
  }, []);

  const toggleStatus = (status: CommuneStatus) => {
      const newSet = new Set(selectedStatuses);
      if (newSet.has(status)) {
          newSet.delete(status);
      } else {
          newSet.add(status);
      }
      setSelectedStatuses(newSet);
  };

  const filteredCommunes = useMemo(() => {
    return localCommunes.filter(c => {
      const matchesSearch = c.nom.toLowerCase().includes(search.toLowerCase()) || c.departement.includes(search);
      const matchesStatus = selectedStatuses.size === 0 || selectedStatuses.has(c.statut);
      
      let matchesGeo = true;
      if (selectedRegions.size > 0 || selectedDepts.size > 0) {
          const region = departmentToRegionMap[c.departement];
          const inRegion = region ? selectedRegions.has(region) : false;
          const inDept = selectedDepts.has(c.departement);
          matchesGeo = inRegion || inDept;
      }
      
      return matchesSearch && matchesStatus && matchesGeo;
    });
  }, [localCommunes, search, selectedRegions, selectedDepts, selectedStatuses]);

  // Update List Map
  useEffect(() => {
    if (mode !== 'list') return;

    const L = (window as any).L;
    if (!L) return;

    if (mapContainerRef.current && !mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, { zoomControl: false }).setView([46.603354, 1.888334], 5.5);
        const isDarkMode = document.documentElement.classList.contains('dark');
        L.tileLayer.provider(isDarkMode ? 'CartoDB.DarkMatter' : 'CartoDB.Positron').addTo(map);
        L.control.zoom({ position: 'topright' }).addTo(map);
        mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    if (map) {
        markersRef.current.forEach(m => map.removeLayer(m));
        markersRef.current = [];

        filteredCommunes.forEach(c => {
            if (c.lat && c.lng) {
                let color = '#3b82f6';
                if (c.statut === 'fait') color = '#10b981';
                else if (c.statut === 'refuse') color = '#ef4444';
                else if (c.statut === 'telescope') color = '#9333ea';
                else if (c.statut === 'informe') color = '#f59e0b';
                else if (c.statut === 'pas_demande') color = '#94a3b8';

                const marker = L.circleMarker([c.lat, c.lng], {
                    radius: 6,
                    fillColor: color,
                    color: '#fff',
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.8
                }).addTo(map);
                
                marker.bindPopup(`<b>${c.nom}</b><br/>${statusMap[c.statut]?.text || c.statut}`);
                marker.on('click', () => setSelectedCommune(c));
                markersRef.current.push(marker);
            }
        });
    }
  }, [filteredCommunes, mode]);

  return (
    <section className="min-h-[calc(100vh-150px)] md:h-[calc(100vh-100px)] flex flex-col md:flex-row gap-4 md:gap-6 animate-fade-in">
        {/* VALIDATION MODAL */}
        <ProspectValidationModal 
            isOpen={!!validationData}
            onClose={() => setValidationData(null)}
            onConfirm={handleConfirmValidation}
            communes={validationData?.communes || []}
            stats={validationData?.stats || {count:0, pop:0, zones:"0"}}
        />

        {/* Left List Panel */}
        <div className="w-full md:w-[480px] flex flex-col bg-white dark:bg-[var(--bg-card-solid)] rounded-2xl shadow-sm border border-[var(--border-subtle)] overflow-hidden flex-shrink-0">
            <div className="p-4 border-b border-[var(--border-subtle)] bg-slate-50/50 dark:bg-slate-800/30 space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-extrabold text-[var(--text-primary)] flex items-center gap-2">
                        {mode === 'list' ? <ListIcon className="text-orange-600"/> : <MapIcon className="text-emerald-600"/>} 
                        {mode === 'list' ? 'Liste des Communes' : 'Prospection Carte'}
                    </h2>
                    {/* MODE SWITCHER */}
                    <div className="flex bg-slate-200 dark:bg-slate-700 p-1 rounded-lg">
                        <button 
                            onClick={() => setMode('list')}
                            className={`p-2 rounded-md transition-all ${mode === 'list' ? 'bg-white dark:bg-[var(--bg-card-solid)] text-orange-600 shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                            title="Vue Liste"
                        >
                            <ListIcon size={18} />
                        </button>
                        <button 
                            onClick={() => setMode('map')}
                            className={`p-2 rounded-md transition-all ${mode === 'map' ? 'bg-white dark:bg-[var(--bg-card-solid)] text-emerald-600 shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                            title="Vue Prospection"
                        >
                            <MapIcon size={18} />
                        </button>
                    </div>
                </div>
                
                {/* Org Switcher */}
                <div className="flex gap-2">
                     {(['msf', 'unicef', 'wwf', 'mdm'] as Organization[]).map(org => (
                         <button
                            key={org}
                            onClick={() => setSelectedOrg(org)}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-bold uppercase transition-all border ${selectedOrg === org ? 'bg-slate-800 text-white border-slate-800' : 'bg-white dark:bg-[var(--bg-card-solid)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                         >
                             {org}
                         </button>
                     ))}
                </div>

                {/* Filters Section */}
                <div className="space-y-3 pt-2 border-t border-[var(--border-subtle)]/50">
                    {mode === 'list' && (
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16}/>
                            <input 
                                type="text" 
                                placeholder="Rechercher une ville..." 
                                className="w-full pl-9 pr-3 py-2 text-sm border border-[var(--border-subtle)] rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-[var(--bg-card-solid)]"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    )}
                    
                    {/* Multi-Select Filters Row */}
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <MultiSelectFilter 
                                label="Régions" 
                                options={availableRegionsOptions}
                                selected={selectedRegions}
                                onChange={setSelectedRegions}
                            />
                        </div>
                        <div className="flex-1">
                             <MultiSelectFilter 
                                label="Départements" 
                                options={availableDeptsOptions}
                                selected={selectedDepts}
                                onChange={setSelectedDepts}
                            />
                        </div>
                    </div>

                    {mode === 'list' && (
                        <div className="flex flex-wrap gap-2">
                            {(['pas_demande', 'informe', 'refuse', 'telescope', 'fait'] as CommuneStatus[]).map(status => {
                                const isSelected = selectedStatuses.has(status);
                                const conf = statusMap[status];
                                return (
                                    <button
                                        key={status}
                                        onClick={() => toggleStatus(status)}
                                        className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase border transition-all flex items-center gap-1
                                        ${isSelected 
                                            ? `${conf.bg} ${conf.color} border-${conf.color.split('-')[1]}-200 shadow-sm` 
                                            : 'bg-white dark:bg-[var(--bg-card-solid)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:border-slate-300 dark:hover:border-slate-500'
                                        }`}
                                    >
                                        {isSelected && <Check size={10} strokeWidth={4}/>}
                                        {conf.text}
                                    </button>
                                );
                            })}
                            {selectedStatuses.size > 0 && (
                                <button onClick={() => setSelectedStatuses(new Set())} className="text-[10px] text-[var(--text-muted)] underline px-1">Reset</button>
                            )}
                        </div>
                    )}

                    {mode === 'map' && (
                        <div className="p-3 bg-orange-50 rounded-lg border border-orange-100 text-xs text-orange-800 dark:text-orange-300">
                            <p className="font-bold flex items-center gap-1"><MousePointer2 size={12}/> Mode Prospection</p>
                            <p className="opacity-80 mt-1">Sélectionnez les départements ci-dessus pour charger la carte, puis utilisez le pinceau pour sélectionner des communes.</p>
                        </div>
                    )}
                </div>
            </div>

            {mode === 'list' && (
                <>
                    <div className="flex-grow overflow-y-auto custom-scrollbar p-2 space-y-2">
                        {filteredCommunes.length > 0 ? (
                            filteredCommunes.map(c => (
                                <div 
                                    key={c.id} 
                                    onClick={() => setSelectedCommune(c)}
                                    className={`p-3 rounded-xl border transition-all cursor-pointer hover:shadow-md ${selectedCommune?.id === c.id ? 'bg-orange-50 border-orange-200 ring-1 ring-orange-200' : 'bg-white dark:bg-[var(--bg-card-solid)] border-[var(--border-subtle)] hover:border-orange-100'}`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-[var(--text-primary)]">{c.nom}</h3>
                                        <QuickStatusDropdown 
                                            currentStatus={c.statut} 
                                            onSelect={(newStatus) => handleUpdateCommune(c.id, { statut: newStatus })}
                                        />
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)]">
                                        <div className="flex items-center gap-1"><MapPin size={12}/> {c.departement}</div>
                                        <div className="flex items-center gap-1"><Users size={12}/> {c.population.toLocaleString()}</div>
                                        <div className="flex items-center gap-1"><Euro size={12}/> {c.revenue}</div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-8 text-center text-[var(--text-muted)] text-sm italic">
                                Aucune commune ne correspond aux filtres.
                            </div>
                        )}
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-[var(--border-subtle)] text-center text-xs font-bold text-[var(--text-secondary)]">
                        {filteredCommunes.length} Communes affichées
                    </div>
                </>
            )}
            
            {/* HISTORY SIDEBAR FOR MAP MODE */}
            {mode === 'map' && (
                <div className="flex-grow overflow-y-auto custom-scrollbar p-4 space-y-4">
                     <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2 mb-2">
                        <History size={16}/> Mes dernières demandes
                     </h3>
                     {pastRequests.map(req => (
                         <div key={req.id} className="bg-white dark:bg-[var(--bg-card-solid)] border border-[var(--border-subtle)] rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow">
                             <div className="flex justify-between items-start mb-2">
                                 <div>
                                     <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">{req.date.toLocaleDateString()}</span>
                                     <div className="font-bold text-[var(--text-primary)]">{req.communeCount} Communes</div>
                                 </div>
                                 <div className="text-right">
                                     <div className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded">{req.zoneCount} Zones</div>
                                     <div className="text-[10px] text-[var(--text-muted)]">{(req.totalPop/1000).toFixed(1)}k hab.</div>
                                 </div>
                             </div>
                             
                             {/* Mini Map Visualizer */}
                             <div className="mb-2">
                                 <MiniZoneVisualizer points={req.communesList} />
                             </div>

                             <div className="text-xs text-[var(--text-secondary)] truncate">
                                 {req.communesList.slice(0, 3).map(c => c.nom).join(', ')}...
                             </div>
                         </div>
                     ))}
                </div>
            )}
        </div>

        {/* Right Details & Map Panel */}
        <div className="flex-1 flex flex-col gap-6 min-h-[400px] md:min-h-0">
            {mode === 'list' ? (
                <>
                     {selectedCommune ? (
                        <div className="glass-card p-6 animate-fade-in flex flex-col gap-6 overflow-y-auto custom-scrollbar max-h-[50vh]">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-3xl font-black text-[var(--text-primary)] mb-1">{selectedCommune.nom}</h2>
                                    <p className="text-[var(--text-secondary)] font-medium text-lg">{departmentMap[selectedCommune.departement]} ({selectedCommune.departement})</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2">Statut Actuel</p>
                                    <QuickStatusDropdown 
                                        currentStatus={selectedCommune.statut} 
                                        onSelect={(s) => handleUpdateCommune(selectedCommune.id, { statut: s })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-[var(--border-subtle)] flex flex-col items-center">
                                    <Users className="text-orange-500 mb-1" size={20}/>
                                    <span className="text-lg font-black text-[var(--text-primary)]">{selectedCommune.population.toLocaleString()}</span>
                                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Habitants</span>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-[var(--border-subtle)] flex flex-col items-center">
                                    <Euro className="text-emerald-500 mb-1" size={20}/>
                                    <span className="text-lg font-black text-[var(--text-primary)]">{selectedCommune.revenue}</span>
                                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Rev. Médian</span>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-[var(--border-subtle)] flex flex-col items-center">
                                    <Clock className="text-purple-500 mb-1" size={20}/>
                                    <span className="text-lg font-black text-[var(--text-primary)]">{selectedCommune.passage}</span>
                                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Dernier Passage</span>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <Info size={16}/> Administration
                                </h3>
                                <div className="bg-white dark:bg-[var(--bg-card-solid)] border border-[var(--border-subtle)] rounded-xl p-4 space-y-3 shadow-sm">
                                        <div>
                                            <p className="text-xs text-[var(--text-muted)] font-bold uppercase">Maire Actuel</p>
                                            <p className="text-base font-bold text-[var(--text-primary)]">{selectedCommune.maire}</p>
                                        </div>
                                        <div className="border-t border-[var(--border-subtle)] pt-3 space-y-2">
                                            <EditableField 
                                            icon={Phone} 
                                            value={selectedCommune.phone || ''} 
                                            onSave={(val) => handleUpdateCommune(selectedCommune.id, { phone: val })} 
                                            type="tel"
                                            />
                                            <EditableField 
                                            icon={Mail} 
                                            value={selectedCommune.email || ''} 
                                            onSave={(val) => handleUpdateCommune(selectedCommune.id, { email: val })} 
                                            type="email"
                                            />
                                        </div>
                                </div>
                            </div>

                            <div className="pt-2">
                                <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <History size={16}/> Historique des Passages
                                </h3>
                                {selectedCommune.historiquePassages ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {Object.entries(selectedCommune.historiquePassages).map(([org, dates]) => (
                                            <div key={org} className="bg-slate-50 dark:bg-slate-800/50 border border-[var(--border-subtle)] rounded-xl p-3 shadow-sm">
                                                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[var(--border-subtle)]">
                                                    <div className={`w-2 h-2 rounded-full ${org === 'msf' ? 'bg-red-500' : org === 'unicef' ? 'bg-orange-500' : org === 'wwf' ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                                                    <span className="text-xs font-black uppercase text-[var(--text-primary)]">{org}</span>
                                                </div>
                                                <div className="space-y-1.5">
                                                    {dates.map((date, idx) => (
                                                        <div key={idx} className="flex items-center gap-2 text-xs text-[var(--text-secondary)] bg-white dark:bg-[var(--bg-card-solid)] px-2 py-1 rounded border border-[var(--border-subtle)]">
                                                            <Calendar size={12} className="text-[var(--text-muted)]"/>
                                                            <span className="font-medium">{date}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-[var(--border-subtle)] text-[var(--text-muted)] text-sm italic">
                                        Aucun historique de passage enregistré pour cette commune.
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="glass-card p-8 flex items-center justify-center text-[var(--text-muted)] font-medium">
                            Sélectionnez une commune pour voir les détails
                        </div>
                    )}

                    <div className="flex-grow min-h-[300px] rounded-2xl overflow-hidden shadow-sm border border-[var(--border-subtle)] relative">
                        <div ref={mapContainerRef} className="absolute inset-0 z-0"></div>
                    </div>
                </>
            ) : (
                // PROSPECTION MAP MODE
                <ProspectionMap 
                    departments={selectedDepts} 
                    onValidationRequest={handleMapValidationRequest}
                />
            )}
        </div>
    </section>
  );
};

export default CommunesTab;
