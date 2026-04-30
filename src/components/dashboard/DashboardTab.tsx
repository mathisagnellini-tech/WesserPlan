
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapPin, Users } from 'lucide-react';
import { DashboardHeader, translations } from './DashboardHeader';
import { CompactWeatherWidget } from './WeatherWidget';
import { ActivityFeed } from './ActivityFeed';
import { FranceMap, type TeamData } from './FranceMap';
import { useDepartmentWeather } from '@/hooks/useWeather';
import { dashboardService } from '@/services/dashboardService';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { departmentCapitals } from '@/constants/departments';
import { ORGANIZATIONS, ORG_FALLBACK_COLOR } from '@/constants/organizations';
import type { Organization } from '@/types/commune';
import { usePreferencesStore } from '@/stores/preferencesStore';
import { reporter } from '@/lib/observability';
import { computeIsoWeek } from '@/lib/isoWeek';
import { parseTeamName, deptCodeForName, deptCodeForCoords } from '@/lib/teamName';
import type {
  DashboardTeamDto,
  GetDashboardDataResponseDto,
} from '@/types/plan';

// Loose extension over the bundle DTO. The backend's typed `DashboardTeamDto`
// only carries identifiers + aggregates; the page bundle may opportunistically
// surface extra fields (coordinates, leader name, housing/car) that aren't
// pinned in the schema but the map happily renders when present. Mirrors the
// resilience of the previous per-row mapper.
interface BackendTeamRow extends DashboardTeamDto {
  latitude?: number;
  longitude?: number;
  lat?: number;
  lng?: number;
  departmentCode?: string;
  deptCode?: string;
  leaderName?: string;
  leader?: string;
  housing?: string;
  housingAddress?: string;
  car?: string;
  licensePlate?: string;
}

function pickFirstNumber(...vals: Array<number | undefined>): number | undefined {
  for (const v of vals) {
    if (typeof v === 'number' && !Number.isNaN(v)) return v;
  }
  return undefined;
}

function pickFirstString(...vals: Array<string | undefined>): string | undefined {
  for (const v of vals) {
    if (typeof v === 'string' && v.trim().length > 0) return v;
  }
  return undefined;
}

function deriveCoordsForOrg(orgKey: string, index: number): [number, number] {
  const codes = Object.keys(departmentCapitals);
  if (codes.length === 0) return [46.603354, 1.888334];
  const seed =
    orgKey.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) + index;
  const code = codes[seed % codes.length];
  const cap = departmentCapitals[code];
  return [cap.lat, cap.lng];
}

function mapTeamsResponseToTeamData(rows: DashboardTeamDto[] | undefined): TeamData[] {
  if (!Array.isArray(rows)) return [];
  const result: TeamData[] = [];
  rows.forEach((raw, idx) => {
    if (!raw || typeof raw !== 'object') return;
    const row = raw as BackendTeamRow;

    const rawName = pickFirstString(row.teamName) ?? '';
    const parsed = parseTeamName(rawName);

    const orgKey = (parsed.org ?? row.organization ?? '').toString().toLowerCase();
    const orgInfo = ORGANIZATIONS[orgKey as Organization];
    const color = orgInfo?.color ?? ORG_FALLBACK_COLOR;
    const logo = orgInfo?.logo ?? null;
    const orgShort = orgInfo?.shortName ?? (orgKey ? orgKey.toUpperCase() : '—');

    const lat = pickFirstNumber(row.latitude, row.lat);
    const lng = pickFirstNumber(row.longitude, row.lng);
    let coords: [number, number] | undefined =
      lat !== undefined && lng !== undefined ? [lat, lng] : undefined;
    if (!coords) {
      const deptCode = deptCodeForName(parsed.department);
      const cap = deptCode ? departmentCapitals[deptCode] : undefined;
      if (cap) coords = [cap.lat, cap.lng];
    }
    if (!coords) coords = deriveCoordsForOrg(orgKey || 'team', idx);

    const id =
      row.teamId !== undefined && row.teamId !== null
        ? `t-${String(row.teamId)}`
        : `team-${idx}`;

    const leader =
      pickFirstString(row.leaderName, row.leader, parsed.leader) ?? '—';
    const department = parsed.department ?? '';
    const name = department
      ? `${department} · ${leader}`
      : pickFirstString(rawName) ?? `Equipe ${idx + 1}`;

    const housing = pickFirstString(row.housing, row.housingAddress) ?? '—';
    const car = pickFirstString(row.car, row.licensePlate) ?? '—';

    result.push({
      id,
      name,
      coords,
      // color + logo ALWAYS from canonical org map — never from backend (XSS).
      color,
      logo,
      orgShort,
      leader,
      housing,
      car,
      weather: { t: 0, c: '', icon: '' },
    });
  });
  return result;
}

const DashboardTab: React.FC = () => {
  const lang = usePreferencesStore((s) => s.language);
  const t = (key: keyof typeof translations.en) => translations[lang][key];

  const now = useMemo(() => new Date(), []);
  const [year, setYear] = useState(now.getFullYear());
  const [week, setWeek] = useState(() => computeIsoWeek(now));
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);

  // One bundle response feeds every widget on this page. Loading / error
  // state collapses to a single transition rather than four parallel ones.
  const [bundle, setBundle] = useState<GetDashboardDataResponseDto | null>(null);
  const [bundleError, setBundleError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const hasLoadedOnce = useRef(false);
  const bundleCtrl = useRef<AbortController | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBundle = useCallback(() => {
    bundleCtrl.current?.abort();
    const ctrl = new AbortController();
    bundleCtrl.current = ctrl;
    if (!hasLoadedOnce.current) setIsLoading(true);
    setBundleError(null);

    return dashboardService
      .getDashboardData(week, year, selectedCampaignId ?? undefined)
      .then((res) => {
        if (ctrl.signal.aborted) return;
        setBundle(res);
        setLastUpdated(Date.now());
      })
      .catch((err) => {
        if (ctrl.signal.aborted) return;
        setBundle(null);
        setBundleError(err instanceof Error ? err : new Error(String(err)));
        reporter.error('getDashboardData failed', err, { source: 'DashboardTab' });
      })
      .finally(() => {
        if (ctrl.signal.aborted) return;
        setIsLoading(false);
        hasLoadedOnce.current = true;
      });
  }, [week, year, selectedCampaignId]);

  useEffect(() => {
    fetchBundle();
    return () => bundleCtrl.current?.abort();
  }, [fetchBundle]);

  const teams = useMemo(
    () => mapTeamsResponseToTeamData(bundle?.teams),
    [bundle],
  );
  const campaigns = bundle?.campaigns ?? [];
  const kpis = bundle?.kpis ?? null;

  // Weather: dept derived from the first available team's coords.
  const weatherDeptCode = useMemo(() => {
    if (teams.length > 0) {
      const [lat, lng] = teams[0].coords;
      return deptCodeForCoords(lat, lng) ?? '75';
    }
    return '75';
  }, [teams]);
  const { data: weatherData, isLoading: weatherLoading } =
    useDepartmentWeather(weatherDeptCode);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshAll = useCallback(() => {
    setIsRefreshing(true);
    Promise.allSettled([fetchBundle()]).finally(() => {
      setIsRefreshing(false);
    });
  }, [fetchBundle]);

  const kpiItems = kpis
    ? [
        { key: 'donors', label: 'Donateurs recrutés', value: kpis.donorsRecruited, hero: true },
        { key: 'fundraisers', label: 'Fundraisers actifs', value: kpis.activeFundraisers, hero: false },
        { key: 'teams', label: 'Équipes actives', value: kpis.activeTeams, hero: false },
        {
          key: 'productivity',
          label: 'Productivité',
          value: kpis.productivity.toFixed(1),
          hint: 'donateurs / FR / jour',
          hero: false,
        },
      ]
    : [];

  return (
    <section className="app-surface animate-fade-in h-auto lg:h-[calc(100vh-100px)] flex flex-col">
      <DashboardHeader
        lang={lang}
        t={t}
        week={week}
        year={year}
        setWeek={setWeek}
        setYear={setYear}
        selectedCampaignId={selectedCampaignId}
        setSelectedCampaignId={setSelectedCampaignId}
        campaigns={campaigns}
        onRefresh={refreshAll}
        isRefreshing={isRefreshing}
        lastUpdated={lastUpdated}
      />

      {bundleError ? (
        <div className="mb-4 glass-card px-4 py-3">
          <ErrorState
            title="Impossible de charger le tableau de bord"
            error={bundleError}
            onRetry={fetchBundle}
          />
        </div>
      ) : !bundle ? (
        <div className="mb-4 grid grid-cols-2 md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="kpi-card h-[92px] animate-pulse"
              aria-hidden="true"
            >
              <div className="h-2.5 w-24 rounded bg-slate-200/70 dark:bg-slate-700/60 mb-3" />
              <div className="h-7 w-16 rounded bg-slate-200/70 dark:bg-slate-700/60" />
            </div>
          ))}
        </div>
      ) : !kpis ? (
        <div className="mb-4">
          <EmptyState
            title="Aucun indicateur pour cette période"
            message="Essayez une autre semaine ou une autre année."
          />
        </div>
      ) : (
        <div className="mb-4">
          {kpis.isFallback && (
            <p className="eyebrow mb-2 italic">
              Affichage de la dernière semaine complète disponible · S{kpis.resolvedWeek}/{kpis.resolvedYear}
            </p>
          )}
          <div className="grid grid-cols-2 md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-3">
            {kpiItems.map(({ key, label, value, hint, hero }) => (
              <div
                key={key}
                className={`kpi-card ${hero ? 'kpi-card--hero md:row-span-1' : ''}`}
              >
                <div className="relative z-10 flex flex-col h-full justify-between gap-2">
                  <p className="eyebrow">{label}</p>
                  <div className="flex items-end justify-between gap-3">
                    <p
                      className={`num text-[var(--text-primary)] leading-none ${
                        hero
                          ? 'display text-[44px] md:text-[56px]'
                          : 'text-[26px] md:text-[30px] font-semibold tracking-tight'
                      }`}
                    >
                      {value}
                    </p>
                    {hint && (
                      <p className="eyebrow text-right text-[10px] leading-tight max-w-[8ch] -mb-0.5">
                        {hint}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex-grow grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6 min-h-0">
        <div className="lg:col-span-3 flex flex-col gap-4 md:gap-6">
          <div className="relative rounded-2xl md:rounded-[28px] overflow-hidden border border-[var(--border-subtle)] shadow-sm h-[50vh] md:h-[60vh] lg:h-auto lg:flex-grow bg-white dark:bg-[var(--bg-card-solid)]">
            {isLoading ? (
              <LoadingState fullHeight label="Chargement des équipes…" />
            ) : bundleError ? (
              <ErrorState
                title="Impossible de charger les équipes"
                error={bundleError}
                onRetry={fetchBundle}
                fullHeight
              />
            ) : teams.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <EmptyState
                  title="Aucune équipe pour cette semaine"
                  message="Essayez une autre semaine ou campagne."
                />
              </div>
            ) : (
              <FranceMap teams={teams} />
            )}

            <div className="map-overlay-card absolute top-3 left-3 md:top-6 md:left-6 px-3.5 py-2.5 md:px-5 md:py-3.5 rounded-xl md:rounded-2xl z-[400] flex items-center gap-3 md:gap-4">
              <div className="hidden md:flex h-10 w-10 rounded-xl items-center justify-center bg-orange-50 text-orange-600 ring-1 ring-orange-100 dark:bg-orange-500/15 dark:ring-orange-500/25">
                <MapPin size={18} strokeWidth={2.2} />
              </div>
              <div className="flex flex-col gap-0.5">
                <p className="eyebrow leading-none">Déploiement national</p>
                <h3 className="display text-[var(--text-primary)] text-base md:text-xl leading-tight">
                  Vue d’ensemble France
                </h3>
              </div>
              <div className="hidden md:flex flex-col items-end pl-3 ml-1 border-l border-[var(--border-subtle)]">
                <span className="num text-[var(--text-primary)] text-lg font-semibold leading-none">
                  {teams.length}
                </span>
                <span className="eyebrow flex items-center gap-1 mt-1 leading-none">
                  <Users size={10} strokeWidth={2.4} /> équipes
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 flex flex-col gap-4 md:gap-6">
          <div className="h-28 md:h-32 shrink-0">
            {weatherLoading ? (
              <div className="glass-card p-4 flex items-center justify-center h-full">
                <LoadingState />
              </div>
            ) : !weatherData ? (
              <div className="glass-card p-4 flex items-center justify-center h-full">
                <EmptyState
                  title="Météo indisponible"
                  message="Réessayez plus tard."
                />
              </div>
            ) : (
              <CompactWeatherWidget
                avgTemp={weatherData.current.temperature}
                condition={weatherData.current.condition}
                walkingScore={weatherData.current.walkingScore}
                hourlyTemperatures={weatherData.hourly.temperature}
                hourlyTimes={weatherData.hourly.time}
                dailyTempMax={weatherData.daily.tempMax}
              />
            )}
          </div>

          <div className="min-h-[300px] lg:flex-grow lg:min-h-0">
            <ActivityFeed />
          </div>
        </div>
      </div>
    </section>
  );
};

export default DashboardTab;
