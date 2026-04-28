import { supabasePlan as supabase } from '@/lib/supabase';
import { withAudit } from '@/lib/audit';
import { formatActivityDate } from '@/lib/activityDate';

export interface ActivityItem {
  id: number;
  type: string;
  text: string;
  author: string;
  /** ISO 8601 timestamp of when the event occurred. */
  occurredAt: string;
}

interface ActivityRow {
  id: number;
  type: string;
  text: string;
  author: string;
  time: string | null;
  date: string | null;
  occurred_at: string | null;
  created_at: string;
}

function rowToItem(r: ActivityRow): ActivityItem {
  const occurredAt = r.occurred_at ?? r.created_at;
  return {
    id: r.id,
    type: r.type,
    text: r.text,
    author: r.author,
    occurredAt,
  };
}

export const activityService = {
  async getRecent(limit = 20): Promise<ActivityItem[]> {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .order('occurred_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error(`Activities fetch failed: ${error.message}`);
    return (data as ActivityRow[]).map(rowToItem);
  },

  async create(activity: { type: string; text: string; author: string; occurredAt: string }): Promise<ActivityItem> {
    const display = formatActivityDate(activity.occurredAt);
    const { data, error } = await supabase
      .from('activities')
      .insert(
        withAudit(
          {
            type: activity.type,
            text: activity.text,
            author: activity.author,
            occurred_at: activity.occurredAt,
            // Legacy NOT NULL columns kept in sync from occurred_at.
            time: display.time,
            date: display.date,
          },
          'insert',
        ),
      )
      .select()
      .single();

    if (error) throw new Error(`Activity create failed: ${error.message}`);
    return rowToItem(data as ActivityRow);
  },

  async delete(id: number): Promise<void> {
    const { error } = await supabase.from('activities').delete().eq('id', id);
    if (error) throw new Error(`Activity delete failed: ${error.message}`);
  },
};
