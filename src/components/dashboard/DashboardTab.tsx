
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
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
import { selectKpis } from '@/lib/dashboardKpis';
import type {
  CampaignMetricsDto,
  ClusterAnalyticsResponseDto,
  GetDashboardWeeklyPerformanceResponseDto,
  TeamListItemDto,
} from '@/types/api';

// Backend rows (loose typing for forward-compat). Note: `color` and `logo`
// are intentionally NOT consumed from the backend — they're rendered into
// HTML/attribute contexts and must come from the canonical ORGANIZATIONS
// constant (see XSS audit + canonical org assets work).
interface BackendTeamRow extends TeamListItemDto {
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
  // Backend `GetTeamsForWeek` accepts a campaignId query param but the
  // typed DTO doesn't expose the row-level campaign. Read whichever shape
  // the backend actually returns so we can client-side filter as a safety
  // net when the backend ignores the param.
  campaignId?: string | number;
  campaign_id?: string | number;
  CampaignId?: string | number;
}

function rowCampaignId(row: BackendTeamRow): string | undefined {
  const raw = row.campaignId ?? row.campaign_id ?? row.CampaignId;
  if (raw === undefined || raw === null) return undefined;
  return String(raw);
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

function mapTeamsResponseToTeamData(
  rows: unknown,
  selectedCampaignId: string | null,
): TeamData[] {
  if (!Array.isArray(rows)) return [];
  const result: TeamData[] = [];
  rows.forEach((raw, idx) => {
    if (!raw || typeof raw !== 'object') return;
    const row = raw as BackendTeamRow;

    // Defence in depth: backend should already filter by campaignId, but
    // if a row exposes its own campaign and it doesn't match, drop it.
    // Rows without any campaign field are passed through (we trust the
    // backend filter in that case).
    if (selectedCampaignId) {
      const rowCampaign = rowCampaignId(row);
      if (rowCampaign !== undefined && rowCampaign !== selectedCampaignId) return;
    }

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

  // Latest successful refresh timestamps per dataset. Used by the header to
  // surface a "Mis à jour il y a Xmin" hint.
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  // Campaigns — used for header filter. Failures keep the list empty.
  const [campaigns, setCampaigns] = useState<CampaignMetricsDto[]>([]);
  useEffect(() => {
    const ctrl = new AbortController();
    dashboardService
      .getCampaigns(year)
      .then((res) => {
        if (ctrl.signal.aborted) return;
        setCampaigns(res?.data ?? []);
      })
      .catch((err) => {
        if (ctrl.signal.aborted) return;
        reporter.warn('getCampaigns failed', err, { source: 'DashboardTab' });
        setCampaigns([]);
      });
    return () => ctrl.abort();
  }, [year]);

  // Weekly performance for the KPI bar.
  const [weeklyPerf, setWeeklyPerf] =
    useState<GetDashboardWeeklyPerformanceResponseDto | null>(null);
  const [kpisError, setKpisError] = useState<Error | null>(null);
  const weeklyPerfCtrl = useRef<AbortController | null>(null);

  const fetchWeeklyPerf = useCallback(() => {
    weeklyPerfCtrl.current?.abort();
    const ctrl = new AbortController();
    weeklyPerfCtrl.current = ctrl;
    setKpisError(null);
    return dashboardService
      .getWeeklyPerformance(12, selectedCampaignId ?? undefined, year)
      .then((res) => {
        if (ctrl.signal.aborted) return;
        setWeeklyPerf(res);
        setLastUpdated(Date.now());
      })
      .catch((err) => {
        if (ctrl.signal.aborted) return;
        setWeeklyPerf(null);
        setKpisError(err instanceof Error ? err : new Error(String(err)));
        reporter.error('getWeeklyPerformance failed', err, { source: 'DashboardTab' });
      });
  }, [selectedCampaignId, year]);

  useEffect(() => {
    fetchWeeklyPerf();
    return () => weeklyPerfCtrl.current?.abort();
  }, [fetchWeeklyPerf]);

  // Teams for the selected (week, year, campaign) tuple.
  const [teams, setTeams] = useState<TeamData[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [teamsError, setTeamsError] = useState<Error | null>(null);
  const hasLoadedTeamsOnce = useRef(false);
  const teamsCtrl = useRef<AbortController | null>(null);

  const fetchTeams = useCallback(() => {
    teamsCtrl.current?.abort();
    const ctrl = new AbortController();
    teamsCtrl.current = ctrl;
    if (!hasLoadedTeamsOnce.current) setTeamsLoading(true);
    setTeamsError(null);

    return dashboardService
      .getTeamsForWeek(week, year, selectedCampaignId ?? undefined)
      .then((data) => {
        if (ctrl.signal.aborted) return;
        try {
          setTeams(mapTeamsResponseToTeamData(data, selectedCampaignId));
          setLastUpdated(Date.now());
        } catch (err) {
          reporter.warn('mapTeamsResponseToTeamData failed', err, { source: 'DashboardTab' });
          setTeams([]);
        }
      })
      .catch((err) => {
        if (ctrl.signal.aborted) return;
        setTeamsError(err instanceof Error ? err : new Error(String(err)));
        reporter.error('getTeamsForWeek failed', err, { source: 'DashboardTab' });
      })
      .finally(() => {
        if (ctrl.signal.aborted) return;
        setTeamsLoading(false);
        hasLoadedTeamsOnce.current = true;
      });
  }, [week, year, selectedCampaignId]);

  useEffect(() => {
    fetchTeams();
    return () => teamsCtrl.current?.abort();
  }, [fetchTeams]);

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

  // Cluster analytics — used to derive Active Fundraisers from tenure buckets.
  const [clusterAnalytics, setClusterAnalytics] =
    useState<ClusterAnalyticsResponseDto | null>(null);
  useEffect(() => {
    const ctrl = new AbortController();
    dashboardService
      .getClusterAnalytics(12, selectedCampaignId ?? undefined, year)
      .then((res) => {
        if (ctrl.signal.aborted) return;
        setClusterAnalytics(res);
      })
      .catch((err) => {
        if (ctrl.signal.aborted) return;
        reporter.warn('getClusterAnalytics failed', err, { source: 'DashboardTab' });
        setClusterAnalytics(null);
      });
    return () => ctrl.abort();
  }, [selectedCampaignId, year]);

  const kpis = useMemo(
    () => selectKpis(weeklyPerf?.data, clusterAnalytics, week, year),
    [weeklyPerf, clusterAnalytics, week, year],
  );

  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshAll = useCallback(() => {
    setIsRefreshing(true);
    Promise.allSettled([fetchWeeklyPerf(), fetchTeams()]).finally(() => {
      setIsRefreshing(false);
    });
  }, [fetchWeeklyPerf, fetchTeams]);

  return (
    <section className="animate-fade-in h-auto lg:h-[calc(100vh-100px)] flex flex-col">
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

      {kpisError ? (
        <div className="mb-4 glass-card px-4 py-3">
          <ErrorState
            title="Impossible de charger les KPI"
            error={kpisError}
            onRetry={fetchWeeklyPerf}
          />
        </div>
      ) : !weeklyPerf ? (
        <div className="mb-4 glass-card px-4 py-3">
          <LoadingState label="Chargement des indicateurs…" />
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
            <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
              Affichage de la dernière semaine complète disponible (S{kpis.week}/{kpis.year})
            </p>
          )}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Donateurs recrutés', value: kpis.donorsRecruited },
              { label: 'Fundraisers actifs', value: kpis.activeFundraisers },
              { label: 'Équipes actives', value: kpis.activeTeams },
              { label: 'Productivité', value: `${kpis.productivity.toFixed(1)}` },
            ].map(({ label, value }) => (
              <div key={label} className="glass-card px-4 py-3">
                <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                  {label}
                </p>
                <p className="text-xl font-black text-[var(--text-primary)]">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex-grow grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6 min-h-0">
        <div className="lg:col-span-3 flex flex-col gap-4 md:gap-6">
          <div className="relative rounded-2xl md:rounded-3xl overflow-hidden border border-[var(--border-subtle)] shadow-sm h-[50vh] md:h-[60vh] lg:h-auto lg:flex-grow bg-white dark:bg-[var(--bg-card-solid)]">
            {teamsLoading ? (
              <LoadingState fullHeight label="Chargement des équipes…" />
            ) : teamsError ? (
              <ErrorState
                title="Impossible de charger les équipes"
                error={teamsError}
                onRetry={fetchTeams}
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

            <div className="absolute top-3 left-3 md:top-6 md:left-6 bg-white/90 dark:bg-[var(--bg-card-solid)]/90 backdrop-blur-md px-3 py-2 md:px-5 md:py-3 rounded-xl md:rounded-2xl shadow-lg border border-[var(--border-subtle)] z-[400]">
              <h2 className="text-[10px] md:text-sm font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-0.5">
                Vue d'ensemble
              </h2>
              <div className="flex items-center gap-1.5 md:gap-2">
                <MapPin size={14} className="text-orange-600 md:hidden" />
                <MapPin size={18} className="text-orange-600 hidden md:block" />
                <h3 className="font-black text-[var(--text-primary)] text-sm md:text-lg">
                  Deploiement National
                </h3>
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
            ) : (
              <CompactWeatherWidget
                avgTemp={weatherData?.current.temperature ?? 14}
                condition={weatherData?.current.condition ?? '...'}
                walkingScore={weatherData?.current.walkingScore ?? 'Bonne'}
                hourlyTemperatures={weatherData?.hourly.temperature}
                hourlyTimes={weatherData?.hourly.time}
                dailyTempMax={weatherData?.daily.tempMax}
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
