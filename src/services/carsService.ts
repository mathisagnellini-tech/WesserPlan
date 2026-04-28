import { createClient } from '@supabase/supabase-js';
import { getCurrentUserOid } from '@/stores/authStore';
import type { CarType } from '@/components/operations/types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Fleet lives in plan.vehicles (migration_003_plan_schema.sql). The legacy
// `cars` schema this service used to point at no longer exists on the
// project — PostgREST returned "Invalid schema: cars" for every read.
const supabasePlan = createClient(supabaseUrl, supabaseAnonKey, {
  db: { schema: 'plan' },
});

interface VehicleRow {
  id: number;
  plate: string;
  brand: string;
  location: string | null;
  km: number | null;
  next_service: string | null;
  owner: string | null;
  lat: number;
  lng: number;
  fuel_declared: number | null;
  tank_size: number | null;
  damages: DamageEntry[] | null;
  created_at: string;
  updated_at: string;
}

interface DamageEntry {
  date: string;
  description: string;
  author: string;
}

function rowToCar(row: VehicleRow): CarType {
  return {
    id: String(row.id),
    plate: row.plate,
    brand: row.brand ?? '',
    where: row.location ?? '',
    km: row.km ?? 0,
    service: row.next_service ?? '',
    owner: row.owner ?? '',
    fuelStats: {
      declared: row.fuel_declared ?? 0,
      tankSize: row.tank_size ?? 50,
    },
    damages: Array.isArray(row.damages) ? row.damages : [],
  };
}

export const carsService = {
  async getAll(): Promise<CarType[]> {
    const { data, error } = await supabasePlan
      .from('vehicles')
      .select('*')
      .order('plate');

    if (error) throw new Error(`Vehicles fetch failed: ${error.message}`);
    return (data as VehicleRow[]).map(rowToCar);
  },

  async getById(id: number): Promise<CarType | null> {
    const { data, error } = await supabasePlan
      .from('vehicles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return rowToCar(data as VehicleRow);
  },

  async reportDamage(
    vehicleId: number,
    damage: { part: string; type: string; detail: string },
  ): Promise<void> {
    // Damages are a JSONB array on plan.vehicles. Read-modify-write is
    // racy under concurrent reports — acceptable for now (single-user
    // operations flow); switch to an RPC with jsonb_insert if that changes.
    const { data: existing, error: readErr } = await supabasePlan
      .from('vehicles')
      .select('damages')
      .eq('id', vehicleId)
      .single();

    if (readErr) throw new Error(`Damage report failed: ${readErr.message}`);

    const oid = getCurrentUserOid();
    const prev: DamageEntry[] = Array.isArray((existing as { damages?: unknown })?.damages)
      ? ((existing as { damages: DamageEntry[] }).damages)
      : [];

    const next: DamageEntry[] = [
      {
        date: new Date().toISOString(),
        description: `${damage.part} — ${damage.type}: ${damage.detail}`,
        author: oid ?? 'app',
      },
      ...prev,
    ];

    const { error: writeErr } = await supabasePlan
      .from('vehicles')
      .update({
        damages: next,
        ...(oid ? { updated_by_oid: oid } : {}),
      })
      .eq('id', vehicleId);

    if (writeErr) throw new Error(`Damage report failed: ${writeErr.message}`);
  },
};
