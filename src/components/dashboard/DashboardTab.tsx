
import React, { useMemo, useState } from 'react';
import { MapPin } from 'lucide-react';
import { DashboardHeader, translations } from './DashboardHeader';
import { CompactWeatherWidget } from './WeatherWidget';
import { ActivityFeed } from './ActivityFeed';
import { FranceMap, generateTeamsData } from './FranceMap';

const DashboardTab: React.FC = () => {
  const [lang, setLang] = useState<'en' | 'fr'>('fr');
  const t = (key: keyof typeof translations.en) => translations[lang][key];

  const { teams, weather: globalWeather } = useMemo(() => generateTeamsData(), []);

  return (
    <section className="animate-fade-in h-auto lg:h-[calc(100vh-100px)] flex flex-col">
      <DashboardHeader lang={lang} onLangChange={() => setLang(l => l === 'en' ? 'fr' : 'en')} t={t} />

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
                  <CompactWeatherWidget
                      avgTemp={globalWeather.temp}
                      condition={globalWeather.condition}
                      walkingScore={globalWeather.walking}
                  />
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
