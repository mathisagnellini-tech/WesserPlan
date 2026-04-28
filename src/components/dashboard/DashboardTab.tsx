
import React, { useEffect, useMemo, useState } from 'react';
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
import { departmentCapitals, departmentMap } from '@/constants/departments';
import type {
    CampaignMetricsDto,
    ClusterAnalyticsResponseDto,
    GetDashboardWeeklyPerformanceResponseDto,
    TeamListItemDto,
    WeeklyMetricDto,
} from '@/types/api';

// Backend `teamName` is a concatenated string in the form
// `S{week} - {ORG} - {Department} - {Leader}`, e.g.
// "S18 - WWF - Seine-Maritime - Maeva C". Split on " - " (space-dash-space)
// so department names that contain plain hyphens (Seine-Maritime,
// Côtes-d'Armor) survive intact.
interface ParsedTeamName {
    weekLabel?: string; // e.g. "S18"
    org?: string;       // lowercased org key (msf|unicef|wwf|mdm)
    department?: string;
    leader?: string;
}

function parseTeamName(raw: string): ParsedTeamName {
    if (!raw) return {};
    const parts = raw.split(' - ').map((p) => p.trim()).filter(Boolean);
    if (parts.length < 4) {
        // unexpected shape — return as best-effort leader
        return { leader: raw };
    }
    const [weekLabel, orgRaw, ...rest] = parts;
    const leader = rest.pop();
    const department = rest.join(' - '); // re-join in case dept had " - "
    return {
        weekLabel,
        org: orgRaw.toLowerCase(),
        department,
        leader,
    };
}

// Build a name → dept-code lookup once, normalized for case + accent.
const departmentNameToCode: Record<string, string> = (() => {
    const map: Record<string, string> = {};
    for (const [code, name] of Object.entries(departmentMap)) {
        map[normalizeName(name)] = code;
    }
    return map;
})();

function normalizeName(name: string): string {
    return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '') // strip combining diacritical marks
        .trim();
}

function deptCodeForName(name: string | undefined): string | undefined {
    if (!name) return undefined;
    return departmentNameToCode[normalizeName(name)];
}

const ORG_PRESETS: Record<string, { color: string; icon: string }> = {
    wwf: { color: '#16a34a', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7h6V5a3 3 0 0 0-3-3Z"/><path d="M19 8a3 3 0 0 0-3 3v4h6v-4a3 3 0 0 0-3-3Z"/><path d="M5 8a3 3 0 0 0-3 3v4h6v-4a3 3 0 0 0-3-3Z"/><path d="M12 14a5 5 0 0 0-5 5v2a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-2a5 5 0 0 0-5-5Z"/></svg>' },
    msf: { color: '#dc2626', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>' },
    mdm: { color: '#1e3a8a', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>' },
    unicef: { color: '#38bdf8', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15.5 20.5a3.5 3.5 0 1 0-7 0 3.5 3.5 0 0 0 7 0Z"/><path d="M12 17v-3"/><path d="M8 10a4 4 0 0 1 8 0"/></svg>' },
};

const FALLBACK_PRESET = { color: '#FF5B2B', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.09a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V12a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>' };

// TODO: align with the backend DTO. `TeamListItemDto` exposes only basic team
// metadata — no coordinates, organization color, lead, housing or vehicle.
// Until the API provides those (or until a join endpoint exists) we degrade
// gracefully by deriving placeholders from the data we DO have. Treat each row
// as a loosely-typed superset so any extra fields the backend later adds (e.g.
// `latitude`, `longitude`, `departmentCode`) are surfaced without a code change.
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
    color?: string;
    icon?: string;
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
    // Spread teams across known department capitals in a deterministic order
    // so the map renders something useful even when the API omits coordinates.
    const codes = Object.keys(departmentCapitals);
    if (codes.length === 0) return [46.603354, 1.888334];
    const seed =
        orgKey
            .split('')
            .reduce((acc, ch) => acc + ch.charCodeAt(0), 0) + index;
    const code = codes[seed % codes.length];
    const cap = departmentCapitals[code];
    return [cap.lat, cap.lng];
}

function deptCodeForCoords(lat: number, lng: number): string | undefined {
    let bestCode: string | undefined;
    let bestDist = Infinity;
    for (const [code, cap] of Object.entries(departmentCapitals)) {
        const dx = cap.lat - lat;
        const dy = cap.lng - lng;
        const d = dx * dx + dy * dy;
        if (d < bestDist) {
            bestDist = d;
            bestCode = code;
        }
    }
    return bestCode;
}

function mapTeamsResponseToTeamData(rows: unknown): TeamData[] {
    if (!Array.isArray(rows)) return [];
    const result: TeamData[] = [];
    rows.forEach((raw, idx) => {
        if (!raw || typeof raw !== 'object') return;
        const row = raw as BackendTeamRow;

        const rawName = pickFirstString(row.teamName) ?? '';
        const parsed = parseTeamName(rawName);

        // org: prefer parsed (from name string), fall back to row.organization,
        // then to lowercase normalisation
        const orgKey = (parsed.org ?? row.organization ?? '').toString().toLowerCase();
        const preset = ORG_PRESETS[orgKey] ?? FALLBACK_PRESET;

        // coords: prefer explicit lat/lng from API, then department-from-name
        // lookup, then deterministic per-org spread
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
                ? String(row.teamId)
                : `team-${idx}`;

        // Display name: prefer the parsed leader + department for a useful
        // marker label. Fall back to whatever we have.
        const leader =
            pickFirstString(row.leaderName, row.leader, parsed.leader) ?? '—';
        const department = parsed.department ?? '';
        const name = department
            ? `${department} · ${leader}`
            : pickFirstString(rawName) ?? `Equipe ${idx + 1}`;

        const housing =
            pickFirstString(row.housing, row.housingAddress) ?? '—';
        const car = pickFirstString(row.car, row.licensePlate) ?? '—';
        const color = pickFirstString(row.color) ?? preset.color;
        const icon = pickFirstString(row.icon) ?? preset.icon;

        result.push({
            id,
            name,
            coords,
            color,
            icon,
            leader,
            housing,
            car,
            // Per-team weather is not provided by the backend yet. Keep the
            // field on the type for compatibility, but render no météo block
            // in the popup — see FranceMap.buildPopupContent.
            weather: { t: 0, c: '', icon: '' },
        });
    });
    return result;
}

function computeIsoWeek(d: Date): number {
    const utc = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    utc.setUTCDate(utc.getUTCDate() + 4 - (utc.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
    return Math.ceil(((utc.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

const DashboardTab: React.FC = () => {
    const [lang, setLang] = useState<'en' | 'fr'>('fr');
    const t = (key: keyof typeof translations.en) => translations[lang][key];

    const now = useMemo(() => new Date(), []);
    const [year, setYear] = useState(now.getFullYear());
    const [week, setWeek] = useState(() => computeIsoWeek(now));
    const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);

    // Campaigns — used for header filter. Failures keep the list empty (the
    // filter simply hides) but we still log so the issue isn't invisible.
    // Campaigns are an enhancement; the page is functional without them.
    const [campaigns, setCampaigns] = useState<CampaignMetricsDto[]>([]);
    useEffect(() => {
        let cancelled = false;
        dashboardService
            .getCampaigns(year)
            .then((res) => {
                if (cancelled) return;
                setCampaigns(res?.data ?? []);
            })
            .catch((err) => {
                if (cancelled) return;
                console.warn('[Dashboard] getCampaigns failed:', err);
                setCampaigns([]);
            });
        return () => {
            cancelled = true;
        };
    }, [year]);

    // Weekly performance for the KPI bar — re-fetches when filters change.
    // Inlined instead of useApiData because that hook captures the fetcher
    // closure on first render and never refires when deps change.
    const [weeklyPerf, setWeeklyPerf] =
        useState<GetDashboardWeeklyPerformanceResponseDto | null>(null);
    const [kpisError, setKpisError] = useState<Error | null>(null);

    const fetchWeeklyPerf = React.useCallback(() => {
        let cancelled = false;
        setKpisError(null);
        dashboardService
            .getWeeklyPerformance(12, selectedCampaignId ?? undefined, year)
            .then((res) => {
                if (cancelled) return;
                setWeeklyPerf(res);
            })
            .catch((err) => {
                if (cancelled) return;
                setWeeklyPerf(null);
                setKpisError(err instanceof Error ? err : new Error(String(err)));
            });
        return () => {
            cancelled = true;
        };
    }, [selectedCampaignId, year]);

    useEffect(() => {
        const cleanup = fetchWeeklyPerf();
        return cleanup;
    }, [fetchWeeklyPerf]);

    // Teams for the selected (week, year, campaign) tuple.
    const [teams, setTeams] = useState<TeamData[]>([]);
    const [teamsLoading, setTeamsLoading] = useState(true);
    const [teamsError, setTeamsError] = useState<Error | null>(null);
    const hasLoadedTeamsOnce = React.useRef(false);

    const fetchTeams = React.useCallback(() => {
        let cancelled = false;
        // Stale-while-revalidate: only show the spinner on the initial load.
        // On subsequent filter changes we keep the previous markers visible to
        // avoid an empty-map flicker.
        if (!hasLoadedTeamsOnce.current) setTeamsLoading(true);
        setTeamsError(null);

        dashboardService
            .getTeamsForWeek(week, year, selectedCampaignId ?? undefined)
            .then((data) => {
                if (cancelled) return;
                try {
                    setTeams(mapTeamsResponseToTeamData(data));
                } catch {
                    setTeams([]);
                }
            })
            .catch((err) => {
                if (cancelled) return;
                setTeamsError(err instanceof Error ? err : new Error(String(err)));
            })
            .finally(() => {
                if (!cancelled) {
                    setTeamsLoading(false);
                    hasLoadedTeamsOnce.current = true;
                }
            });

        return () => {
            cancelled = true;
        };
    }, [week, year, selectedCampaignId]);

    useEffect(() => {
        const cleanup = fetchTeams();
        return cleanup;
    }, [fetchTeams]);

    // Weather: derive dept from the first available team's coords; default to Paris.
    const weatherDeptCode = useMemo(() => {
        if (teams.length > 0) {
            const [lat, lng] = teams[0].coords;
            return deptCodeForCoords(lat, lng) ?? '75';
        }
        return '75';
    }, [teams]);
    const { data: weatherData, isLoading: weatherLoading } =
        useDepartmentWeather(weatherDeptCode);

    // Cluster analytics — used to derive Active Fundraisers from tenure
    // buckets (1W + 2-4W + 5W+) the way WesserDashboard does it. Falls back to
    // weeklyPerf.activeFundraisers when the cluster endpoint is unavailable.
    const [clusterAnalytics, setClusterAnalytics] =
        useState<ClusterAnalyticsResponseDto | null>(null);
    useEffect(() => {
        let cancelled = false;
        dashboardService
            .getClusterAnalytics(12, selectedCampaignId ?? undefined, year)
            .then((res) => {
                if (cancelled) return;
                setClusterAnalytics(res);
            })
            .catch((err) => {
                if (cancelled) return;
                console.warn('[Dashboard] getClusterAnalytics failed:', err);
                setClusterAnalytics(null);
            });
        return () => {
            cancelled = true;
        };
    }, [selectedCampaignId, year]);

    // KPIs from API. The backend's weekly-performance endpoint returns one
    // row per (week, campaign) — when the user filters to "all campaigns" we
    // get N rows per week and must aggregate them like WesserDashboard does:
    //  • donorsRecruited / activeTeams: SUM across campaigns
    //  • productivity: weighted average by activeFundraisers
    //  • activeFundraisers: prefer cluster-analytics tenure split
    //    (w1 + w2To4 + w5Plus); fall back to summing weeklyPerf rows.
    // If the selected week is the current in-progress week (often all-zero),
    // fall back to the last completed week with non-zero metrics.
    const kpis = useMemo(() => {
        const series = weeklyPerf?.data;
        if (!series?.length) return null;

        // Group rows by weekNumber+year so multi-campaign weeks aggregate.
        const groups = new Map<string, WeeklyMetricDto[]>();
        for (const row of series) {
            const key = `${row.year}-${row.weekNumber}`;
            const arr = groups.get(key) ?? [];
            arr.push(row);
            groups.set(key, arr);
        }

        const aggregate = (rows: WeeklyMetricDto[]) => {
            const donorsRecruited = rows.reduce((s, r) => s + (r.donorsRecruited ?? 0), 0);
            const activeTeams = rows.reduce((s, r) => s + (r.activeTeams ?? 0), 0);
            const sumFundraisers = rows.reduce((s, r) => s + (r.activeFundraisers ?? 0), 0);
            const weightedProd = rows.reduce(
                (s, r) => s + (r.productivity ?? 0) * (r.activeFundraisers ?? 0),
                0,
            );
            const productivity = sumFundraisers > 0 ? weightedProd / sumFundraisers : 0;
            return {
                weekNumber: rows[0].weekNumber,
                year: rows[0].year,
                donorsRecruited,
                activeTeams,
                activeFundraisers: sumFundraisers,
                productivity,
            };
        };

        // Tenure-based active fundraisers (matches WesserDashboard).
        const fundraisersFromClusters = (
            weekNumber: number,
            yr: number,
        ): number | null => {
            const bucket = clusterAnalytics?.data?.find(
                (d) => d.weekNumber === weekNumber && (d.year === undefined || d.year === yr),
            );
            const split = bucket?.fundraiserSplit;
            if (!split) return null;
            return (split.w1 ?? 0) + (split.w2To4 ?? 0) + (split.w5Plus ?? 0);
        };

        const isUseful = (a: ReturnType<typeof aggregate>) =>
            a.donorsRecruited > 0 ||
            a.activeFundraisers > 0 ||
            a.activeTeams > 0 ||
            a.productivity > 0;

        const selectedRows = groups.get(`${year}-${week}`);
        const selected = selectedRows ? aggregate(selectedRows) : null;

        let chosen = selected && isUseful(selected) ? selected : null;
        if (!chosen) {
            // walk weeks descending until we find one with data
            const sortedKeys = [...groups.keys()].sort((a, b) => {
                const [ya, wa] = a.split('-').map(Number);
                const [yb, wb] = b.split('-').map(Number);
                return yb - ya || wb - wa;
            });
            for (const k of sortedKeys) {
                const cand = aggregate(groups.get(k)!);
                if (isUseful(cand)) {
                    chosen = cand;
                    break;
                }
            }
        }
        if (!chosen) return null;

        const tenureFR = fundraisersFromClusters(chosen.weekNumber, chosen.year);

        return {
            week: chosen.weekNumber,
            year: chosen.year,
            donorsRecruited: chosen.donorsRecruited,
            activeFundraisers: tenureFR ?? chosen.activeFundraisers,
            activeTeams: chosen.activeTeams,
            productivity: chosen.productivity,
            isFallback: !selected || chosen.weekNumber !== selected.weekNumber || chosen.year !== selected.year,
        };
    }, [weeklyPerf, clusterAnalytics, week, year]);

    return (
        <section className="animate-fade-in h-auto lg:h-[calc(100vh-100px)] flex flex-col">
            <DashboardHeader
                lang={lang}
                onLangChange={() => setLang((l) => (l === 'en' ? 'fr' : 'en'))}
                t={t}
                week={week}
                year={year}
                setWeek={setWeek}
                setYear={setYear}
                selectedCampaignId={selectedCampaignId}
                setSelectedCampaignId={setSelectedCampaignId}
                campaigns={campaigns}
            />

            {/* KPI Bar — from API only. On failure show an inline error so the
                user knows the metrics didn't load instead of just disappearing. */}
            {kpisError ? (
                <div className="mb-4 glass-card px-4 py-3">
                    <ErrorState
                        title="Impossible de charger les KPI"
                        error={kpisError}
                        onRetry={fetchWeeklyPerf}
                    />
                </div>
            ) : kpis ? (
                <div className="mb-4">
                    {kpis.isFallback && (
                        <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
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
                                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                                    {label}
                                </p>
                                <p className="text-xl font-black text-[var(--text-primary)]">{value}</p>
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}

            <div className="flex-grow grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6 min-h-0">
                {/* Main Map Area */}
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

                        {/* Floating Overlay Title */}
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

                {/* Right Sidebar - Weather & Feed */}
                <div className="lg:col-span-1 flex flex-col gap-4 md:gap-6">
                    {/* Compact Weather Top */}
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

                    {/* Activity Feed Bottom */}
                    <div className="min-h-[300px] lg:flex-grow lg:min-h-0">
                        <ActivityFeed />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default DashboardTab;
