# WesserPlan Codebase Restructuring Design

**Date:** 2026-03-25
**Status:** Approved
**Goal:** Restructure the codebase to follow best architecture practices while keeping mock data and existing functionality intact.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Approach | Clean architecture first | Reorganize before wiring real data |
| Folder structure | Layer-based with `src/` | Simple, fits project size |
| Component breakdown | Components + hooks + services | Full separation of concerns |
| State management | Zustand | Lightweight, per-domain slices, works outside React |
| Navigation | React Router | URL-based routing, deep linking, browser history |
| CDN libraries | Bundle via npm | Proper types, tree-shaking, cleaner imports |

## Execution Strategy

Big bang with parallel agents:
1. **Sequential:** Create `src/` skeleton, install deps, set up Router + Zustand config
2. **Parallel:** Dispatch agents per domain (communes, dashboard, mairie, wplan, operations, team-planner, zone-maker, settings/upload)
3. **Sequential:** Integration pass — wire into App.tsx, fix imports, verify build

## Target Folder Structure

```
src/
├── app/
│   ├── App.tsx              — Router setup + layout shell
│   ├── routes.tsx           — Route definitions
│   └── layouts/
│       └── MainLayout.tsx   — Navbar + <Outlet />
│
├── components/
│   ├── ui/                  — Shared: buttons, modals, cards, tags
│   ├── maps/                — Leaflet map wrappers
│   ├── charts/              — Chart.js wrappers
│   ├── communes/            — CommunesList, CommuneCard, CommuneFilters, CommuneMap, CommuneEditor
│   ├── dashboard/           — KpiCards, ActivityChart, RecentActivity
│   ├── mairie/
│   ├── wplan/
│   ├── operations/
│   ├── team-planner/        — BoardColumn, PersonCard, InspectorPanel, etc.
│   ├── zone-maker/          — MapCanvas, ClusterInspector, etc.
│   └── settings/
│
├── hooks/                   — Shared custom hooks
│   ├── useTheme.ts
│   ├── useKeyboardShortcut.ts
│   └── useUndoRedo.ts
│
├── stores/                  — Zustand stores
│   ├── themeStore.ts
│   ├── communesStore.ts
│   ├── teamStore.ts
│   ├── zoneStore.ts
│   ├── operationsStore.ts
│   └── uiStore.ts
│
├── services/                — Data access layer (mock now, Supabase later)
│   ├── communesService.ts
│   ├── teamService.ts
│   ├── zoneService.ts
│   ├── operationsService.ts
│   └── geminiService.ts
│
├── pages/                   — Route-level components (thin wrappers)
│   ├── DashboardPage.tsx
│   ├── CommunesPage.tsx
│   ├── MairiePage.tsx
│   ├── WplanPage.tsx
│   ├── OperationsPage.tsx
│   ├── TeamPlannerPage.tsx
│   ├── ZoneMakerPage.tsx
│   ├── UploadPage.tsx
│   └── SettingsPage.tsx
│
├── types/                   — Type definitions split by domain
│   ├── commune.ts
│   ├── team.ts
│   ├── zone.ts
│   ├── operations.ts
│   └── index.ts
│
├── constants/               — Static data & config
│   ├── communes.ts
│   ├── departments.ts
│   ├── organizations.ts
│   └── index.ts
│
├── mocks/                   — Mock data generators (isolated from prod code)
│   ├── teamMocks.ts
│   ├── communesMocks.ts
│   └── zoneMocks.ts
│
├── lib/                     — Third-party client init
│   └── supabase.ts
│
├── styles.css
└── main.tsx                 — Entry point

```

## Routing

- React Router v7 with `createBrowserRouter`
- `MainLayout` wraps all routes except team-planner (full-screen)
- `NavLink` replaces custom active-tab logic
- Team-planner at `/team-planner` outside MainLayout

## State Management

- One Zustand store per domain: `useCommunesStore`, `useTeamStore`, `useZoneStore`, etc.
- `useThemeStore` for dark mode (replaces localStorage + useState)
- `useUiStore` for cross-cutting UI state (sidebar open, modals)
- Stores call services for data operations

## Service Layer

- One service file per domain with async methods
- Services return mock data now, swap to Supabase calls later
- Mock data generators isolated in `src/mocks/`

## Page Components

- Thin wrappers that compose domain components
- Load data via store actions in `useEffect`
- No business logic in pages

## npm Migrations

- `leaflet` + `@types/leaflet` + `react-leaflet` replaces CDN Leaflet
- `chart.js` + `react-chartjs-2` replaces CDN Chart.js
- `react-router-dom` for routing
- `zustand` for state management
- Remove CDN `<script>` tags from `index.html`
