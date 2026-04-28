import { supabasePlan as supabase } from '@/lib/supabase';
import { withAudit } from '@/lib/audit';
import type { BoardData } from '@/components/team-planner/types';

/**
 * Team-planner board persistence.
 * One row per (org_id, year, week_index). Board state stored as JSONB.
 *
 * TODO: upsert with audit currently stamps both created_by_oid and
 * updated_by_oid on every save. To distinguish insert vs update we'd need a
 * 2-step lookup (select existing → choose mode). Acceptable for now since
 * the UI shows last-edit metadata via updated_by_oid + updated_at.
 */

interface BoardLoadResult {
  boardData: BoardData;
  updatedAt: string;
}

export const teamPlannerService = {
  async load({
    orgId,
    year,
    weekIndex,
  }: {
    orgId: string;
    year: number;
    weekIndex: number;
  }): Promise<BoardLoadResult | null> {
    const { data, error } = await supabase
      .from('team_planner_boards')
      .select('board_data, updated_at')
      .eq('org_id', orgId)
      .eq('year', year)
      .eq('week_index', weekIndex)
      .maybeSingle();

    if (error) throw new Error(`Board load failed: ${error.message}`);
    if (!data) return null;

    return {
      boardData: data.board_data as BoardData,
      updatedAt: data.updated_at as string,
    };
  },

  async save({
    orgId,
    year,
    weekIndex,
    boardData,
  }: {
    orgId: string;
    year: number;
    weekIndex: number;
    boardData: BoardData;
  }): Promise<void> {
    const payload = withAudit(
      {
        org_id: orgId,
        year,
        week_index: weekIndex,
        board_data: boardData as unknown as Record<string, unknown>,
      },
      'insert',
    );

    const { error } = await supabase
      .from('team_planner_boards')
      .upsert(payload, { onConflict: 'org_id,year,week_index' });

    if (error) throw new Error(`Board save failed: ${error.message}`);
  },
};
