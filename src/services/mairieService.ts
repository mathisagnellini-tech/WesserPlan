import { supabasePlan as supabase } from '@/lib/supabase';
import type { Mairie, Zone, Commentaire } from '@/components/mairie/types';
import type { Organization } from '@/types/commune';
import { standardHoraires } from '@/components/mairie/helpers';

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

function rowToZone(row: TownHallZoneRow): Zone {
  const startWeek = row.deployment_weeks?.[0]
    ? parseInt(row.deployment_weeks[0].split('-W')[1] || '1', 10)
    : 1;

  return {
    id: row.id,
    name: row.zone_name,
    leader: 'Non assigné', // team_leader_id is a UUID, would need join
    organization: (row.organization as Organization | 'all') || 'all',
    defaultDuration: row.deployment_weeks.length || 1,
    startWeek,
  };
}

// ── Service ──

export const mairieService = {
  async getZones(): Promise<Zone[]> {
    const { data, error } = await supabase
      .from('zones')
      .select('*')
      .order('zone_name');

    if (error) throw new Error(`Zones fetch failed: ${error.message}`);
    return (data as TownHallZoneRow[]).map(rowToZone);
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
      .update(updates)
      .eq('id', id);
    if (error) throw new Error(`Mairie update failed: ${error.message}`);
  },

  async createZone(zone: { zone_name: string; organization: string; deployment_weeks: string[]; color: string; town_hall_ids: number[] }): Promise<Zone> {
    const { data, error } = await supabase
      .from('zones')
      .insert(zone)
      .select()
      .single();
    if (error) throw new Error(`Zone create failed: ${error.message}`);
    return rowToZone(data as TownHallZoneRow);
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
      .update(updates)
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

  async addComment(townHallId: number, content: string): Promise<void> {
    const { error } = await supabase
      .from('comments')
      .insert({
        town_hall_entry_id: townHallId,
        scope: 'back_office',
        content,
      });
    if (error) throw new Error(`Comment create failed: ${error.message}`);
  },

  async deleteComment(commentId: number): Promise<void> {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);
    if (error) throw new Error(`Comment delete failed: ${error.message}`);
  },
};
