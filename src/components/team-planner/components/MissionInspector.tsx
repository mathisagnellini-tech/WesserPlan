
import React, { useEffect, useId, useRef, useState } from 'react';
import { Column } from '../types';
import { X, MapPin, Wind, CloudRain, Sun, Cloud, Car, Home, Wifi, Key, Fuel, Gauge, CalendarClock, Navigation, Copy, ExternalLink, ChevronRight, Edit2, Save, Loader2 } from 'lucide-react';
import { useWeather } from '@/hooks/useWeather';
import { useDialogA11y } from '@/hooks/useDialogA11y';

interface MissionInspectorProps {
  column: Column;
  onClose: () => void;
  onUpdate: (updates: any) => void;
}

export const MissionInspector: React.FC<MissionInspectorProps> = ({ column, onClose, onUpdate }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'housing' | 'vehicle'>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const titleId = useId();
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 350);
  };

  const { dialogRef } = useDialogA11y({ isOpen: true, onClose: handleClose, initialFocusRef: closeBtnRef });
  
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

  // Real weather from API
  const zoneLat = column.missionData?.zone.lat;
  const zoneLng = column.missionData?.zone.lng;
  const { data: weatherData, isLoading: weatherLoading } = useWeather(zoneLat, zoneLng);

  if (!column.missionData) return null;
  const { car, housing, zone } = column.missionData;

  const realTemp = weatherData?.current.temperature ?? zone.weather.temp;
  const realCondition = weatherData?.current.condition ?? zone.weather.condition;

  const WeatherIcon = () => {
      if (weatherLoading) return <Loader2 size={24} className="text-slate-400 animate-spin" />;
      if (weatherData) {
          const icon = weatherData.current.icon;
          if (icon === 'Sun') return <Sun size={24} className="text-amber-500" strokeWidth={2} />;
          if (icon === 'CloudSun') return <Sun size={24} className="text-amber-400" strokeWidth={2} />;
          if (icon === 'CloudRain' || icon === 'CloudDrizzle') return <CloudRain size={24} className="text-orange-500" strokeWidth={2} />;
          if (icon === 'Cloud' || icon === 'CloudFog') return <Cloud size={24} className="text-slate-500" strokeWidth={2} />;
          return <Cloud size={24} className="text-slate-500" strokeWidth={2} />;
      }
      // Fallback to mock data
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
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`
            app-surface fixed top-4 bottom-4 right-4 w-[480px] z-[130] rounded-[28px]
            bg-white dark:bg-slate-900 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] border border-[var(--border-subtle)]
            flex flex-col overflow-hidden
            transform transition-all duration-300
            ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-[20px] opacity-0'}
        `}
        onClick={(e) => e.stopPropagation()}
      >
          {/* --- HERO HEADER --- */}
          <div className="relative h-64 flex-shrink-0 group overflow-hidden bg-slate-100 dark:bg-slate-800 rounded-t-[28px]">
               <div className="absolute inset-0">
                   <img src={zone.mapImage} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt="Map" />
                   <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-slate-900 via-white/40 dark:via-slate-900/40 to-transparent" />
               </div>

               <button
                  ref={closeBtnRef}
                  onClick={handleClose}
                  aria-label="Fermer"
                  className="absolute top-5 right-5 p-2 rounded-xl bg-white/85 dark:bg-slate-800/85 hover:bg-white dark:hover:bg-slate-700 text-slate-900 dark:text-white backdrop-blur-md transition active:translate-y-[1px] shadow-sm border border-[var(--border-subtle)] z-20"
              >
                  <X size={16} strokeWidth={2.2} />
              </button>

              <button
                  onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                  className={`absolute top-5 right-16 z-20 flex items-center gap-1.5 px-3 py-2 rounded-xl backdrop-blur-md transition active:translate-y-[1px] shadow-sm border tracking-tight
                    ${isEditing
                        ? 'bg-orange-600 text-white border-orange-500 hover:bg-orange-700'
                        : 'bg-white/85 dark:bg-slate-800/85 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-[var(--border-subtle)]'}
                  `}
              >
                  {isEditing ? <Save size={14} strokeWidth={2.2} /> : <Edit2 size={14} strokeWidth={2.2} />}
                  <span className="text-[12px] font-medium">{isEditing ? 'Enregistrer' : 'Modifier'}</span>
              </button>

              <div className="absolute bottom-5 left-7 right-7 flex items-end justify-between z-10 gap-3">
                  <div className="min-w-0">
                      {isEditing ? (
                          <div className="flex flex-col gap-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md p-2 rounded-xl">
                             <input
                                className="text-[11px] font-medium tracking-tight bg-white/60 dark:bg-slate-700/60 border border-[var(--border-subtle)] rounded px-2 py-1 w-full dark:text-white"
                                value={editForm.zoneName}
                                onChange={e => setEditForm({...editForm, zoneName: e.target.value})}
                                placeholder="Zone"
                             />
                             <input
                                className="display text-[24px] tracking-tight bg-white/60 dark:bg-slate-700/60 border border-[var(--border-subtle)] rounded px-2 py-1 w-full dark:text-white"
                                value={editForm.title}
                                onChange={e => setEditForm({...editForm, title: e.target.value})}
                                placeholder="Titre de l'équipe"
                             />
                          </div>
                      ) : (
                        <>
                            <div className="num flex items-center gap-1.5 text-orange-700 dark:text-orange-300 text-[11px] font-medium tracking-tight mb-2 bg-orange-50 dark:bg-orange-500/15 backdrop-blur-md px-2 py-0.5 rounded-md w-fit ring-1 ring-orange-100 dark:ring-orange-500/25">
                                <MapPin size={10} strokeWidth={2.4} /> {zone.name}
                            </div>
                            <h2 id={titleId} className="display text-slate-900 dark:text-white text-[34px] tracking-tight leading-none drop-shadow-sm line-clamp-2">{column.title}</h2>
                        </>
                      )}
                  </div>

                  {/* Weather */}
                  {!isEditing && (
                    <div className="flex items-center gap-2.5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl px-3 py-2 rounded-xl border border-[var(--border-subtle)] shadow-md flex-shrink-0">
                        <WeatherIcon />
                        <div>
                            <div className="num display text-slate-900 dark:text-white text-lg leading-none tracking-tight">{Math.round(realTemp)}°</div>
                            <div className="eyebrow leading-none mt-0.5">{realCondition}</div>
                        </div>
                    </div>
                  )}
              </div>
          </div>

          {/* --- TABS --- */}
          <div className="px-7 pt-3 pb-2 flex-shrink-0 bg-white dark:bg-slate-900">
              <div className="seg w-full !grid !grid-cols-3 !gap-1">
                  {[
                      { id: 'overview', label: 'Aperçu' },
                      { id: 'housing', label: 'Logement' },
                      { id: 'vehicle', label: 'Véhicule' }
                  ].map((tab) => (
                      <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id as any)}
                          data-active={activeTab === tab.id}
                          className="!justify-center"
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
                      
                      <div className="grid grid-cols-2 gap-3">
                          <button className="kpi-card !p-5 relative h-36 flex flex-col justify-between text-left active:translate-y-[1px]">
                              <div className="relative z-10 flex justify-between items-start">
                                  <div className="p-2 bg-orange-50 dark:bg-orange-500/15 rounded-xl text-orange-600 dark:text-orange-300 ring-1 ring-orange-100 dark:ring-orange-500/25">
                                      <Navigation size={16} strokeWidth={2.2} />
                                  </div>
                                  <ChevronRight size={16} className="text-orange-300 group-hover:text-orange-600 transition-colors" strokeWidth={2.2} />
                              </div>
                              <div className="relative z-10">
                                  <div className="eyebrow leading-none mb-1.5">Trajet</div>
                                  <div className="display text-slate-900 dark:text-white text-[20px] leading-tight tracking-tight">Secteur nord</div>
                              </div>
                          </button>

                          <button className="kpi-card !p-5 relative h-36 flex flex-col justify-between text-left active:translate-y-[1px]">
                              <div className="relative z-10 flex justify-between items-start">
                                  <div className="p-2 bg-amber-50 dark:bg-amber-500/15 rounded-xl text-amber-600 dark:text-amber-300 ring-1 ring-amber-100 dark:ring-amber-500/25">
                                      <Wind size={16} strokeWidth={2.2} />
                                  </div>
                                  <ChevronRight size={16} className="text-amber-300 group-hover:text-amber-600 transition-colors" strokeWidth={2.2} />
                              </div>
                              <div className="relative z-10">
                                  <div className="eyebrow leading-none mb-1.5">Météo</div>
                                  <div className="display text-slate-900 dark:text-white text-[20px] leading-tight tracking-tight">Vent faible</div>
                              </div>
                          </button>
                      </div>

                      <div className="bg-slate-50/60 dark:bg-slate-800/40 rounded-2xl p-5 border border-[var(--border-subtle)]">
                          <h3 className="eyebrow leading-none mb-3 pl-1">Résumé mission</h3>
                          <div className="space-y-1.5">
                              <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-[var(--bg-card-solid)] border border-[var(--border-subtle)] shadow-sm">
                                  <div className="flex items-center gap-2.5">
                                      <div className="p-1.5 bg-slate-50 dark:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400">
                                          <Home size={14} strokeWidth={2.2} />
                                      </div>
                                      <span className="text-[13px] font-medium text-slate-600 dark:text-slate-400 tracking-tight">Logement</span>
                                  </div>
                                  <span className="text-[13px] text-slate-900 dark:text-white font-medium tracking-tight">{housing.type}</span>
                              </div>
                              <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-[var(--bg-card-solid)] border border-[var(--border-subtle)] shadow-sm">
                                  <div className="flex items-center gap-2.5">
                                      <div className="p-1.5 bg-slate-50 dark:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400">
                                          <Car size={14} strokeWidth={2.2} />
                                      </div>
                                      <span className="text-[13px] font-medium text-slate-600 dark:text-slate-400 tracking-tight">Véhicule</span>
                                  </div>
                                  <span className="text-[13px] text-slate-900 dark:text-white font-medium tracking-tight">{car.model}</span>
                              </div>
                              <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-[var(--bg-card-solid)] border border-[var(--border-subtle)] shadow-sm">
                                  <div className="flex items-center gap-2.5">
                                      <div className="p-1.5 bg-slate-50 dark:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400">
                                          <CalendarClock size={14} strokeWidth={2.2} />
                                      </div>
                                      <span className="text-[13px] font-medium text-slate-600 dark:text-slate-400 tracking-tight">Fin de mission</span>
                                  </div>
                                  <span className="num text-[13px] text-slate-900 dark:text-white font-medium tracking-tight">{housing.checkOut}</span>
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

                      <div className="bg-slate-50/60 dark:bg-slate-800/40 rounded-2xl p-2 border border-[var(--border-subtle)]">
                          <div className="p-3.5 flex items-center justify-between border-b border-[var(--border-subtle)]">
                              <div className="flex items-center gap-3">
                                  <div className="bg-orange-50 dark:bg-orange-500/15 ring-1 ring-orange-100 dark:ring-orange-500/25 p-2.5 rounded-xl text-orange-600 dark:text-orange-300">
                                      <Wifi size={16} strokeWidth={2.2} />
                                  </div>
                                  <div>
                                      <div className="eyebrow leading-none">Réseau wifi</div>
                                      <div className="num text-slate-900 dark:text-white text-[13px] font-medium tracking-tight mt-0.5">
                                          {housing.wifiDetails?.split('/')[0] || 'Inconnu'}
                                      </div>
                                  </div>
                              </div>
                              <button className="btn-ghost !p-2" title="Copier">
                                  <Copy size={15} strokeWidth={2.2} />
                              </button>
                          </div>
                          <div className="p-3.5 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                  {/* Replaced purple AI fingerprint with the brand orange */}
                                  <div className="bg-orange-50 dark:bg-orange-500/15 ring-1 ring-orange-100 dark:ring-orange-500/25 p-2.5 rounded-xl text-orange-600 dark:text-orange-300">
                                      <Key size={16} strokeWidth={2.2} />
                                  </div>
                                  <div>
                                      <div className="eyebrow leading-none">Code d’accès</div>
                                      <div className="num text-slate-900 dark:text-white text-[13px] font-medium tracking-[0.2em] mt-0.5">
                                          {housing.accessCode || 'N/A'}
                                      </div>
                                  </div>
                              </div>
                              <button className="btn-ghost !p-2" title="Copier">
                                  <Copy size={15} strokeWidth={2.2} />
                              </button>
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                          <div className="kpi-card !p-4 relative text-center">
                              <div className="relative z-10">
                                  <div className="eyebrow leading-none">Arrivée</div>
                                  <div className="num display text-slate-900 dark:text-white text-[24px] leading-none tracking-tight mt-2">{housing.checkIn}</div>
                                  <div className="num text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-2 bg-slate-100 dark:bg-slate-700/60 px-2 py-0.5 rounded-md inline-block tracking-tight">17:00</div>
                              </div>
                          </div>
                          <div className="kpi-card !p-4 relative text-center">
                              <div className="relative z-10">
                                  <div className="eyebrow leading-none">Départ</div>
                                  <div className="num display text-slate-900 dark:text-white text-[24px] leading-none tracking-tight mt-2">{housing.checkOut}</div>
                                  <div className="num text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-2 bg-slate-100 dark:bg-slate-700/60 px-2 py-0.5 rounded-md inline-block tracking-tight">10:00</div>
                              </div>
                          </div>
                      </div>

                  </div>
              )}

              {activeTab === 'vehicle' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      
                      <div className="bg-slate-900 rounded-2xl p-5 relative overflow-hidden text-white shadow-xl group">
                          <div className="absolute right-0 top-0 w-44 h-full opacity-35 pointer-events-none">
                              <img src={car.image} className="w-full h-full object-cover scale-110 group-hover:scale-100 transition-transform duration-1000" alt="" />
                              <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/40 to-transparent" />
                          </div>
                          <div className="relative z-10">
                            {isEditing ? (
                                <input
                                    className="display text-[22px] tracking-tight mb-2 bg-white/10 border border-white/20 rounded px-2 w-full text-white"
                                    value={editForm.carModel}
                                    onChange={e => setEditForm({...editForm, carModel: e.target.value})}
                                />
                            ) : (
                                <h3 className="display text-[22px] tracking-tight leading-tight mb-2">{car.model}</h3>
                            )}

                            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10 mb-7">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                                {isEditing ? (
                                    <input
                                        className="num text-white text-[12px] tracking-[0.2em] font-medium bg-transparent border-none focus:outline-none w-24"
                                        value={editForm.carPlate}
                                        onChange={e => setEditForm({...editForm, carPlate: e.target.value})}
                                    />
                                ) : (
                                    <span className="num text-white text-[12px] tracking-[0.2em] font-medium">{car.plate}</span>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <div className="eyebrow leading-none mb-2 !text-slate-400 flex items-center gap-1.5">
                                        <Fuel size={11} strokeWidth={2.4} /> Carburant
                                    </div>
                                    <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden mb-2">
                                        <div className={`h-full rounded-full ${car.fuelLevel < 20 ? 'bg-red-500' : 'bg-emerald-400'}`} style={{ width: `${car.fuelLevel}%`}} />
                                    </div>
                                    <div className="num text-[13px] font-medium tracking-tight">{car.fuelLevel} %</div>
                                </div>
                                <div>
                                    <div className="eyebrow leading-none mb-2 !text-slate-400 flex items-center gap-1.5">
                                        <Gauge size={11} strokeWidth={2.4} /> Kilométrage
                                    </div>
                                    <div className="num text-base font-medium tracking-tight">{car.mileage.toLocaleString('fr-FR')} km</div>
                                </div>
                            </div>
                          </div>
                      </div>

                      <div className="bg-slate-50/60 dark:bg-slate-800/40 rounded-2xl p-2 border border-[var(--border-subtle)]">
                          <button className="w-full p-3.5 flex items-center justify-between border-b border-[var(--border-subtle)] hover:bg-white dark:hover:bg-slate-800 rounded-t-xl transition text-left group active:translate-y-[1px]">
                              <div>
                                  <div className="text-[13px] font-medium text-slate-900 dark:text-white tracking-tight">Déclarer un incident</div>
                                  <div className="text-[11px] text-slate-500 dark:text-slate-400 tracking-tight mt-0.5">Rayure, panne, accident…</div>
                              </div>
                              <ChevronRight size={15} className="text-slate-300 group-hover:text-red-500 transition-colors" strokeWidth={2.2} />
                          </button>
                          <button className="w-full p-3.5 flex items-center justify-between hover:bg-white dark:hover:bg-slate-800 rounded-b-xl transition text-left group active:translate-y-[1px]">
                              <div>
                                  <div className="text-[13px] font-medium text-slate-900 dark:text-white tracking-tight">Localiser le véhicule</div>
                                  <div className="text-[11px] text-slate-500 dark:text-slate-400 tracking-tight mt-0.5">Dernière position · parking hôtel</div>
                              </div>
                              <ExternalLink size={15} className="text-slate-300 group-hover:text-orange-500 transition-colors" strokeWidth={2.2} />
                          </button>
                      </div>
                  </div>
              )}
          </div>
      </div>
    </>
  );
};
