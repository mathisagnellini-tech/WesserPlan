# WesserPlan - Developer Guide

## What is WesserPlan?

WesserPlan is a **field operations management platform** built for French NGOs (MSF, UNICEF, WWF, MDM). It helps fundraising/outreach teams plan, track, and optimize their door-to-door campaigns across French communes.

**Core features:**
- **Dashboard** — Home page with search, time display, language selector
- **Nos Communes** — Prospect tracking: cities visited, contact status, conversion history
- **Relations Mairie** — City hall relationship management, progression stages, communication logs
- **DataWiz** — Interactive GeoJSON map with real INSEE statistics (income, unemployment, density, etc.)
- **Zone Maker** — Draw custom geographic zones on a map, with AI-powered cluster analysis (Gemini)
- **Team Planner** — Kanban-style mission board for team coordination
- **Operations** — Housing & vehicle logistics, smart matching, fuel/cost tracking
- **Upload** — CSV/file import for communes, mairies, housing, vehicles, targets
- **Settings** — Dark mode, notifications, data export/import, API keys

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript 5.8 |
| Build | Vite 6.2 |
| Styling | Tailwind CSS 4.2 (with custom dark mode via CSS variables) |
| Icons | Lucide React |
| Maps | Leaflet 1.9.4 + Leaflet.Draw (loaded via CDN) |
| Charts | Chart.js 4.4 |
| Backend | Supabase (PostgreSQL) |
| AI | Google Gemini (`gemini-3-flash-preview`) for zone analysis |
| Deployment | Vercel |

---

## Getting Started

```bash
# Clone
git clone https://github.com/mathisagnellini-tech/WesserPlan.git
cd WesserPlan

# Install dependencies
npm install

# Set up environment variables (see below)
cp .env.example .env

# Run dev server (port 3000)
npm run dev

# Build for production
npm run build

# Type check
npm run lint

# Seed database
npm run seed
```

### Environment Variables

Create a `.env` file at the root:

```env
VITE_SUPABASE_URL=https://bcefdhuazozmiklokfte.supabase.co
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
GEMINI_API_KEY=<your-gemini-api-key>
```

---

## Project Structure

```
WesserPlan/
├── components/
│   ├── DashboardTab.tsx          # Home/search page
│   ├── CommunesTab.tsx           # Commune tracking (largest component)
│   ├── MairieTab.tsx             # City hall relations
│   ├── WplanTab.tsx              # DataWiz map + INSEE metrics
│   ├── OperationsTab.tsx         # Logistics (housing, vehicles)
│   ├── UploadTab.tsx             # File imports
│   ├── SettingsTab.tsx           # App settings
│   ├── team-planner/             # Kanban team management sub-app
│   └── zone-maker/               # Zone drawing + AI analysis sub-app
│       └── services/
│           └── geminiService.ts  # Google Gemini AI integration
├── data/
│   └── insee-departments.ts      # Real INSEE department statistics
├── lib/
│   └── supabase.ts               # Supabase client setup
├── constants.ts                  # Communes data, regions, events, context
├── types.ts                      # TypeScript type definitions
├── App.tsx                       # Main app shell + tab navigation
├── index.tsx                     # React root + ErrorBoundary
├── index.html                    # HTML entry (CDN scripts for Leaflet)
├── vite.config.ts                # Vite config
└── vercel.json                   # Deployment config
```

---

## Data Sources

### 1. INSEE Department Data (`data/insee-departments.ts`)

Real French national statistics for the **20 most populated departments** (expandable to 96).

Each department entry contains:

| Field | Source | Description |
|-------|--------|-------------|
| `population` | Recensement 2022 | Municipal population |
| `surface` | IGN | Area in km² |
| `density` | Computed | Inhabitants per km² |
| `medianIncome` | Filosofi 2021 | Median disposable income (€/year/CU) |
| `unemploymentRate` | BIT T4 2024 | Local unemployment rate (%) |
| `medianAge` | Recensement 2022 | Median age (years) |
| `ownershipRate` | Recensement 2022 | % primary residences owned |
| `povertyRate` | Filosofi 2021 | Poverty rate (%) |
| `macron2022T2` | Min. Intérieur | Macron % at 2022 presidential runoff |
| `urbanRate` | Recensement 2022 | % population in urban areas |

**To add more departments**, edit the `DEPARTMENT_INSEE_DATA` object in `data/insee-departments.ts`. The app falls back to hash-based coloring for departments not in the dataset.

**Helper functions:**
- `getDepartmentData(code)` — Get all data for a department
- `getMetricScore(code, metric)` — Normalized 0-100 score for map coloring
- `formatMetricValue(code, metric)` — Human-readable formatted value

### 2. GeoJSON (External)

Loaded at runtime from GitHub:
- **Regions**: `https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/regions.geojson`
- **Departments**: `https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/departements.geojson`

Source repo: [gregoiredavid/france-geojson](https://github.com/gregoiredavid/france-geojson)

### 3. Communes Data (`constants.ts`)

Sample data for ~25 communes across 4 NGOs, including:
- Name, department code, population, coordinates (lat/lng)
- Visit dates, status (`pas_demande`, `informe`, `refuse`, `telescope`, `fait`)
- Mayor name, revenue, contact info (email, phone)
- Visit history per organization

### 4. Supabase (Backend)

PostgreSQL database via Supabase for persistent storage of:
- Communes, mairies, housing, vehicles, operations, missions

Client setup in `lib/supabase.ts`.

---

## Map System (Leaflet)

Maps appear in 4 tabs: CommunesTab, WplanTab, OperationsTab, ZoneMaker.

**WplanTab (DataWiz)** is the main data visualization map:
- Loads France GeoJSON (regions + departments)
- Colors each department based on selected metric
- Available metrics: `density`, `income`, `unemployment`, `age`, `politics`, `urbanity`, `donors`, `visits`, `generosity_score`
- Click a region to zoom into its departments
- Popups show real INSEE values for departments in the dataset

**Leaflet is loaded via CDN** (see `index.html`), not npm. The global `L` object is used directly.

---

## AI Integration (Gemini)

Located in `components/zone-maker/services/geminiService.ts`.

Used for:
- Auto-naming zone clusters based on included communes
- Coherence analysis of drawn zones
- Shared services suggestions for zone planning

Model: `gemini-3-flash-preview`. Prompts are in French.

---

## Useful Commands

```bash
npm run dev        # Start dev server on port 3000
npm run build      # Production build
npm run lint       # TypeScript type checking
npm run preview    # Preview production build
npm run seed       # Seed the Supabase database
```

---

## GitHub

**Repository**: [mathisagnellini-tech/WesserPlan](https://github.com/mathisagnellini-tech/WesserPlan)
