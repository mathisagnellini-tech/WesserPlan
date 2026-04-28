import { z } from 'zod';

/**
 * Schema for commune (town hall) uploads.
 *
 * Accepts both English and French column names — the preprocessor below
 * normalizes raw row keys to the canonical English keys used by the
 * `plan.town_halls` table.
 *
 * Allowed values for `organization` and `status` are coerced from common
 * French aliases.
 */

const ORG_VALUES = ['msf', 'unicef', 'wwf', 'mdm'] as const;
const STATUS_VALUES = [
  'pending',
  'in_progress',
  'accepted',
  'refused',
  'action_required',
] as const;

// Header alias map: lowercased / trimmed -> canonical column name
const HEADER_ALIASES: Record<string, string> = {
  // name
  name: 'name',
  nom: 'name',
  commune: 'name',
  'nom de la commune': 'name',
  // region
  region: 'region',
  région: 'region',
  // department
  department: 'department',
  departement: 'department',
  département: 'department',
  dept: 'department',
  // population
  population: 'population',
  habitants: 'population',
  // mayor
  mayor: 'mayor',
  maire: 'mayor',
  // email
  email: 'email',
  courriel: 'email',
  mail: 'email',
  // phone
  phone: 'phone',
  telephone: 'phone',
  téléphone: 'phone',
  tel: 'phone',
  // organization
  organization: 'organization',
  organisation: 'organization',
  org: 'organization',
  ngo: 'organization',
  // status
  status: 'status',
  statut: 'status',
  état: 'status',
  etat: 'status',
  // insee_code
  insee_code: 'insee_code',
  insee: 'insee_code',
  'code insee': 'insee_code',
  // postal_code
  postal_code: 'postal_code',
  'code postal': 'postal_code',
  cp: 'postal_code',
  zip: 'postal_code',
  // latitude
  latitude: 'latitude',
  lat: 'latitude',
  // longitude
  longitude: 'longitude',
  lng: 'longitude',
  lon: 'longitude',
  // median_income
  median_income: 'median_income',
  'revenu median': 'median_income',
  'revenu médian': 'median_income',
  revenu: 'median_income',
  // poverty_rate
  poverty_rate: 'poverty_rate',
  'taux de pauvrete': 'poverty_rate',
  'taux de pauvreté': 'poverty_rate',
  pauvrete: 'poverty_rate',
};

function normalizeKey(k: string): string {
  return k.trim().toLowerCase();
}

function normalizeStatus(v: unknown): unknown {
  if (typeof v !== 'string') return v;
  const s = v.trim().toLowerCase();
  if (!s) return undefined;
  const map: Record<string, (typeof STATUS_VALUES)[number]> = {
    pending: 'pending',
    'pas demandé': 'pending',
    'pas demande': 'pending',
    'pas_demande': 'pending',
    in_progress: 'in_progress',
    'en cours': 'in_progress',
    informe: 'in_progress',
    informé: 'in_progress',
    accepted: 'accepted',
    accepté: 'accepted',
    accepte: 'accepted',
    fait: 'accepted',
    refused: 'refused',
    refusé: 'refused',
    refuse: 'refused',
    action_required: 'action_required',
    telescope: 'action_required',
    télescope: 'action_required',
  };
  return map[s] ?? v;
}

function normalizeOrg(v: unknown): unknown {
  if (typeof v !== 'string') return v;
  const s = v.trim().toLowerCase();
  if (!s) return undefined;
  if ((ORG_VALUES as readonly string[]).includes(s)) return s;
  // Common typo / spaced variants
  const map: Record<string, (typeof ORG_VALUES)[number]> = {
    'médecins sans frontières': 'msf',
    'medecins sans frontieres': 'msf',
    'médecins du monde': 'mdm',
    'medecins du monde': 'mdm',
  };
  return map[s] ?? v;
}

const baseSchema = z.object({
  name: z.string().min(1, 'Nom requis'),
  region: z.string().min(1, 'Région requise'),
  department: z.string().nullable().optional(),
  population: z.coerce.number().nonnegative().default(0),
  mayor: z.string().nullable().optional(),
  email: z
    .string()
    .email('Email invalide')
    .nullable()
    .optional()
    .or(z.literal('')),
  phone: z.string().nullable().optional(),
  organization: z
    .preprocess(normalizeOrg, z.enum(ORG_VALUES).nullable().optional()),
  status: z
    .preprocess(normalizeStatus, z.enum(STATUS_VALUES).nullable().optional()),
  insee_code: z.string().nullable().optional(),
  postal_code: z.string().nullable().optional(),
  latitude: z.coerce.number().nullable().optional(),
  longitude: z.coerce.number().nullable().optional(),
  median_income: z.coerce.number().nullable().optional(),
  poverty_rate: z.coerce.number().nullable().optional(),
});

/**
 * Pre-processor that maps incoming row keys (e.g. "Nom", "Département") to
 * the canonical column names defined in the schema, then strips empty
 * strings to undefined for cleaner validation.
 */
export const communeUploadSchema = z.preprocess((entry) => {
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
    if (out[canonical] === undefined) {
      out[canonical] = val;
    }
  }
  return out;
}, baseSchema);

export type CommuneUpload = z.infer<typeof communeUploadSchema>;

/**
 * Maps a validated upload row to the `plan.town_halls` row shape expected
 * by Supabase. Defaults `status` to 'pending' if missing.
 */
export function mapCommuneToTownHall(c: CommuneUpload): Record<string, unknown> {
  return {
    name: c.name,
    region: c.region,
    department: c.department ?? null,
    population: c.population,
    mayor: c.mayor ?? null,
    email: c.email && c.email !== '' ? c.email : null,
    phone: c.phone ?? null,
    organization: c.organization ?? null,
    status: c.status ?? 'pending',
    insee_code: c.insee_code ?? null,
    postal_code: c.postal_code ?? null,
    latitude: c.latitude ?? null,
    longitude: c.longitude ?? null,
    median_income: c.median_income ?? null,
    poverty_rate: c.poverty_rate ?? null,
  };
}
