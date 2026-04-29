# WesserPlan — Finish Plan

> Generated: 2026-04-28
> Branch: `refactor/restructure-to-src`
> Status: ~70% built, persistence + sync are the gap

---

## Progress Log

### Session 2026-04-28 (uncommitted, working tree only)

**✅ Phase 0 — Critical bugs (done)**
- `src/services/userService.ts:6` — fixed path to `/api/France/Mobile/Users/GetMyFundraiserUser`
- `src/components/navigation/MobileSidebar.tsx` — wired `useAuth()` for real user name + initials + email; logout button now calls `useAuth().logout()`
- `src/pages/TeamPlannerPage.tsx` — collapsed triple-nested wrapper to single `<div>` (kept outside MainLayout because team-planner has its own internal Navbar — that architecture is intentional)

**✅ Phase 1 — Audit columns + OID stamping (done; awaits migration apply)**
- `src/stores/authStore.ts` (new) — Zustand mirror of MSAL user for non-React consumers
- `src/hooks/useAuth.ts` — exposes `userOid`, syncs to authStore on every render
- `src/lib/audit.ts` (new) — `withAudit(payload, mode)` helper stamps `created_by_oid`/`updated_by_oid`
- `src/services/{communesService,mairieService,activityService,housingsService}.ts` — every insert/update now wrapped in `withAudit(...)`
- `src/services/carsService.ts` — `reportDamage` populates the existing `created_by` column on `cars.vehicle_damages` with the OID
- `supabase/migration_004_audit_columns.sql` (new) — adds `created_by_oid`/`updated_by_oid` to all `plan.*` tables + `public.activities`

**⚠ ACTION REQUIRED before writes will work:**
> Apply `supabase/migration_004_audit_columns.sql` to the Supabase project (SQL Editor or `supabase db push`). Without it, every write will fail with "column does not exist". The `withAudit()` helper returns empty fields when no user is signed in, so anonymous boot-time reads still work; only authenticated writes need the columns.

**✅ Phase 2 prep — UI primitives (scaffolding done)**
- `src/components/ui/LoadingState.tsx` (new) — spinner + label
- `src/components/ui/ErrorState.tsx` (new) — error box with retry button
- `src/components/ui/EmptyState.tsx` (new) — empty placeholder with icon + action
- Phase 2 main work (refactor data hooks to surface errors instead of falling back to mocks) is not yet started

**✅ Phase 8 quick wins (partial)**
- `src/pages/NotFoundPage.tsx` (new)
- `src/app/routes.tsx` — added catch-all `{ path: '*', element: <NotFoundPage /> }` under MainLayout

**Verification**
- `npm run lint` (tsc --noEmit) — passes clean

### Session 2026-04-28 — Wave 2 (uncommitted, working tree only)

Dispatched 9 parallel agents + handled the Gemini Edge Function inline. All work composes — `npm run lint` passes clean.

**✅ Phase 2 — Kill silent fallbacks (done in 4 domains)**
- `OperationsTab.tsx` — removed FALLBACK_HOUSINGS / FALLBACK_CARS arrays + the dataSource banner; added `error` state, `<ErrorState onRetry>`, `<LoadingState />`
- `MairieTab.tsx` — fallback-to-`initialMairieData`/`initialZones` replaced with ErrorState + retry; LoadingState; EmptyState when 0 results
- `useCommunesData.ts` — removed `communesData[selectedOrg]` mock fallback (success and error paths). Hook now returns `{ error, validationError, validationSuccess, geoError }` for consumer wiring
- `ActivityFeed.tsx` — removed FALLBACK_ACTIVITIES; ErrorState/LoadingState/EmptyState; hardcoded "Début Campagne Handicap International" event removed

**✅ Phase 3 — Backend reads wired**
- **Dashboard map**: `dashboardService.getTeamsForWeek({ week, year, campaign_id })` replaces `generateTeamsData()`. Defensive shape mapping for unknown backend response fields, falls back to `departmentCapitals` for coordinates. New `BackendTeamRow` type guards.
- **Dashboard header**: week/year/campaign selectors replace dead clock + search. `dashboardService.getCampaigns(year)` populates dropdown.
- **Dashboard weather**: hardcoded `'75'` → derived from teams' coords via nearest-capital lookup
- **WPlan**: `dashboardService.getWeeklyPerformance(12)` provides real national KPIs; per-region/dept breakdowns scaled to real totals (deterministic, no `Math.random()`); retention chart real (cohort proxy: active fundraisers / cumulative newcomers); correlation chart real (Open-Meteo precip × signup proxy)
- **WPlan SWOT**: Forces / Faiblesses now KPI-driven via thresholds; Opportunités / Menaces stay editorial
- **WPlan DataLab**: WeatherCorrelatorWidget accepts `deptCode` prop (no more hardcoded Paris)

**✅ Phase 4 — All write handlers persistent**
- **Mairie**: 13 mutation handlers wired to mairieService — createZone / deleteZone / updateZone (debounced 500ms per zone-id+field) / updateMairie (status+progress+contacts) / addComment (optimistic temp-id then replaced) / deleteComment / updateComment / town-hall ↔ zone assignment via updateZone(town_hall_ids). Optimistic UI with revert-on-error.
- **Communes**: `handleUpdateCommune` async with optimistic update + revert via getById; status/email/phone/mayor map to DB. ProspectValidationModal blocks empty/short zone names; success + error banners replace `alert()`.
- **Operations**: AddHousingModal calls `housingsService.create()` with full DB-row mapping + form validation (people > 0, nights > 0, etc.); ReportDamageModal expanded to `{ part, type, detail }` + calls `carsService.reportDamage()`; refresh() reloads after writes
- **Settings**: notification toggles + language preference now persist via `usePreferencesStore` (Zustand + localStorage key `wesserplan-preferences`); profile inputs read-only with explanation banner ("synchronisé depuis Microsoft 365"); "Vider les logements/véhicules" replaced with single "Vider le cache local"; "Enregistrer" button removed (was a no-op)

**✅ Phase 5 — Team-planner persistence**
- `supabase/migration_005_team_planner.sql` — adds `plan.team_planner_boards` (org_id, year, week_index UNIQUE, board_data JSONB, audit columns)
- `src/services/teamPlannerService.ts` — load() / save() with upsert on (org_id, year, week_index)
- `useTeamBoard` — per-week load on mount + week-change with `loadedWeeksRef` guard; debounced 500ms save on every mutation; `lastSaved`, `isSaving`, `saveError` exposed
- `BoardHeader` — `<SaveIndicator>` shows "Enregistré il y a Xs" / "Enregistrement…" / "Erreur — Réessayer" with Cloud/Check/Loader icons
- `InspectorPanel` — hardcoded PIN `'2003'` replaced with `useAuthStore(s => s.isAuthenticated)` check; PIN modal removed

**✅ Phase 6 — Zone-maker complete**
- `clusteringService.generateClusters()` — implemented: greedy seed-and-expand BFS, sorts by population, accepts neighbors that bring cluster pop closer to target (≤120% threshold), commits if pop ≥ 50% of target
- `clusterPersistence` (in clusteringService) — loadAll(ngo) / upsertMany / deleteOne / replaceAll(ngo, clusters); plan.clusters table already in migration_003
- `useZoneMakerApp` + `useZonePlanner` — load on mount, debounced save (500ms), per-NGO hydration tracking; `persistenceError` field for ErrorState
- New "Generate" Wand2 button in `ClusterSidebar` (multi-NGO view); existing "Regénérer" wired in `AppSidebar` (single-NGO view)
- **Gemini key removed from browser**: new Edge Function `supabase/functions/analyze-cluster/index.ts` (Deno) proxies cluster → Gemini API. CORS-restricted to dev + `*.wesser.fr` origins. No JWT validation (matches anon-key architecture). `geminiService.ts` now POSTs to `/functions/v1/analyze-cluster` instead of using `@google/genai` directly. `process.env.API_KEY` reference gone.
- (`@google/genai` package is now unused — can `npm uninstall` later)

**✅ Phase 7 — Upload pipeline**
- Installed `papaparse @types/papaparse xlsx zod`
- New `src/services/uploadService.ts` — parseFile (CSV/XLSX/XLS/JSON), bulkInsert (500-row batches with per-row fallback), downloadErrorReport, downloadInsertFailures
- New Zod schemas: `src/lib/schemas/{communes,housings,vehicles}.schema.ts` with EN/FR header aliasing, French status value normalization, Excel serial-date coercion, dd/mm/yyyy support, boolish + stringList coercers
- `UploadTab` rewritten with 6-state machine per zone (idle → parsing → preview → inserting → done | error); 3 live zones (Communes/Logements/Véhicules) + Reports zone marked "Bientôt disponible"
- Preview shows row count, first 10 valid rows, first 5 errors; confirm runs bulkInsert with progress bar; failed rows downloadable as CSV with UTF-8 BOM
- Lazy-loaded into UploadPage chunk (446 KB / 146 KB gzipped) — no impact on main bundle

**✅ Verification**
- `npm run lint` (`tsc --noEmit`) — passes clean
- All agent reports referenced expected types and audit pattern
- Gemini Edge Function key-hiding verified (no `process.env.API_KEY`, no `@google/genai` import in frontend)

### ⚠ Actions still required on your side

Two SQL migrations to apply in Supabase SQL Editor (or `supabase db push`):
1. `supabase/migration_004_audit_columns.sql` — adds `created_by_oid` / `updated_by_oid` columns
2. `supabase/migration_005_team_planner.sql` — adds `plan.team_planner_boards` table

One Edge Function to deploy:
3. `supabase functions deploy analyze-cluster --no-verify-jwt`
4. `supabase secrets set GEMINI_API_KEY=...` (move it from `.env.local` to function secrets)

Optional cleanup:
5. `npm uninstall @google/genai` (no longer used after Edge Function migration) — wait until you're sure no other consumer references it

### What's left for the product to be fully done

**Phase 8 — UX polish** (~2 days)
- Loading/error states on remaining pages that haven't been touched (Wplan map metric load, Zone-maker initial geo load if not already covered)
- Active-state highlighting in MobileBottomNav for secondary tabs
- Hardcoded `rgba(255,91,43,...)` shadow colors in `FranceMap.tsx` popup HTML → CSS vars
- Bundle: lazy-load Chart.js per widget instead of registering globally
- Accessibility pass (keyboard nav, ARIA labels, focus mgmt)

**Optional**
- Phase 9: tests (no test infra exists)
- Phase 10: extract `@wesser/core` shared lib with WesserDashboard

**Future / Deferred**
- F1: enable RLS on `plan.*` tables once user base broadens
- F2: MSAL ↔ Supabase token bridge if external users get added
- F3: Realtime sync for team-planner multi-user collab
- F4: Backend ownership of zone clusters (if salary calc needs them server-side)
- F5: Real i18n wiring (preferences store now persists language; UI strings still 100% French)
- F6: Booking.com + Airbnb housing ingestion via email parser → `plan.housings` (mirror the existing Sixt rental pipeline). Neither platform exposes a guest-side API, so the only realistic path is parsing confirmation emails on a dedicated mailbox and routing by sender domain. `plan.housings` already has the right shape (`channel`, `address`, `cost_total`, `nights`, `date_start/date_end`, `owner_name`, `owner_phone`, `lat`/`lng`); set `channel` to `'booking'` / `'airbnb'`. Cheapest version: extend the Sixt mailbox + parser rather than spinning up a new pipeline.

---

## North Star

WesserPlan becomes a fully-synced municipal planning tool where:
- **Fundraiser/team/performance/quality data** flows in from the **Wesser.Ign8 .NET backend** (https://api.wesser.fr) — read-only consumer, authenticated with Azure AD bearer tokens (MSAL).
- **Planning data** (communes, mairies, zones, housings, cars, activities, comments, team-planner boards, zone-maker clusters) lives in **Supabase** — read+write owner, accessed with the public **anon key**. MSAL and Supabase are intentionally **not connected** — different auth systems for different purposes.
- **User identity / org scoping is app-level**: the frontend reads the Azure user from MSAL, then includes `user_oid` / `org_id` columns when writing to Supabase. Supabase RLS, if enabled, uses static or column-based policies — never `auth.uid()`.
- **No silent fallback to mock data** — failures surface as errors.
- **WesserDashboard** (sibling app) reads the same backend + same Supabase project, so changes sync across both apps automatically.

### Auth model summary

| Concern | Handled by | How |
|---|---|---|
| Login / session | MSAL (Azure AD) | `loginRedirect` → token in sessionStorage |
| Backend API calls | MSAL access token | `Authorization: Bearer …` to `api.wesser.fr` |
| Supabase reads/writes | Anon key | Standard `createClient(url, anonKey)` |
| User attribution in Supabase rows | App-level | Frontend writes `created_by_oid` from MSAL claims |
| Multi-tenant isolation | App-level filters | Frontend always passes `org_id` in queries |

This is a trusted-user-base model. Acceptable trade-offs: no `auth.uid()`-based RLS, no token validation between MSAL and Supabase, audit trail relies on the frontend honestly populating `created_by_oid`. If the user base ever grows beyond trusted internal staff, revisit.

---

## Architecture Decision: Data Ownership

| Domain | Source of Truth | Why |
|---|---|---|
| Dashboard KPIs (weekly/daily performance, campaigns) | Backend | `/api/France/Web/Dashboard/*` already live |
| Teams (roster, leaders, performance, weekly overview) | Backend | `/api/France/Web/Teams/*` already live |
| Fundraisers (kanban, top performers, live stats) | Backend | `/api/France/Web/Fundraiser/*` already live |
| Quality / Salary / Reports / Arena | Backend | All endpoints live, used by WesserDashboard |
| Person lookups | Backend | `/api/France/Web/Person/GetPersonRecord` |
| Organizations | Backend | `/api/France/Web/Organizations/GetOrganizations` |
| User profile + avatar | Backend | `/api/France/Web/Users/{GetMyAvatar,UpdateMyAvatar}` |
| **Communes / town_halls** | **Supabase** | `plan.town_halls` — only home for this data |
| **Mairies / zones / comments** | **Supabase** | `plan.zones`, `plan.comments` |
| **Housings** | **Supabase** | `housings` table |
| **Cars / vehicles** | **Supabase** | `cars` table (separate schema currently) |
| **Activities feed** | **Supabase** | `activities` table |
| **Team-planner board state** | **Supabase** (new table) | Currently 100% ephemeral |
| **Zone-maker clusters** | **Supabase** (new table) | Currently 100% ephemeral |
| **Settings / preferences** | localStorage + Supabase profile | Theme already on localStorage |
| **Uploaded files** | Supabase Storage | Currently console.log only |

---

## Critical Bugs (Phase 0 — fix today)

| # | File | Issue | Fix |
|---|---|---|---|
| B1 | `src/services/userService.ts:6` | Calls `/Users/GetMyFundraiserUser`, backend exposes `/api/France/Mobile/Users/GetMyFundraiserUser`. **404 in prod.** | Update path |
| B2 | `src/components/navigation/MobileSidebar.tsx:98` | Hardcoded user name "Gérard Larcher" | Use `useAuth().userName` like `TopNavbar.tsx:123-135` |
| B3 | `src/components/navigation/MobileSidebar.tsx:101-103` | Logout button has no onClick | Wire to `useAuth().logout()` |
| B4 | `src/app/routes.tsx:30` + `src/pages/TeamPlannerPage.tsx:5-11` | TeamPlanner outside MainLayout, duplicate full-page wrapper | Move under MainLayout, remove duplicate wrapper |
| B5 | `src/services/geminiService.ts:8` | Reads `process.env.API_KEY`, env defines `GEMINI_API_KEY`. Also: shouldn't be in browser. | Defer until Phase 6 (move to Edge Function) |

**Phase 0 estimate**: 30 minutes for B1–B4. B5 deferred.

---

## Phase 1 — App-Level User Context + Supabase Hardening

**Goal**: Make MSAL identity available to every Supabase write (as a column, not as JWT), and tighten the Supabase repo so prod state is reproducible. **MSAL and Supabase remain disconnected.**

### Tasks

1. **Surface MSAL user info app-wide**
   - Extend `useAuth()` (`src/hooks/useAuth.ts`) to expose `{ oid, email, name, orgs: string[] }` extracted from the Azure `idTokenClaims`
   - Add `src/stores/authStore.ts` (Zustand) — caches the user info for non-React consumers (services)
   - Service layer reads from the store when stamping rows

2. **Stamp Supabase rows with the Azure user**
   - Every insert/update path in services adds:
     - `created_by_oid` (Azure objectIdentifier) on insert
     - `updated_by_oid`, `updated_at` on update
   - Affected services: `mairieService`, `communesService`, `housingsService`, `carsService`, `activityService`
   - Schema migration: add `created_by_oid TEXT`, `updated_by_oid TEXT`, `updated_at TIMESTAMPTZ` to `plan.town_halls`, `plan.zones`, `plan.comments`, `housings`, `cars`, `activities`
   - This is honor-system attribution — Supabase doesn't validate the OID, but it gives audit trail and lets WesserDashboard show "edited by".

3. **App-level org scoping**
   - Read user's primary org from MSAL (claim or app role — TBD with Azure AD admin)
   - Default queries scoped to current org via `selectedOrg` in `communesStore` (already exists for communes; replicate the pattern for mairies/operations)
   - Cross-org views (admin) are explicit — opt-in flag in queries

4. **Track missing RPCs in repo**
   - `communesService.ts:113,147` calls `get_geo_filter_options`, `get_dept_codes` — these exist in prod Supabase but aren't in repo migrations
   - Pull current definitions from prod (`supabase db pull` or via dashboard)
   - Commit them to `supabase/migrations/00X_geo_rpcs.sql`

5. **RLS — explicitly deferred**
   - Anon key, no RLS, until product is feature-complete
   - When product is finished, revisit as a hardening pass (see "Future" section at bottom of this doc)
   - For now: nothing to do here

6. **Schema consolidation**
   - `cars` is in a separate schema from `plan.*` — move into `plan` for consistency, OR document why it's separate
   - File: `supabase/migrations/00X_consolidate_cars_schema.sql` if moving

### Files
- `src/hooks/useAuth.ts`
- `src/stores/authStore.ts` (new)
- `src/services/{mairieService,communesService,housingsService,carsService,activityService}.ts`
- `supabase/migrations/00X_audit_columns.sql` (new)
- `supabase/migrations/00X_geo_rpcs.sql` (new)

### Acceptance
- Every row written from WesserPlan has a populated `created_by_oid`
- Pulling fresh Supabase against repo migrations reproduces all RPCs and tables (no drift)
- WesserDashboard can read `created_by_oid` and resolve to a name/avatar
- Org-scoped queries respect the user's current org selection

**Estimate**: 0.5 day (smaller than the original auth-bridge plan)

---

## Phase 2 — Kill Silent Fallbacks

**Goal**: Replace the `try Supabase / catch fallback to mock` pattern with surfaced errors. Mocks only run in dev when explicitly toggled.

### Why
Currently every domain hides Supabase failures (`OperationsTab.tsx:49`, `MairieTab.tsx:43-54`, `ActivityFeed.tsx:94-95`, `useCommunesData.ts:103-122`). The user thinks they're seeing real data, but if Supabase is unreachable they see hardcoded mock data with no warning.

### Tasks
1. Add `src/components/ui/ErrorState.tsx` — reusable error UI with retry button
2. Add `src/components/ui/LoadingState.tsx` — reusable skeleton/spinner
3. Refactor `useCommunesData.ts:74-122` — return `{ data, isLoading, error }` instead of falling back to `communesData[org]`
4. Same for `OperationsTab.tsx:44-72` (housings + cars), `MairieTab.tsx:25-68` (mairies + zones), `ActivityFeed.tsx:81-101`
5. Add a single dev-only env flag `VITE_USE_MOCKS` — when set, bypass Supabase entirely (for offline dev), but never silently
6. Mocks under `src/mocks/` stay for that purpose, get a clear "DEV ONLY" comment

### Files
- `src/components/ui/{ErrorState.tsx,LoadingState.tsx}` (new)
- `src/hooks/useCommunesData.ts`
- `src/components/operations/OperationsTab.tsx`
- `src/components/mairie/MairieTab.tsx`
- `src/components/dashboard/ActivityFeed.tsx`

### Acceptance
- Disconnecting Supabase shows error UI on every tab, not mock data
- Setting `VITE_USE_MOCKS=true` runs offline with mocks (warning banner shown)

**Estimate**: 1 day

---

## Phase 3 — Wire Backend Reads

**Goal**: Replace mock generators with real backend calls for fundraiser/team/performance data. These endpoints already exist.

### Tasks

#### 3.1 Dashboard map (real teams)
- Replace `generateTeamsData()` (`dashboardMocks.ts:28-92`) with `dashboardService.getTeamsForWeek({ week, year })`
- Update `FranceMap.tsx:29-86` popup HTML to use real team fields
- Per-team weather: loop teams, call `useDepartmentWeather(team.deptCode)` (cache makes this cheap)
- File: `src/components/dashboard/{DashboardTab.tsx,FranceMap.tsx}`

#### 3.2 Dashboard date controls
- Add week/year selector in `DashboardHeader.tsx:32-37` (currently shows clock with no business logic)
- Pass selected `{week, year}` through to all `dashboardService.*` calls
- Use existing `dashboardService.getCampaigns()` (fetched but unused at `DashboardTab.tsx:21-22`) to populate a campaign filter

#### 3.3 WPlan real data
- Replace deterministic-hash mock data (`useWplanData.ts:73-94`) with backend calls:
  - Top departments/communes → aggregate from signup data via existing `Reports.GetWeeklySignupsReport`
  - Radar chart metrics → `Quality.GetQualityMetricsReport` + `Reports.GetCampaignProductivity`
  - Retention chart (currently placeholder `ChartPanel.tsx:40-46`) → derive from `Performance` queries
  - Correlation chart (currently placeholder `ChartPanel.tsx:48-54`) → weather + signup join
- Replace static SWOT (`SwotMatrix.tsx:8-26`) with computed insights from KPIs

#### 3.4 Team-planner roster
- Load real fundraisers via `Fundraiser.GetFundraisersKanban` instead of `mocks/teamMocks`
- Person details from `Person.GetPersonRecord`
- Note: Kanban writes still go to Supabase (Phase 5) — backend is read-only for this domain

#### 3.5 Activity feed
- Already wired to Supabase (`activityService.getRecent`). Just kill the silent fallback (Phase 2).
- Hardcoded "Début Campagne Handicap International" in `ActivityFeed.tsx:160-164` → either remove or move to a `activities` row

### Files
- `src/components/dashboard/{DashboardTab.tsx,DashboardHeader.tsx,FranceMap.tsx,ActivityFeed.tsx}`
- `src/hooks/useWplanData.ts`
- `src/components/wplan/{ChartPanel.tsx,SwotMatrix.tsx}`
- `src/components/team-planner/TeamPlannerApp.tsx` (add data load)
- `src/services/dashboardService.ts` (extend if needed)

### Acceptance
- Dashboard shows real teams on the map for a selected week/year
- WPlan charts respond to real data filtered by region/dept
- Team-planner board lists actual fundraisers, not mock people

**Estimate**: 2-3 days

---

## Phase 4 — Persist Writes (Supabase domain)

**Goal**: Every UI mutation reaches Supabase. Currently most updates dead-end in local React state.

### 4.1 Mairie (highest gap — zero persistence today)
Wire all 6 mutation handlers in `MairieTab.tsx:25-122` to existing `mairieService` methods:
- `handleUpdateZone()` → `mairieService.updateZone()`
- `handleAddZone()` → `mairieService.createZone()`
- `handleDeleteZone()` → `mairieService.deleteZone()`
- `handleUpdateMairieStatus()`, `handleUpdateMairieProgress()` → `mairieService.updateMairie()`
- `handleAddMairieComment()` → `mairieService.addComment()` (needs to be added to service)
- `handleDeleteMairieComment()` → `mairieService.deleteComment()`
- Add comment edit: new `mairieService.updateComment(id, content)` method

Stub the "Générer documents" button (`MairieModals.tsx:27`) properly — either implement (Phase 6 AI) or remove for now.

### 4.2 Communes inline edits
- `useCommunesData.ts:142-144` `handleUpdateCommune` currently only updates local state
- Wire to `communesService.update(id, { email, phone, status })`
- `useCommunesData.ts:160-219` zone creation has no error handling — add error UI + rollback logic
- `useCommunesData.ts:40-53` `pastRequests` is hardcoded — back with a Supabase table or remove
- Validate zone name in `ProspectValidationModal.tsx:59-66` (non-empty, no duplicates)

### 4.3 Operations writes
- `AddHousingModal.tsx:19` — replace local-only insert with `housingsService.create()`
- Add missing form fields: amenities multi-select, geocoding for lat/lng (use Nominatim)
- Replace fake document scanner timeout with real OCR or remove
- `ReportDamageModal.tsx:51` — wire to `carsService.reportDamage()`
- Add "Change Driver" handler at `VehicleSection.tsx:72`
- Add housing edit flow (currently read-only modal)

### 4.4 Settings persistence
- `SettingsTab.tsx:71` save button has no handler — wire profile save to a `users` table in Supabase or backend `Users` endpoint
- `SettingsTab.tsx:113-115` notification toggles → persist to user prefs
- `SettingsTab.tsx:105` language selector → wire to i18n + persist
- `SettingsTab.tsx:78-80` "Vider les logements/véhicules" → either remove or implement with confirmation

### Files
- `src/components/mairie/MairieTab.tsx` + `MairieCard.tsx` + `MairieModals.tsx`
- `src/services/mairieService.ts` (add `updateComment`, fix `addComment`)
- `src/hooks/useCommunesData.ts`
- `src/components/operations/{OperationsTab.tsx,AddHousingModal.tsx,ReportDamageModal.tsx,VehicleSection.tsx,HousingDetailModal.tsx}`
- `src/components/settings/SettingsTab.tsx`

### Acceptance
- Every mutation in Mairie/Communes/Operations/Settings survives a page reload
- WesserDashboard sees the same updates (proves sync)
- Failure shows error UI, not silent local-only update

**Estimate**: 3 days

---

## Phase 5 — Team-Planner Persistence

**Goal**: Save Kanban board state to Supabase so reload + multi-user works.

### Schema
New table `plan.team_planner_boards`:
```sql
CREATE TABLE plan.team_planner_boards (
  id BIGSERIAL PRIMARY KEY,
  org_id TEXT NOT NULL,         -- 'msf' | 'unicef' | 'wwf' | 'mdm'
  week_index INT NOT NULL,
  year INT NOT NULL,
  board_data JSONB NOT NULL,    -- full BoardData shape from src/components/team-planner/types.ts
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE (org_id, year, week_index)
);
```

Plus a `plan.team_planner_relationships` table if relationships should outlive the JSON blob (recommended for queryability).

### Tasks
1. Add migration for the table(s) + RLS policies (org-scoped read/write)
2. Add `src/services/teamPlannerService.ts` — `loadBoard({org, year, week})`, `saveBoard({org, year, week, data})`
3. Refactor `useTeamBoard.ts:35-62` — load on mount, save on change (debounced 500ms)
4. Add optimistic UI: apply locally, save in background, revert on failure
5. Replace hardcoded PIN `'2003'` (`InspectorPanel.tsx:49`) with real auth check
6. Show last-saved indicator in the toolbar
7. (Optional) Realtime sync via Supabase Realtime for multi-user

### Files
- `supabase/migrations/00X_team_planner.sql` (new)
- `src/services/teamPlannerService.ts` (new)
- `src/hooks/useTeamBoard.ts`
- `src/components/team-planner/TeamPlannerApp.tsx`
- `src/components/team-planner/components/InspectorPanel.tsx`

### Acceptance
- Reload preserves board state per week/org
- Two browsers logged in as the same user see each other's changes (with realtime) or after refresh (without)
- Undo/redo still works (history stays in memory, but persistence is on top)

**Estimate**: 2 days

---

## Phase 6 — Zone-Maker

**Goal**: Real clustering, secure Gemini, persistent zones.

### 6.1 Implement clustering algorithm
- `clusteringService.ts:24-26` `generateClusters()` currently returns empty
- Use the adjacency graph already built at `useZoneMakerApp.ts:121-146`
- Approach: greedy neighbor-merging targeting `targetPop` per cluster (population-balanced k-means is also fine)
- Respect existing tier rules in `calculateDuration()` and `getZoneStatus()` from `clusteringService.ts`

### 6.2 Hide Gemini API key
- Move Gemini call out of the browser so the key isn't shipped in the bundle
- Create Supabase Edge Function `analyze-cluster` that:
  - Reads `GEMINI_API_KEY` from Edge Function env (not from request)
  - Calls Gemini with the cluster payload
  - Returns markdown analysis
  - **No JWT validation** (matches the rest of the app — anon access). Restrict by CORS allowed origins to limit scope.
- Update `geminiService.ts` to POST to the Edge Function instead of using `GoogleGenAI` directly
- Remove `GEMINI_API_KEY`/`API_KEY` from frontend `.env*` files entirely

### 6.3 Persist zones
- New table `plan.zones` (already exists for mairie zones, may need separate `plan.zone_maker_clusters`):
  - `id`, `org_id`, `name`, `code`, `color`, `population`, `commune_codes` (text[]), `team_id`, `start_week`, `duration_weeks`, `created_at`, `created_by`
- Save on cluster creation (currently `useZonePlanner.ts:211-237` only updates local state)
- Load existing zones on mount per org
- Wire `useZoneMakerApp.ts:346` `handleAnalyze()` Gemini result to UI display (currently the call is made but output not bound)

### Files
- `src/services/clusteringService.ts`
- `src/services/geminiService.ts`
- `supabase/functions/analyze-cluster/index.ts` (new)
- `supabase/migrations/00X_zone_maker.sql` (new)
- `src/hooks/useZonePlanner.ts`
- `src/hooks/useZoneMakerApp.ts`
- `src/components/zone-maker/ClusterDetail.tsx` (analysis display)

### Acceptance
- Drawing a brush selection produces a clustered set of communes via the algorithm (not just manual)
- Gemini analysis renders in `ClusterDetail` when "Analyser" is clicked
- Zones persist across reloads
- No `GEMINI_API_KEY` in the frontend bundle

**Estimate**: 2-3 days

---

## Phase 7 — Upload Pipeline

**Goal**: Real CSV/Excel ingestion replacing the `console.log` stub.

### Tasks
1. Add `papaparse` for CSV, `xlsx` for Excel (already in project? check `package.json`)
2. `UploadTab.tsx:20-23` — replace `console.log` with parser + validator
3. Define schemas per upload type:
   - Communes (CSV/JSON): code, name, region, dept, lat/lng, population, status
   - Housings (CSV/XLSX): zone, dates, costs, address, capacity
   - Vehicles (CSV): plate, brand, location, km, next service
   - Performance reports (PDF/XLSX): handle separately, possibly defer
4. Validation per row (Zod schemas), aggregate errors, show in UI
5. Bulk insert via `supabase.from(table).insert(rows)` — batch 500 at a time
6. Progress UI: file size → row count → inserted count
7. Error report: download CSV of failed rows with reasons
8. Confirmation step before commit (preview first 10 rows)

### Files
- `src/components/settings/UploadTab.tsx`
- `src/services/uploadService.ts` (new) — parsing + validation per type
- `src/lib/schemas/{communes,housings,vehicles}.schema.ts` (new — Zod)

### Acceptance
- Drag a real communes CSV → preview → confirm → rows in Supabase
- Bad rows show error report, good rows still insert
- Progress bar accurate
- Re-uploading the same file deduplicates by primary key (or warns)

**Estimate**: 1-2 days

---

## Phase 8 — UX & Production Polish

### Loading states + error UI everywhere
Apply the patterns from Phase 2 to all data hooks: `useWplanData`, `useZoneMakerApp`, `useZonePlanner`, dashboard hooks, team-planner hooks.

### Routing polish
- Add 404 catch-all route → `src/pages/NotFoundPage.tsx`
- Add `ProtectedRoute` wrapper for role-based access (admin-only routes if needed)
- Currently AuthProvider is global; that's fine, but add granular role checks for delete/admin actions

### Mobile parity
- Bottom nav only covers 5 of 9 routes; add Wplan/Mairie/ZoneMaker discoverability (probably via the existing "Plus" overflow)
- Active state highlighting in `MobileBottomNav` for secondary tabs

### Dark mode audit
- Replace hardcoded `rgba(255,91,43,...)` colors in `FranceMap.tsx` etc. with `var(--accent-primary)`
- Fix `.dark body::before` selector bug in `styles.css:101`

### Performance
- Lazy-load Chart.js and react-chartjs-2 (currently re-registered per widget)
- Virtualize large lists (communes list, team-planner cards)
- Image optimization for avatars

### Accessibility
- Keyboard navigation for modals
- ARIA labels on icon-only buttons
- Focus management on route changes

**Estimate**: 2-3 days

---

## Phase 9 (Optional) — Tests + CI

Currently zero tests. If shipping without is acceptable, defer. If not:
- Add `vitest` + `@testing-library/react` + `msw` for API mocking
- Smoke tests per route (renders without crash)
- Unit tests for services (mocked Supabase + apiClient)
- Integration tests for critical flows: login → dashboard → mairie write → reload → write persists
- GitHub Action: `npm run lint && npm run build && npm test` on PR

**Estimate**: 3-4 days

---

## Phase 10 (Optional) — Shared Library with WesserDashboard

Both apps duplicate types (Commune, Organization, status enums), constants (departmentMap), and services (auth, supabase client). Extract `@wesser/core`:

```
@wesser/core/
├── types/         (Commune, Organization, CommuneStatus, ...)
├── constants/     (departmentMap, regions, statusMap)
├── services/      (authExchange, supabaseClient factory)
├── hooks/         (useAuth, useDebounce, useLocalStorage)
```

Publish to private npm or use a monorepo (Turborepo/pnpm workspaces).

**Estimate**: 3-5 days. Worth it only if both teams agree to coordinate releases.

---

## Dependency Graph

Since Supabase uses the anon key (no RLS, no token bridge), writes don't depend on any auth setup. Phase 1 becomes a small audit-trail + repo-hygiene pass that can happen anytime.

```
Phase 0 (bugs)            ─── independent, do anytime
Phase 1 (audit cols, RPCs in repo)   ─── independent, small (0.5d)
Phase 2 (kill fallbacks)             ─── independent
Phase 3 (backend reads)              ─── independent (only needs Phase 0)
Phase 4 (persist writes)             ─── needs Phase 2 (error UI), benefits from Phase 1 (audit cols)
Phase 5 (team-planner persistence)   ─── parallel with Phase 4
Phase 6 (zone-maker)                 ─── independent; Edge Function for Gemini is key-hiding only, no auth
Phase 7 (upload pipeline)            ─── needs Phase 4 service patterns
Phase 8 (UX polish)                  ─── continuous, finalize at end
```

**Critical path**: 0 → 2 → 4 → 7. Phases 1, 3, 5, 6 can run in parallel with the critical path.

---

## Total Effort Estimate

| Phase | Days | Cumulative |
|---|---|---|
| 0 — Critical bugs | 0.1 | 0.1 |
| 1 — Audit cols + RPCs in repo | 0.5 | 0.6 |
| 2 — Kill fallbacks | 1 | 1.6 |
| 3 — Backend reads | 2.5 | 4.1 |
| 4 — Persist writes | 3 | 7.1 |
| 5 — Team-planner persistence | 2 | 9.1 |
| 6 — Zone-maker | 2.5 | 11.6 |
| 7 — Upload pipeline | 1.5 | 13.1 |
| 8 — UX polish | 2.5 | 15.6 |
| **Core product-complete** | | **~15-16 days** |
| 9 — Tests + CI (optional) | 3.5 | 19.1 |
| 10 — Shared library (optional) | 4 | 23.1 |
| **Future — RLS hardening** | 1-2 | — |
| **Future — Auth bridge if user base opens up** | 2-3 | — |

---

## File-by-File Hotspots (Quick Reference)

**Auth**
- `src/lib/auth.ts` — MSAL config (✅ working)
- `src/lib/supabase.ts:1-12` — Supabase client (⚠ no auth context — Phase 1)
- `src/components/auth/AuthProvider.tsx` — Azure auth gate (✅ working)
- `src/hooks/useAuth.ts` — Token getter

**Data hooks (all need Phase 2 fallback removal)**
- `src/hooks/useCommunesData.ts:74-122` — Communes load
- `src/components/operations/OperationsTab.tsx:44-72` — Housings/cars load
- `src/components/mairie/MairieTab.tsx:25-68` — Mairie load
- `src/components/dashboard/ActivityFeed.tsx:81-101` — Activity load

**Mock data (DEV-ONLY after Phase 2)**
- `src/mocks/{communesMocks,teamMocks,dashboardMocks,mairieMocks,operationsMocks}.ts`

**Services (extend in Phase 4)**
- `src/services/communesService.ts` — needs `update` wired
- `src/services/mairieService.ts:204-268` — methods exist, never called
- `src/services/housingsService.ts` — `create/update` not called from UI
- `src/services/carsService.ts` — `reportDamage` not called from UI
- `src/services/clusteringService.ts:24-26` — stubbed
- `src/services/geminiService.ts:8` — env var bug + browser-side key

**Persistence gaps (Phase 4-5)**
- `src/components/mairie/MairieTab.tsx:25-122` — all 6 handlers local-only
- `src/components/operations/{AddHousingModal,ReportDamageModal}.tsx` — local-only
- `src/components/settings/SettingsTab.tsx:71` — save has no handler
- `src/components/settings/UploadTab.tsx:20-23` — file processing is console.log
- `src/hooks/useTeamBoard.ts:35-62` — fully ephemeral

**Routing/nav polish (Phase 0/8)**
- `src/app/routes.tsx:30` — TeamPlanner outside MainLayout
- `src/pages/TeamPlannerPage.tsx:5-11` — duplicate wrapper
- `src/components/navigation/MobileSidebar.tsx:98-103` — hardcoded user + dead logout

---

## Future / Deferred (after product is feature-complete)

These are explicitly **not** in the finish-plan scope. Capturing them here so they aren't forgotten.

### F1 — Enable RLS on Supabase
Currently anon key + RLS off. When the product is feature-complete:
- Enable RLS on all `plan.*` tables, `housings`, `cars`, `activities`
- Start with permissive policies that just require *some* JWT claim (org, role)
- Tighten over time
- Audit `created_by_oid` columns (added in Phase 1) become enforceable rather than honor-system

### F2 — MSAL ↔ Supabase auth bridge
If the user base ever opens up beyond trusted internal staff, write a token-exchange Edge Function that:
- Validates the Azure access token
- Issues a short-lived Supabase JWT with `oid`, `org_id`, `role` claims
- Frontend stores the Supabase JWT, refreshes alongside the Azure token

This unlocks `auth.uid()`-based RLS policies. Until then, app-level scoping is sufficient.

### F3 — Realtime sync for team-planner
Phase 5 lands single-user persistence. If multiple planners need to collaborate live on the same week, add Supabase Realtime subscriptions on `plan.team_planner_boards`.

### F4 — Backend ownership of zone-maker clusters
If zone clusters need to feed into salary/performance calculations server-side (currently only consumed by WesserPlan + WesserDashboard UIs), design an API contract and move them into Ign8.

### F5 — i18n
Settings has a language selector but the UI is 100% French. If multi-language ever becomes real, wire up `react-i18next` and extract strings.

---

## Open Questions

1. **Org scoping in MSAL**: Is the user's NGO assignment in an Azure AD claim, an app role, or read from the backend (`/api/France/Web/Organizations/GetOrganizations`)? Phase 1's "stamp `created_by_oid` and filter by org" needs this resolved.
2. **WesserDashboard write surface**: Will WesserDashboard ever write to the same Supabase tables WesserPlan owns? If yes, both apps need to stamp `created_by_oid` consistently.
3. **Multi-user team-planner**: Realtime collab or last-writer-wins? Currently scoping Phase 5 as last-writer-wins; realtime moves to F3.

---

## Next Step

Phase 0 is 30 minutes of warmup bug fixes. Phase 1 (auth sync) is the highest-leverage starting point because it unblocks everything else.

Recommended order: **0 → 1 → 2 (parallel with 1) → 3 → 4 → 5 → 6 → 7 → 8**.
