
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Plus } from 'lucide-react';
import type { Housing, CarType } from './types';
import { getDistance, MOCK_ZONES } from './helpers';
import { LogisticsDashboard } from './LogisticsDashboard';
import { ReportDamageModal } from './ReportDamageModal';
import { AddHousingModal } from './AddHousingModal';
import { HousingDetailModal } from './HousingDetailModal';
import { HousingList } from './HousingList';
import { HousingMap } from './HousingMap';
import { SmartMatcher } from './SmartMatcher';
import { VehicleSection } from './VehicleSection';
import { useOperationsStore } from '@/stores/operationsStore';
import { housingsService } from '@/services/housingsService';
import { carsService } from '@/services/carsService';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Home, Car as CarIcon } from 'lucide-react';

const OperationsTab: React.FC = () => {
  const { activeSubTab, setActiveSubTab, viewMode, setViewMode, selectedHousingId, setSelectedHousingId, reportingCarId, setReportingCarId } = useOperationsStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalMode, setAddModalMode] = useState<'manual'|'scan'>('manual');
  const [smartZoneId, setSmartZoneId] = useState<string>("");
  const [housingData, setHousingData] = useState<Housing[]>([]);
  const [carsData, setCarsData] = useState<CarType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load data from Supabase. Surface errors via ErrorState.
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    Promise.all([
      housingsService.getAll(),
      carsService.getAll(),
    ])
      .then(([housings, cars]) => {
        if (cancelled) return;
        setHousingData(housings);
        setCarsData(cars);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const [housings, cars] = await Promise.all([
        housingsService.getAll(),
        carsService.getAll(),
      ]);
      setHousingData(housings);
      setCarsData(cars);
    } catch (err) {
      setError(err as Error);
    }
  }, []);

  const retryLoad = useCallback(async () => {
    setIsLoading(true);
    await refresh();
    setIsLoading(false);
  }, [refresh]);

  const selectedHousing = useMemo(() => selectedHousingId ? housingData.find(h => h.id === selectedHousingId) ?? null : null, [selectedHousingId, housingData]);
  const reportingCar = useMemo(() => reportingCarId ? carsData.find(c => c.id === reportingCarId) ?? null : null, [reportingCarId, carsData]);

  const filteredHousing = useMemo(() => {
      let data = [...housingData];
      if (smartZoneId) {
          const zone = MOCK_ZONES.find(z => z.id === smartZoneId);
          if (zone) {
              data = data.map(h => {
                  const dist = getDistance(h.lat, h.lng, zone.lat, zone.lng);
                  let score = 100;
                  score -= dist * 2;
                  if (dist > 30) score -= 20;
                  const pricePerNight = h.cost / h.nights;
                  if (pricePerNight > 120) score -= 10;
                  if (pricePerNight < 80) score += 10;
                  let label = "";
                  let color = "";
                  if (score > 85) { label = "Top Match"; color = "bg-green-500"; }
                  else if (dist > 50) { label = "Trop Loin"; color = "bg-red-500"; }
                  else if (score > 60) { label = "Correct"; color = "bg-orange-500"; }
                  else { label = "Faible"; color = "bg-slate-400"; }
                  return { ...h, _matchScore: Math.round(score), _matchDistance: dist, _matchLabel: label, _matchColor: color };
              });
              data.sort((a, b) => (b._matchScore || 0) - (a._matchScore || 0));
          }
      }
      return data;
  }, [housingData, smartZoneId]);

  const handleHousingCreated = useCallback(async () => {
    await refresh();
  }, [refresh]);

  const handleReportDamage = async (damage: { part: string; type: string; detail: string }) => {
    if (!reportingCar) return;
    await carsService.reportDamage(Number(reportingCar.id), damage);
    setReportingCarId(null);
    await refresh();
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
  };

  const handleSelectHousing = useCallback((h: Housing) => setSelectedHousingId(h.id), [setSelectedHousingId]);

  if (isLoading) {
    return <LoadingState fullHeight label="Chargement des logements et véhicules…" />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={retryLoad} fullHeight />;
  }

  return (
    <div className="min-h-screen pb-10 relative">
        {/* Modals */}
        <HousingDetailModal housing={selectedHousing} onClose={() => setSelectedHousingId(null)} />
        <AddHousingModal isOpen={isAddModalOpen} initialMode={addModalMode} onClose={() => setIsAddModalOpen(false)} onCreated={handleHousingCreated} />
        {reportingCar && <ReportDamageModal car={reportingCar} onClose={() => setReportingCarId(null)} onReport={handleReportDamage} />}

        {/* Logistics Dashboard */}
        <LogisticsDashboard housings={housingData} cars={carsData} />

        {/* Navigation & Main Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
            <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl w-full sm:w-fit border border-[var(--border-subtle)]">
                <button onClick={() => setActiveSubTab('housing')} className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeSubTab === 'housing' ? 'bg-white dark:bg-[var(--bg-card-solid)] text-orange-600 shadow-sm' : 'text-[var(--text-secondary)] hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                    🏠 Logements
                </button>
                <button onClick={() => setActiveSubTab('cars')} className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeSubTab === 'cars' ? 'bg-white dark:bg-[var(--bg-card-solid)] text-orange-600 shadow-sm' : 'text-[var(--text-secondary)] hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                    🚗 Véhicules & Flotte
                </button>
            </div>
             {activeSubTab === 'housing' && (
                 <div className="flex gap-2">
                     <button onClick={() => openAddModal('manual')} className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-xl font-bold text-sm shadow-md hover:bg-orange-700 transition-colors">
                        <Plus size={16} /> Ajouter
                    </button>
                 </div>
             )}
        </div>

        {/* HOUSING TAB */}
        {activeSubTab === 'housing' && (
            <div className="animate-fade-in space-y-6">
                <SmartMatcher smartZoneId={smartZoneId} viewMode={viewMode} onZoneChange={setSmartZoneId} onViewModeChange={setViewMode} />
                {housingData.length === 0 ? (
                    <div className="glass-card">
                        <EmptyState
                            title="Aucun logement"
                            message="Aucun logement enregistré. Cliquez sur Ajouter pour en créer un."
                            icon={<Home size={22} />}
                        />
                    </div>
                ) : (
                    <>
                        {viewMode === 'map' && <HousingMap housings={filteredHousing} smartZoneId={smartZoneId} onSelectHousing={handleSelectHousing} />}
                        {viewMode === 'list' && <HousingList housings={filteredHousing} copiedId={copiedId} onSelect={handleSelectHousing} onCopy={copyToClipboard} />}
                    </>
                )}
            </div>
        )}

        {/* CARS TAB */}
        {activeSubTab === 'cars' && (
            carsData.length === 0 ? (
                <div className="glass-card">
                    <EmptyState
                        title="Aucun véhicule"
                        message="Aucun véhicule dans le parc."
                        icon={<CarIcon size={22} />}
                    />
                </div>
            ) : (
                <VehicleSection cars={carsData} onReportDamage={(car) => setReportingCarId(car.id)} />
            )
        )}

        {/* STATS TAB */}
        {activeSubTab === 'stats' && (
             <div className="animate-fade-in glass-card p-12 text-center text-[var(--text-secondary)]">
                <p>Les statistiques détaillées sont désormais intégrées au tableau de bord en haut de page.</p>
             </div>
        )}
    </div>
  );
};

export default OperationsTab;
