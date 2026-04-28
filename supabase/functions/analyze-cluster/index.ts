// Supabase Edge Function — analyze-cluster
//
// Proxies a cluster analysis request to Gemini.
// The frontend never sees the GEMINI_API_KEY.
//
// Auth model: anon access matches the rest of the app (per FINISH_PLAN.md
// "Future / Deferred F2"). CORS limits caller origins.
//
// Deploy: `supabase functions deploy analyze-cluster --no-verify-jwt`
// Secrets: `supabase secrets set GEMINI_API_KEY=...`

// @ts-nocheck — Deno runtime types not present in the Vite project; this file
// is server-side only and never compiled with the app's tsconfig.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3030',
  'https://app.wesser.fr',
  'https://test.wesser.fr',
];

const GEMINI_MODEL = 'gemini-2.5-flash';

interface ClusterPayload {
  communes: Array<{ name: string; population: number }>;
  totalPopulation: number;
}

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
    'Access-Control-Max-Age': '86400',
  };
}

function buildPrompt(cluster: ClusterPayload): string {
  const names = cluster.communes
    .map((c) => `${c.name} (${c.population} hab.)`)
    .join(', ');
  return `
Tu es un urbaniste expert du territoire français.
J'ai créé un regroupement de communes composé de :
${names}.

Population totale: ${cluster.totalPopulation}.

1. Donne un nom créatif et réaliste à ce territoire (Ex: "Terres de l'Ill", "Porte du Sud", etc).
2. Analyse brièvement la cohérence de ce groupe (ex: rural vs urbain).
3. Suggère un service public prioritaire à mutualiser pour ces villes (ex: crèche, transport, déchetterie).

Réponds en format texte court et structuré (Markdown). Sois concis.
  `.trim();
}

async function callGemini(prompt: string, apiKey: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const text =
    data?.candidates?.[0]?.content?.parts?.[0]?.text ??
    'Pas de réponse générée.';
  return text;
}

serve(async (req: Request): Promise<Response> => {
  const origin = req.headers.get('origin');
  const headers = { ...corsHeaders(origin), 'Content-Type': 'application/json' };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers,
    });
  }

  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'GEMINI_API_KEY not configured' }), {
      status: 500,
      headers,
    });
  }

  let cluster: ClusterPayload;
  try {
    const body = await req.json();
    if (!Array.isArray(body?.communes) || typeof body?.totalPopulation !== 'number') {
      throw new Error('Invalid payload: expected { communes: [{name, population}], totalPopulation: number }');
    }
    cluster = body;
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Invalid JSON' }),
      { status: 400, headers },
    );
  }

  try {
    const prompt = buildPrompt(cluster);
    const text = await callGemini(prompt, apiKey);
    return new Response(JSON.stringify({ text }), { status: 200, headers });
  } catch (err) {
    console.error('analyze-cluster error:', err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : 'Unknown error',
      }),
      { status: 502, headers },
    );
  }
});
