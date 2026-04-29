# analyze-cluster Edge Function

Proxies cluster analysis requests from the WesserPlan frontend to Google Gemini.
Hides `GEMINI_API_KEY` from the browser bundle.

## Deploy

```bash
# from repo root
supabase functions deploy analyze-cluster --no-verify-jwt
supabase secrets set GEMINI_API_KEY=AIza...your_key
```

`--no-verify-jwt` is intentional: the rest of the app uses the Supabase anon key
without RLS (see `FINISH_PLAN.md` "Future / Deferred F1, F2"). When auth bridges
to Supabase get added, drop that flag.

## Auth model

- No JWT validation
- CORS restricts allowed origins to localhost dev ports + `*.wesser.fr`
- Anon Supabase key from the frontend is sent as `apikey` header but ignored
  (Supabase does its own routing; the function just sees the request)

## Request

```http
POST /functions/v1/analyze-cluster
Content-Type: application/json

{
  "communes": [
    { "name": "Saverne", "population": 11800 },
    { "name": "Marmoutier", "population": 2700 }
  ],
  "totalPopulation": 14500
}
```

## Response

```json
{ "text": "## Vallée de la Zorn\n\nCe regroupement…" }
```

Errors:
- 400 — invalid payload
- 405 — non-POST method
- 500 — `GEMINI_API_KEY` not configured in Edge Function secrets
- 502 — upstream Gemini API failure
