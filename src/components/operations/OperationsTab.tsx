
import React, { useState, useMemo, useCallback } from 'react';
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

// --- INITIAL DATA ---
const INITIAL_HOUSINGS: Housing[] = [
    { id: '1', name: "Appartement Croix-Rousse", date: "2025-10-29", lead: "Aboubacar N.", region: "Rhône-Alpes", dept: "69", org: "MSF", people: 5, nights: 7, cost: 660, channel: "Airbnb Pro", address: "12 Rue de la République, 69001 Lyon", owner: "+33 6 00 00 00 00", ownerName: "M. Dupuis", rating: 4, comment: "Très bon emplacement, parking difficile pour le Trafic.", lat: 45.7640, lng: 4.8357, amenities: ["Wifi Haut Débit", "Cuisine équipée", "Lave-linge"] },
    { id: '2', name: "Maison Alsacienne", date: "2025-11-03", lead: "Mickaël P.", region: "Alsace", dept: "67", org: "UNICEF", people: 5, nights: 7, cost: 610, channel: "Booking", address: "5 Avenue des Vosges, 67000 Strasbourg", owner: "+33 6 11 22 33 44", ownerName: "Sarl ImmoEst", rating: 3, comment: "Correct, un peu bruyant le matin.", lat: 48.5839, lng: 7.7455, amenities: ["Wifi", "TV", "Draps fournis"] },
    { id: '3', name: "Gîte des Vignes", date: "2025-11-10", lead: "Sarah L.", region: "Alsace", dept: "68", org: "WWF", people: 8, nights: 4, cost: 820, channel: "Gîtes de France", address: "Route du Vin, 68000 Colmar", owner: "+33 6 55 44 33 22", ownerName: "Mme. Weber", rating: 5, comment: "Super gîte, grand parking, proprio adorable.", lat: 48.0794, lng: 7.3585, amenities: ["Parking Privé", "Wifi", "Jardin", "Barbecue"] },
    { id: '4', name: "T3 Centre Rennes", date: "2025-09-15", lead: "Thomas R.", region: "Bretagne", dept: "35", org: "MSF", people: 6, nights: 6, cost: 550, channel: "Leboncoin", address: "Rue de Saint-Malo, 35000 Rennes", owner: "+33 6 99 88 77 66", ownerName: "Julien B.", rating: 4, comment: "Bien situé, bon rapport qualité prix.", lat: 48.1173, lng: -1.6778, amenities: ["Wifi", "Parking rue gratuit"] },
    { id: '5', name: "Duplex Fosse", date: "2025-10-01", lead: "Julie B.", region: "Pays de la Loire", dept: "44", org: "WWF", people: 5, nights: 7, cost: 700, channel: "Airbnb", address: "Quai de la Fosse, 44000 Nantes", owner: "+33 6 12 34 56 78", ownerName: "Agence Loire", rating: 3, comment: "Appartement sombre mais fonctionnel.", lat: 47.2100, lng: -1.5600, amenities: ["Wifi", "Proche Tram"] },
    { id: '6', name: "Maison Cronenbourg", date: "2025-11-05", lead: "Moussa D.", region: "Alsace", dept: "67", org: "MSF", people: 6, nights: 7, cost: 580, channel: "Pap", address: "Rue Principale, 67200 Strasbourg (Cronenbourg)", owner: "+33 6 98 76 54 32", ownerName: "Famille Muller", rating: 4, comment: "A 10 min du centre en tram, calme.", lat: 48.5900, lng: 7.7200, amenities: ["Wifi", "Garage", "Lave-vaisselle"] },
];

const INITIAL_CARS: CarType[] = [
    { id: 'c1', plate: "GA-123-AB", brand: "Peugeot 2008", where: "Strasbourg", km: 42850, service: "2026-01-10", owner: "Léa", lat: 48.5734, lng: 7.7521, fuelStats: { declared: 1, tankSize: 50 }, damages: [] },
    { id: 'c2', plate: "GB-456-CD", brand: "Renault Clio", where: "Nantes", km: 31870, service: "2025-12-01", owner: "Maëva", lat: 47.2184, lng: -1.5536, fuelStats: { declared: 0, tankSize: 45 }, damages: [] }
];

const OperationsTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'housing' | 'cars' | 'stats'>('housing');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalMode, setAddModalMode] = useState<'manual'|'scan'>('manual');
  const [smartZoneId, setSmartZoneId] = useState<string>("");
  const [housingData, setHousingData] = useState<Housing[]>(INITIAL_HOUSINGS);
  const [carsData, setCarsData] = useState<CarType[]>(INITIAL_CARS);
  const [selectedHousing, setSelectedHousing] = useState<Housing | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [reportingCar, setReportingCar] = useState<CarType | null>(null);

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

  const handleAddNewHousing = (newHousing: Housing) => { setHousingData([newHousing, ...housingData]); };
  const handleReportDamage = (desc: string) => {
      if (reportingCar) {
          const newDamage = { date: new Date().toISOString(), description: desc, author: "Moi" };
          setCarsData(carsData.map(c => c.id === reportingCar.id ? { ...c, damages: [...(c.damages || []), newDamage] } : c));
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
  };

  const handleSelectHousing = useCallback((h: Housing) => setSelectedHousing(h), []);

  return (
    <div className="min-h-screen pb-10 relative">
        {/* Modals */}
        <HousingDetailModal housing={selectedHousing} onClose={() => setSelectedHousing(null)} />
        <AddHousingModal isOpen={isAddModalOpen} initialMode={addModalMode} onClose={() => setIsAddModalOpen(false)} onAdd={handleAddNewHousing} />
        {reportingCar && <ReportDamageModal car={reportingCar} onClose={() => setReportingCar(null)} onReport={handleReportDamage} />}

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
                {viewMode === 'map' && <HousingMap housings={filteredHousing} smartZoneId={smartZoneId} onSelectHousing={handleSelectHousing} />}
                {viewMode === 'list' && <HousingList housings={filteredHousing} copiedId={copiedId} onSelect={handleSelectHousing} onCopy={copyToClipboard} />}
            </div>
        )}

        {/* CARS TAB */}
        {activeSubTab === 'cars' && <VehicleSection cars={carsData} onReportDamage={setReportingCar} />}

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
