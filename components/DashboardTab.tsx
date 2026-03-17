
import React, { useEffect, useRef, useState } from 'react';
import { Search, Bell, ChevronDown, Cloud, Sun, CloudRain, Thermometer, Droplets, Footprints, Wind, MapPin, Activity, CalendarDays, Ban, CheckCircle2, Home, Flag, Clock, Plus, X, TrendingUp } from 'lucide-react';

interface DashboardTabProps {
  isActive: boolean;
}

const translations = {
  en: {
    searchPlaceholder: "For example: Where is CR7's team",
  },
  fr: {
    searchPlaceholder: "Rechercher une équipe, un lieu...",
  }
};

const DashboardHeader: React.FC<{ lang: 'en' | 'fr'; onLangChange: () => void; t: (key: keyof typeof translations.en) => string; }> = ({ lang, onLangChange, t }) => {
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const dateString = date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <header className="flex items-center gap-6 mb-6 h-16">
      <div className="relative flex-grow">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
        <input type="text" placeholder={t('searchPlaceholder')} className="w-full bg-white/50 dark:bg-[var(--input-bg)] pl-12 pr-4 py-3.5 rounded-2xl border border-transparent focus:border-gray-200 dark:focus:border-[var(--input-border)] focus:ring-1 focus:ring-gray-200 dark:focus:ring-[var(--input-border)] outline-none transition-all shadow-sm dark:text-[var(--text-primary)] dark:placeholder-[var(--text-muted)]" />
      </div>
      
      <div className="hidden md:flex flex-col items-end justify-center px-4 border-r border-gray-200/50 dark:border-[var(--border-subtle)]">
        <div className="text-3xl font-black text-[var(--text-primary)] leading-none tracking-tight">
            {timeString}
        </div>
        <div className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide first-letter:uppercase">
            {dateString}
        </div>
      </div>

      <div className="flex items-center gap-4 flex-shrink-0">
        <button onClick={onLangChange} className="flex items-center gap-2 text-slate-600 dark:text-[var(--text-secondary)] font-bold bg-white dark:bg-[var(--bg-card-solid)] px-3 py-2 rounded-xl shadow-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
          {lang.toUpperCase()} <ChevronDown size={16} />
        </button>
        <button className="relative p-2.5 bg-white dark:bg-[var(--bg-card-solid)] rounded-xl shadow-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-[var(--text-secondary)]">
          <Bell size={20} />
          <span className="absolute top-2 right-2 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-[var(--bg-card-solid)]"></span>
        </button>
      </div>
    </header>
  );
};

// Compact Weather Widget with Chart
const CompactWeatherWidget: React.FC<{ avgTemp: number, condition: string, walkingScore: 'Excellente' | 'Bonne' | 'Difficile' | 'Extrême' }> = ({ avgTemp, condition, walkingScore }) => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<any>(null);

    useEffect(() => {
        const Chart = (window as any).Chart;
        if (!Chart || !chartRef.current) return;

        // Destroy previous instance if exists
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }

        const ctx = chartRef.current.getContext('2d');
        if (!ctx) return;

        // Gradient for the line
        const gradient = ctx.createLinearGradient(0, 0, 0, 80);
        gradient.addColorStop(0, 'rgba(251, 146, 60, 0.5)'); // Orange-400
        gradient.addColorStop(1, 'rgba(251, 146, 60, 0)');

        // Mock data for 24h evolution (e.g., lower at night, higher day)
        // Values roughly around avgTemp
        const labels = ['0h', '4h', '8h', '12h', '16h', '20h', '24h'];
        const dataPoints = [
            avgTemp - 5, 
            avgTemp - 6, 
            avgTemp - 2, 
            avgTemp + 2, 
            avgTemp + 4, 
            avgTemp + 1, 
            avgTemp - 3
        ];

        chartInstance.current = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Temp (°C)',
                    data: dataPoints,
                    borderColor: '#fb923c', // Orange-400
                    borderWidth: 2,
                    backgroundColor: gradient,
                    fill: true,
                    tension: 0.4, // Smooth curve
                    pointRadius: 0,
                    pointHoverRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: true, mode: 'index', intersect: false },
                    datalabels: { display: false } // Disable datalabels if plugin is active globally
                },
                scales: {
                    x: { display: false },
                    y: { display: false, min: avgTemp - 10, max: avgTemp + 10 }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });

        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [avgTemp]);

    return (
        <div className="glass-card p-4 flex justify-between relative overflow-hidden h-full gap-4">
            {/* Left: Stats */}
            <div className="flex flex-col justify-between z-10 flex-shrink-0">
                <div>
                     <h4 className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-1">Météo Moyenne</h4>
                     <div className="flex items-end gap-2">
                         <span className="text-4xl font-black text-[var(--text-primary)] leading-none">{avgTemp}°</span>
                         <div className="flex flex-col">
                             <span className="text-xs font-bold text-[var(--text-secondary)]">{condition}</span>
                             <span className="text-[10px] text-[var(--text-muted)] font-medium flex items-center gap-1">
                                <TrendingUp size={10} /> +2° vs Hier
                             </span>
                         </div>
                     </div>
                </div>
                <div className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1.5 shadow-sm w-fit
                    ${walkingScore === 'Excellente' ? 'bg-emerald-100 text-emerald-700' : 
                      walkingScore === 'Bonne' ? 'bg-blue-100 text-blue-700' : 
                      walkingScore === 'Difficile' ? 'bg-orange-100 text-orange-700' : 
                      'bg-red-100 text-red-700'}`}>
                    {walkingScore === 'Excellente' ? <Sun size={12}/> : <Cloud size={12}/>}
                    Marche : {walkingScore}
                </div>
            </div>

            {/* Right: Chart */}
            <div className="flex-grow relative min-w-[80px] h-full">
                <div className="absolute top-0 right-0 text-[10px] font-bold text-slate-300 dark:text-slate-600 uppercase">24h</div>
                <div className="h-full w-full pt-2">
                    <canvas ref={chartRef}></canvas>
                </div>
            </div>
            
            {/* Background Icon Decoration */}
            <Sun className="absolute -bottom-6 -right-6 text-amber-400/10 pointer-events-none" size={100} />
        </div>
    );
}

interface ActivityItem {
    id: number;
    type: string;
    text: string;
    author: string;
    time: string;
    date: string;
}

// Add Event Modal
const AddEventModal: React.FC<{ isOpen: boolean; onClose: () => void; onAdd: (e: any) => void }> = ({ isOpen, onClose, onAdd }) => {
    const [type, setType] = useState('housing');
    const [text, setText] = useState('');
    const [time, setTime] = useState('09:00');
    const [dateMode, setDateMode] = useState('today'); // today, yesterday, specific
    const [specificDate, setSpecificDate] = useState('');

    if(!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        let finalDateStr = "Auj.";
        if (dateMode === 'yesterday') finalDateStr = "Hier";
        if (dateMode === 'specific') {
            const d = new Date(specificDate);
            finalDateStr = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
        }

        onAdd({
            type,
            text,
            author: "Moi",
            time,
            date: finalDateStr
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>
             <div className="bg-white dark:bg-[var(--bg-card-solid)] rounded-2xl shadow-xl w-full max-w-sm p-6 relative z-10 animate-fade-in">
                 <button onClick={onClose} className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><X size={20}/></button>
                 <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Ajouter un événement</h3>
                 <form onSubmit={handleSubmit} className="space-y-4">
                     <div>
                         <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-1">Type</label>
                         <select value={type} onChange={e => setType(e.target.value)} className="w-full border border-[var(--input-border)] rounded-lg p-2 text-sm bg-[var(--input-bg)] dark:text-[var(--text-primary)] font-medium">
                             <option value="housing">Logement</option>
                             <option value="refusal">Refus Mairie</option>
                             <option value="done">Mission Terminée</option>
                             <option value="info">Information</option>
                         </select>
                     </div>
                     <div>
                         <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-1">Description</label>
                         <input type="text" value={text} onChange={e => setText(e.target.value)} placeholder="Ex: Logement validé à Lyon" className="w-full border border-[var(--input-border)] rounded-lg p-2 text-sm bg-[var(--input-bg)] dark:text-[var(--text-primary)] dark:placeholder-[var(--text-muted)]" required autoFocus/>
                     </div>
                     <div className="grid grid-cols-2 gap-3">
                         <div>
                            <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-1">Heure</label>
                            <input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full border border-[var(--input-border)] rounded-lg p-2 text-sm bg-[var(--input-bg)] dark:text-[var(--text-primary)]"/>
                         </div>
                         <div>
                            <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-1">Jour</label>
                            <select value={dateMode} onChange={e => setDateMode(e.target.value)} className="w-full border border-[var(--input-border)] rounded-lg p-2 text-sm bg-[var(--input-bg)] dark:text-[var(--text-primary)]">
                                <option value="today">Aujourd'hui</option>
                                <option value="yesterday">Hier</option>
                                <option value="specific">Date...</option>
                            </select>
                         </div>
                     </div>
                     {dateMode === 'specific' && (
                         <div>
                             <input type="date" value={specificDate} onChange={e => setSpecificDate(e.target.value)} className="w-full border border-[var(--input-border)] rounded-lg p-2 text-sm bg-[var(--input-bg)] dark:text-[var(--text-primary)]" required/>
                         </div>
                     )}
                     <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-700 transition-colors">Ajouter</button>
                 </form>
             </div>
        </div>
    );
};

// Activity Feed & Calendar Component
const ActivityFeed: React.FC = () => {
    const [activities, setActivities] = useState<ActivityItem[]>([
        { id: 1, type: 'housing', text: "Logement ajouté (Lyon)", author: "Sarah L.", time: "10:45", date: "Auj." },
        { id: 2, type: 'refusal', text: "Refus Mairie Colmar", author: "Thomas R.", time: "09:30", date: "Auj." },
        { id: 3, type: 'done', text: "Zone B terminée", author: "Équipe 4", time: "16:00", date: "Hier" },
    ]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleAddEvent = (newEvent: any) => {
        setActivities([{ id: Date.now(), ...newEvent }, ...activities]);
    };

    const getIcon = (type: string) => {
        switch(type) {
            case 'housing': return <Home size={14} className="text-blue-600"/>;
            case 'refusal': return <Ban size={14} className="text-red-600"/>;
            case 'done': return <CheckCircle2 size={14} className="text-emerald-600"/>;
            default: return <Activity size={14} className="text-slate-600 dark:text-slate-400"/>;
        }
    };

    return (
        <div className="glass-card p-0 flex flex-col h-full overflow-hidden relative">
            <AddEventModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAdd={handleAddEvent} />
            
            <div className="p-4 border-b border-[var(--border-subtle)] bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
                <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-2">
                    <Activity size={18} className="text-blue-600"/> Activité Récente
                </h3>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold bg-white dark:bg-[var(--bg-card-solid)] border border-[var(--border-subtle)] px-2 py-0.5 rounded text-[var(--text-secondary)]">Live</span>
                    <button onClick={() => setIsModalOpen(true)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-[var(--text-secondary)] hover:text-blue-600 transition-colors">
                        <Plus size={16} />
                    </button>
                </div>
            </div>
            
            <div className="flex-grow overflow-y-auto p-4 space-y-3">
                {activities.map((act) => (
                    <div key={act.id} className="flex gap-3 items-start group animate-fade-in">
                        <div className="flex flex-col items-center gap-1 min-w-[35px]">
                            <span className="text-[10px] font-bold text-[var(--text-secondary)]">{act.time}</span>
                            <span className="text-[8px] font-bold text-slate-300 dark:text-slate-600 uppercase">{act.date}</span>
                            <div className="h-full w-px bg-slate-100 dark:bg-slate-700 group-last:hidden"></div>
                        </div>
                        <div className="bg-white dark:bg-[var(--bg-card-solid)] border border-[var(--border-subtle)] p-2.5 rounded-xl shadow-sm flex-grow hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-2 mb-1">
                                <div className={`p-1 rounded-md ${act.type === 'refusal' ? 'bg-red-50 dark:bg-red-900/30' : act.type === 'housing' ? 'bg-blue-50 dark:bg-blue-900/30' : act.type === 'done' ? 'bg-emerald-50 dark:bg-emerald-900/30' : 'bg-slate-50 dark:bg-slate-800'}`}>
                                    {getIcon(act.type)}
                                </div>
                                <span className="text-xs font-bold text-[var(--text-primary)]">{act.text}</span>
                            </div>
                            <p className="text-[10px] text-[var(--text-muted)] pl-8">Par {act.author}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Event Highlight */}
            <div className="p-4 bg-gradient-to-br from-blue-600 to-indigo-700 text-white m-4 rounded-xl shadow-lg shadow-blue-500/30 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                     <Flag size={60} />
                 </div>
                 <div className="relative z-10">
                     <div className="flex items-center gap-2 mb-1 opacity-90">
                         <CalendarDays size={14} />
                         <span className="text-xs font-bold uppercase tracking-wider">Main Event</span>
                     </div>
                     <h4 className="font-black text-lg leading-tight mb-2">Début Campagne Handicap International</h4>
                     <div className="flex items-center gap-2 text-xs font-medium bg-white/20 w-fit px-2 py-1 rounded-lg backdrop-blur-sm">
                         <Clock size={12} />
                         1er Mars 2025
                     </div>
                 </div>
            </div>
        </div>
    );
};

const FranceMap: React.FC<{ setGlobalWeather: (w: any) => void }> = ({ setGlobalWeather }) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);

    useEffect(() => {
        const L = (window as any).L;
        if (!L) return;

        if (mapContainerRef.current && !mapInstanceRef.current) {
            const map = L.map(mapContainerRef.current, {
                center: [46.603354, 1.888334],
                zoom: 6,
                zoomControl: false,
                attributionControl: false
            });

            L.tileLayer.provider('CartoDB.Positron').addTo(map);
            L.control.zoom({ position: 'bottomright' }).addTo(map);
            mapInstanceRef.current = map;

            // SVG Icons for Logos
            const svgs = {
                wwf: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7h6V5a3 3 0 0 0-3-3Z"/><path d="M19 8a3 3 0 0 0-3 3v4h6v-4a3 3 0 0 0-3-3Z"/><path d="M5 8a3 3 0 0 0-3 3v4h6v-4a3 3 0 0 0-3-3Z"/><path d="M12 14a5 5 0 0 0-5 5v2a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-2a5 5 0 0 0-5-5Z"/></svg>`, 
                msf: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>`,
                mdm: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`, 
                unicef: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15.5 20.5a3.5 3.5 0 1 0-7 0 3.5 3.5 0 0 0 7 0Z"/><path d="M12 17v-3"/><path d="M8 10a4 4 0 0 1 8 0"/></svg>` 
            };

            const orgConfigs = [
                { id: 'wwf', color: '#16a34a', icon: svgs.wwf, name: 'WWF' }, 
                { id: 'msf', color: '#dc2626', icon: svgs.msf, name: 'MSF' }, 
                { id: 'mdm', color: '#1e3a8a', icon: svgs.mdm, name: 'MDM' }, 
                { id: 'unicef', color: '#38bdf8', icon: svgs.unicef, name: 'UNICEF' } 
            ];

            const teamsData: any[] = [];
            const bounds = { latMin: 44.0, latMax: 49.0, lngMin: -0.5, lngMax: 6.5 };
            const leaders = ['Thomas', 'Sarah', 'Julie', 'Marc', 'Lucas', 'Emma', 'Hugo', 'Chloé'];
            const housingAddresses = [
                "12 Rue des Fleurs, Lyon", "5 Av. Jean Jaurès, Strasbourg", "Gîte du Lac, Annecy", 
                "Appart'Hotel Centre, Nantes", "Camping des Pins, Bordeaux", "Maison Bleue, Lille", 
                "Résidence Etudiante, Toulouse", "Villa des Roses, Nice"
            ];
            const carPlates = [
                "GB-123-HZ", "AA-999-BB", "ET-404-OK", "XW-007-JB", 
                "FY-555-RR", "KL-888-MP", "ZE-111-AZ", "PO-222-MN"
            ];
            const weathers = [
                { t: 18, c: "Ensoleillé", icon: "☀️" }, 
                { t: 14, c: "Nuageux", icon: "☁️" }, 
                { t: 9, c: "Pluvieux", icon: "🌧️" }, 
                { t: 22, c: "Grand Soleil", icon: "😎" }, 
                { t: 11, c: "Vent", icon: "💨" }
            ];

            // Generate Teams
            orgConfigs.forEach((org, idx) => {
                for(let i=0; i<2; i++) {
                    const w = weathers[Math.floor(Math.random() * weathers.length)];
                    teamsData.push({
                        id: `${org.id}-${i}`,
                        name: `Équipe ${org.name} ${i+1}`,
                        coords: [
                            bounds.latMin + Math.random() * (bounds.latMax - bounds.latMin),
                            bounds.lngMin + Math.random() * (bounds.lngMax - bounds.lngMin)
                        ],
                        ...org,
                        leader: leaders[(idx * 2 + i) % leaders.length],
                        housing: housingAddresses[(idx * 2 + i) % housingAddresses.length],
                        car: carPlates[(idx * 2 + i) % carPlates.length],
                        weather: w
                    });
                }
            });

            // Calculate Global Stats
            const avgTemp = Math.round(teamsData.reduce((acc, t) => acc + t.weather.t, 0) / teamsData.length);
            let walkCond: any = 'Bonne';
            if(avgTemp > 25) walkCond = 'Difficile';
            else if(avgTemp < 5) walkCond = 'Extrême';
            else if(avgTemp >= 15 && avgTemp <= 22) walkCond = 'Excellente';
            
            // Determine dominant condition
            const conditions = teamsData.map(t => t.weather.c);
            const domCond = conditions.sort((a,b) => conditions.filter(v => v===a).length - conditions.filter(v => v===b).length).pop();

            setGlobalWeather({ temp: avgTemp, condition: domCond, walking: walkCond });

            // Create Icons
            teamsData.forEach(team => {
                 const pinHtml = `
                    <div class="relative group cursor-pointer" style="transform: translateY(-20px);">
                        <!-- Pin Head -->
                        <div style="background-color: ${team.color};" class="w-12 h-12 rounded-full border-4 border-white shadow-lg flex items-center justify-center relative z-20 group-hover:scale-110 transition-transform duration-200">
                             <div class="text-white">${team.icon}</div>
                        </div>
                        <!-- Pin Needle -->
                        <div style="border-top-color: ${team.color};" class="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[14px] absolute left-1/2 -translate-x-1/2 top-[40px] z-10"></div>
                        <!-- Shadow -->
                        <div class="w-8 h-2 bg-black/20 blur-sm rounded-full absolute left-1/2 -translate-x-1/2 top-[52px]"></div>
                    </div>
                 `;

                 const icon = L.divIcon({
                    html: pinHtml,
                    className: 'bg-transparent',
                    iconSize: [48, 60],
                    iconAnchor: [24, 60],
                    popupAnchor: [0, -60]
                });

                const popupContent = `
                  <style>
                    .dark .leaflet-popup-content-wrapper { background: var(--bg-card-solid) !important; color: var(--text-primary) !important; }
                    .dark .leaflet-popup-tip { background: var(--bg-card-solid) !important; }
                    .dark .wp-popup-border { border-color: #334155 !important; }
                    .dark .wp-popup-heading { color: var(--text-primary) !important; }
                    .dark .wp-popup-sub { color: var(--text-secondary) !important; }
                    .dark .wp-popup-label { color: var(--text-muted) !important; }
                    .dark .wp-popup-value { color: var(--text-primary) !important; }
                    .dark .wp-popup-icon-bg { background: #1e293b !important; color: var(--text-secondary) !important; }
                    .dark .wp-popup-car-badge { background: #334155 !important; color: var(--text-primary) !important; }
                    .dark .wp-popup-weather-box { background: #1e293b !important; border-color: #334155 !important; }
                    .dark .wp-popup-weather-label { color: var(--text-secondary) !important; }
                    .dark .wp-popup-weather-temp { color: var(--text-primary) !important; }
                  </style>
                  <div style="font-family: 'Inter', sans-serif; min-width: 240px; padding: 4px;">
                    <div class="wp-popup-border" style="display:flex; align-items:center; gap:10px; margin-bottom:12px; padding-bottom:12px; border-bottom:1px solid #f1f5f9;">
                        <div style="background:${team.color}; width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                            ${team.icon.replace('width="20"', 'width="18"').replace('height="20"', 'height="18"')}
                        </div>
                        <div>
                            <h3 class="wp-popup-heading" style="font-weight: 800; margin:0; color: #1e293b; font-size:15px; letter-spacing: -0.02em;">${team.name}</h3>
                            <span class="wp-popup-sub" style="font-size: 11px; color:#64748b; font-weight:600; text-transform:uppercase;">Lead: ${team.leader}</span>
                        </div>
                    </div>

                    <div style="display:flex; flex-direction:column; gap:12px;">
                        <div style="display:flex; align-items:start; gap:10px;">
                            <div class="wp-popup-icon-bg" style="background:#f1f5f9; padding:6px; border-radius:8px; color:#64748b;">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                            </div>
                            <div style="flex:1;">
                                <p class="wp-popup-label" style="margin:0; font-size:10px; text-transform:uppercase; color:#94a3b8; font-weight:700; letter-spacing:0.5px;">Logement</p>
                                <p class="wp-popup-value" style="margin:2px 0 0 0; font-size:12px; font-weight:600; color:#334155; line-height:1.3;">${team.housing}</p>
                            </div>
                        </div>

                        <div style="display:flex; align-items:start; gap:10px;">
                            <div class="wp-popup-icon-bg" style="background:#f1f5f9; padding:6px; border-radius:8px; color:#64748b;">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
                            </div>
                            <div style="flex:1;">
                                <p class="wp-popup-label" style="margin:0; font-size:10px; text-transform:uppercase; color:#94a3b8; font-weight:700; letter-spacing:0.5px;">Véhicule</p>
                                <p class="wp-popup-car-badge" style="margin:2px 0 0 0; font-size:12px; font-weight:600; color:#334155; font-family:monospace; background:#e2e8f0; display:inline-block; padding:2px 6px; border-radius:4px;">${team.car}</p>
                            </div>
                        </div>

                        <div class="wp-popup-weather-box" style="background-color:#f8fafc; padding:10px; border-radius:10px; display:flex; align-items:center; justify-content:space-between; margin-top:4px; border:1px solid #e2e8f0;">
                            <span class="wp-popup-weather-label" style="font-size:11px; font-weight:600; color:#475569;">Météo locale</span>
                            <div style="display:flex; align-items:center; gap:8px;">
                                <span style="font-size:18px;">${team.weather.icon}</span>
                                <span class="wp-popup-weather-temp" style="font-size:14px; font-weight:800; color:#1e293b;">${team.weather.t}°C</span>
                            </div>
                        </div>
                    </div>
                  </div>
                `;

                L.marker(team.coords, { icon }).addTo(map).bindPopup(popupContent);
            });
        }
    }, [setGlobalWeather]);

    return (
        <div id="france-map" ref={mapContainerRef} className="h-full w-full rounded-2xl shadow-inner bg-slate-100 dark:bg-slate-800 z-0 relative"></div>
    );
};

const DashboardTab: React.FC<DashboardTabProps> = ({ isActive }) => {
  const [lang, setLang] = useState<'en' | 'fr'>('fr');
  const t = (key: keyof typeof translations.en) => translations[lang][key];
  const [globalWeather, setGlobalWeather] = useState({ temp: 0, condition: '-', walking: 'Bonne' as any });

  return (
    <section className="animate-fade-in h-[calc(100vh-100px)] flex flex-col">
      <DashboardHeader lang={lang} onLangChange={() => setLang(l => l === 'en' ? 'fr' : 'en')} t={t} />
      
      <div className="flex-grow grid grid-cols-4 gap-6 min-h-0">
          {/* Main Map Area - 3 Cols */}
          <div className="col-span-3 flex flex-col gap-6">
              <div className="flex-grow relative rounded-3xl overflow-hidden border border-[var(--border-subtle)] shadow-sm">
                  <FranceMap setGlobalWeather={setGlobalWeather} />

                  {/* Floating Overlay Title */}
                  <div className="absolute top-6 left-6 bg-white/90 dark:bg-[var(--bg-card-solid)]/90 backdrop-blur-md px-5 py-3 rounded-2xl shadow-lg border border-[var(--border-subtle)] z-[400]">
                      <h2 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-0.5">Vue d'ensemble</h2>
                      <div className="flex items-center gap-2">
                          <MapPin size={18} className="text-blue-600"/>
                          <h3 className="font-black text-[var(--text-primary)] text-lg">Déploiement National</h3>
                      </div>
                  </div>
              </div>
          </div>

          {/* Right Sidebar - Split into Weather & Feed - 1 Col */}
          <div className="col-span-1 h-full flex flex-col gap-6">
              {/* Compact Weather Top */}
              <div className="h-32 shrink-0">
                  <CompactWeatherWidget 
                      avgTemp={globalWeather.temp} 
                      condition={globalWeather.condition} 
                      walkingScore={globalWeather.walking} 
                  />
              </div>

              {/* Activity Feed & Calendar Bottom */}
              <div className="flex-grow min-h-0">
                  <ActivityFeed />
              </div>
          </div>
      </div>
    </section>
  );
};

export default DashboardTab;
