import { Cluster } from '@/components/zone-maker/types';
import { reporter } from '@/lib/observability';

// Calls the Supabase Edge Function `analyze-cluster`, which proxies to Gemini
// with the API key held server-side. Frontend never sees GEMINI_API_KEY.
//
// Deploy the function: see supabase/functions/analyze-cluster/README.md

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const analyzeCluster = async (cluster: Cluster): Promise<string> => {
  if (!SUPABASE_URL) {
    return 'Configuration manquante : VITE_SUPABASE_URL.';
  }

  const payload = {
    communes: cluster.communes.map((c) => ({
      name: c.name,
      population: c.population,
    })),
    totalPopulation: cluster.totalPopulation,
  };

  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/analyze-cluster`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(SUPABASE_ANON_KEY ? { apikey: SUPABASE_ANON_KEY } : {}),
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(`Edge Function ${res.status}: ${detail}`);
    }

    const data = (await res.json()) as { text?: string; error?: string };
    if (data.error) throw new Error(data.error);
    return data.text ?? 'Pas de réponse générée.';
  } catch (error) {
    reporter.error('analyzeCluster failed', error, { source: 'geminiService' });
    return "Erreur lors de l'analyse IA. Vérifiez la console.";
  }
};
