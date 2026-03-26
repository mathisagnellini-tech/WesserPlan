
import React, { useEffect, useState } from 'react';
import { Column } from '../types';
import { X, MapPin, Wind, CloudRain, Sun, Cloud, Car, Home, Wifi, Key, Fuel, Gauge, CalendarClock, Navigation, Copy, ExternalLink, ChevronRight, Edit2, Save } from 'lucide-react';

interface MissionInspectorProps {
  column: Column;
  onClose: () => void;
  onUpdate: (updates: any) => void;
}

export const MissionInspector: React.FC<MissionInspectorProps> = ({ column, onClose, onUpdate }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'housing' | 'vehicle'>('overview');
  const [isEditing, setIsEditing] = useState(false);
  
  // Local state for editing form
  const [editForm, setEditForm] = useState({
      title: column.title,
      zoneName: column.missionData?.zone.name || '',
      carModel: column.missionData?.car.model || '',
      carPlate: column.missionData?.car.plate || '',
      housingAddress: column.missionData?.housing.address || ''
  });

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    // Sync local state when column changes (dragging new col opens it)
    setEditForm({
      title: column.title,
      zoneName: column.missionData?.zone.name || '',
      carModel: column.missionData?.car.model || '',
      carPlate: column.missionData?.car.plate || '',
      housingAddress: column.missionData?.housing.address || ''
    });
    return () => clearTimeout(timer);
  }, [column]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 350); 
  };

  const handleSave = () => {
      onUpdate({
          title: editForm.title,
          missionData: {
              zone: { name: editForm.zoneName },
              car: { model: editForm.carModel, plate: editForm.carPlate },
              housing: { address: editForm.housingAddress }
          }
      });
      setIsEditing(false);
  };

  if (!column.missionData) return null;
  const { car, housing, zone } = column.missionData;

  const WeatherIcon = () => {
      switch (zone.weather.condition) {
          case 'Sunny': return <Sun size={24} className="text-amber-500" strokeWidth={2} />;
          case 'Rainy': return <CloudRain size={24} className="text-orange-500" strokeWidth={2} />;
          case 'Cloudy': return <Cloud size={24} className="text-slate-500" strokeWidth={2} />;
          default: return <Sun size={24} className="text-amber-500" strokeWidth={2} />;
      }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[120] transition-opacity duration-300 ease-out ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
      />
      
      {/* Panel */}
      <div 
        className={`
            fixed top-4 bottom-4 right-4 w-[480px] z-[130] rounded-[36px] 
            bg-white dark:bg-slate-900 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] border border-white/50 dark:border-slate-700
            flex flex-col overflow-hidden
            transform transition-all duration-300 cubic-bezier(0.2, 0.8, 0.2, 1)
            ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-[20px] opacity-0'}
        `}
        onClick={(e) => e.stopPropagation()}
      >
          {/* --- HERO HEADER --- */}
          <div className="relative h-64 flex-shrink-0 group overflow-hidden bg-slate-100 dark:bg-slate-800 rounded-t-[36px]">
               <div className="absolute inset-0">
                   <img src={zone.mapImage} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt="Map" />
                   <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-slate-900 via-white/40 dark:via-slate-900/40 to-transparent" />
               </div>
               
               <button 
                  onClick={handleClose}
                  className="absolute top-6 right-6 p-2.5 rounded-full bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 text-slate-900 dark:text-white backdrop-blur-md transition-all shadow-sm hover:shadow-md border border-white/40 dark:border-slate-600 z-20"
              >
                  <X size={20} />
              </button>

              <button 
                  onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                  className={`absolute top-6 right-20 p-2.5 rounded-full backdrop-blur-md transition-all shadow-sm hover:shadow-md border border-white/40 z-20 flex items-center gap-2 px-4
                    ${isEditing ? 'bg-orange-600 text-white hover:bg-orange-700' : 'bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 text-slate-900 dark:text-white'}
                  `}
              >
                  {isEditing ? <Save size={18} /> : <Edit2 size={18} />}
                  <span className="text-xs font-bold">{isEditing ? 'Enregistrer' : 'Modifier'}</span>
              </button>

              <div className="absolute bottom-6 left-8 right-8 flex items-end justify-between z-10">
                  <div className="w-2/3">
                      {isEditing ? (
                          <div className="flex flex-col gap-2 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md p-2 rounded-xl">
                             <input
                                className="text-xs font-bold uppercase tracking-wider bg-white/50 dark:bg-slate-700/50 border border-white/50 dark:border-slate-600 rounded px-2 py-1 w-full dark:text-white"
                                value={editForm.zoneName}
                                onChange={e => setEditForm({...editForm, zoneName: e.target.value})}
                                placeholder="Zone"
                             />
                             <input
                                className="text-2xl font-black bg-white/50 dark:bg-slate-700/50 border border-white/50 dark:border-slate-600 rounded px-2 py-1 w-full dark:text-white"
                                value={editForm.title}
                                onChange={e => setEditForm({...editForm, title: e.target.value})}
                                placeholder="Titre de l'équipe"
                             />
                          </div>
                      ) : (
                        <>
                            <div className="flex items-center gap-1.5 text-orange-700 dark:text-orange-300 font-bold uppercase tracking-wider text-[10px] mb-2 bg-orange-100/90 dark:bg-orange-900/60 backdrop-blur-md px-2.5 py-1 rounded-lg w-fit shadow-sm border border-orange-200/50 dark:border-orange-700/50">
                                <MapPin size={10} strokeWidth={3} /> {zone.name}
                            </div>
                            <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-none drop-shadow-sm line-clamp-2">{column.title}</h2>
                        </>
                      )}
                  </div>
                  
                  {/* Weather Widget */}
                  {!isEditing && (
                    <div className="flex items-center gap-3 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl px-4 py-2.5 rounded-2xl border border-white dark:border-slate-700 shadow-lg">
                        <WeatherIcon />
                        <div>
                            <div className="text-xl font-black text-slate-900 dark:text-white leading-none">{zone.weather.temp}°</div>
                            <div className="text-[10px] text-slate-500 font-bold uppercase">{zone.weather.condition}</div>
                        </div>
                    </div>
                  )}
              </div>
          </div>

          {/* --- TABS --- */}
          <div className="px-8 pb-2 flex-shrink-0 bg-white dark:bg-slate-900">
              <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-[18px] grid grid-cols-3 gap-1 relative">
                  {/* Animated Tab Indicator */}
                  <div 
                      className="absolute top-1.5 bottom-1.5 bg-white dark:bg-slate-700 rounded-2xl shadow-sm transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] z-0"
                      style={{ 
                          left: activeTab === 'overview' ? '6px' : activeTab === 'housing' ? 'calc(33.33% + 4px)' : 'calc(66.66% + 2px)',
                          width: 'calc(33.33% - 8px)'
                      }}
                  />
                  {[
                      { id: 'overview', label: 'Aperçu' },
                      { id: 'housing', label: 'Logement' },
                      { id: 'vehicle', label: 'Véhicule' }
                  ].map((tab) => (
                      <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id as any)}
                          className={`
                              relative z-10 py-2.5 text-xs font-bold text-center rounded-xl transition-colors duration-200
                              ${activeTab === tab.id ? 'text-slate-900 dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}
                          `}
                      >
                          {tab.label}
                      </button>
                  ))}
              </div>
          </div>

          {/* --- CONTENT --- */}
          <div className="flex-1 overflow-y-auto px-8 pb-8 pt-6 custom-scrollbar-light bg-white dark:bg-slate-900">
              
              {activeTab === 'overview' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      
                      <div className="grid grid-cols-2 gap-4">
                          <div className="bg-orange-50 dark:bg-orange-900/30 rounded-[28px] p-5 border border-orange-100/50 dark:border-orange-800/50 hover:bg-orange-100/50 dark:hover:bg-orange-900/50 transition-colors cursor-pointer group flex flex-col justify-between h-40">
                              <div className="flex justify-between items-start">
                                  <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl text-orange-600 shadow-sm"><Navigation size={20} /></div>
                                  <ChevronRight size={20} className="text-orange-300 group-hover:text-orange-600 transition-colors" />
                              </div>
                              <div>
                                  <div className="text-[10px] text-orange-400 dark:text-orange-300 font-bold uppercase tracking-wider mb-1">Trajet</div>
                                  <div className="text-slate-900 dark:text-white font-bold text-xl leading-tight">Secteur<br/>Nord</div>
                              </div>
                          </div>
                          
                          <div className="bg-amber-50 dark:bg-amber-900/30 rounded-[28px] p-5 border border-amber-100/50 dark:border-amber-800/50 hover:bg-amber-100/50 dark:hover:bg-amber-900/50 transition-colors cursor-pointer group flex flex-col justify-between h-40">
                              <div className="flex justify-between items-start">
                                  <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl text-amber-500 shadow-sm"><Wind size={20} /></div>
                                  <ChevronRight size={20} className="text-amber-300 group-hover:text-amber-600 transition-colors" />
                              </div>
                              <div>
                                  <div className="text-[10px] text-amber-400 dark:text-amber-300 font-bold uppercase tracking-wider mb-1">Météo</div>
                                  <div className="text-slate-900 dark:text-white font-bold text-xl leading-tight">Vent<br/>Faible</div>
                              </div>
                          </div>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-[28px] p-6 border border-slate-100 dark:border-slate-700">
                          <h3 className="text-slate-900 dark:text-white font-bold mb-4 flex items-center gap-2 text-xs uppercase tracking-widest pl-1">
                              Résumé Mission
                          </h3>
                          <div className="space-y-1">
                              <div className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-[var(--bg-card-solid)] border border-slate-100 dark:border-slate-800 shadow-sm">
                                  <div className="flex items-center gap-3">
                                      <div className="p-2 bg-slate-50 dark:bg-slate-700 rounded-xl text-slate-400"><Home size={16} /></div>
                                      <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Logement</span>
                                  </div>
                                  <span className="text-sm text-slate-900 dark:text-white font-black">{housing.type}</span>
                              </div>
                              <div className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-[var(--bg-card-solid)] border border-slate-100 dark:border-slate-800 shadow-sm">
                                  <div className="flex items-center gap-3">
                                      <div className="p-2 bg-slate-50 dark:bg-slate-700 rounded-xl text-slate-400"><Car size={16} /></div>
                                      <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Véhicule</span>
                                  </div>
                                  <span className="text-sm text-slate-900 dark:text-white font-black">{car.model}</span>
                              </div>
                              <div className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-[var(--bg-card-solid)] border border-slate-100 dark:border-slate-800 shadow-sm">
                                  <div className="flex items-center gap-3">
                                      <div className="p-2 bg-slate-50 dark:bg-slate-700 rounded-xl text-slate-400"><CalendarClock size={16} /></div>
                                      <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Fin Mission</span>
                                  </div>
                                  <span className="text-sm text-slate-900 dark:text-white font-black">{housing.checkOut}</span>
                              </div>
                          </div>
                      </div>
                  </div>
              )}

              {activeTab === 'housing' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      
                      <div className="relative h-48 rounded-[28px] overflow-hidden border border-slate-100 dark:border-slate-700 shadow-md group">
                          <img src={housing.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Housing" />
                          <div className="absolute top-4 right-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1 shadow-sm">
                             <div className="text-amber-400">★</div> {housing.rating}
                          </div>
                          <div className="absolute bottom-0 inset-x-0 p-5 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                              <div className="text-white font-bold text-xl">{housing.type}</div>
                              <div className="text-white/80 text-xs flex items-center gap-1 mt-1 font-medium">
                                  <MapPin size={10}/> 
                                  {isEditing ? (
                                      <input 
                                        className="bg-white/20 border border-white/30 rounded px-1 text-white text-xs w-full"
                                        value={editForm.housingAddress}
                                        onChange={e => setEditForm({...editForm, housingAddress: e.target.value})}
                                      />
                                  ) : housing.address}
                              </div>
                          </div>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-[28px] p-2 border border-slate-100 dark:border-slate-700">
                          <div className="p-4 flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700/60">
                              <div className="flex items-center gap-4">
                                  <div className="bg-orange-100 dark:bg-orange-900/40 p-3 rounded-2xl text-orange-600"><Wifi size={20}/></div>
                                  <div>
                                      <div className="text-[10px] uppercase text-slate-400 font-bold">Réseau Wifi</div>
                                      <div className="text-slate-900 dark:text-white font-mono text-sm font-bold">{housing.wifiDetails?.split('/')[0] || 'Unknown'}</div>
                                  </div>
                              </div>
                              <button className="p-2 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-slate-400 hover:text-orange-600 transition-colors" title="Copier"><Copy size={18}/></button>
                          </div>
                          <div className="p-4 flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                  <div className="bg-purple-100 dark:bg-purple-900/40 p-3 rounded-2xl text-purple-600 dark:text-purple-400"><Key size={20}/></div>
                                  <div>
                                      <div className="text-[10px] uppercase text-slate-400 font-bold">Code d'accès</div>
                                      <div className="text-slate-900 dark:text-white font-mono text-sm font-bold tracking-widest">{housing.accessCode || 'N/A'}</div>
                                  </div>
                              </div>
                              <button className="p-2 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-slate-400 hover:text-purple-600 transition-colors" title="Copier"><Copy size={18}/></button>
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white dark:bg-[var(--bg-card-solid)] p-5 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-sm text-center">
                              <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">Arrivée</div>
                              <div className="text-2xl font-black text-slate-900 dark:text-white">{housing.checkIn}</div>
                              <div className="text-xs text-slate-500 font-bold mt-1 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full inline-block">17:00</div>
                          </div>
                          <div className="bg-white dark:bg-[var(--bg-card-solid)] p-5 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-sm text-center">
                              <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">Départ</div>
                              <div className="text-2xl font-black text-slate-900 dark:text-white">{housing.checkOut}</div>
                              <div className="text-xs text-slate-500 font-bold mt-1 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full inline-block">10:00</div>
                          </div>
                      </div>

                  </div>
              )}

              {activeTab === 'vehicle' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      
                      <div className="bg-slate-900 rounded-[28px] p-6 relative overflow-hidden text-white shadow-xl group">
                          <div className="absolute right-0 top-0 w-48 h-full opacity-40 pointer-events-none">
                              <img src={car.image} className="w-full h-full object-cover mask-gradient-to-l scale-110 group-hover:scale-100 transition-transform duration-1000" alt="" />
                              <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/40 to-transparent"></div>
                          </div>
                          <div className="relative z-10">
                            {isEditing ? (
                                <input 
                                    className="font-bold text-2xl mb-2 bg-white/10 border border-white/20 rounded px-2 w-full text-white"
                                    value={editForm.carModel}
                                    onChange={e => setEditForm({...editForm, carModel: e.target.value})}
                                />
                            ) : (
                                <h3 className="font-bold text-2xl mb-2">{car.model}</h3>
                            )}
                            
                            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 mb-8">
                                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.5)]"></div>
                                {isEditing ? (
                                    <input 
                                        className="font-mono text-white text-sm tracking-widest font-bold bg-transparent border-none focus:outline-none w-24"
                                        value={editForm.carPlate}
                                        onChange={e => setEditForm({...editForm, carPlate: e.target.value})}
                                    />
                                ) : (
                                    <span className="font-mono text-white text-sm tracking-widest font-bold">{car.plate}</span>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <div className="flex items-center gap-2 text-slate-400 text-xs font-bold mb-2">
                                        <Fuel size={12} /> CARBURANT
                                    </div>
                                    <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden mb-2">
                                        <div className={`h-full rounded-full ${car.fuelLevel < 20 ? 'bg-red-500' : 'bg-emerald-400'}`} style={{ width: `${car.fuelLevel}%`}}></div>
                                    </div>
                                    <div className="text-sm font-bold">{car.fuelLevel}%</div>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 text-slate-400 text-xs font-bold mb-2">
                                        <Gauge size={12} /> KILOMÉTRAGE
                                    </div>
                                    <div className="font-mono text-lg font-bold">{car.mileage.toLocaleString()} km</div>
                                </div>
                            </div>
                          </div>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-[28px] p-2 border border-slate-100 dark:border-slate-700">
                          <button className="w-full p-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 rounded-t-[20px] transition-all text-left group">
                              <div>
                                  <div className="text-sm font-bold text-slate-900 dark:text-white">Déclarer un incident</div>
                                  <div className="text-xs text-slate-500 font-medium">Rayure, panne, accident...</div>
                              </div>
                              <ChevronRight size={18} className="text-slate-300 group-hover:text-red-500 transition-colors" />
                          </button>
                          <button className="w-full p-4 flex items-center justify-between hover:bg-white dark:hover:bg-slate-800 rounded-b-[20px] transition-all text-left group">
                              <div>
                                  <div className="text-sm font-bold text-slate-900 dark:text-white">Localiser le véhicule</div>
                                  <div className="text-xs text-slate-500 font-medium">Dernière position : Parking Hôtel</div>
                              </div>
                              <ExternalLink size={18} className="text-slate-300 group-hover:text-orange-500 transition-colors" />
                          </button>
                      </div>
                  </div>
              )}
          </div>
      </div>
    </>
  );
};
