import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn('[supabase] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY missing — Supabase features disabled.');
}

const createStubClient = (): SupabaseClient => {
  const result = { data: [], error: { message: 'Supabase not configured' } };
  const handler: ProxyHandler<any> = {
    get(_target, prop) {
      if (prop === 'then') return (resolve: any) => resolve(result);
      return () => new Proxy(function () {}, handler);
    },
    apply() {
      return new Proxy(function () {}, handler);
    },
  };
  return new Proxy(function () {}, handler) as unknown as SupabaseClient;
};

export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createStubClient();
