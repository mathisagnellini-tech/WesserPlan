// Activities table does not exist in the WESSER DASHBOARD Supabase project yet.
// All methods return empty/no-op to avoid console errors. Mock data is used as fallback.

export interface ActivityItem {
  id: number;
  type: string;
  text: string;
  author: string;
  time: string;
  date: string;
}

export const activityService = {
  async getRecent(_limit = 20): Promise<ActivityItem[]> {
    return [];
  },

  async create(activity: Omit<ActivityItem, 'id'>): Promise<ActivityItem> {
    return { ...activity, id: Date.now() };
  },

  async delete(_id: number): Promise<void> {},
};
