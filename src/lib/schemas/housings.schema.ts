import { z } from 'zod';

/**
 * Schema for housing uploads — maps to `plan.housings` (migration_003).
 * Accepts both English and French column names.
 */

// Header alias map: lowercased -> canonical column name
const HEADER_ALIASES: Record<string, string> = {
  // name
  name: 'name',
  nom: 'name',
  logement: 'name',
  // week
  week: 'week',
  semaine: 'week',
  // zone
  zone: 'zone',
  // lead
  lead: 'lead',
  responsable: 'lead',
  'chef équipe': 'lead',
  // region
  region: 'region',
  région: 'region',
  // dept
  dept: 'dept',
  department: 'dept',
  departement: 'dept',
  département: 'dept',
  // org
  org: 'org',
  organization: 'org',
  organisation: 'org',
  ngo: 'org',
  // people
  people: 'people',
  personnes: 'people',
  pax: 'people',
  // nights
  nights: 'nights',
  nuits: 'nights',
  // dates
  date_start: 'date_start',
  'date start': 'date_start',
  'date début': 'date_start',
  'date debut': 'date_start',
  arrivee: 'date_start',
  arrivée: 'date_start',
  date_end: 'date_end',
  'date end': 'date_end',
  'date fin': 'date_end',
  depart: 'date_end',
  départ: 'date_end',
  // costs
  cost_reservation: 'cost_reservation',
  'cout reservation': 'cost_reservation',
  'coût réservation': 'cost_reservation',
  cost_additional: 'cost_additional',
  'cout additionnel': 'cost_additional',
  'coût additionnel': 'cost_additional',
  cost_total: 'cost_total',
  'cout total': 'cost_total',
  'coût total': 'cost_total',
  // insurance
  has_insurance: 'has_insurance',
  insurance: 'has_insurance',
  assurance: 'has_insurance',
  // receipt
  receipt_ok: 'receipt_ok',
  receipt: 'receipt_ok',
  facture: 'receipt_ok',
  // channel
  channel: 'channel',
  canal: 'channel',
  source: 'channel',
  // address
  address: 'address',
  adresse: 'address',
  // dept_score
  dept_score: 'dept_score',
  score: 'dept_score',
  note_dept: 'dept_score',
  // team_note
  team_note: 'team_note',
  note: 'team_note',
  commentaire: 'team_note',
  remarque: 'team_note',
  // status
  status: 'status',
  statut: 'status',
  // coords
  lat: 'lat',
  latitude: 'lat',
  lng: 'lng',
  lon: 'lng',
  longitude: 'lng',
  // amenities
  amenities: 'amenities',
  equipements: 'amenities',
  équipements: 'amenities',
  services: 'amenities',
};

function normalizeKey(k: string): string {
  return k.trim().toLowerCase();
}

/** Coerce truthy/falsy strings to boolean. */
const boolish = z.preprocess((v) => {
  if (typeof v === 'boolean') return v;
  if (v === null || v === undefined) return undefined;
  if (typeof v === 'number') return v !== 0;
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    if (s === '') return undefined;
    if (['true', '1', 'yes', 'oui', 'y', 'o'].includes(s)) return true;
    if (['false', '0', 'no', 'non', 'n'].includes(s)) return false;
  }
  return v;
}, z.boolean().optional());

/** Coerce string lists (CSV "wifi,parking" or JSON array) into string[]. */
const stringList = z.preprocess((v) => {
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
  if (typeof v === 'string') {
    const s = v.trim();
    if (!s) return [];
    // try JSON array first
    if (s.startsWith('[')) {
      try {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed)) return parsed.map((x) => String(x).trim()).filter(Boolean);
      } catch {
        // fallthrough
      }
    }
    return s.split(/[,;]/).map((x) => x.trim()).filter(Boolean);
  }
  return undefined;
}, z.array(z.string()).optional());

/** ISO date or recognizable string -> "YYYY-MM-DD" or null. */
const dateish = z.preprocess((v) => {
  if (v === null || v === undefined) return undefined;
  if (typeof v === 'string') {
    const s = v.trim();
    if (!s) return undefined;
    // already ISO-ish
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    // dd/mm/yyyy
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
  if (typeof v === 'number') {
    // Excel serial date — treat large positive integers as days since 1899-12-30
    if (v > 10000 && v < 80000) {
      const ms = (v - 25569) * 86400 * 1000;
      const d = new Date(ms);
      if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    }
  }
  return v;
}, z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide (attendu YYYY-MM-DD)').nullable().optional());

const baseSchema = z.object({
  name: z.string().min(1, 'Nom requis'),
  week: z.string().nullable().optional(),
  zone: z.string().nullable().optional(),
  lead: z.string().nullable().optional(),
  region: z.string().nullable().optional(),
  dept: z.string().nullable().optional(),
  org: z.string().nullable().optional(),
  people: z.coerce.number().int().nonnegative().default(0),
  nights: z.coerce.number().int().nonnegative().default(0),
  date_start: dateish,
  date_end: dateish,
  cost_reservation: z.coerce.number().nonnegative().default(0),
  cost_additional: z.coerce.number().nonnegative().default(0),
  cost_total: z.coerce.number().nonnegative().default(0),
  has_insurance: boolish,
  receipt_ok: boolish,
  channel: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  dept_score: z.coerce.number().nullable().optional(),
  team_note: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  lat: z.coerce.number().nullable().optional(),
  lng: z.coerce.number().nullable().optional(),
  amenities: stringList,
});

export const housingUploadSchema = z.preprocess((entry) => {
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

export type HousingUpload = z.infer<typeof housingUploadSchema>;

/** Maps validated row to `plan.housings` insert payload. */
export function mapHousingToDb(h: HousingUpload): Record<string, unknown> {
  return {
    name: h.name,
    week: h.week ?? null,
    zone: h.zone ?? null,
    lead: h.lead ?? null,
    region: h.region ?? null,
    dept: h.dept ?? null,
    org: h.org ?? null,
    people: h.people,
    nights: h.nights,
    date_start: h.date_start ?? null,
    date_end: h.date_end ?? null,
    cost_reservation: h.cost_reservation,
    cost_additional: h.cost_additional,
    cost_total: h.cost_total,
    has_insurance: h.has_insurance ?? false,
    receipt_ok: h.receipt_ok ?? false,
    channel: h.channel ?? null,
    address: h.address ?? null,
    dept_score: h.dept_score ?? null,
    team_note: h.team_note ?? null,
    status: h.status ?? 'Honorée',
    lat: h.lat ?? null,
    lng: h.lng ?? null,
    amenities: h.amenities ?? [],
  };
}
