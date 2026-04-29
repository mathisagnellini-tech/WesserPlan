import { getCurrentUserOid } from '@/stores/authStore';

/**
 * Audit columns to stamp on Supabase writes.
 * Reads the Azure AD objectIdentifier from the auth store.
 * Honor-system attribution — Supabase doesn't validate (anon key, no RLS yet).
 *
 * Migration that adds the columns: supabase/migration_004_audit_columns.sql
 */

export type AuditMode = 'insert' | 'update';

export interface AuditFields {
  created_by_oid?: string;
  updated_by_oid?: string;
}

/**
 * Returns the audit fields for a write payload.
 * - `insert` mode: stamps both created_by_oid and updated_by_oid
 * - `update` mode: stamps only updated_by_oid
 *
 * Returns an empty object if no user is signed in (e.g. during boot or dev
 * without auth) — the columns will be NULL, which is acceptable.
 */
export function auditFields(mode: AuditMode): AuditFields {
  const oid = getCurrentUserOid();
  if (!oid) return {};
  if (mode === 'insert') {
    return { created_by_oid: oid, updated_by_oid: oid };
  }
  return { updated_by_oid: oid };
}

/** Convenience: merge audit fields into a write payload. */
export function withAudit<T extends Record<string, unknown>>(
  payload: T,
  mode: AuditMode,
): T & AuditFields {
  return { ...payload, ...auditFields(mode) };
}
