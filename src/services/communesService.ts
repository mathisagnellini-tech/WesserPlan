import { supabasePlan as supabase } from '@/lib/supabase';
import type { Commune } from '@/types';
import type { Organization, CommuneStatus } from '@/types/commune';

// Communes = Town Halls — single source of truth from plan.town_halls

interface TownHallRow {
  id: number;
  name: string;
  region: string;
  department: string | null;
  population: number;
  mayor: string | null;
  email: string | null;
  phone: string | null;
  organization: string | null;
  status: string | null;
  deployment_week: string[] | null;
  requested_date: string | null;
  insee_code: string | null;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  postal_code: string | null;
  horaires: string | null;
  median_income: number | null;
  poverty_rate: number | null;
}

function mapStatusToCommune(dbStatus: string | null): CommuneStatus {
  switch (dbStatus) {
    case 'accepted': return 'fait';
    case 'refused': return 'refuse';
    case 'in_progress': return 'informe';
    case 'action_required': return 'telescope';
    case 'pending':
    default: return 'pas_demande';
  }
}

const SELECT_COLS = 'id,name,region,department,population,mayor,email,phone,organization,status,deployment_week,requested_date,insee_code,latitude,longitude,address,postal_code,horaires,median_income,poverty_rate';

function formatRevenue(income: number | null): string {
  if (!income) return '';
  return `${income.toLocaleString('fr-FR')} €`;
}

function rowToCommune(row: TownHallRow): Commune {
  return {
    id: row.id,
    nom: row.name,
    departement: row.department ?? '',
    population: row.population,
    passage: row.deployment_week?.[0] ?? 'Jamais',
    statut: mapStatusToCommune(row.status),
    maire: row.mayor ?? '',
    revenue: formatRevenue(row.median_income),
    lat: row.latitude ?? 0,
    lng: row.longitude ?? 0,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    medianIncome: row.median_income ?? undefined,
    povertyRate: row.poverty_rate ?? undefined,
    postalCode: row.postal_code ?? undefined,
    address: row.address ?? undefined,
    horaires: row.horaires ?? undefined,
    inseeCode: row.insee_code ?? undefined,
  };
}

export const communesService = {
  async getByOrganization(org: Organization): Promise<Commune[]> {
    const { data, error } = await supabase
      .from('town_halls')
      .select(SELECT_COLS)
      .eq('organization', org)
      .order('name')
      .limit(1000);

    if (error) throw new Error(`Communes fetch failed: ${error.message}`);
    return (data as TownHallRow[]).map(rowToCommune);
  },

  async getAll(limit = 1000, filters?: { region?: string; departments?: string[]; search?: string }): Promise<{ data: Commune[]; total: number }> {
    let query = supabase
      .from('town_halls')
      .select(SELECT_COLS, { count: 'exact' });

    if (filters?.region) {
      query = query.eq('region', filters.region);
    }
    if (filters?.departments && filters.departments.length > 0) {
      query = query.in('department', filters.departments);
    }
    if (filters?.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }

    const { data, error, count } = await query.order('name').limit(limit);

    if (error) throw new Error(`Communes fetch failed: ${error.message}`);
    return {
      data: (data as TownHallRow[]).map(rowToCommune),
      total: count ?? 0,
    };
  },

  async getRegionsAndDepartments(): Promise<{
    regions: { value: string; label: string }[];
    departments: { value: string; label: string; region: string }[];
  }> {
    // Single RPC call — server-side GROUP BY, returns ~100 rows
    const { data, error } = await supabase.rpc('get_geo_filter_options');

    if (error) throw new Error(`Geo options fetch failed: ${error.message}`);

    const regionCounts: Record<string, number> = {};
    const depts: { value: string; label: string; region: string }[] = [];

    for (const row of data as { region: string; department: string | null; cnt: number }[]) {
      regionCounts[row.region] = (regionCounts[row.region] || 0) + row.cnt;

      if (row.department) {
        depts.push({
          value: row.department,
          label: `${row.department} (${row.cnt})`,
          region: row.region,
        });
      }
    }

    const regions = Object.entries(regionCounts)
      .filter(([, count]) => count > 20)
      .sort((a, b) => b[1] - a[1])
      .map(([region, count]) => ({
        value: region,
        label: `${region} (${count.toLocaleString()})`,
      }));

    return {
      regions,
      departments: depts.sort((a, b) => a.value.localeCompare(b.value)),
    };
  },

  async getDeptCodeMap(): Promise<Record<string, string>> {
    const { data, error } = await supabase.rpc('get_dept_codes');
    if (error) throw new Error(`Dept codes fetch failed: ${error.message}`);
    const map: Record<string, string> = {};
    for (const row of data as { department: string; dept_code: string }[]) {
      map[row.department] = row.dept_code;
    }
    return map;
  },

  async getCommunesByDeptCode(deptCode: string): Promise<Commune[]> {
    const { data, error } = await supabase
      .from('town_halls')
      .select(SELECT_COLS)
      .like('postal_code', `${deptCode}%`)
      .order('name')
      .limit(2000);

    if (error) throw new Error(`Communes by dept code failed: ${error.message}`);
    return (data as TownHallRow[]).map(rowToCommune);
  },

  async getById(id: number): Promise<Commune | null> {
    const { data, error } = await supabase
      .from('town_halls')
      .select(SELECT_COLS)
      .eq('id', id)
      .single();

    if (error) return null;
    return rowToCommune(data as TownHallRow);
  },

  async update(id: number, updates: Partial<{
    status: string;
    email: string;
    phone: string;
    mayor: string;
  }>): Promise<Commune | null> {
    const { data, error } = await supabase
      .from('town_halls')
      .update(updates)
      .eq('id', id)
      .select(SELECT_COLS)
      .single();

    if (error) throw new Error(`Commune update failed: ${error.message}`);
    return rowToCommune(data as TownHallRow);
  },
};
