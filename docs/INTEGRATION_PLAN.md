# WesserPlan — Real Data Integration Plan

> Generated: 2026-03-26
> Frontend: `C:\Users\andre\Documents\DEV\WesserPlan`
> Backend: `C:\Users\andre\source\repos\WesserDE\Wesser.Ign8`

---

## Current State

### Backend (Wesser.Ign8)

**.NET 9 | Clean Architecture | CQRS/MediatR | SQL Server | Azure AD Auth**

106 API endpoints already live, organized under `/api/France/Web/*` and `/api/France/Mobile/*`:

| Domain | Endpoints | Key Data |
|--------|-----------|----------|
| Teams | 7 | Stats, details, leaders, weekly overview, performance |
| Fundraiser | 7 | Performance, kanban, live stats, top performers |
| Dashboard | 5 | Weekly/daily performance, cluster analytics, campaigns |
| Quality | 5 | Metrics, calls data, fundraiser performance |
| Salary | 3 | Salary data, bonuses, bonus reports |
| Arena/Leaderboards | 4 | Fundraiser, team, cup, spring challenge |
| Reports | 6 | Recruitment, weekly signups, quality, productivity, forecast |
| Organizations | 1 | List all organizations |
| Users | 4 | Profile, avatar get/set |
| Person | 1 | Person record by ID |
| Signups | 1 | Signup list |
| Devices | 2 | Device list, device user lookup |
| Partner | 4 | Overview, teams, quality, deployment |
| TV Mode | 2 | Live signups, team performance display |
| Tablet | 7 | User, assignments, projects, signup submission |

### Frontend (WesserPlan)

**React 19 | TypeScript 5.8 | Vite 6 | Tailwind v4 | Zustand**

- 9 pages all running on **100% mock data**
- Supabase client initialized but **never called**
- Only real API: Open-Meteo weather (free, no auth)
- All Zustand stores are **UI-only** (filters, view modes) — no data stores
- No HTTP client, no auth, no API layer

---

## Mock Data Inventory

### Centralized Mocks (`src/mocks/`)

| File | Lines | Data | Count | Used By |
|------|-------|------|-------|---------|
| `teamMocks.ts` | 467 | People generators, NGOs, cities, cars, photos | 15+ structures | Team Planner |
| `communesMocks.ts` | 58 | Commune records per org | 25 communes | Communes tab |
| `operationsMocks.ts` | 9 | Target zone definitions | 4 zones | Operations |
| `dashboardMocks.ts` | 92 | Team generator, weather, orgs | 1 generator | Dashboard |
| `mairieMocks.ts` | 16 | Zones + mairie records | 7 records | Mairie tab |

### Constants (`src/constants/`)

| File | Lines | Data | Used By |
|------|-------|------|---------|
| `departments.ts` | 73 | 35 dept codes, capitals, region mapping | Geographic filtering |
| `regions.ts` | 69 | 3 regional context analyses, 8 events | WPlan analytics |
| `status.ts` | 9 | 5 commune status definitions | Status display |
| `dataLibrary.ts` | 14 | 10 metric categories, 80+ items | WPlan data selection |

### Component-Level Hardcoded Data

| File | Data | Count |
|------|------|-------|
| `ActivityFeed.tsx` | Initial activity items | 3 activities |
| `OperationsTab.tsx` | Housing + cars initial state | 6 housings, 2 cars |
| `useCommunesData.ts` | Past request history | 1 history item |
| `metricsConfig.ts` | 9 map metric color scales | 9 metric configs |
| `zone-maker/constants.ts` | Cluster colors, 150 commune names | 15 colors, 150 communes |
| `mairie/helpers.ts` | Leaders, progression steps, org configs | 6 leaders, 5 steps |
| `useWplanData.ts` | Mock chart data generators | 2 generators |

---

## Existing API/Service Layer (Frontend)

### What Works

| Service | API | Status |
|---------|-----|--------|
| `weatherService.ts` | Open-Meteo (free) | Fully integrated, 15-min cache |
| `geminiService.ts` | Google Gemini AI | Partial (needs API key) |
| `clusteringService.ts` | Local computation | Working (no external API) |

### What's Missing

- No HTTP client or fetch wrapper
- No API base URL configuration
- No authentication layer
- No error handling patterns for API failures
- No loading/error states in most components
- Supabase client exists (`src/lib/supabase.ts`) but is **never imported by any component**

### Zustand Stores (All UI-Only)

| Store | State |
|-------|-------|
| `communesStore` | selectedOrg, filters, search, mode |
| `operationsStore` | activeSubTab, viewMode, selections |
| `teamStore` | weekIndex, personId, pageMode, density |
| `zoneStore` | selectedNGO, selectedClusterId |
| `themeStore` | isDark (persisted to localStorage) |
| `uiStore` | isMobileMenuOpen |

None of these stores handle data fetching.

---

## Supabase Database (Ready, Unused)

### Schema (`supabase/schema.sql`)

**communes**
```
id (BIGSERIAL PK), nom, departement, population, passage (DATE),
statut ('pas_demande'|'informe'|'refuse'|'telescope'|'fait'),
maire, revenue, lat, lng, email, phone, organisation ('msf'|'unicef'|'wwf'|'mdm'),
historique_passages (JSONB), created_at, updated_at
Indexes: organisation, departement, statut
RLS: enabled (permissive for now)
```

**housings**
```
id (BIGSERIAL PK), week, zone, name, lead, region, dept, org,
people, nights, date_start, date_end,
cost_reservation, cost_additional, cost_total, refund_amount, cost_final (NUMERIC),
has_insurance, receipt_ok (BOOL), channel, team_note, address,
status ('Honoree'|'Annulee'), lat, lng, created_at, updated_at
Indexes: org, dept, week, status
```

**cars**
```
id (BIGSERIAL PK), plate (UNIQUE), brand, location, owner,
km, fuel_declared, tank_size, next_service (DATE),
lat, lng, damages (JSONB), created_at, updated_at
```

### Seed Data (`supabase/seed.sql`)

- ~50 real housing records from Google Sheet
- Spans weeks S01-S10 (Dec 29, 2025 - March 8, 2026)
- Real accommodation names, team leads, regions, organizations, costs
- No communes or cars seed data

---

## Backend Architecture Details

### Tech Stack

| Component | Technology |
|-----------|-----------|
| Framework | ASP.NET Core 9.0 |
| Architecture | Clean Architecture + CQRS + MediatR |
| Database | SQL Server 2022 (EF Core 9.0) |
| Auth | Azure AD (Microsoft Identity Web 4.3.0) |
| API Pattern | Minimal APIs (Endpoint Groups) |
| Background Jobs | Hangfire 1.8.20 |
| Validation | FluentValidation 11.11.0 |
| Object Mapping | AutoMapper 13.0.1 |
| Cloud Storage | Azure Blob Storage |
| Secrets | Azure Key Vault |
| Monitoring | Application Insights |
| API Docs | NSwag (OpenAPI) at `/doc` |
| Caching | In-Memory (Redis-ready) |
| Localization | EN, DE, FR, IT, CH |

### Authentication Configuration

**Two Azure AD schemes:**
- `WESSER_TENANT_SCHEME` — Internal users
- `WESSER_EXTERNALS_TENANT_SCHEME` — External/partner users

**France Region:**
- Internal Tenant: `160de6d7-4585-4956-9444-d8555de4a6ec`
- External Tenant: `271a9d1d-d9aa-4875-b39b-b1d27b9111c5`
- Client ID (API): `4936c1bf-5378-410f-a3a2-d61060518e3a`
- Audience: `api://4936c1bf-5378-410f-a3a2-d61060518e3a`

**OAuth Scopes:**
- `Users.Read` — Read user information
- `Signups.Write` — Create/modify signups
- `FR.Web.Read` — France web interface read access
- `FR.Mobile.Read` — France mobile app read access
- `FR.Mobile.Write` — France mobile app write access
- `FR.Partner.Read` — France partner portal read access

### CORS (Already Configured)

```
http://localhost:3000       ← React dev (matches WesserPlan)
http://localhost:3030
https://app.wesser.fr       ← Production
https://test.wesser.fr      ← Staging
https://partner.wesser.fr   ← Partner portal
```

Methods: Any | Headers: Any | Credentials: Allowed

### Error Handling

| Exception | HTTP Status | Response |
|-----------|-------------|----------|
| `ValidationException` | 400 | ValidationProblemDetails |
| `NotFoundException` | 404 | ProblemDetails |
| `UnauthorizedAccessException` | 401 | ProblemDetails |
| `ForbiddenAccessException` | 403 | ProblemDetails |
| `ConflictException` | 409 | ProblemDetails |
| `NotModifiedException` | 304 | Empty body |

### Key Database Entities (SQL Server)

| Entity | Schema | Purpose |
|--------|--------|---------|
| AuthUser | Auth | User authentication |
| TeamDe / TeamDetailDe | dbo | Team definitions (master-detail) |
| TeamAssignmentDe / DetailDe | dbo | Person-team assignments |
| OrganizationsDe / DetailDe | dbo | Organization definitions |
| WeeklyProductionFigureDe / DetailDe | dbo | Weekly work hours/performance |
| SignupData | Tablet | Signup information (temporal table) |
| SignupInbox | Tablet | Incoming signup queue |
| AssetDe / AssetDetailDe | dbo | Device/asset tracking |
| CloudStorageCatalogue | dbo | Cloud storage references |

### Key Database Views

| View | Purpose |
|------|---------|
| FundraiserUserView | Fundraiser extended profile |
| PersonBasicView | Person core data |
| CalendarView | Campaign week calendar mapping |
| AuthUsersWithRolesView | User role assignments |
| AssetOwnershipView | Tablet device ownership |
| PortalTeamAssignmentWeekView | Weekly team assignments |
| TeamOrganizationAssignmentView | Team-org relationships |

---

## Mapping: Frontend Needs → Backend Endpoints

### Ready to Connect Now

| Frontend Page | Backend Endpoint | Replaces |
|---------------|-----------------|----------|
| Dashboard — Teams on map | `GET /Web/Teams/GetTeamsForWeek` | `generateTeamsData()` mock |
| Dashboard — KPIs | `GET /Web/Dashboard/weekly-performance` | Hardcoded metrics |
| Dashboard — Daily stats | `GET /Web/Dashboard/daily-performance` | Mock data |
| Dashboard — Campaigns | `GET /Web/Dashboard/campaigns` | None (new feature) |
| Dashboard — Cluster analytics | `GET /Web/Dashboard/cluster-analytics` | Mock data |
| Team Planner — Kanban | `GET /Web/Fundraiser/GetFundraisersKanban` | `generateBoard()` mock |
| Team Planner — Person details | `GET /Web/Person/GetPersonRecord` | `generatePerson()` mock |
| Team Planner — Performance | `GET /Web/Fundraiser/GetFundraisersPerformance` | Mock stats |
| Team Planner — Live stats | `GET /Web/Fundraiser/GetIndividualLiveStats` | Mock data |
| Team Planner — Top performers | `GET /Web/Fundraiser/GetTopPerformers` | Mock rankings |
| Team Planner — Team stats | `GET /Web/Teams/GetMyTeamStats` | Mock data |
| Team Planner — Team details | `GET /Web/Teams/GetTeamDetails` | Mock data |
| Team Planner — Team leaders | `GET /Web/Teams/GetTeamLeaders` | LEADERS constant |
| Settings — User profile | `GET /Users/GetMyFundraiserUser` | Hardcoded "Gerard Larcher" |
| Settings — Avatar | `GET/PUT /Web/Users/GetMyAvatar` / `UpdateMyAvatar` | None |
| Organizations list | `GET /Web/Organizations/GetOrganizations` | Hardcoded org configs |
| Quality metrics | `GET /Web/Quality/*` (5 endpoints) | None (new feature) |
| Reports | `GET /Web/Reports/*` (6 endpoints) | None (new feature) |
| Salary | `GET /Web/Salary/*` (3 endpoints) | None (new feature) |
| Arena/Leaderboards | `GET /Web/Arena/*` (4 endpoints) | None (new feature) |
| Signups list | `GET /Web/Signups/GetSignupsList` | None (new feature) |

### Needs New Backend Endpoints

| Frontend Page | Missing Endpoint | Description |
|---------------|-----------------|-------------|
| Communes | `GET /api/communes` | List communes with filters (dept, region, status, org) |
| Communes | `GET /api/communes/:id` | Commune details with history |
| Communes | `PATCH /api/communes/:id` | Update status, contact info |
| Communes | `POST /api/communes/batch-validate` | Validate prospect selection |
| Communes | `GET /api/communes/:id/historical-passages` | Org visit history |
| Mairie | `GET /api/mairies` | List all mairie records |
| Mairie | `POST /api/mairies` | Create mairie record |
| Mairie | `PATCH /api/mairies/:id` | Update status, progress, contacts |
| Mairie | `DELETE /api/mairies/:id` | Remove mairie |
| Mairie | `POST /api/mairies/:id/comments` | Add comment |
| Mairie | `PATCH /api/mairies/:id/comments/:cid` | Edit comment |
| Mairie | `DELETE /api/mairies/:id/comments/:cid` | Delete comment |
| Mairie | `GET /api/zones` | List zones |
| Mairie | `POST /api/zones` | Create zone |
| Mairie | `PATCH /api/zones/:id` | Update zone |
| Mairie | `DELETE /api/zones/:id` | Delete zone |
| Operations | `GET /api/housings` | List housings |
| Operations | `POST /api/housings` | Create housing |
| Operations | `PATCH /api/housings/:id` | Update housing |
| Operations | `DELETE /api/housings/:id` | Delete housing |
| Operations | `GET /api/housings/matches?zoneId=:id` | Smart match algorithm |
| Operations | `GET /api/vehicles` | List vehicles |
| Operations | `POST /api/vehicles` | Create vehicle |
| Operations | `PATCH /api/vehicles/:id` | Update vehicle |
| Operations | `DELETE /api/vehicles/:id` | Delete vehicle |
| Operations | `POST /api/vehicles/:id/damages` | Report damage |
| Zone Maker | `GET /api/clusters` | List clusters |
| Zone Maker | `POST /api/clusters` | Create cluster |
| Zone Maker | `PATCH /api/clusters/:id` | Update cluster |
| Zone Maker | `DELETE /api/clusters/:id` | Delete cluster |
| Zone Maker | `GET /api/schedule` | Get deployment schedule |
| Zone Maker | `PATCH /api/schedule/:clusterId` | Modify schedule entry |
| WPlan | `GET /api/regions/:id/metrics` | Regional metric data |
| WPlan | `GET /api/departments/:id/metrics` | Department-level analytics |
| Upload | `POST /api/import/communes` | Import commune CSV/JSON |
| Upload | `POST /api/import/housings` | Import housing CSV/XLSX |
| Upload | `POST /api/import/vehicles` | Import vehicle fleet CSV |
| Activity Feed | `GET /api/activities` | List activities |
| Activity Feed | `POST /api/activities` | Create activity event |

---

## Database Strategy Decision

### Option A: Supabase for Planning Data (Recommended)

Use the .NET backend for **operational data** (teams, fundraisers, orgs, signups, performance).
Use Supabase for **WesserPlan-specific planning data** (communes, mairie, zones, housing logistics).

**Rationale:**
- Supabase already has schema + seed data for communes, housings, cars
- .NET backend doesn't have these planning tables
- Supabase provides instant REST API via PostgREST (no endpoint coding needed)
- RLS already configured (permissive for now, tighten later)
- Real-time subscriptions available for collaborative features

### Option B: Everything in .NET Backend

Add new controllers/CQRS handlers for all planning data in the .NET backend.

**Rationale:**
- Single auth system (Azure AD)
- Consistent architecture
- More control over business logic
- Better for long-term maintenance

### Option C: Hybrid (Pragmatic)

Start with Supabase for quick wins (communes, housings, cars are ready).
Migrate to .NET backend later as needs solidify.

---

## Type Mapping: Frontend ↔ Backend

| Frontend Type | Backend DTO | Match Level | Notes |
|---------------|-------------|-------------|-------|
| `Person` (team-planner) | `FundraiserPerformanceDto` + `PersonRecord` | Partial | Need adapter/mapping layer |
| `Organization` ('msf'\|'unicef'\|...) | `OrganizationDto` (ID-based) | Different | Frontend uses string codes, backend uses numeric IDs |
| `Commune` | Supabase `communes` table | Direct | Field names match |
| `Housing` | Supabase `housings` table | Close | Some field name differences |
| `CarType` | Supabase `cars` table | Close | Some field name differences |
| `TeamData` (dashboard) | `TeamListItemDto` | Partial | Needs adapter |
| `WeatherData` | Open-Meteo API | N/A | Keep as-is, no backend needed |
| `Mairie` | None | Missing | Needs new table/endpoints |
| `Cluster` (zone-maker) | None | Missing | Needs new table/endpoints |
| `BoardData` (kanban) | `FundraisersKanbanResponseDto` | Partial | Structure differs significantly |

---

## Implementation Plan

### Phase 1: Auth + API Client (Foundation)

**Duration:** ~2 hours
**Files to create/modify:**

1. Install `@azure/msal-browser` and `@azure/msal-react`
2. Create `src/lib/auth.ts` — MSAL configuration for FR tenant
   - Client ID: `4936c1bf-5378-410f-a3a2-d61060518e3a`
   - Authority: `https://login.microsoftonline.com/160de6d7-4585-4956-9444-d8555de4a6ec`
   - Redirect URI: `http://localhost:3000`
   - Scopes: `api://4936c1bf-5378-410f-a3a2-d61060518e3a/FR.Web.Read`
3. Create `src/lib/apiClient.ts` — Fetch wrapper with JWT token injection
   - Base URL from env: `VITE_API_BASE_URL`
   - Auto-attach `Authorization: Bearer {token}` header
   - Parse ProblemDetails error responses
   - Handle 401 → redirect to login
4. Create `src/components/auth/AuthProvider.tsx` — MSAL provider wrapper
5. Wrap `App.tsx` with `MsalProvider`
6. Add env vars: `VITE_API_BASE_URL`, `VITE_AZURE_CLIENT_ID`, `VITE_AZURE_TENANT_ID`

### Phase 2: Connect Existing Backend Endpoints (Quick Wins)

**Duration:** ~3 hours
**Replace mock data with real API calls:**

7. **Dashboard — Teams:** Replace `generateTeamsData()` with `GET /Web/Teams/GetTeamsForWeek`
8. **Dashboard — KPIs:** Replace hardcoded metrics with `GET /Web/Dashboard/weekly-performance`
9. **Dashboard — Campaigns:** Wire `GET /Web/Dashboard/campaigns`
10. **Settings — Profile:** Replace "Gerard Larcher" with `GET /Users/GetMyFundraiserUser`
11. **Organizations:** Replace hardcoded org configs with `GET /Web/Organizations/GetOrganizations`
12. **Team Planner — Kanban:** Replace `generateBoard()` with `GET /Web/Fundraiser/GetFundraisersKanban`
13. **Team Planner — Person:** Replace `generatePerson()` with `GET /Web/Person/GetPersonRecord`
14. **Team Planner — Team leaders:** Replace LEADERS constant with `GET /Web/Teams/GetTeamLeaders`

### Phase 3: Wire Supabase for Planning Data

**Duration:** ~3 hours
**Create service layer for Supabase tables:**

15. Create `src/services/communesService.ts` — CRUD for communes table
16. Create `src/services/housingsService.ts` — CRUD for housings table
17. Create `src/services/carsService.ts` — CRUD for cars table
18. Replace `communesMocks.ts` imports → `communesService.getCommunes()`
19. Replace `INITIAL_HOUSINGS` → `housingsService.getHousings()` (50 real seed records!)
20. Replace `INITIAL_CARS` → `carsService.getCars()`
21. Add loading/error states to Communes, Operations tabs

### Phase 4: New Backend Endpoints

**Duration:** ~4 hours (backend work in .NET repo)
**Or use Supabase tables + PostgREST if going Option A**

22. Add `mairies` table to Supabase (or MairieController to .NET)
23. Add `zones` table to Supabase (or ZoneController to .NET)
24. Add `clusters` table for zone-maker data
25. Add `activities` table for dashboard activity feed
26. Create corresponding frontend services
27. Replace mairie mock data with real CRUD
28. Replace zone-maker local state with persisted clusters

### Phase 5: Data Stores + Loading States

**Duration:** ~2 hours
**Upgrade Zustand stores from UI-only to data+UI:**

29. Add data fetching actions to `communesStore` (fetchCommunes, loading, error)
30. Add data fetching actions to `operationsStore` (fetchHousings, fetchCars)
31. Add data fetching actions to `teamStore` (fetchBoard, fetchPerson)
32. Add `React.Suspense` or loading skeletons to all pages
33. Add error boundaries per page section

### Phase 6: Import/Export Features

**Duration:** ~2 hours

34. Wire Upload tab to `POST /api/import/*` endpoints
35. Add CSV parsing (client-side with `papaparse`)
36. Add progress indicators for bulk imports
37. Add export functionality for reports

---

## File Changes Summary

### New Files to Create

```
src/lib/auth.ts                      — MSAL configuration
src/lib/apiClient.ts                 — HTTP client with auth
src/components/auth/AuthProvider.tsx  — Auth context provider
src/services/communesService.ts      — Supabase communes CRUD
src/services/housingsService.ts      — Supabase housings CRUD
src/services/carsService.ts          — Supabase cars CRUD
src/services/teamsService.ts         — .NET backend teams API
src/services/dashboardService.ts     — .NET backend dashboard API
src/services/fundraiserService.ts    — .NET backend fundraiser API
src/services/userService.ts          — .NET backend user API
src/services/organizationService.ts  — .NET backend org API
```

### Files to Modify

```
src/app/App.tsx                          — Add AuthProvider wrapper
src/components/dashboard/DashboardTab.tsx — Replace mock teams/KPIs
src/components/communes/CommunesTab.tsx   — Replace mock communes
src/components/operations/OperationsTab.tsx — Replace INITIAL_HOUSINGS/CARS
src/components/team-planner/TeamPlannerApp.tsx — Replace mock board
src/components/settings/SettingsTab.tsx    — Replace hardcoded user
src/stores/communesStore.ts               — Add data fetching
src/stores/operationsStore.ts             — Add data fetching
src/stores/teamStore.ts                   — Add data fetching
vite.config.ts                            — Add new env vars
.env.local                                — API URLs, Azure AD config
```

### Files to Eventually Remove

```
src/mocks/teamMocks.ts        — After Phase 2
src/mocks/communesMocks.ts    — After Phase 3
src/mocks/dashboardMocks.ts   — After Phase 2
src/mocks/mairieMocks.ts      — After Phase 4
src/mocks/operationsMocks.ts  — After Phase 3
```

---

## Environment Variables Needed

```env
# .env.local

# Azure AD (France)
VITE_AZURE_CLIENT_ID=4936c1bf-5378-410f-a3a2-d61060518e3a
VITE_AZURE_TENANT_ID=160de6d7-4585-4956-9444-d8555de4a6ec
VITE_AZURE_REDIRECT_URI=http://localhost:3000

# Backend API
VITE_API_BASE_URL=https://test.wesser.fr/api

# Supabase (existing)
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_ANON_KEY=<your-supabase-key>

# Gemini (existing)
GEMINI_API_KEY=<your-gemini-key>
```

---

## Risk & Dependencies

| Risk | Impact | Mitigation |
|------|--------|------------|
| Azure AD app registration not created for WesserPlan | Blocks all auth | Register app in Azure portal, grant API permissions |
| Backend DTO shapes don't match frontend types | Data mapping bugs | Create adapter layer, test with real responses |
| Supabase not deployed/seeded | No planning data | Run schema.sql + seed.sql against Supabase instance |
| CORS issues in production | API calls blocked | Already configured for app.wesser.fr |
| Rate limiting on backend | Throttled requests | Not currently implemented, but monitor |
| Organization ID mapping (string vs numeric) | Wrong data association | Create mapping constant: 'msf' → org ID |

---

## Quick Reference: All Backend Endpoints

### Teams (`/api/France/Web/Teams`)
- `GET /GetMyTeamStats` — My team performance stats
- `GET /GetTeamDetails` — Team detail by query
- `GET /GetTeamLeaders` — Team leader list
- `GET /GetTeamsForWeek` — Teams for a specific week
- `GET /GetTeamsOverview` — All teams overview
- `GET /GetTeamsPerformance` — Team performance metrics

### Dashboard (`/api/France/Web/Dashboard`)
- `GET /weekly-performance` — Weekly perf (params: weeks, campaign_id, year)
- `GET /cluster-analytics` — Cluster analytics (params: weeks, campaign_id)
- `GET /campaigns` — Campaign list (params: year)
- `GET /daily-performance` — Daily perf (params: week, year, campaign_id)
- `GET /weekly-signup-ids` — Weekly signup IDs (params: week, year, campaign_id)

### Fundraiser (`/api/France/Web/Fundraiser`)
- `GET /GetFundraisersPerformance` — All fundraiser performance
- `GET /GetFundraisersKanban` — Kanban board data
- `GET /GetIndividualLiveStats` — Individual live stats
- `GET /GetMyFundraiserStats` — My stats
- `GET /GetMyTeamFundraiserStats` — My team's fundraiser stats
- `GET /GetTopPerformers` — Top performers
- `GET /GetFundraiserPerformanceDetails` — Detailed performance

### Quality (`/api/France/Web/Quality`)
- `GET /GetMyQualityData` — My quality data
- `GET /GetFundraisersPerformanceForPeriod` — Period performance
- `GET /SearchFundraisers` — Search fundraisers
- `GET /GetQualityMetricsReport` — Quality metrics report
- `GET /GetQualityCallsData` — Call quality data

### Salary (`/api/France/Web/Salary`)
- `GET /GetFundraisersSalaryData` — Salary data
- `GET /GetTeamLeadersBonus` — Team leader bonuses
- `GET /GetBonusReport` — Bonus report

### Arena (`/api/France/Web/Arena`)
- `GET /GetFundraisersLeaderboard` — Fundraiser leaderboard
- `GET /GetTeamsLeaderboard` — Team leaderboard
- `GET /GetTeamCupLeaderboard` — Team cup standings
- `GET /GetSpringChallengeLeaderboard` — Spring challenge

### Reports (`/api/France/Web/Reports`)
- `GET /GetRecruitmentReport` — Recruitment report
- `GET /GetRecruitmentOverviewReport` — Recruitment overview
- `GET /GetWeeklySignupsReport` — Weekly signups
- `GET /GetWeeklyQualityReport` — Weekly quality
- `GET /GetCampaignProductivity` — Campaign productivity
- `GET /GetAcquisitionForecast` — Acquisition forecast

### Users (`/api/France/Web/Users`)
- `GET /GetUsers` — List users
- `GET /GetAvatarByPersonId` — Avatar by person ID
- `GET /GetMyAvatar` — My avatar
- `PUT /UpdateMyAvatar` — Upload avatar

### Other
- `GET /Web/Organizations/GetOrganizations` — All organizations
- `GET /Web/Person/GetPersonRecord` — Person record by ID
- `GET /Web/Signups/GetSignupsList` — Signup list
- `GET /Web/Devices/GetDevicesList` — Device list
- `GET /Web/Devices/GetDeviceUserBySerial` — Device user by serial
- `GET /Users/GetMyFundraiserUser` — My user profile
- `GET /Users/GetMyFundraiserUserAvatar` — My avatar

### Partner (`/api/France/Partner/Dashboard`)
- `GET /overview` — Partner overview (params: org_id, year)
- `GET /teams` — Partner teams
- `GET /quality` — Partner quality
- `GET /deployment` — Partner deployment

### TV Mode (`/api/France/Web/TVMode`)
- `GET /GetTeamsPerformanceTV` — TV display performance
- `GET /GetLiveSignupsTV` — Live signup feed

### Tablet (`/Tablet`)
- `GET /GetMyUser` — Tablet user
- `GET /GetMyTeamAssignments` — My assignments
- `GET /GetAsset` — Asset by code
- `GET /GetMyProjects` — My projects
- `POST /UpdateMyPreferences` — Update preferences
- `POST /SubmitSignup` — Submit signup
- `GET /GetMyPrinter` — My printer

---

## Bottom Line

- **~15 existing backend endpoints** can replace mock data **right now** with just an auth layer
- **3 Supabase tables** already have schema + seed data ready for communes/housing/cars
- **Mairie, Zones, Activity Feed, WPlan metrics** need new endpoints (either .NET or Supabase)
- **Auth is the single blocker** — once MSAL is wired, everything unlocks
