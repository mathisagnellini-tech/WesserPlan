# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WesserPlan is a French municipal planning and operations management tool built as a single-page React app. It manages communes, city hall relations, housing/vehicle operations, team scheduling, and geographic zone planning. The app is in French.

## Commands

```bash
npm run dev            # Dev server on port 3000 (host 0.0.0.0)
npm run build          # Production build → dist/
npm run lint           # TypeScript type-check (tsc --noEmit)
npm run preview        # Preview production build
npm test               # Run Vitest test suite once (jsdom env)
npm run test:watch     # Vitest in watch mode
npm run test:coverage  # Vitest with v8 coverage report
```

Tests live alongside source as `*.test.ts` / `*.spec.ts` (e.g. `src/services/clusteringService.test.ts`). Run a single test file with `npx vitest run path/to/file.test.ts`.

## Tech Stack

- **React 19** + **TypeScript 5.8** + **Vite 6**
- **Tailwind CSS v4** (via `@tailwindcss/vite` plugin)
- **React Router v7** for URL-based routing
- **Zustand** for global state management (theme, UI state)
- **Supabase** for database (PostgreSQL) — service layer in place, components mid-migration from mocks
- **MSAL** (`@azure/msal-react`) for Microsoft/Entra authentication via `AuthProvider`
- **Google Gemini API** (`@google/genai`) for AI analysis (zone-maker clustering)
- **Vitest** + **jsdom** for testing
- **PapaParse** + **xlsx** + **Zod** for upload/import flows
- **Leaflet** + **react-leaflet** + Leaflet Draw for maps (bundled via npm, CSS via CDN)
- **Chart.js** + **react-chartjs-2** for charts (bundled via npm)
- **Lucide React** for icons
- Deployed on **Vercel**

## Architecture

### Source Structure

All source code lives under `src/` with a layer-based organization:

```
src/
├── app/                    — App shell, router, layouts
│   ├── App.tsx             — BrowserRouter + RouterProvider
│   ├── routes.tsx          — Route definitions (lazy-loaded pages)
│   └── layouts/
│       └── MainLayout.tsx  — Navbar + Outlet + mobile nav
│
├── components/             — UI components organized by domain
│   ├── ui/                 — Shared: ErrorBoundary
│   ├── auth/               — AuthProvider (MSAL/Entra wrapper)
│   ├── navigation/         — TopNavbar, MobileSidebar, MobileBottomNav, MobileHeader, navConfig
│   ├── communes/           — CommunesTab (commune list, map, editor)
│   ├── dashboard/          — DashboardTab (KPIs, charts, map)
│   ├── mairie/             — MairieTab (city hall relations)
│   ├── wplan/              — WplanTab (data analysis, charts, DataSourceBadge)
│   ├── operations/         — OperationsTab (housing, vehicles, SmartMatcher)
│   ├── settings/           — SettingsTab, UploadTab
│   ├── team-planner/       — Self-contained Kanban module (types, hooks, sub-components)
│   └── zone-maker/         — Geographic clustering module (types, constants, MapCanvas)
│
├── pages/                  — Route-level components (thin wrappers, lazy-loaded)
├── hooks/                  — Shared custom hooks
├── stores/                 — Zustand stores (themeStore, uiStore)
├── services/               — Data access layer: per-domain services (communes, cars, housings,
│                             mairie, dashboard, teams, teamPlanner, organization, fundraiser,
│                             activity, upload, user, geocoding, weather) + clustering/gemini AI
├── types/                  — Type definitions (commune.ts, navigation.ts)
├── constants/              — Static data (communes, departments, inseeDepartments, organizations,
│                             status, regions, dataLibrary)
├── mocks/                  — Mock data generators (dashboard, mairie, operations) — used by
│                             services as fallbacks while Supabase migration is in progress
├── lib/                    — Third-party client init (supabase.ts)
├── main.tsx                — Entry point
└── styles.css              — Tailwind import
```

### Navigation & Routing

React Router v7 with `createBrowserRouter`. Routes defined in `src/app/routes.tsx`. All pages are lazy-loaded via `React.lazy()` for code splitting.

- `MainLayout` wraps all routes except team-planner (provides navbar + `<Outlet />`)
- Team-planner renders full-screen at `/team-planner` (outside MainLayout)
- Desktop: top navbar with pill buttons
- Mobile: sidebar drawer + bottom nav bar

Routes: `/` (dashboard), `/communes`, `/mairie`, `/wplan`, `/zone-maker`, `/team-planner`, `/operations`, `/upload`, `/settings`

### State Management

- **Zustand** stores for shared state: `useThemeStore` (dark mode), `useUiStore` (mobile menu)
- Each tab component manages its own local state via `useState` (domain stores planned for future)
- Theme persisted to `localStorage` key `wesserplan-theme`

### Theming

CSS variables defined in `index.html` for light/dark modes. Accent color is `#FF5B2B` (orange). The `.dark` class on `<html>` toggles dark mode variables. Tailwind classes reference these variables.

### Path Alias

`@/*` maps to `src/` (configured in both `vite.config.ts` and `tsconfig.json`).

### Database & Service Layer

Schema in `supabase/schema.sql`: tables for `communes`, `housings`, `cars` with row-level security. Seed data in `supabase/seed.sql`. Client in `src/lib/supabase.ts`.

Each domain has its own service module in `src/services/` (e.g. `communesService`, `housingsService`, `mairieService`). Services encapsulate data access — components import from services rather than calling Supabase directly. During the mock-to-Supabase migration, services may fall back to data from `src/mocks/`; check the specific service to see whether it's wired live.

### Environment Variables

Injected through Vite's `define` (see `vite.config.ts`):
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — Supabase client
- `GEMINI_API_KEY` — exposed as both `process.env.API_KEY` and `process.env.GEMINI_API_KEY`
- `VITE_API_BASE_URL` — backend API base URL (Plan namespace, see memory)

### External Libraries

Leaflet CSS and Leaflet Draw CSS are loaded via CDN in `index.html`. All JavaScript libraries are bundled via npm (leaflet, react-leaflet, chart.js, react-chartjs-2, etc.).

### Planning Documents

`docs/FINISH_PLAN.md` and `docs/INTEGRATION_PLAN.md` track the active migration roadmap (mocks → Supabase, backend integration). Consult them before making structural changes.
