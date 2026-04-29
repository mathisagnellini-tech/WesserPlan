import { z } from 'zod';

/**
 * Schema for vehicle uploads — maps to `plan.vehicles` (migration_003).
 *
 * Note: the legacy `cars` schema has its own table (`cars.vehicles`) used by
 * carsService for damage reports. This upload targets the new
 * `plan.vehicles` table where audit columns and the canonical fleet record
 * live.
 */

const HEADER_ALIASES: Record<string, string> = {
  // plate (required, unique)
  plate: 'plate',
  plaque: 'plate',
  immatriculation: 'plate',
  license_plate: 'plate',
  'license plate': 'plate',
  // brand
  brand: 'brand',
  marque: 'brand',
  modele: 'brand',
  modèle: 'brand',
  model: 'brand',
  // location
  location: 'location',
  emplacement: 'location',
  ville: 'location',
  where: 'location',
  // km
  km: 'km',
  kilometrage: 'km',
  kilométrage: 'km',
  mileage: 'km',
  // next_service
  next_service: 'next_service',
  'prochaine revision': 'next_service',
  'prochaine révision': 'next_service',
  service: 'next_service',
  revision: 'next_service',
  révision: 'next_service',
  // owner
  owner: 'owner',
  proprietaire: 'owner',
  propriétaire: 'owner',
  // coords
  lat: 'lat',
  latitude: 'lat',
  lng: 'lng',
  longitude: 'lng',
  lon: 'lng',
  // fuel
  fuel_declared: 'fuel_declared',
  carburant: 'fuel_declared',
  fuel: 'fuel_declared',
  tank_size: 'tank_size',
  reservoir: 'tank_size',
  réservoir: 'tank_size',
};

function normalizeKey(k: string): string {
  return k.trim().toLowerCase();
}

const dateish = z.preprocess((v) => {
  if (v === null || v === undefined) return undefined;
  if (typeof v === 'string') {
    const s = v.trim();
    if (!s) return undefined;
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
    if (m) {
      const [, dd, mm, yyyy] = m;
      const year = yyyy.length === 2 ? `20${yyyy}` : yyyy;
      return `${year}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
    }
    const d = new Date(s);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    return s;
  }
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === 'number' && v > 10000 && v < 80000) {
    const ms = (v - 25569) * 86400 * 1000;
    const d = new Date(ms);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }
  return v;
}, z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide (attendu YYYY-MM-DD)').nullable().optional());

const baseSchema = z.object({
  plate: z
    .string()
    .min(1, 'Plaque requise')
    .transform((s) => s.toUpperCase().replace(/\s+/g, '')),
  brand: z.string().min(1, 'Marque requise'),
  location: z.string().nullable().optional(),
  km: z.coerce.number().int().nonnegative().default(0),
  next_service: dateish,
  owner: z.string().nullable().optional(),
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  fuel_declared: z.coerce.number().int().nonnegative().default(0),
  tank_size: z.coerce.number().int().positive().default(50),
});

export const vehicleUploadSchema = z.preprocess((entry) => {
  if (!entry || typeof entry !== 'object') return entry;
  const out: Record<string, unknown> = {};
  for (const [rawKey, rawVal] of Object.entries(entry as Record<string, unknown>)) {
    const norm = normalizeKey(rawKey);
    const canonical = HEADER_ALIASES[norm] ?? norm;
    let val: unknown = rawVal;
    if (typeof val === 'string') {
      const t = val.trim();
      val = t === '' ? undefined : t;
    }
    if (out[canonical] === undefined) out[canonical] = val;
  }
  return out;
}, baseSchema);

export type VehicleUpload = z.infer<typeof vehicleUploadSchema>;

/** Maps validated row to `plan.vehicles` insert payload. */
export function mapVehicleToDb(v: VehicleUpload): Record<string, unknown> {
  return {
    plate: v.plate,
    brand: v.brand,
    location: v.location ?? null,
    km: v.km,
    next_service: v.next_service ?? null,
    owner: v.owner ?? null,
    lat: v.lat,
    lng: v.lng,
    fuel_declared: v.fuel_declared,
    tank_size: v.tank_size,
  };
}
