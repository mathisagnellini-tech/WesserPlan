import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Default client (public schema) — for tables not yet migrated
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Plan schema client — for all WesserPlan planning data
export const supabasePlan = createClient(supabaseUrl, supabaseAnonKey, {
  db: { schema: 'plan' },
});
