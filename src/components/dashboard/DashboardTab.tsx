
import React, { useMemo, useState } from 'react';
import { MapPin, Loader2, AlertTriangle } from 'lucide-react';
import { DashboardHeader, translations } from './DashboardHeader';
import { CompactWeatherWidget } from './WeatherWidget';
import { ActivityFeed } from './ActivityFeed';
import { FranceMap, generateTeamsData } from './FranceMap';
import { useDepartmentWeather } from '@/hooks/useWeather';
import { useApiData } from '@/hooks/useApiData';
import { dashboardService } from '@/services/dashboardService';

const DashboardTab: React.FC = () => {
  const [lang, setLang] = useState<'en' | 'fr'>('fr');
  const t = (key: keyof typeof translations.en) => translations[lang][key];

  // Real data with mock fallback
  const mockTeams = useMemo(() => generateTeamsData(), []);
  const { data: weeklyPerf, error: perfError } = useApiData(
    () => dashboardService.getWeeklyPerformance(),
  );
  const { data: campaigns } = useApiData(
    () => dashboardService.getCampaigns(),
  );

  const teams = mockTeams.teams;
  const { data: weatherData, isLoading: weatherLoading } = useDepartmentWeather('75');

  // Compute KPIs from API data or fallback
  const kpis = useMemo(() => {
    if (weeklyPerf?.data?.length) {
      const latest = weeklyPerf.data[weeklyPerf.data.length - 1];
      return {
        donorsRecruited: latest.donorsRecruited,
        activeFundraisers: latest.activeFundraisers,
        activeTeams: latest.activeTeams,
        productivity: latest.productivity,
      };
    }
    return null;
  }, [weeklyPerf]);

  return (
    <section className="animate-fade-in h-auto lg:h-[calc(100vh-100px)] flex flex-col">
      <DashboardHeader lang={lang} onLangChange={() => setLang(l => l === 'en' ? 'fr' : 'en')} t={t} />

      {/* KPI Bar — from API or hidden */}
      {kpis && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {[
            { label: 'Donateurs recrutés', value: kpis.donorsRecruited },
            { label: 'Fundraisers actifs', value: kpis.activeFundraisers },
            { label: 'Équipes actives', value: kpis.activeTeams },
            { label: 'Productivité', value: `${kpis.productivity.toFixed(1)}` },
          ].map(({ label, value }) => (
            <div key={label} className="glass-card px-4 py-3">
              <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{label}</p>
              <p className="text-xl font-black text-[var(--text-primary)]">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* API connection indicator */}
      {perfError && (
        <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 mb-3 px-1">
          <AlertTriangle size={12} />
          <span>API hors ligne — données de démonstration</span>
        </div>
      )}

      <div className="flex-grow grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6 min-h-0">
          {/* Main Map Area */}
          <div className="lg:col-span-3 flex flex-col gap-4 md:gap-6">
              <div className="relative rounded-2xl md:rounded-3xl overflow-hidden border border-[var(--border-subtle)] shadow-sm h-[50vh] md:h-[60vh] lg:h-auto lg:flex-grow">
                  <FranceMap teams={teams} />

                  {/* Floating Overlay Title */}
                  <div className="absolute top-3 left-3 md:top-6 md:left-6 bg-white/90 dark:bg-[var(--bg-card-solid)]/90 backdrop-blur-md px-3 py-2 md:px-5 md:py-3 rounded-xl md:rounded-2xl shadow-lg border border-[var(--border-subtle)] z-[400]">
                      <h2 className="text-[10px] md:text-sm font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-0.5">Vue d'ensemble</h2>
                      <div className="flex items-center gap-1.5 md:gap-2">
                          <MapPin size={14} className="text-orange-600 md:hidden"/>
                          <MapPin size={18} className="text-orange-600 hidden md:block"/>
                          <h3 className="font-black text-[var(--text-primary)] text-sm md:text-lg">Deploiement National</h3>
                      </div>
                  </div>
              </div>
          </div>

          {/* Right Sidebar - Weather & Feed */}
          <div className="lg:col-span-1 flex flex-col gap-4 md:gap-6">
              {/* Compact Weather Top */}
              <div className="h-28 md:h-32 shrink-0">
                  {weatherLoading ? (
                      <div className="glass-card p-4 flex items-center justify-center h-full">
                          <Loader2 size={20} className="animate-spin text-[var(--text-muted)]" />
                      </div>
                  ) : (
                      <CompactWeatherWidget
                          avgTemp={weatherData?.current.temperature ?? 14}
                          condition={weatherData?.current.condition ?? '...'}
                          walkingScore={weatherData?.current.walkingScore ?? 'Bonne'}
                          hourlyTemperatures={weatherData?.hourly.temperature}
                          hourlyTimes={weatherData?.hourly.time}
                      />
                  )}
              </div>

              {/* Activity Feed & Calendar Bottom */}
              <div className="min-h-[300px] lg:flex-grow lg:min-h-0">
                  <ActivityFeed />
              </div>
          </div>
      </div>
    </section>
  );
};

export default DashboardTab;
