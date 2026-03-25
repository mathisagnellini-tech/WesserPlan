# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WesserPlan is a French municipal planning and operations management tool built as a single-page React app. It manages communes, city hall relations, housing/vehicle operations, team scheduling, and geographic zone planning. The app is in French.

## Commands

```bash
npm run dev      # Dev server on port 3000
npm run build    # Production build → dist/
npm run lint     # TypeScript type-check (tsc --noEmit)
npm run preview  # Preview production build
```

## Tech Stack

- **React 19** + **TypeScript 5.8** + **Vite 6**
- **Tailwind CSS v4** (via `@tailwindcss/vite` plugin)
- **Supabase** for database (PostgreSQL)
- **Google Gemini API** for AI analysis (zone-maker clustering)
- **Leaflet.js** + Leaflet Draw for maps (loaded as externals in index.html)
- **Chart.js** for charts (loaded as external in index.html)
- **Lucide React** for icons
- Deployed on **Vercel**

## Architecture

### Navigation & Routing

No React Router. Tab-based SPA controlled by `activeTab` state in `App.tsx`. Tabs render via a `switch` in `renderTabContent()`. Nine main tabs: dashboard, communes, mairie, wplan, zone-maker, team-planner, operations, upload, settings.

Desktop uses a top navbar with pill buttons; mobile uses a sidebar drawer + bottom nav bar. The team-planner tab renders full-screen (hides the main navbar).

### State Management

No global state library. Each tab manages its own local state via `useState`. Theme (dark mode) is persisted to `localStorage` key `wesserplan-theme`. Supabase client in `lib/supabase.ts` handles database calls.

### Component Structure

- `App.tsx` — main shell: navbar, tab routing, theme toggle
- `components/` — one large file per tab (CommunesTab, MairieTab, OperationsTab are 57-75KB each)
- `components/team-planner/` — self-contained team scheduling module with its own types, constants, and sub-components (Kanban board, inspector panel, map view, command palette)
- `components/zone-maker/` — geographic clustering module with clustering algorithm (`clusteringService.ts`) and Gemini AI integration (`geminiService.ts`)
- `types.ts` + `constants.ts` — shared type definitions and data constants (communes, departments, organizations)

### Theming

CSS variables defined in `index.html` for light/dark modes. Accent color is `#FF5B2B` (orange). The `.dark` class on `<html>` toggles dark mode variables. Tailwind classes reference these variables.

### Path Alias

`@/*` maps to the project root (configured in both `vite.config.ts` and `tsconfig.json`).

### Database

Schema in `supabase/schema.sql`: tables for `communes`, `housings`, `cars` with row-level security. Seed data in `supabase/seed.sql`. Auto-updated `updated_at` timestamps via triggers.

### Environment Variables

Required: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `GEMINI_API_KEY` (injected via Vite's `define`).

### External Libraries (CDN)

Leaflet, Leaflet Draw, and Chart.js are loaded via `<script>` tags in `index.html`, not bundled. They are available as globals.
