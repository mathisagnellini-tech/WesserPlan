
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Plus, Trash2, FileText, Search, MapPin, LayoutGrid, List as ListIcon, Fuel, AlertTriangle, Gauge, Calendar, Phone, User, Euro, CheckCircle2, Navigation, Hotel, X, Bed, Wifi, Car, Star, ArrowRight, Scan, Upload, Loader2, Save, Copy, Check, Camera, MousePointer2, ShieldCheck, Target, Zap, TrendingDown, Percent, Wallet } from 'lucide-react';
import { HOUSINGS_SEED, CARS_SEED } from '../data/operations-seed';

// To satisfy TypeScript for global variables loaded from CDNs
declare const L: any;
declare const Chart: any;

interface OperationsTabProps {
  isActive: boolean;
}

// --- Types ---
interface Housing {
  id: string;
  name: string;
  date: string;
  lead: string;
  region: string;
  dept: string;
  org: string;
  people: number;
  nights: number;
  cost: number;
  channel: string;
  address: string;
  owner: string;
  ownerName: string;
  rating: number;
  comment: string;
  lat: number;
  lng: number;
  amenities: string[];
  // Smart Match properties (dynamic)
  _matchScore?: number;
  _matchDistance?: number;
  _matchLabel?: string;
  _matchColor?: string;
}

interface Car {
  id: string;
  plate: string;
  brand: string;
  where: string;
  km: number;
  service: string;
  owner: string;
  lat: number;
  lng: number;
  fuelStats: {
    declared: number;
    tankSize: number;
  };
  damages?: { date: string; description: string; author: string }[];
}

interface TargetZone {
    id: string;
    name: string;
    lat: number;
    lng: number;
    radius: number; // km
}

interface GeoApiCommune {
    nom: string;
    code: string;
    departement: {
        code: string;
        nom: string;
    };
    centre: {
        coordinates: [number, number];
    };
}

// --- Helper Functions ---
const getDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371; 
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lng2 - lng1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; 
};

// Estimation: (Distance Logement <-> Zone * 2 (A/R) * 6 jours) / Autonomie (~800km)
const estimateFuelStops = (housingLat: number, housingLng: number, zoneLat: number, zoneLng: number) => {
    const distOneWay = getDistance(housingLat, housingLng, zoneLat, zoneLng);
    const weeklyKm = (distOneWay * 2 * 6) * 1.2; 
    const tankRange = 800; 
    return {
        stops: Math.ceil((weeklyKm / tankRange) * 10) / 10,
        km: Math.round(weeklyKm),
        distOneWay: Math.round(distOneWay)
    };
};

const getWeekNumberLabel = (dateString: string) => {
    const date = new Date(dateString);
    if(isNaN(date.getTime())) return "S--";
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `S${weekNo}-${d.getUTCFullYear()}`;
};

// --- MOCK ZONES FOR SMART MATCHER ---
const MOCK_ZONES: TargetZone[] = [
    { id: 'z1', name: 'Zone S42 - Strasbourg Nord', lat: 48.62, lng: 7.77, radius: 15 },
    { id: 'z2', name: 'Zone S42 - Colmar Vignoble', lat: 48.08, lng: 7.35, radius: 20 },
    { id: 'z3', name: 'Zone S43 - Mulhouse Agglo', lat: 47.75, lng: 7.33, radius: 10 },
    { id: 'z4', name: 'Zone S43 - Rennes Centre', lat: 48.11, lng: -1.67, radius: 12 },
];

// --- COMPONENTS ---

// 1. LOGISTICS DASHBOARD WIDGET
const LogisticsDashboard: React.FC<{ housings: Housing[], cars: Car[] }> = ({ housings, cars }) => {
    const totalCost = housings.reduce((acc, h) => acc + h.cost, 0);
    const totalNights = housings.reduce((acc, h) => acc + h.nights, 0);
    const avgCostPerNight = totalNights > 0 ? (totalCost / totalNights).toFixed(0) : 0;
    
    // Occupancy (Mock: capacity used vs available)
    const totalCapacity = housings.reduce((acc, h) => acc + (h.people > 0 ? 8 : 0), 0); // Mock max capacity 8 per housing
    const usedCapacity = housings.reduce((acc, h) => acc + h.people, 0);
    const occupancyRate = totalCapacity > 0 ? Math.round((usedCapacity / totalCapacity) * 100) : 0;

    const budgetTotal = 5000;
    const budgetUsed = totalCost;
    const budgetPercent = Math.round((budgetUsed / budgetTotal) * 100);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-[var(--bg-card-solid)] rounded-2xl p-4 border border-[var(--border-subtle)] shadow-sm flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Euro size={48} />
                </div>
                <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Coût Moyen / Nuit</h4>
                <div className="flex items-end gap-2 mt-2">
                    <span className="text-3xl font-black text-[var(--text-primary)]">{avgCostPerNight}€</span>
                    <span className="text-xs font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded mb-1 flex items-center gap-1">
                        <TrendingDown size={10} /> -5%
                    </span>
                </div>
                <p className="text-[10px] text-[var(--text-muted)] mt-1">Objectif: &lt; 30€/pers/nuit</p>
            </div>

            <div className="bg-white dark:bg-[var(--bg-card-solid)] rounded-2xl p-4 border border-[var(--border-subtle)] shadow-sm flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Bed size={48} />
                </div>
                <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Taux d'Occupation</h4>
                <div className="flex items-end gap-2 mt-2">
                    <span className="text-3xl font-black text-[var(--text-primary)]">{occupancyRate}%</span>
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded mb-1 ${occupancyRate < 70 ? 'text-red-600 bg-red-50' : 'text-orange-600 bg-orange-50'}`}>
                        {occupancyRate < 70 ? 'Sous-optimisé' : 'Optimal'}
                    </span>
                </div>
                 {/* Mini Bar */}
                 <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-orange-500 rounded-full" style={{ width: `${occupancyRate}%` }}></div>
                </div>
            </div>

            <div className="bg-white dark:bg-[var(--bg-card-solid)] rounded-2xl p-4 border border-[var(--border-subtle)] shadow-sm flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Wallet size={48} />
                </div>
                <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Budget Hebdo (S42)</h4>
                <div className="flex items-end gap-2 mt-2">
                    <span className="text-3xl font-black text-[var(--text-primary)]">{budgetUsed}€</span>
                    <span className="text-xs font-bold text-[var(--text-muted)] mb-1">/ {budgetTotal}€</span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full mt-2 overflow-hidden relative">
                    <div className={`h-full rounded-full transition-all duration-500 ${budgetPercent > 90 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${budgetPercent}%` }}></div>
                </div>
                <p className={`text-[10px] mt-1 font-bold ${budgetPercent > 90 ? 'text-red-500' : 'text-emerald-600'}`}>
                    {budgetPercent > 90 ? 'Attention budget critique' : 'Budget maîtrisé'}
                </p>
            </div>

            <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 shadow-sm flex flex-col justify-between relative overflow-hidden text-white">
                <div className="absolute right-0 top-0 p-3 opacity-20">
                    <AlertTriangle size={48} />
                </div>
                <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Alertes Flotte</h4>
                <div className="mt-2 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-orange-300">
                        <Calendar size={14}/>
                        <span>1 Véhicule en révision (J-5)</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-medium text-red-300">
                        <AlertTriangle size={14}/>
                        <span>1 Choc signalé non réparé</span>
                    </div>
                </div>
                <button className="mt-auto text-xs font-bold text-center bg-white/10 hover:bg-white/20 py-2 rounded-lg transition-colors">
                    Voir Parc Auto
                </button>
            </div>
        </div>
    );
};

// 2. REPORT DAMAGE MODAL
const ReportDamageModal: React.FC<{ car: Car, onClose: () => void, onReport: (desc: string) => void }> = ({ car, onClose, onReport }) => {
    const [step, setStep] = useState(1);
    const [desc, setDesc] = useState("");
    
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fade-in">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-white dark:bg-[var(--bg-card-solid)] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative z-10">
                <div className="p-6">
                    <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2 flex items-center gap-2">
                        <ShieldCheck className="text-orange-500"/> État des lieux Digital
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)] mb-6">Véhicule : {car.brand} ({car.plate})</p>

                    {step === 1 && (
                        <div className="space-y-4">
                             <div className="bg-slate-50 dark:bg-slate-800/50 p-8 border-2 border-dashed border-[var(--border-subtle)] rounded-xl flex flex-col items-center justify-center text-[var(--text-muted)] hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors cursor-pointer group">
                                 <Camera size={48} className="mb-2 group-hover:text-orange-500"/>
                                 <span className="font-bold text-sm">Prendre une photo du choc</span>
                             </div>
                             <div>
                                 <label className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-1 block">Description</label>
                                 <textarea 
                                    className="w-full border border-[var(--border-subtle)] rounded-lg p-3 text-sm focus:ring-2 focus:ring-orange-500 outline-none dark:bg-[var(--bg-card-solid)] dark:text-[var(--text-primary)]"
                                    rows={3}
                                    placeholder="Ex: Rayure pare-choc arrière droit..."
                                    value={desc}
                                    onChange={e => setDesc(e.target.value)}
                                 ></textarea>
                             </div>
                             <button 
                                onClick={() => setStep(2)}
                                disabled={!desc}
                                className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
                             >
                                 Suivant
                             </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="text-center py-6">
                            <CheckCircle2 size={64} className="text-green-500 mx-auto mb-4 animate-bounce" />
                            <h4 className="text-lg font-bold text-[var(--text-primary)]">Signalement Enregistré</h4>
                            <p className="text-sm text-[var(--text-secondary)] mb-6">Le manager de flotte a été notifié.</p>
                            <button 
                                onClick={() => { onReport(desc); onClose(); }}
                                className="px-6 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[var(--text-primary)] font-bold rounded-lg"
                            >
                                Fermer
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ... (Keep existing modals: AddHousingModal, HousingDetailModal - minimal updates if needed)
const AddHousingModal: React.FC<{ 
    isOpen: boolean; 
    initialMode: 'manual' | 'scan';
    onClose: () => void; 
    onAdd: (h: Housing) => void;
}> = ({ isOpen, initialMode, onClose, onAdd }) => {
    // ... (Keep existing implementation)
    const [mode, setMode] = useState<'manual' | 'scan'>(initialMode);
    const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'done'>('idle');
    const [formData, setFormData] = useState<Partial<Housing>>({ org: 'MSF', amenities: [], rating: 0, people: 5, nights: 5, date: new Date().toISOString().split('T')[0] });

    useEffect(() => { if(isOpen) { setMode(initialMode); setScanStatus('idle'); setFormData({ org: 'MSF', amenities: [], rating: 0, people: 5, nights: 5, date: new Date().toISOString().split('T')[0] }); } }, [isOpen, initialMode]);
    if (!isOpen) return null;

    const handleManualSubmit = (e: React.FormEvent) => { e.preventDefault(); const newHousing: Housing = { id: Date.now().toString(), name: formData.name || "Logement sans nom", date: formData.date || new Date().toISOString().split('T')[0], lead: "Moi", region: "Nouvelle-Aquitaine", dept: "33", org: formData.org || 'MSF', people: Number(formData.people), nights: Number(formData.nights), cost: Number(formData.cost) || 0, channel: formData.channel || "Direct", address: formData.address || "Adresse non renseignée", owner: formData.owner || "", ownerName: formData.ownerName || "Propriétaire", rating: 0, comment: formData.comment || "", lat: 44.8378, lng: -0.5792, amenities: formData.amenities || [] }; onAdd(newHousing); onClose(); };
    const handleScanFile = () => { setScanStatus('scanning'); setTimeout(() => { setScanStatus('done'); setFormData({ name: "Gîte Airbnb 'Le Petit Bonheur'", address: "12 Rue des Lilas, 33000 Bordeaux", cost: 450, nights: 4, ownerName: "Airbnb Receipt #4920", channel: "Airbnb", people: 2, org: "MSF", date: new Date().toISOString().split('T')[0] }); setTimeout(() => setMode('manual'), 800); }, 2000); };

    return ( <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fade-in"> <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose}></div> <div className="relative bg-white dark:bg-[var(--bg-card-solid)] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"> <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 border-b border-[var(--border-subtle)] flex justify-between items-center"> <h3 className="font-bold text-lg text-[var(--text-primary)]">{mode === 'manual' ? 'Saisie Manuelle' : 'Scanner un document'}</h3> <button onClick={onClose}><X className="text-[var(--text-muted)] hover:text-slate-600" /></button> </div> <div className="p-6 overflow-y-auto"> {mode === 'scan' && ( <div className="flex flex-col items-center justify-center py-8 text-center"> {scanStatus === 'idle' && ( <div onClick={handleScanFile} className="w-full h-48 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"> <Upload size={48} className="text-slate-300 mb-4" /> <p className="font-medium text-[var(--text-secondary)]">Cliquez pour uploader le reçu</p> <p className="text-xs text-[var(--text-muted)] mt-1">PDF, JPG, PNG acceptés</p> </div> )} {scanStatus === 'scanning' && ( <div className="py-12"> <Loader2 size={48} className="text-purple-600 animate-spin mb-4 mx-auto" /> <p className="font-bold text-[var(--text-primary)]">Analyse du document...</p> <p className="text-sm text-[var(--text-secondary)]">Extraction des données via IA</p> </div> )} {scanStatus === 'done' && ( <div className="py-12 text-green-600"> <CheckCircle2 size={48} className="mx-auto mb-4" /> <p className="font-bold">Analyse terminée !</p> </div> )} <button onClick={() => setMode('manual')} className="mt-6 text-orange-600 text-sm hover:underline font-medium">Passer à la saisie manuelle</button> </div> )} {mode === 'manual' && ( <form onSubmit={handleManualSubmit} className="space-y-4"> <div className="grid grid-cols-2 gap-4"> <div className="col-span-2"> <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-1">Nom du Logement</label> <input type="text" className="w-full px-3 py-2 border border-[var(--border-subtle)] rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm font-medium dark:bg-[var(--bg-card-solid)] dark:text-[var(--text-primary)]" placeholder="Ex: Gîte des Lilas" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} autoFocus required /> </div> </div> <div> <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-1">Adresse complète</label> <div className="relative"> <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} /> <input type="text" className="w-full pl-9 pr-3 py-2 border border-[var(--border-subtle)] rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm font-medium dark:bg-[var(--bg-card-solid)] dark:text-[var(--text-primary)]" placeholder="Ex: 12 Rue de la Paix, 75000 Paris" value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} required /> </div> </div> <div className="grid grid-cols-2 gap-4"> <div> <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-1">Date début location</label> <input type="date" className="w-full px-3 py-2 border border-[var(--border-subtle)] rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm font-medium dark:bg-[var(--bg-card-solid)] dark:text-[var(--text-primary)]" value={formData.date || ''} onChange={e => setFormData({...formData, date: e.target.value})} required /> {formData.date && ( <p className="text-xs text-orange-600 font-bold mt-1 text-right">{getWeekNumberLabel(formData.date)}</p> )} </div> <div> <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-1">Capacité (Pers.)</label> <div className="flex items-center gap-2"> <input type="number" className="w-16 px-2 py-2 border border-[var(--border-subtle)] rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm font-medium text-center" value={formData.people || ''} onChange={e => setFormData({...formData, people: +e.target.value})} /> <button type="button" onClick={() => setFormData({...formData, people: 5})} className={`px-3 py-2 rounded-lg text-xs font-bold border ${formData.people === 5 ? 'bg-orange-100 border-orange-200 text-orange-700' : 'bg-white dark:bg-[var(--bg-card-solid)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>5</button> <button type="button" onClick={() => setFormData({...formData, people: 10})} className={`px-3 py-2 rounded-lg text-xs font-bold border ${formData.people === 10 ? 'bg-orange-100 border-orange-200 text-orange-700' : 'bg-white dark:bg-[var(--bg-card-solid)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>10</button> </div> </div> </div> <div className="grid grid-cols-2 gap-4"> <div> <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-1">Coût Total (€)</label> <input type="number" className="w-full px-3 py-2 border border-[var(--border-subtle)] rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm font-medium dark:bg-[var(--bg-card-solid)] dark:text-[var(--text-primary)]" placeholder="0" value={formData.cost || ''} onChange={e => setFormData({...formData, cost: +e.target.value})} required /> </div> <div> <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-1">Source</label> <select className="w-full px-3 py-2 border border-[var(--border-subtle)] rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm font-medium bg-white dark:bg-[var(--bg-card-solid)]" value={formData.channel || 'Direct'} onChange={e => setFormData({...formData, channel: e.target.value})} > <option value="Direct">Direct</option> <option value="Airbnb">Airbnb</option> <option value="Booking">Booking</option> <option value="Gîtes">Gîtes</option> </select> </div> </div> <div className="grid grid-cols-2 gap-4"> <div> <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-1">Nom Contact</label> <input type="text" className="w-full px-3 py-2 border border-[var(--border-subtle)] rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm font-medium dark:bg-[var(--bg-card-solid)] dark:text-[var(--text-primary)]" placeholder="M. Martin" value={formData.ownerName || ''} onChange={e => setFormData({...formData, ownerName: e.target.value})} /> </div> <div> <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-1">Téléphone</label> <input type="tel" className="w-full px-3 py-2 border border-[var(--border-subtle)] rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm font-medium dark:bg-[var(--bg-card-solid)] dark:text-[var(--text-primary)]" placeholder="06..." value={formData.owner || ''} onChange={e => setFormData({...formData, owner: e.target.value})} /> </div> </div> <div className="flex gap-3 pt-2"> <button type="button" onClick={onClose} className="flex-1 py-3 text-[var(--text-secondary)] font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">Annuler</button> <button type="submit" className="flex-1 py-3 bg-orange-600 text-white font-bold text-sm rounded-lg shadow-md hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"> <Save size={16} /> Enregistrer </button> </div> </form> )} </div> </div> </div> );
};

const HousingDetailModal: React.FC<{ housing: Housing | null; onClose: () => void; }> = ({ housing, onClose }) => {
    if (!housing) return null;
    return ( <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in"> <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div> <div className="relative bg-white dark:bg-[var(--bg-card-solid)] rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"> <div className="h-40 bg-slate-100 dark:bg-slate-800 relative"> <div className="absolute inset-0 flex items-center justify-center text-slate-300"> <MapPin size={48} opacity={0.2}/> <span className="ml-2 text-sm font-medium">Aperçu carte indisponible</span> </div> <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/80 dark:bg-[var(--bg-card-solid)]/80 hover:bg-white rounded-full text-[var(--text-secondary)] transition-colors shadow-sm"> <X size={20} /> </button> <div className="absolute bottom-4 left-6"> <span className={`px-3 py-1 rounded-lg text-xs font-bold text-white shadow-sm ${housing.org === 'MSF' ? 'bg-red-600' : housing.org === 'UNICEF' ? 'bg-orange-500' : 'bg-green-600'}`}> Utilisé par {housing.org} </span> </div> </div> <div className="p-8 overflow-y-auto"> <div className="flex justify-between items-start mb-6"> <div> <h2 className="text-2xl font-bold text-[var(--text-primary)] leading-tight mb-1">{housing.name}</h2> <p className="text-[var(--text-secondary)] text-sm">{housing.address}</p> <div className="flex items-center gap-2 mt-1"> <span className="text-xs font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded">{getWeekNumberLabel(housing.date)}</span> <span className="text-xs text-[var(--text-secondary)]">{housing.region} ({housing.dept})</span> </div> </div> <div className="text-right"> <div className="text-2xl font-extrabold text-[var(--text-primary)]">{housing.cost} € <span className="text-sm font-medium text-[var(--text-muted)]">/ sem.</span></div> <div className="text-sm text-[var(--text-secondary)]">{(housing.cost / housing.nights).toFixed(0)}€ / nuit</div> </div> </div> <div className="grid grid-cols-3 gap-4 mb-8"> <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-[var(--border-subtle)] flex flex-col items-center justify-center text-center"> <User className="text-orange-500 mb-2" size={24} /> <span className="font-bold text-[var(--text-primary)] text-lg">{housing.people}</span> <span className="text-xs text-[var(--text-secondary)] uppercase font-bold">Personnes</span> </div> <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-[var(--border-subtle)] flex flex-col items-center justify-center text-center"> <Bed className="text-orange-500 mb-2" size={24} /> <span className="font-bold text-[var(--text-primary)] text-lg">{housing.nights}</span> <span className="text-xs text-[var(--text-secondary)] uppercase font-bold">Nuits min.</span> </div> <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-[var(--border-subtle)] flex flex-col items-center justify-center text-center"> <Star className="text-yellow-500 mb-2" size={24} fill="currentColor" /> <span className="font-bold text-[var(--text-primary)] text-lg">{housing.rating}/5</span> <span className="text-xs text-[var(--text-secondary)] uppercase font-bold">Avis Équipe</span> </div> </div> <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8"> <div> <h3 className="font-bold text-[var(--text-primary)] mb-3">Commentaire Chef d'Équipe</h3> <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-xl text-sm text-[var(--text-primary)] italic border border-yellow-100 dark:border-yellow-800/40 relative"> <span className="absolute top-2 left-2 text-4xl text-yellow-200 dark:text-yellow-700/50 font-serif leading-none">"</span> <p className="relative z-10">{housing.comment || "Aucun commentaire spécifique."}</p> <p className="text-right mt-2 text-xs font-bold not-italic text-[var(--text-muted)]">- {housing.lead}</p> </div> </div> <div> <h3 className="font-bold text-[var(--text-primary)] mb-3">Commodités</h3> <div className="space-y-2"> {housing.amenities.map(am => ( <div key={am} className="flex items-center gap-3 text-sm text-[var(--text-secondary)]"> <CheckCircle2 size={16} className="text-green-500"/> {am} </div> ))} </div> </div> </div> <div className="border-t border-[var(--border-subtle)] pt-6 flex items-center justify-between"> <div className="flex items-center gap-3"> <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center text-[var(--text-secondary)]"> <User size={20} /> </div> <div> <p className="text-sm font-bold text-[var(--text-primary)]">{housing.ownerName}</p> <p className="text-xs text-[var(--text-secondary)]">{housing.channel}</p> </div> </div> <button className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 dark:shadow-slate-900 flex items-center gap-2"> <Phone size={18} /> {housing.owner} </button> </div> </div> </div> </div> );
};

const OperationsTab: React.FC<OperationsTabProps> = ({ isActive }) => {
  // --- State ---
  const [activeSubTab, setActiveSubTab] = useState<'housing' | 'cars' | 'stats'>('housing');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalMode, setAddModalMode] = useState<'manual'|'scan'>('manual');
  
  // Smart Matcher State
  const [smartZoneId, setSmartZoneId] = useState<string>("");

  // Data State (local seed data, no backend)
  const [housingData, setHousingData] = useState<Housing[]>(HOUSINGS_SEED as Housing[]);
  const [carsData, setCarsData] = useState<Car[]>(CARS_SEED as Car[]);
  const [isLoading] = useState(false);

  const [selectedHousing, setSelectedHousing] = useState<Housing | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [reportingCar, setReportingCar] = useState<Car | null>(null);

  const housingMapRef = useRef<HTMLDivElement>(null);
  const housingMapInstance = useRef<any>(null);

  // --- SMART MATCHER LOGIC ---
  const filteredHousing = useMemo(() => {
      let data = [...housingData];

      if (smartZoneId) {
          const zone = MOCK_ZONES.find(z => z.id === smartZoneId);
          if (zone) {
              data = data.map(h => {
                  const dist = getDistance(h.lat, h.lng, zone.lat, zone.lng);
                  // Mock score calculation: 
                  // Distance weight: 50%, Price weight: 30%, Capacity weight: 20%
                  let score = 100;
                  score -= dist * 2; // -2 pts per km
                  if (dist > 30) score -= 20; // Penalty for far
                  
                  // Price factor (cheaper is better, assume base 100€/night)
                  const pricePerNight = h.cost / h.nights;
                  if (pricePerNight > 120) score -= 10;
                  if (pricePerNight < 80) score += 10;

                  // Label logic
                  let label = "";
                  let color = "";
                  if (score > 85) { label = "Top Match"; color = "bg-green-500"; }
                  else if (dist > 50) { label = "Trop Loin"; color = "bg-red-500"; }
                  else if (score > 60) { label = "Correct"; color = "bg-orange-500"; }
                  else { label = "Faible"; color = "bg-slate-400"; }

                  return { ...h, _matchScore: Math.round(score), _matchDistance: dist, _matchLabel: label, _matchColor: color };
              });
              // Sort by score desc
              data.sort((a, b) => (b._matchScore || 0) - (a._matchScore || 0));
          }
      }

      return data;
  }, [housingData, smartZoneId]);

  // Map Update
  useEffect(() => {
    // Housing Map Initialization
    if (isActive && activeSubTab === 'housing' && viewMode === 'map' && housingMapRef.current && !housingMapInstance.current) {
        const map = L.map(housingMapRef.current, { zoomControl: false }).setView([46.6, 2.5], 6);
        const isDark = document.documentElement.classList.contains('dark');
        L.tileLayer.provider(isDark ? 'CartoDB.DarkMatter' : 'CartoDB.Positron').addTo(map);
        L.control.zoom({ position: 'topright' }).addTo(map);
        housingMapInstance.current = map;
    }

    // Housing Map Update
    if (housingMapInstance.current && viewMode === 'map') {
        const map = housingMapInstance.current;
        // Clear existing layers
        map.eachLayer((layer: any) => {
            if (!layer._url) map.removeLayer(layer); // Keep tiles, remove markers/vectors
        });

        // 1. Draw Target Zone (if selected)
        if (smartZoneId) {
             const zone = MOCK_ZONES.find(z => z.id === smartZoneId);
             if (zone) {
                // Zone Circle
                L.circle([zone.lat, zone.lng], {
                    color: '#3b82f6',
                    fillColor: '#3b82f6',
                    fillOpacity: 0.1,
                    radius: zone.radius * 1000
                }).addTo(map);

                // Zone Center
                const targetIcon = L.divIcon({
                    html: `<div class="relative flex items-center justify-center">
                            <div class="absolute w-4 h-4 bg-orange-600 rounded-full animate-ping"></div>
                            <div class="relative w-3 h-3 bg-orange-600 rounded-full border border-white shadow-sm"></div>
                        </div>`,
                    className: 'bg-transparent border-none',
                    iconSize: [24, 24],
                    iconAnchor: [12, 12]
                });
                L.marker([zone.lat, zone.lng], { icon: targetIcon, zIndexOffset: 1000 })
                    .addTo(map)
                    .bindPopup(`<b>Zone: ${zone.name}</b>`);
             }
        }

        // 2. Draw Housing Markers
        const bounds = L.latLngBounds([]);

        filteredHousing.forEach((h: any) => {
            // Marker Color based on Match
            const markerColor = h._matchColor ? h._matchColor.replace('bg-', '') : 'slate-800'; // Simplistic mapping, ideally hex

            const iconHtml = `<div class="w-8 h-8 bg-white dark:bg-[var(--bg-card-solid)] rounded-full border-2 border-white flex items-center justify-center shadow-md hover:scale-110 transition-transform cursor-pointer text-sm relative">
                                🏠
                                ${h._matchLabel ? `<span class="absolute -top-2 -right-2 w-3 h-3 rounded-full ${h._matchColor}"></span>` : ''}
                              </div>`;
            const icon = L.divIcon({ html: iconHtml, className: 'bg-transparent', iconSize: [32, 32], iconAnchor: [16, 16] });
            
            const marker = L.marker([h.lat, h.lng], { icon }).addTo(map);
            
            marker.on('click', () => setSelectedHousing(h));

            bounds.extend([h.lat, h.lng]);
        });
        
        if (bounds.isValid()) {
             map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
        } else {
             map.setView([46.6, 2.5], 6);
        }

        setTimeout(() => map.invalidateSize(), 100);
    }
  }, [isActive, activeSubTab, viewMode, filteredHousing, smartZoneId]);

  const handleAddNewHousing = (newHousing: Housing) => {
    setHousingData([newHousing, ...housingData]);
  };

  const handleReportDamage = (desc: string) => {
      if (reportingCar) {
          const newDamage = { date: new Date().toISOString(), description: desc, author: "Moi" };
          const updatedDamages = [...(reportingCar.damages || []), newDamage];
          setCarsData(carsData.map(c => c.id === reportingCar.id ? { ...c, damages: updatedDamages } : c));
          setReportingCar(null);
      }
  };
  
  const copyToClipboard = (text: string, id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
  };

  const openAddModal = (mode: 'manual'|'scan') => {
      setAddModalMode(mode);
      setIsAddModalOpen(true);
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-orange-500" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-10 relative">

        {/* Modals */}
        <HousingDetailModal housing={selectedHousing} onClose={() => setSelectedHousing(null)} />
        <AddHousingModal isOpen={isAddModalOpen} initialMode={addModalMode} onClose={() => setIsAddModalOpen(false)} onAdd={handleAddNewHousing} />
        {reportingCar && <ReportDamageModal car={reportingCar} onClose={() => setReportingCar(null)} onReport={handleReportDamage} />}

        {/* 1. KEY IMPROVEMENT: LOGISTICS DASHBOARD */}
        <LogisticsDashboard housings={housingData} cars={carsData} />

        {/* --- Navigation & Main Actions --- */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
            <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl w-full sm:w-fit border border-[var(--border-subtle)]">
                <button onClick={() => setActiveSubTab('housing')} className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeSubTab === 'housing' ? 'bg-white dark:bg-[var(--bg-card-solid)] text-orange-600 shadow-sm' : 'text-[var(--text-secondary)] hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                    🏠 Logements
                </button>
                <button onClick={() => setActiveSubTab('cars')} className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeSubTab === 'cars' ? 'bg-white dark:bg-[var(--bg-card-solid)] text-orange-600 shadow-sm' : 'text-[var(--text-secondary)] hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                    🚗 Véhicules & Flotte
                </button>
            </div>
             
             {/* Add Buttons */}
             {activeSubTab === 'housing' && (
                 <div className="flex gap-2">
                     <button onClick={() => openAddModal('manual')} className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-xl font-bold text-sm shadow-md hover:bg-orange-700 transition-colors">
                        <Plus size={16} /> Ajouter
                    </button>
                 </div>
             )}
        </div>

        {/* --- HOUSING TAB --- */}
        {activeSubTab === 'housing' && (
            <div className="animate-fade-in space-y-6">
                
                {/* 2. KEY IMPROVEMENT: SMART MATCHER UI */}
                <div className="bg-white dark:bg-[var(--bg-card-solid)] p-4 rounded-2xl border border-[var(--border-subtle)] shadow-sm flex flex-col md:flex-row gap-4 items-center">
                    <div className="flex-grow">
                        <label className="text-xs font-bold text-[var(--text-secondary)] uppercase mb-1 block flex items-center gap-2">
                            <Target size={14} className="text-orange-500"/> Smart Matcher
                        </label>
                        <select 
                            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-[var(--border-subtle)] text-[var(--text-primary)] font-bold rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
                            value={smartZoneId}
                            onChange={(e) => setSmartZoneId(e.target.value)}
                        >
                            <option value="">Sélectionner une Zone de Mission...</option>
                            {MOCK_ZONES.map(z => (
                                <option key={z.id} value={z.id}>{z.name}</option>
                            ))}
                        </select>
                    </div>
                    {smartZoneId && (
                        <div className="flex items-center gap-4 px-4 py-2 bg-orange-50 rounded-xl border border-orange-100 text-sm text-orange-800 animate-fade-in">
                            <Zap size={20} className="text-yellow-500 fill-current"/>
                            <div>
                                <span className="font-bold block">Tri Intelligent Actif</span>
                                <span className="text-xs opacity-80">Optimisation distance & coût</span>
                            </div>
                            <button onClick={() => setSmartZoneId("")} className="bg-white dark:bg-[var(--bg-card-solid)] p-1 rounded-full hover:bg-orange-100 transition"><X size={14}/></button>
                        </div>
                    )}
                    <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-[var(--border-subtle)] h-fit">
                        <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-[var(--bg-card-solid)] text-orange-600 shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`} title="Liste"><ListIcon size={20}/></button>
                        <button onClick={() => setViewMode('map')} className={`p-2 rounded-lg transition-colors ${viewMode === 'map' ? 'bg-white dark:bg-[var(--bg-card-solid)] text-orange-600 shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`} title="Carte"><MapPin size={20}/></button>
                    </div>
                </div>

                {/* CONTENT: MAP MODE */}
                {viewMode === 'map' && (
                    <div className="h-[600px] w-full rounded-2xl overflow-hidden border border-[var(--border-subtle)] shadow-sm relative animate-fade-in">
                        <div ref={housingMapRef} className="h-full w-full z-0"></div>
                    </div>
                )}

                {/* CONTENT: LIST MODE */}
                {viewMode === 'list' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-fade-in">
                        {filteredHousing.map((h: any) => (
                            <div 
                                key={h.id} 
                                onClick={() => setSelectedHousing(h)}
                                className={`group bg-white dark:bg-[var(--bg-card-solid)] rounded-2xl border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col cursor-pointer relative ${h._matchLabel === 'Top Match' ? 'border-green-400 ring-2 ring-green-100' : 'border-[var(--border-subtle)]'}`}
                            >
                                    {/* Smart Match Badges */}
                                    {h._matchLabel && (
                                        <div className={`absolute top-3 left-3 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg z-20 shadow-sm uppercase tracking-wide flex items-center gap-1 ${h._matchColor}`}>
                                            {h._matchLabel === 'Top Match' && <Star size={10} fill="currentColor"/>}
                                            {h._matchLabel} ({h._matchScore}%)
                                        </div>
                                    )}

                                    {/* Card Header */}
                                    <div className="h-24 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-end p-4 relative">
                                        <h3 className="font-extrabold text-xl text-[var(--text-primary)] leading-tight line-clamp-1 w-full pr-12">
                                            {h.name}
                                        </h3>
                                    </div>

                                    {/* Card Body */}
                                    <div className="p-5 space-y-4 flex-grow">
                                        <div className="flex items-start gap-3 group/addr">
                                            <MapPin className={`mt-0.5 shrink-0 text-[var(--text-muted)]`} size={16} />
                                            <div className="flex-grow">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-xs font-semibold text-[var(--text-secondary)] line-clamp-1">{h.address}</p>
                                                    <button onClick={(e) => copyToClipboard(h.address, h.id, e)} className="text-slate-300 hover:text-orange-500 transition-colors opacity-0 group-hover/addr:opacity-100">
                                                        {copiedId === h.id ? <Check size={14} className="text-green-500"/> : <Copy size={14} />}
                                                    </button>
                                                </div>
                                                {h._matchDistance !== undefined && (
                                                    <p className="text-xs font-bold text-orange-600 mt-1">à {h._matchDistance.toFixed(1)} km de la zone</p>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="flex flex-wrap gap-2">
                                            {h.amenities.slice(0, 2).map((am: string) => (
                                                <span key={am} className="text-[10px] bg-slate-100 dark:bg-slate-800 text-[var(--text-secondary)] px-2 py-1 rounded-md border border-[var(--border-subtle)]">{am}</span>
                                            ))}
                                            {h.amenities.length > 2 && <span className="text-[10px] text-[var(--text-muted)] px-1 py-1">+{h.amenities.length - 2}</span>}
                                        </div>
                                        
                                            <div className="flex items-center justify-between pt-3 border-t border-[var(--border-subtle)] border-dashed">
                                            <div className="flex items-center gap-2">
                                                <User className="text-[var(--text-muted)]" size={16} />
                                                <span className="text-sm font-medium text-[var(--text-secondary)]">{h.people} pers.</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Bed className="text-[var(--text-muted)]" size={16} />
                                                <span className="text-sm font-medium text-[var(--text-secondary)]">{h.nights} nuits min.</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card Footer */}
                                    <div className="p-4 border-t border-[var(--border-subtle)] flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30 group-hover:bg-orange-50/30 dark:group-hover:bg-orange-900/20 transition-colors">
                                            <div>
                                            <p className="text-lg font-extrabold text-[var(--text-primary)]">{h.cost} €</p>
                                            </div>
                                            <div className="flex items-center gap-1 text-orange-600 font-bold text-sm">
                                                Voir <ArrowRight size={16} />
                                            </div>
                                    </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}

        {/* --- CARS TAB --- */}
        {activeSubTab === 'cars' && (
            <div className="animate-fade-in space-y-8">
                
                {/* 3. KEY IMPROVEMENT: ADVANCED FLEET MANAGEMENT */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {carsData.map(car => {
                        const hasDamages = car.damages && car.damages.length > 0;
                        return (
                            <div key={car.id} className="bg-white dark:bg-[var(--bg-card-solid)] rounded-2xl border border-[var(--border-subtle)] shadow-sm overflow-hidden flex flex-col">
                                {/* Header */}
                                <div className="px-6 py-4 border-b border-[var(--border-subtle)] flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                                    <div>
                                        <h3 className="font-bold text-lg text-[var(--text-primary)] flex items-center gap-2">
                                            {car.brand}
                                            <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-[var(--text-secondary)] text-xs rounded font-mono">{car.plate}</span>
                                        </h3>
                                        <p className="text-sm text-[var(--text-secondary)] flex items-center gap-1 mt-1">
                                            <Navigation size={14} /> {car.where}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                         <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Conducteur</p>
                                         <div className="flex items-center gap-1 justify-end font-semibold text-[var(--text-primary)]">
                                             <User size={14} /> {car.owner}
                                         </div>
                                    </div>
                                </div>

                                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 flex-grow">
                                    {/* Left: Stats */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-[var(--text-secondary)] font-medium"><Gauge size={18} /> Kilométrage</div>
                                            <span className="font-bold text-[var(--text-primary)]">{car.km.toLocaleString()} km</span>
                                        </div>
                                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                                            <div className="bg-orange-500 h-full rounded-full" style={{ width: '65%' }}></div>
                                        </div>
                                        
                                        <div className="flex items-center justify-between pt-2">
                                            <div className="flex items-center gap-2 text-[var(--text-secondary)] font-medium"><Calendar size={18} /> Entretien</div>
                                            <span className="font-bold text-[var(--text-primary)]">{car.service}</span>
                                        </div>

                                        {/* Damage Status */}
                                        <div className={`mt-4 p-3 rounded-xl border flex items-center gap-3 ${hasDamages ? 'bg-red-50 border-red-100 text-red-800' : 'bg-green-50 border-green-100 text-green-800'}`}>
                                            {hasDamages ? <AlertTriangle size={20}/> : <ShieldCheck size={20}/>}
                                            <div>
                                                <p className="text-xs font-bold uppercase">{hasDamages ? 'Sinistre Signalé' : 'État conforme'}</p>
                                                {hasDamages && <p className="text-xs opacity-80">{car.damages?.[0].description}</p>}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Actions */}
                                    <div className="flex flex-col gap-3 justify-center">
                                        <button 
                                            onClick={() => setReportingCar(car)}
                                            className="w-full py-3 bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                                        >
                                            <Camera size={18}/> Déclarer Choc
                                        </button>
                                        <button className="w-full py-3 bg-white dark:bg-[var(--bg-card-solid)] text-[var(--text-secondary)] hover:bg-slate-50 dark:hover:bg-slate-700/50 border border-[var(--border-subtle)] rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors">
                                            <User size={18}/> Changer Conducteur
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        )}

        {/* --- STATS TAB --- */}
        {activeSubTab === 'stats' && (
             <div className="animate-fade-in glass-card p-12 text-center text-[var(--text-secondary)]">
                <p>Les statistiques détaillées sont désormais intégrées au tableau de bord en haut de page.</p>
             </div>
        )}

    </div>
  );
};

export default OperationsTab;
