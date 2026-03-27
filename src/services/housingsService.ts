import { supabasePlan as supabase } from '@/lib/supabase';
import type { Housing } from '@/components/operations/types';

// Supabase row type matches schema.sql
interface HousingRow {
  id: number;
  week: string | null;
  zone: string | null;
  name: string;
  lead: string | null;
  region: string | null;
  dept: string | null;
  org: string | null;
  people: number;
  nights: number;
  date_start: string | null;
  date_end: string | null;
  cost_reservation: number;
  cost_additional: number;
  has_insurance: boolean;
  cost_total: number;
  receipt_ok: boolean;
  channel: string | null;
  address: string | null;
  dept_score: number | null;
  team_note: string | null;
  status: string;
  refund_amount: number;
  cost_final: number;
  lat: number | null;
  lng: number | null;
  created_at: string;
  updated_at: string;
}

function rowToHousing(row: HousingRow): Housing {
  return {
    id: String(row.id),
    name: row.name,
    date: row.date_start ?? '',
    lead: row.lead ?? '',
    region: row.region ?? '',
    dept: row.dept ?? '',
    org: row.org ?? '',
    people: row.people,
    nights: row.nights,
    cost: row.cost_total,
    channel: row.channel ?? '',
    address: row.address ?? '',
    owner: '',
    ownerName: row.lead ?? '',
    rating: row.dept_score ?? 3,
    comment: row.team_note ?? '',
    lat: row.lat ?? 0,
    lng: row.lng ?? 0,
    amenities: [],
  };
}

export const housingsService = {
  async getAll(): Promise<Housing[]> {
    const { data, error } = await supabase
      .from('housings')
      .select('*')
      .order('date_start', { ascending: false });

    if (error) throw new Error(`Housings fetch failed: ${error.message}`);
    return (data as HousingRow[]).map(rowToHousing);
  },

  async getByWeek(week: string): Promise<Housing[]> {
    const { data, error } = await supabase
      .from('housings')
      .select('*')
      .eq('week', week)
      .order('name');

    if (error) throw new Error(`Housings fetch failed: ${error.message}`);
    return (data as HousingRow[]).map(rowToHousing);
  },

  async getById(id: number): Promise<Housing | null> {
    const { data, error } = await supabase
      .from('housings')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return rowToHousing(data as HousingRow);
  },

  async create(housing: Partial<HousingRow>): Promise<Housing> {
    const { data, error } = await supabase
      .from('housings')
      .insert(housing)
      .select()
      .single();

    if (error) throw new Error(`Housing create failed: ${error.message}`);
    return rowToHousing(data as HousingRow);
  },

  async update(id: number, updates: Partial<HousingRow>): Promise<Housing | null> {
    const { data, error } = await supabase
      .from('housings')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Housing update failed: ${error.message}`);
    return rowToHousing(data as HousingRow);
  },

  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('housings')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Housing delete failed: ${error.message}`);
  },
};
