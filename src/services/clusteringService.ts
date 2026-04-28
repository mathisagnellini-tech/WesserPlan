
import { Commune, Cluster, ClusteringResult } from '@/components/zone-maker/types';
import {
  CLUSTER_COLORS, DEPT_CODE,
  MIN_1W, MAX_1W,
  MIN_2W, MAX_2W,
  MIN_3W, MAX_3W
} from '@/components/zone-maker/constants';
import { supabasePlan as supabase } from '@/lib/supabase';
import { withAudit } from '@/lib/audit';

export const calculateDuration = (pop: number): number => {
    if (pop >= MIN_3W) return 3;
    if (pop >= MIN_2W) return 2;
    return 1;
};

export const getZoneStatus = (pop: number) => {
    if (pop >= MIN_1W && pop <= MAX_1W) return { label: 'Prêt (1 sem)', color: 'text-emerald-500', valid: true };
    if (pop >= MIN_2W && pop <= MAX_2W) return { label: 'Prêt (2 sem)', color: 'text-emerald-500', valid: true };
    if (pop >= MIN_3W && pop <= MAX_3W) return { label: 'Prêt (3 sem)', color: 'text-emerald-500', valid: true };
    if (pop < MIN_1W) return { label: 'Population insuffisante', color: 'text-amber-500', valid: false };
    return { label: 'Population hors paliers', color: 'text-red-500', valid: false };
};

// ─────────────────────────────────────────────────────────────
// Generate clusters
// Greedy BFS: seed from largest-pop communes, expand to adjacent
// communes via the `neighbors` graph until ~targetPop is reached.
// ─────────────────────────────────────────────────────────────
export interface GenerateClustersInput {
  communes: Commune[];
  targetPop: number;
  startWeek?: number;
  /**
   * Optional explicit adjacency override (commune.id → neighbor ids).
   * If omitted, we use commune.neighbors (already populated by the caller).
   */
  adjacency?: Map<string, Set<string>>;
}

export const generateClusters = (
  inputOrCommunes: Commune[] | GenerateClustersInput,
  maybeTargetPop?: number,
): ClusteringResult => {
  // Backward-compatible signature: generateClusters(communes, targetPop)
  const input: GenerateClustersInput = Array.isArray(inputOrCommunes)
    ? { communes: inputOrCommunes, targetPop: maybeTargetPop ?? 8000 }
    : inputOrCommunes;

  const { communes, targetPop, startWeek = 1 } = input;

  if (!communes || communes.length === 0) {
    return { clusters: [], unclustered: [] };
  }

  // Build adjacency lookup. Falls back to commune.neighbors if no override.
  const adjacency: Map<string, Set<string>> = input.adjacency
    ?? new Map(communes.map(c => [c.id, new Set(c.neighbors ?? [])]));

  const hasAnyAdj = [...adjacency.values()].some(s => s.size > 0);
  if (!hasAnyAdj) {
    console.warn('[clusteringService] adjacency map is empty — clusters may be single-commune.');
  }

  const byId = new Map(communes.map(c => [c.id, c]));
  const visited = new Set<string>();
  const clusters: Cluster[] = [];

  // Seed from largest population first.
  const seeds = [...communes].sort((a, b) => b.population - a.population);

  for (const seed of seeds) {
    if (visited.has(seed.id)) continue;
    if (seed.population <= 0) continue;

    const clusterCommunes: Commune[] = [seed];
    let pop = seed.population;
    visited.add(seed.id);

    // BFS expand.
    const queue: string[] = [seed.id];
    while (queue.length > 0 && pop < targetPop) {
      const current = queue.shift();
      if (!current) break;
      const neighbors = adjacency.get(current) ?? new Set<string>();
      const candidates = [...neighbors]
        .filter(n => !visited.has(n) && byId.has(n))
        .map(n => byId.get(n) as Commune)
        // Prefer neighbors that bring pop closest to target.
        .sort((a, b) => {
          const overshootA = Math.abs(pop + a.population - targetPop);
          const overshootB = Math.abs(pop + b.population - targetPop);
          return overshootA - overshootB;
        });

      for (const n of candidates) {
        if (pop >= targetPop) break;
        // Accept if it doesn't push us more than 20% over target.
        if (pop + n.population <= targetPop * 1.2) {
          clusterCommunes.push(n);
          visited.add(n.id);
          pop += n.population;
          queue.push(n.id);
        }
      }
    }

    // Viable cluster threshold: at least 50% of target pop OR a single dense seed.
    const viable = pop >= targetPop * 0.5;
    if (viable) {
      const idx = clusters.length;
      const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      const letterPart = idx < 26
        ? letters[idx]
        : letters[Math.floor(idx / 26) - 1] + letters[idx % 26];
      const sortLat = clusterCommunes.reduce(
        (sum, c) => sum + (c.centroid?.[1] ?? 0), 0
      ) / clusterCommunes.length;

      clusters.push({
        id: `cl-${Date.now()}-${idx}`,
        code: `${DEPT_CODE}${letterPart}`,
        communes: clusterCommunes,
        totalPopulation: pop,
        color: CLUSTER_COLORS[idx % CLUSTER_COLORS.length],
        durationWeeks: calculateDuration(pop),
        startWeek: startWeek + idx,
        assignedTeam: 0,
        sortLat,
        isPinned: false,
        isBonus: false,
      });
    } else {
      // Unwind — let these communes be "unclustered" so the user sees them.
      for (const c of clusterCommunes) visited.delete(c.id);
    }
  }

  const unclustered = communes.filter(c => !visited.has(c.id));
  return { clusters, unclustered };
};

/**
 * Recalculate the schedule for a set of clusters.
 *
 * Behavior:
 * - Draft clusters (`assignedTeam === 0`) are left at `startWeek = 0` and only
 *   get their color refreshed.
 * - Pinned clusters (`isPinned === true`) keep their `startWeek` and
 *   `assignedTeam` exactly as provided — they act as fixed obstacles in the
 *   timeline.
 * - Non-pinned, scheduled clusters (`assignedTeam > 0`) are placed greedily
 *   per team: sorted by their existing `startWeek` (to preserve user intent),
 *   then by `sortLat` as a tiebreaker, then assigned consecutive weeks
 *   starting at week 1 — skipping over week ranges already occupied by pinned
 *   clusters on the same team and skipping weeks where `weekOverrides`
 *   reduces the team capacity below the cluster's `assignedTeam`.
 * - Cluster colors are re-assigned by index so two clusters never share a
 *   color (existing behavior preserved).
 *
 * `weekOverrides` maps week-number → number of teams active that week.
 * If a week's override is < the cluster's `assignedTeam`, that week is
 * unavailable and the cluster is pushed forward.
 *
 * `defaultTeamCount` is the team capacity for any week not present in
 * `weekOverrides` and is used as the upper bound for valid `assignedTeam`
 * when no override applies.
 *
 * Returns a new array of new cluster objects — does NOT mutate input.
 */
export const recalculateSchedule = (
    clusters: Cluster[],
    weekOverrides: Record<number, number> = {},
    defaultTeamCount: number = 1
): Cluster[] => {
    // Defensive copy so we never mutate caller-owned objects.
    const result: Cluster[] = clusters.map((c, index) => ({
        ...c,
        // Ensure durationWeeks is sane; fall back to population-derived duration.
        durationWeeks: c.durationWeeks && c.durationWeeks > 0
            ? c.durationWeeks
            : calculateDuration(c.totalPopulation ?? 0),
        color: CLUSTER_COLORS[index % CLUSTER_COLORS.length],
    }));

    const capacityFor = (week: number): number => {
        const override = weekOverrides[week];
        return override !== undefined ? override : defaultTeamCount;
    };

    // Draft clusters stay drafts; we touch only their color (already done).
    const scheduled = result.filter(c => c.assignedTeam > 0);

    // Group by team for placement.
    const byTeam = new Map<number, Cluster[]>();
    for (const c of scheduled) {
        const list = byTeam.get(c.assignedTeam);
        if (list) list.push(c);
        else byTeam.set(c.assignedTeam, [c]);
    }

    for (const [team, teamClusters] of byTeam) {
        // Pinned clusters are fixed — record their occupied weeks and leave them.
        const pinned = teamClusters.filter(c => c.isPinned === true);
        const unpinned = teamClusters.filter(c => c.isPinned !== true);

        // Build occupancy from pinned clusters first.
        const occupied = new Set<number>();
        for (const p of pinned) {
            for (let w = p.startWeek; w < p.startWeek + p.durationWeeks; w++) {
                occupied.add(w);
            }
        }

        // Sort unpinned by their previous startWeek (preserves user-intended
        // ordering across reschedules) then by sortLat as a stable tiebreak.
        unpinned.sort((a, b) => {
            // Clusters that were already placed (startWeek > 0) come before
            // freshly-promoted-from-draft clusters (startWeek 0 is invalid for
            // a scheduled cluster but can exist transiently).
            const aw = a.startWeek > 0 ? a.startWeek : Number.MAX_SAFE_INTEGER;
            const bw = b.startWeek > 0 ? b.startWeek : Number.MAX_SAFE_INTEGER;
            if (aw !== bw) return aw - bw;
            return (a.sortLat ?? 0) - (b.sortLat ?? 0);
        });

        // Greedy placement: scan weeks from 1 forward, place each unpinned
        // cluster at the earliest contiguous run of `durationWeeks` slots
        // that is (a) not occupied by a pinned cluster and (b) within
        // capacity for every week of the run.
        let cursor = 1;
        for (const c of unpinned) {
            const dur = c.durationWeeks;
            let placed = false;
            // Cap the search to avoid runaway loops if capacities are pathological.
            const SEARCH_LIMIT = 520; // ~10 years of weeks
            for (let start = cursor; start <= SEARCH_LIMIT && !placed; start++) {
                let fits = true;
                for (let w = start; w < start + dur; w++) {
                    if (occupied.has(w)) { fits = false; break; }
                    if (team > capacityFor(w)) { fits = false; break; }
                }
                if (fits) {
                    c.startWeek = start;
                    for (let w = start; w < start + dur; w++) occupied.add(w);
                    cursor = start + dur;
                    placed = true;
                }
            }
            if (!placed) {
                // Couldn't place within search limit — leave at week 1 as a
                // last-resort so we at least return a valid cluster shape.
                c.startWeek = 1;
            }
        }
    }

    return result;
};

// ─────────────────────────────────────────────────────────────
// Persistence: plan.clusters
// ─────────────────────────────────────────────────────────────

interface ClusterRow {
  id: string;
  code: string;
  custom_suffix: string | null;
  commune_ids: string[];
  total_population: number;
  color: string | null;
  duration_weeks: number;
  start_week: number;
  assigned_team: number;
  sort_lat: number | null;
  is_pinned: boolean;
  is_bonus: boolean;
  ngo: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * DB rows store only commune_ids[] — the caller hydrates them into full
 * Commune objects from the geo data (which is loaded from the Gouv API).
 */
function rowToCluster(row: ClusterRow, communeLookup: Map<string, Commune>): Cluster {
  const communes: Commune[] = (row.commune_ids ?? [])
    .map(id => communeLookup.get(id))
    .filter((c): c is Commune => !!c);
  return {
    id: row.id,
    code: row.code,
    customSuffix: row.custom_suffix ?? undefined,
    communes,
    totalPopulation: row.total_population ?? 0,
    color: row.color ?? CLUSTER_COLORS[0],
    durationWeeks: row.duration_weeks ?? 1,
    startWeek: row.start_week ?? 0,
    assignedTeam: row.assigned_team ?? 0,
    sortLat: row.sort_lat ?? 0,
    isPinned: row.is_pinned ?? false,
    isBonus: row.is_bonus ?? false,
  };
}

function clusterToRow(c: Cluster, ngo: string): Omit<ClusterRow, 'created_at' | 'updated_at'> {
  return {
    id: c.id,
    code: c.code,
    custom_suffix: c.customSuffix ?? null,
    commune_ids: c.communes.map(com => com.id),
    total_population: c.totalPopulation,
    color: c.color ?? null,
    duration_weeks: c.durationWeeks,
    start_week: c.startWeek,
    assigned_team: c.assignedTeam,
    sort_lat: c.sortLat ?? null,
    is_pinned: c.isPinned ?? false,
    is_bonus: c.isBonus ?? false,
    ngo,
  };
}

export const clusterPersistence = {
  /**
   * Load all clusters for an NGO and hydrate their `communes` from the
   * provided lookup (built by the caller from geo data).
   */
  async loadAll(ngo: string, communeLookup: Map<string, Commune>): Promise<Cluster[]> {
    const { data, error } = await supabase
      .from('clusters')
      .select('*')
      .eq('ngo', ngo)
      .order('start_week', { ascending: true });

    if (error) throw new Error(`Clusters load failed: ${error.message}`);
    return (data as ClusterRow[]).map(r => rowToCluster(r, communeLookup));
  },

  async upsertMany(clusters: Cluster[], ngo: string): Promise<void> {
    if (clusters.length === 0) return;
    const rows = clusters.map(c => withAudit(
      clusterToRow(c, ngo) as unknown as Record<string, unknown>,
      'insert',
    ));
    const { error } = await supabase
      .from('clusters')
      .upsert(rows, { onConflict: 'id' });
    if (error) throw new Error(`Clusters save failed: ${error.message}`);
  },

  async deleteOne(id: string): Promise<void> {
    const { error } = await supabase
      .from('clusters')
      .delete()
      .eq('id', id);
    if (error) throw new Error(`Cluster delete failed: ${error.message}`);
  },

  /**
   * Replace all clusters for an NGO with a new set (used after "Generate").
   * Deletes the old set, inserts the new one.
   */
  async replaceAll(ngo: string, clusters: Cluster[]): Promise<void> {
    const { error: delErr } = await supabase
      .from('clusters')
      .delete()
      .eq('ngo', ngo);
    if (delErr) throw new Error(`Clusters reset failed: ${delErr.message}`);
    if (clusters.length > 0) {
      await clusterPersistence.upsertMany(clusters, ngo);
    }
  },
};
