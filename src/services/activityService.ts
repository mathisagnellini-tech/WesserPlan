import { supabasePlan as supabase } from '@/lib/supabase';
import { withAudit } from '@/lib/audit';

export interface ActivityItem {
  id: number;
  type: string;
  text: string;
  author: string;
  time: string;
  date: string;
}

interface ActivityRow {
  id: number;
  type: string;
  text: string;
  author: string;
  time: string;
  date: string;
  created_at: string;
}

export const activityService = {
  async getRecent(limit = 20): Promise<ActivityItem[]> {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error(`Activities fetch failed: ${error.message}`);
    return (data as ActivityRow[]).map(r => ({
      id: r.id,
      type: r.type,
      text: r.text,
      author: r.author,
      time: r.time,
      date: r.date,
    }));
  },

  async create(activity: Omit<ActivityItem, 'id'>): Promise<ActivityItem> {
    const { data, error } = await supabase
      .from('activities')
      .insert(withAudit({
        type: activity.type,
        text: activity.text,
        author: activity.author,
        time: activity.time,
        date: activity.date,
      }, 'insert'))
      .select()
      .single();

    if (error) throw new Error(`Activity create failed: ${error.message}`);
    return { ...(data as ActivityRow) };
  },

  async delete(id: number): Promise<void> {
    const { error } = await supabase.from('activities').delete().eq('id', id);
    if (error) throw new Error(`Activity delete failed: ${error.message}`);
  },
};
