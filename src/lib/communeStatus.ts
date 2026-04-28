import type { CommuneStatus } from '@/types';

// Bidirectional mapping between the UI status names (used by the Commune
// type and statusMap) and the DB status names (stored in plan.town_halls.status).
// Single source of truth — consumers must import from here, not redefine inline.

export type DbStatus = 'pending' | 'in_progress' | 'refused' | 'action_required' | 'accepted';

const UI_TO_DB: Record<CommuneStatus, DbStatus> = {
  pas_demande: 'pending',
  informe: 'in_progress',
  refuse: 'refused',
  telescope: 'action_required',
  fait: 'accepted',
};

const DB_TO_UI: Record<DbStatus, CommuneStatus> = {
  pending: 'pas_demande',
  in_progress: 'informe',
  refused: 'refuse',
  action_required: 'telescope',
  accepted: 'fait',
};

export function uiStatusToDb(s: CommuneStatus): DbStatus {
  return UI_TO_DB[s];
}

export function dbStatusToUi(s: string | null | undefined): CommuneStatus {
  if (!s) return 'pas_demande';
  return DB_TO_UI[s as DbStatus] ?? 'pas_demande';
}
