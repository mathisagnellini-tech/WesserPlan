import { createClient } from '@supabase/supabase-js';
import type { CarType } from '@/components/operations/types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Cars schema client
const supabaseCars = createClient(supabaseUrl, supabaseAnonKey, {
  db: { schema: 'cars' },
});

// ── Row types (cars schema) ──

interface VehicleRow {
  vehicle_id: number;
  license_plate: string;
  model: string | null;
  created_at: string;
}

interface DamageRow {
  damage_id: number;
  vehicle_id: number;
  source_type: string;
  damage_json: { part: string; type: string; detail: string };
  recorded_at: string;
  created_by: string | null;
}

function rowToCar(row: VehicleRow, damages: DamageRow[]): CarType {
  const vehicleDamages = damages
    .filter(d => d.vehicle_id === row.vehicle_id)
    .map(d => ({
      date: d.recorded_at,
      description: `${d.damage_json.part} — ${d.damage_json.type}: ${d.damage_json.detail}`,
      author: d.created_by ?? d.source_type,
    }));

  return {
    id: String(row.vehicle_id),
    plate: row.license_plate,
    brand: row.model ?? '',
    where: '',
    km: 0,
    service: '',
    owner: '',
    lat: 48.58,  // default Strasbourg
    lng: 7.75,
    fuelStats: { declared: 0, tankSize: 50 },
    damages: vehicleDamages,
  };
}

export const carsService = {
  async getAll(): Promise<CarType[]> {
    const [vehiclesRes, damagesRes] = await Promise.all([
      supabaseCars.from('vehicles').select('*').order('license_plate'),
      supabaseCars.from('vehicle_damages').select('*'),
    ]);

    if (vehiclesRes.error) throw new Error(`Vehicles fetch failed: ${vehiclesRes.error.message}`);

    const damages = (damagesRes.data as DamageRow[]) ?? [];
    return (vehiclesRes.data as VehicleRow[]).map(row => rowToCar(row, damages));
  },

  async getById(id: number): Promise<CarType | null> {
    const [vehicleRes, damagesRes] = await Promise.all([
      supabaseCars.from('vehicles').select('*').eq('vehicle_id', id).single(),
      supabaseCars.from('vehicle_damages').select('*').eq('vehicle_id', id),
    ]);

    if (vehicleRes.error) return null;
    const damages = (damagesRes.data as DamageRow[]) ?? [];
    return rowToCar(vehicleRes.data as VehicleRow, damages);
  },

  async reportDamage(vehicleId: number, damage: { part: string; type: string; detail: string }): Promise<void> {
    const { error } = await supabaseCars
      .from('vehicle_damages')
      .insert({
        vehicle_id: vehicleId,
        source_type: 'app',
        damage_json: damage,
      });

    if (error) throw new Error(`Damage report failed: ${error.message}`);
  },
};
