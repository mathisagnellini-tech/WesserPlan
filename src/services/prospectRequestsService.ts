import { supabasePlan as supabase } from '@/lib/supabase';
import { withAudit } from '@/lib/audit';
import type { Organization } from '@/types/commune';
import type { ProspectHistoryItem } from '@/components/communes/types';

interface ProspectRequestRow {
  id: number;
  town_hall_id: number;
  organization: string;
  status: 'pending' | 'accepted' | 'refused' | 'expired';
  requested_at: string;
  resolved_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface TownHallGeoRow {
  id: number;
  name: string;
  latitude: number | null;
  longitude: number | null;
  population: number | null;
}

export interface CreateProspectRequestInput {
  townHallIds: number[];
  organization: Organization;
  notes?: string;
}

export const prospectRequestsService = {
  async list(): Promise<ProspectHistoryItem[]> {
    const { data: rows, error } = await supabase
      .from('prospect_requests')
      .select('*')
      .order('requested_at', { ascending: false });
    if (error) throw new Error(`Prospect requests fetch failed: ${error.message}`);

    const reqs = (rows as ProspectRequestRow[]) ?? [];
    if (reqs.length === 0) return [];

    const allTownHallIds = Array.from(new Set(reqs.map((r) => r.town_hall_id)));
    const { data: townHalls, error: thError } = await supabase
      .from('town_halls')
      .select('id, name, latitude, longitude, population')
      .in('id', allTownHallIds);
    if (thError) throw new Error(`Town hall lookup failed: ${thError.message}`);

    const thById = new Map<number, TownHallGeoRow>();
    for (const th of (townHalls as TownHallGeoRow[]) ?? []) thById.set(th.id, th);

    // Group requests by (requested_at-second, organization, notes) so a single
    // multi-commune validation collapses back into one history card.
    const groupKey = (r: ProspectRequestRow) =>
      `${r.requested_at}::${r.organization}::${r.notes ?? ''}`;
    const groups = new Map<string, ProspectRequestRow[]>();
    for (const r of reqs) {
      const k = groupKey(r);
      const arr = groups.get(k) ?? [];
      arr.push(r);
      groups.set(k, arr);
    }

    const items: ProspectHistoryItem[] = [];
    for (const [key, group] of groups) {
      const first = group[0];
      const communesList = group
        .map((g) => thById.get(g.town_hall_id))
        .filter((th): th is TownHallGeoRow => !!th)
        .map((th) => ({ nom: th.name, lat: th.latitude ?? 0, lng: th.longitude ?? 0 }));
      const totalPop = group.reduce(
        (acc, g) => acc + (thById.get(g.town_hall_id)?.population ?? 0),
        0,
      );
      items.push({
        id: `req-${key}`,
        date: new Date(first.requested_at),
        communeCount: group.length,
        totalPop,
        zoneCount: (totalPop / 8000).toFixed(1),
        communesList,
      });
    }

    return items;
  },

  async create({ townHallIds, organization, notes }: CreateProspectRequestInput): Promise<void> {
    if (townHallIds.length === 0) return;
    const requestedAt = new Date().toISOString();
    const rows = townHallIds.map((id) =>
      withAudit(
        {
          town_hall_id: id,
          organization,
          status: 'pending',
          requested_at: requestedAt,
          notes: notes ?? null,
        },
        'insert',
      ),
    );
    const { error } = await supabase.from('prospect_requests').insert(rows);
    if (error) throw new Error(`Prospect request create failed: ${error.message}`);
  },
};
