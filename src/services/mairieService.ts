import { supabasePlan as supabase } from '@/lib/supabase';
import { withAudit } from '@/lib/audit';
import type { Mairie, Zone, Commentaire } from '@/components/mairie/types';
import type { Organization } from '@/types/commune';
import type { TargetZone } from '@/components/operations/types';
import { standardHoraires, getCalculatedWeekString, parseWeekString } from '@/components/mairie/helpers';

interface ZoneGeoRow {
  id: string;
  zone_name: string;
  geo_lat: number | null;
  geo_lng: number | null;
  geo_radius_km: number | null;
}

// ── Row types (matching real Supabase tables) ──

interface TownHallRow {
  id: number;
  name: string;
  region: string;
  department: string | null;
  organization: string | null;
  status: string | null;
  mayor: string | null;
  email: string | null;
  phone: string | null;
  population: number;
  requested_date: string | null;
  mail_status: string | null;
  call_status: string | null;
  notes: string | null;
  deployment_week: string[] | null;
  action_pills: string[] | null;
  additional_contact_1_name: string | null;
  additional_contact_1_email: string | null;
  additional_contact_1_phone: string | null;
  additional_contact_2_name: string | null;
  additional_contact_2_email: string | null;
  additional_contact_2_phone: string | null;
  police_email: string | null;
  created_at: string;
  updated_at: string;
}

interface TownHallZoneRow {
  id: string;
  zone_name: string;
  color: string | null;
  deployment_weeks: string[];
  organization: string;
  team_leader_id: string | null;
  town_hall_ids: number[];
  created_at: string;
  updated_at: string;
}

interface TownHallCommentRow {
  id: number;
  town_hall_entry_id: number;
  scope: string;
  content: string;
  created_at: string;
  updated_at: string;
}

// ── Status mapping: DB status → frontend statutGeneral ──

function mapStatus(dbStatus: string | null): Mairie['statutGeneral'] {
  switch (dbStatus) {
    case 'accepted': return 'Validé';
    case 'refused': return 'Refusé';
    case 'in_progress': return 'En cours';
    case 'action_required': return 'Action requise';
    case 'pending':
    default: return 'À traiter';
  }
}

function mapMailStatusToProgress(mailStatus: string | null, callStatus: string | null): number {
  // Map mail/call status combo to 0-4 progression
  if (mailStatus === 'mail_final_sent') return 4;
  if (callStatus === 'called_ok' || callStatus === 'called') return 3;
  if (mailStatus === 'mail_1_sent' || mailStatus === 'mail_2_sent') return 2;
  if (mailStatus === 'mail_1_to_resend') return 1;
  return 0;
}

// ── Mappers ──

function rowToMairie(row: TownHallRow, comments: TownHallCommentRow[], zoneId?: string): Mairie {
  const mairieComments: Commentaire[] = comments
    .filter(c => c.town_hall_entry_id === row.id)
    .map(c => ({
      id: String(c.id),
      date: c.created_at,
      texte: c.content,
    }));

  return {
    id: row.id,
    nom: row.name,
    region: row.region,
    departement: row.department ?? '',
    organization: (row.organization as Organization) || 'msf',
    contact: {
      email: row.email ?? '',
      tel: row.phone ?? '',
      nomContact: row.additional_contact_1_name ?? undefined,
      fonctionContact: undefined,
      autresContacts: row.additional_contact_2_name ? [{
        id: 'ac2',
        nom: row.additional_contact_2_name,
        numero: row.additional_contact_2_phone ?? '',
        email: row.additional_contact_2_email ?? undefined,
        type: 'tel' as const,
      }] : undefined,
    },
    infos: {
      adresse: '',
      maire: row.mayor ?? '',
    },
    horaires: standardHoraires,
    population: row.population,
    semaineDemandee: row.deployment_week?.[0] ?? '',
    dateDemande: row.requested_date ?? '',
    etapeProgression: mapMailStatusToProgress(row.mail_status, row.call_status),
    statutGeneral: mapStatus(row.status),
    commentaires: mairieComments,
    zoneId,
  };
}

/**
 * Resolves a `plan.team_leaders` row to a display name. The legacy table
 * predates our migrations so the exact column shape is not pinned in SQL —
 * we accept the most common conventions (`name` / `full_name`, or split
 * `first_name` + `last_name`) and fall back to the row id when none match.
 */
function leaderRowToName(row: Record<string, unknown> | undefined): string | null {
  if (!row) return null;
  const direct = (row.name ?? row.full_name ?? row.display_name) as string | undefined;
  if (typeof direct === 'string' && direct.trim()) return direct.trim();
  const first = typeof row.first_name === 'string' ? row.first_name.trim() : '';
  const last = typeof row.last_name === 'string' ? row.last_name.trim() : '';
  const composed = `${first} ${last}`.trim();
  if (composed) return composed;
  return null;
}

function rowToZone(row: TownHallZoneRow, leadersById: Map<string, string>): Zone {
  const startWeek = row.deployment_weeks?.[0]
    ? parseInt(row.deployment_weeks[0].split('-W')[1] || '1', 10)
    : 1;

  const leader = (row.team_leader_id && leadersById.get(row.team_leader_id)) || 'Non assigné';

  return {
    id: row.id,
    name: row.zone_name,
    leader,
    organization: (row.organization as Organization | 'all') || 'all',
    defaultDuration: row.deployment_weeks.length || 1,
    startWeek,
    townHallIds: row.town_hall_ids ?? [],
  };
}

// ── Service ──

export const mairieService = {
  async getZones(): Promise<Zone[]> {
    // Fetch zones and team_leaders in parallel so we can resolve the FK
    // (`team_leader_id`) into a display name without a second round-trip.
    const [zonesRes, leadersRes] = await Promise.all([
      supabase.from('zones').select('*').order('zone_name'),
      supabase.from('team_leaders').select('*'),
    ]);

    if (zonesRes.error) throw new Error(`Zones fetch failed: ${zonesRes.error.message}`);
    // A leaders fetch failure should not hide the zones — surface it via the
    // observability layer, then continue with an empty map so `leader` falls
    // back to "Non assigné" cleanly.
    const leadersById = new Map<string, string>();
    if (!leadersRes.error && Array.isArray(leadersRes.data)) {
      for (const raw of leadersRes.data as Record<string, unknown>[]) {
        const id = raw.id;
        const name = leaderRowToName(raw);
        if (typeof id === 'string' && name) leadersById.set(id, name);
      }
    }

    return (zonesRes.data as TownHallZoneRow[]).map((row) => rowToZone(row, leadersById));
  },

  /**
   * Returns zones in the geographic shape required by the Operations
   * SmartMatcher / HousingMap (centroid lat/lng + radius). Zones with no
   * resolvable geography (no manual override and no member town halls with
   * lat/lng) are filtered out — they would render at (0, 0) otherwise.
   */
  async getZonesGeo(): Promise<TargetZone[]> {
    const { data, error } = await supabase
      .from('zones_with_geo')
      .select('id, zone_name, geo_lat, geo_lng, geo_radius_km')
      .order('zone_name');
    if (error) throw new Error(`Zones geo fetch failed: ${error.message}`);

    return ((data as ZoneGeoRow[]) ?? [])
      .filter((z) => z.geo_lat != null && z.geo_lng != null)
      .map((z) => ({
        id: z.id,
        name: z.zone_name,
        lat: z.geo_lat as number,
        lng: z.geo_lng as number,
        radius: z.geo_radius_km ?? 25,
      }));
  },

  async getMairies(options: {
    org?: Organization | 'all';
    page?: number;
    pageSize?: number;
    search?: string;
  } = {}): Promise<{ data: Mairie[]; total: number }> {
    const { org = 'all', page = 0, pageSize = 50, search } = options;
    const from = page * pageSize;
    const to = from + pageSize - 1;

    // Build query
    let query = supabase
      .from('town_halls')
      .select('*', { count: 'exact' });

    if (org !== 'all') {
      query = query.eq('organization', org);
    }

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    query = query.order('name').range(from, to);

    // Fetch entries, comments, zones in parallel
    const [entriesRes, commentsRes, zonesRes] = await Promise.all([
      query,
      supabase.from('comments').select('*'),
      supabase.from('zones').select('id, town_hall_ids'),
    ]);

    if (entriesRes.error) throw new Error(`Mairies fetch failed: ${entriesRes.error.message}`);

    const comments = (commentsRes.data as TownHallCommentRow[]) ?? [];
    const zones = (zonesRes.data as Pick<TownHallZoneRow, 'id' | 'town_hall_ids'>[]) ?? [];

    const entryToZone: Record<number, string> = {};
    for (const zone of zones) {
      for (const thId of zone.town_hall_ids) {
        entryToZone[thId] = zone.id;
      }
    }

    return {
      data: (entriesRes.data as TownHallRow[]).map(row =>
        rowToMairie(row, comments, entryToZone[row.id])
      ),
      total: entriesRes.count ?? 0,
    };
  },

  async updateMairie(id: number, updates: Partial<{
    status: string;
    mail_status: string;
    call_status: string;
    notes: string;
    email: string;
    phone: string;
  }>): Promise<void> {
    const { error } = await supabase
      .from('town_halls')
      .update(withAudit(updates, 'update'))
      .eq('id', id);
    if (error) throw new Error(`Mairie update failed: ${error.message}`);
  },

  async createZone(zone: { zone_name: string; organization: string; deployment_weeks: string[]; color: string; town_hall_ids: number[] }): Promise<Zone> {
    const { data, error } = await supabase
      .from('zones')
      .insert(withAudit(zone, 'insert'))
      .select()
      .single();
    if (error) throw new Error(`Zone create failed: ${error.message}`);
    // New zone has no team_leader_id yet; passing an empty map yields the
    // "Non assigné" fallback inside rowToZone.
    return rowToZone(data as TownHallZoneRow, new Map());
  },

  async updateZone(id: string, updates: Partial<{
    zone_name: string;
    organization: string;
    deployment_weeks: string[];
    town_hall_ids: number[];
    color: string;
  }>): Promise<void> {
    const { error } = await supabase
      .from('zones')
      .update(withAudit(updates, 'update'))
      .eq('id', id);
    if (error) throw new Error(`Zone update failed: ${error.message}`);
  },

  async deleteZone(id: string): Promise<void> {
    const { error } = await supabase
      .from('zones')
      .delete()
      .eq('id', id);
    if (error) throw new Error(`Zone delete failed: ${error.message}`);
  },

  /**
   * Append one ISO week to a town hall's `deployment_week` array. The new
   * week is contiguous with the array's last entry (so successive calls walk
   * forward in time). When the array is empty we seed it with the current
   * ISO week so the row gains its first deployment slot.
   */
  async extendMairie(mairieId: number): Promise<void> {
    const { data: current, error: fetchError } = await supabase
      .from('town_halls')
      .select('deployment_week')
      .eq('id', mairieId)
      .single();
    if (fetchError) throw new Error(`Mairie fetch failed: ${fetchError.message}`);

    const existing: string[] = Array.isArray(current?.deployment_week)
      ? (current!.deployment_week as string[])
      : [];

    let nextWeek: string;
    if (existing.length === 0) {
      const now = new Date();
      // Inline ISO-week computation — getISOWeek is exported from helpers but
      // we avoid importing it here to keep this method self-contained.
      const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
      const dayNum = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      const weekNum = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
      nextWeek = getCalculatedWeekString(weekNum, 0, d.getUTCFullYear());
    } else {
      const last = existing[existing.length - 1];
      const parsed = parseWeekString(last);
      nextWeek = parsed
        ? getCalculatedWeekString(parsed.week, 1, parsed.year)
        : getCalculatedWeekString(1, existing.length, new Date().getFullYear());
    }

    const updated = [...existing, nextWeek];
    const { error } = await supabase
      .from('town_halls')
      .update(withAudit({ deployment_week: updated }, 'update'))
      .eq('id', mairieId);
    if (error) throw new Error(`Mairie extend failed: ${error.message}`);
  },

  /**
   * Resize a town hall's `deployment_week` array to exactly `weeks` entries,
   * keeping the first slot (start week) stable and regenerating subsequent
   * weeks contiguously. When the row has no existing weeks we seed from the
   * current ISO week.
   */
  async setMairieDuration(mairieId: number, weeks: number): Promise<void> {
    if (!Number.isFinite(weeks) || weeks < 1) {
      throw new Error(`Mairie duration must be a positive integer (got ${weeks})`);
    }

    const { data: current, error: fetchError } = await supabase
      .from('town_halls')
      .select('deployment_week')
      .eq('id', mairieId)
      .single();
    if (fetchError) throw new Error(`Mairie fetch failed: ${fetchError.message}`);

    const existing: string[] = Array.isArray(current?.deployment_week)
      ? (current!.deployment_week as string[])
      : [];

    // Determine the anchor week + year from the existing first slot, falling
    // back to the current ISO week when the array is empty.
    let startWeek: number;
    let startYear: number;
    const parsedFirst = existing.length > 0 ? parseWeekString(existing[0]) : null;
    if (parsedFirst) {
      startWeek = parsedFirst.week;
      startYear = parsedFirst.year;
    } else {
      const now = new Date();
      const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
      const dayNum = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      startWeek = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
      startYear = d.getUTCFullYear();
    }

    const updated = Array.from({ length: weeks }, (_, i) =>
      getCalculatedWeekString(startWeek, i, startYear),
    );

    const { error } = await supabase
      .from('town_halls')
      .update(withAudit({ deployment_week: updated }, 'update'))
      .eq('id', mairieId);
    if (error) throw new Error(`Mairie duration update failed: ${error.message}`);
  },

  async addComment(townHallId: number, content: string): Promise<void> {
    const { error } = await supabase
      .from('comments')
      .insert(withAudit({
        town_hall_entry_id: townHallId,
        scope: 'back_office',
        content,
      }, 'insert'));
    if (error) throw new Error(`Comment create failed: ${error.message}`);
  },

  async updateComment(commentId: number, content: string): Promise<void> {
    const { error } = await supabase
      .from('comments')
      .update(withAudit({ content }, 'update'))
      .eq('id', commentId);
    if (error) throw new Error(`Comment update failed: ${error.message}`);
  },

  async deleteComment(commentId: number): Promise<void> {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);
    if (error) throw new Error(`Comment delete failed: ${error.message}`);
  },
};
