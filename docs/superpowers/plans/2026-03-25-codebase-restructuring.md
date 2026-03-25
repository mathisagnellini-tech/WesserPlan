# WesserPlan Codebase Restructuring — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the WesserPlan codebase from flat root layout to a layer-based `src/` architecture with React Router, Zustand, npm-bundled libraries, and clean separation of components/hooks/services.

**Architecture:** Layer-based folder structure under `src/`. Each domain (communes, team-planner, zone-maker, etc.) gets its own components, but hooks/services/stores/types live in shared top-level directories. React Router replaces tab-switching. Zustand replaces per-component useState for shared state. Leaflet and Chart.js move from CDN to npm.

**Tech Stack:** React 19, TypeScript 5.8, Vite 6, Tailwind CSS v4, React Router v7, Zustand, react-leaflet, react-leaflet-draw, react-chartjs-2, chartjs-plugin-datalabels, Lucide React

**Deferred to future phases:**
- Domain-specific Zustand stores (`communesStore`, `teamStore`, `zoneStore`, `operationsStore`) — each tab keeps its local `useState` for now; converting to Zustand stores is a separate effort
- Custom hooks (`useKeyboardShortcut`, `useUndoRedo`) — these will be extracted when the team-planner patterns are generalized to other pages

---

## File Structure

### New files to create

```
src/
├── main.tsx                          — Entry point (move from index.tsx)
├── styles.css                        — Tailwind import (move from styles.css)
├── vite-env.d.ts                     — Vite type declarations
│
├── app/
│   ├── App.tsx                       — BrowserRouter + routes
│   ├── routes.tsx                    — Route config array
│   └── layouts/
│       └── MainLayout.tsx            — Navbar + Outlet + mobile nav
│
├── components/
│   ├── ui/
│   │   └── ErrorBoundary.tsx         — Extracted from index.tsx
│   ├── navigation/
│   │   ├── TopNavbar.tsx             — Desktop navbar (extracted from App.tsx)
│   │   ├── MobileSidebar.tsx         — Mobile drawer (extracted from App.tsx)
│   │   ├── MobileBottomNav.tsx       — Bottom nav (extracted from App.tsx)
│   │   ├── MobileHeader.tsx          — Mobile header (extracted from App.tsx)
│   │   └── navConfig.ts             — Tab configs (extracted from App.tsx)
│   ├── communes/                     — Extracted from CommunesTab.tsx
│   ├── dashboard/                    — Extracted from DashboardTab.tsx
│   ├── mairie/                       — Extracted from MairieTab.tsx
│   ├── wplan/                        — Extracted from WplanTab.tsx
│   ├── operations/                   — Extracted from OperationsTab.tsx
│   ├── team-planner/                 — Move from components/team-planner/
│   ├── zone-maker/                   — Move from components/zone-maker/
│   └── settings/                     — Extracted from SettingsTab.tsx
│
├── pages/
│   ├── DashboardPage.tsx
│   ├── CommunesPage.tsx
│   ├── MairiePage.tsx
│   ├── WplanPage.tsx
│   ├── ZoneMakerPage.tsx
│   ├── TeamPlannerPage.tsx
│   ├── OperationsPage.tsx
│   ├── UploadPage.tsx
│   └── SettingsPage.tsx
│
├── hooks/                            — (empty for now, populated as patterns emerge)
│
├── stores/
│   ├── themeStore.ts                 — Dark mode state via Zustand
│   └── uiStore.ts                    — Mobile menu, active UI state
│
├── services/                         — Data access (mock for now)
│   └── communesService.ts
│
├── types/
│   ├── commune.ts                    — Commune, CommuneStatus, etc.
│   ├── navigation.ts                 — TabName
│   └── index.ts                      — Re-exports
│
├── constants/
│   ├── communes.ts                   — communesData
│   ├── departments.ts                — departmentMap, departmentToRegionMap
│   ├── status.ts                     — statusMap
│   ├── regions.ts                    — regionalContextData, eventData
│   ├── dataLibrary.ts                — dataLibraryData
│   └── index.ts                      — Re-exports
│
├── mocks/                            — Mock data (team-planner generators, etc.)
│   └── index.ts
│
└── lib/
    └── supabase.ts                   — Move from lib/supabase.ts
```

### Files to modify
- `index.html` — Remove CDN scripts, update entry point path to `src/main.tsx`
- `vite.config.ts` — Update `@` alias to point to `src/`
- `tsconfig.json` — Update paths to `src/`
- `package.json` — Add new dependencies

### Files to delete (after migration)
- Root `App.tsx`, `index.tsx`, `types.ts`, `constants.ts`, `styles.css`
- Root `lib/` directory
- Root `components/` directory

---

## Phase 1: Foundation (Sequential — must be done first)

### Task 1: Install dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install runtime dependencies**

```bash
npm install react-router-dom zustand leaflet react-leaflet react-leaflet-draw leaflet-draw leaflet-providers chart.js react-chartjs-2 chartjs-plugin-datalabels @supabase/supabase-js
```

- [ ] **Step 2: Install type dependencies**

```bash
npm install -D @types/leaflet @types/leaflet-draw @types/leaflet.markercluster
```

- [ ] **Step 3: Verify install succeeded**

```bash
npm ls react-router-dom zustand leaflet react-leaflet react-leaflet-draw chart.js react-chartjs-2 chartjs-plugin-datalabels
```
Expected: All packages listed without errors.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add react-router, zustand, leaflet, chart.js npm packages"
```

---

### Task 2: Create `src/` directory skeleton

**Files:**
- Create: All directories under `src/`

- [ ] **Step 1: Create the full directory tree**

```bash
mkdir -p src/{app/layouts,components/{ui,navigation,communes,dashboard,mairie,wplan,operations,settings,team-planner/components,zone-maker/services},pages,hooks,stores,services,types,constants,mocks,lib}
```

- [ ] **Step 2: Verify structure**

```bash
find src -type d | sort
```
Expected: All directories listed.

- [ ] **Step 3: Commit**

```bash
git add src/
git commit -m "chore: create src/ directory skeleton" --allow-empty
```

---

### Task 3: Update build config to use `src/`

**Files:**
- Modify: `vite.config.ts`
- Modify: `tsconfig.json`
- Modify: `index.html`

- [ ] **Step 1: Update vite.config.ts**

Change the alias from project root to `src/`:

```typescript
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react(), tailwindcss()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
        'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, 'src'),
        }
      },
    };
});
```

- [ ] **Step 2: Update tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "experimentalDecorators": true,
    "useDefineForClassFields": false,
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "types": ["node"],
    "moduleResolution": "bundler",
    "isolatedModules": true,
    "moduleDetection": "force",
    "allowJs": true,
    "jsx": "react-jsx",
    "paths": {
      "@/*": ["./src/*"]
    },
    "allowImportingTsExtensions": true,
    "noEmit": true
  },
  "include": ["src", "."]
}
```

Note: `"include"` uses both `"src"` and `"."` during the transition. In Task 16 (after deleting old root files), change this to `"include": ["src"]` only.
```

- [ ] **Step 3: Update index.html entry point**

Change the script tag from:
```html
<script type="module" src="/index.tsx"></script>
```
To:
```html
<script type="module" src="/src/main.tsx"></script>
```

Also remove ALL CDN script/link tags for Leaflet, Leaflet Draw, and Chart.js (lines 14-23 of index.html). Keep the Google Fonts link.

Remove these lines:
```html
<!-- Leaflet -->
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet-providers/1.13.0/leaflet-providers.min.js"></script>
<!-- Leaflet Draw -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.css"/>
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.js"></script>
<!-- Chart.js -->
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0"></script>
<script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.2.0/dist/chartjs-plugin-datalabels.min.js"></script>
```

Keep Leaflet CSS and Leaflet Draw CSS via CDN (react-leaflet expects them):
```html
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.css"/>
```

Note: Only the CSS stays on CDN. All JS is bundled via npm.

- [ ] **Step 4: Commit**

```bash
git add vite.config.ts tsconfig.json index.html
git commit -m "chore: update build config to use src/ directory"
```

---

### Task 4: Move and split foundational files into `src/`

**Files:**
- Create: `src/main.tsx`
- Create: `src/styles.css`
- Create: `src/vite-env.d.ts`
- Create: `src/types/commune.ts`
- Create: `src/types/navigation.ts`
- Create: `src/types/index.ts`
- Create: `src/constants/communes.ts`
- Create: `src/constants/departments.ts`
- Create: `src/constants/status.ts`
- Create: `src/constants/regions.ts`
- Create: `src/constants/dataLibrary.ts`
- Create: `src/constants/index.ts`
- Create: `src/lib/supabase.ts`

- [ ] **Step 1: Create src/vite-env.d.ts**

```typescript
/// <reference types="vite/client" />
```

- [ ] **Step 2: Create src/styles.css**

```css
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));
```

- [ ] **Step 3: Create src/types/commune.ts**

```typescript
export type Organization = 'msf' | 'unicef' | 'wwf' | 'mdm';

export type CommuneStatus = 'pas_demande' | 'informe' | 'refuse' | 'telescope' | 'fait';

export interface Commune {
  id: number;
  nom: string;
  departement: string;
  population: number;
  passage: string;
  statut: CommuneStatus;
  maire: string;
  revenue: string;
  lat: number;
  lng: number;
  email?: string;
  phone?: string;
  historiquePassages?: Record<string, string[]>;
}

export interface DepartmentMap {
  [key: string]: string;
}

export interface StatusMap {
  [key: string]: { text: string; color: string; bg: string };
}
```

- [ ] **Step 4: Create src/types/navigation.ts**

```typescript
export type TabName = 'dashboard' | 'communes' | 'mairie' | 'wplan' | 'zone-maker' | 'team-planner' | 'operations' | 'upload' | 'settings';
```

- [ ] **Step 5: Create src/types/index.ts**

```typescript
export * from './commune';
export * from './navigation';
```

- [ ] **Step 6: Create src/constants/communes.ts**

Copy `communesData` from root `constants.ts` into this file:

```typescript
import { Commune, Organization } from '@/types';

export const communesData: Record<Organization, Commune[]> = {
  // ... (exact copy of the communesData object from root constants.ts)
};
```

- [ ] **Step 7: Create src/constants/departments.ts**

```typescript
import { DepartmentMap } from '@/types';

export const departmentMap: DepartmentMap = { /* exact copy from root constants.ts */ };

export const departmentToRegionMap: Record<string, string> = { /* exact copy from root constants.ts */ };
```

- [ ] **Step 8: Create src/constants/status.ts**

```typescript
import { StatusMap } from '@/types';

export const statusMap: StatusMap = {
  'pas_demande': { text: 'Pas demandé', color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800' },
  'informe': { text: 'Informé', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  'refuse': { text: 'Refusé', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' },
  'telescope': { text: 'Téléscopé', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  'fait': { text: 'Faites', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30' }
};
```

- [ ] **Step 9: Create src/constants/regions.ts**

```typescript
export const regionalContextData = { /* exact copy from root constants.ts */ };

export const eventData = [ /* exact copy from root constants.ts */ ];
```

- [ ] **Step 10: Create src/constants/dataLibrary.ts**

```typescript
export const dataLibraryData = { /* exact copy from root constants.ts */ };
```

- [ ] **Step 11: Create src/constants/index.ts**

```typescript
export * from './communes';
export * from './departments';
export * from './status';
export * from './regions';
export * from './dataLibrary';
```

- [ ] **Step 12: Create src/lib/supabase.ts**

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

- [ ] **Step 13: Commit**

```bash
git add src/
git commit -m "feat: add types, constants, lib, and styles to src/"
```

---

### Task 5: Create stores and navigation components

**Files:**
- Create: `src/stores/themeStore.ts`
- Create: `src/stores/uiStore.ts`
- Create: `src/components/ui/ErrorBoundary.tsx`
- Create: `src/components/navigation/navConfig.ts`
- Create: `src/components/navigation/TopNavbar.tsx`
- Create: `src/components/navigation/MobileSidebar.tsx`
- Create: `src/components/navigation/MobileBottomNav.tsx`
- Create: `src/components/navigation/MobileHeader.tsx`

- [ ] **Step 1: Create src/stores/themeStore.ts**

```typescript
import { create } from 'zustand';

interface ThemeState {
  isDark: boolean;
  toggle: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  isDark: document.documentElement.classList.contains('dark'),

  toggle: () => set((state) => {
    const html = document.documentElement;
    html.classList.add('theme-transition');
    if (state.isDark) {
      html.classList.remove('dark');
      localStorage.setItem('wesserplan-theme', 'light');
    } else {
      html.classList.add('dark');
      localStorage.setItem('wesserplan-theme', 'dark');
    }
    setTimeout(() => html.classList.remove('theme-transition'), 350);
    return { isDark: !state.isDark };
  }),

  setTheme: (theme) => set(() => {
    const html = document.documentElement;
    html.classList.add('theme-transition');
    if (theme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
    localStorage.setItem('wesserplan-theme', theme);
    setTimeout(() => html.classList.remove('theme-transition'), 350);
    return { isDark: theme === 'dark' };
  }),
}));
```

- [ ] **Step 2: Create src/stores/uiStore.ts**

```typescript
import { create } from 'zustand';

interface UiState {
  isMobileMenuOpen: boolean;
  openMobileMenu: () => void;
  closeMobileMenu: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  isMobileMenuOpen: false,
  openMobileMenu: () => set({ isMobileMenuOpen: true }),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),
}));
```

- [ ] **Step 3: Create src/components/ui/ErrorBoundary.tsx**

```tsx
import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('App Error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, fontFamily: 'Inter, sans-serif' }}>
          <h1 style={{ color: '#ef4444' }}>Erreur de chargement</h1>
          <pre style={{ background: '#f1f5f9', padding: 16, borderRadius: 8, overflow: 'auto' }}>
            {this.state.error?.message}
            {'\n\n'}
            {this.state.error?.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
```

- [ ] **Step 4: Create src/components/navigation/navConfig.ts**

```typescript
import { Home, Building, Mail, Database, Truck, Settings, Upload, Users, Compass, Menu } from 'lucide-react';

export const tabConfig = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/' },
  { id: 'communes', label: 'Nos Communes', icon: Building, path: '/communes' },
  { id: 'mairie', label: 'Relations Mairie', icon: Mail, path: '/mairie' },
  { id: 'wplan', label: 'DataWiz', icon: Database, path: '/wplan' },
  { id: 'zone-maker', label: 'Zone Maker', icon: Compass, path: '/zone-maker' },
  { id: 'team-planner', label: 'Team Planner', icon: Users, path: '/team-planner' },
  { id: 'operations', label: 'Opérations', icon: Truck, path: '/operations' },
] as const;

export const secondaryTabs = [
  { id: 'upload', label: 'Upload', icon: Upload, path: '/upload' },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
] as const;

export const mobileBottomTabs = [
  { id: 'dashboard', label: 'Home', icon: Home, path: '/' },
  { id: 'communes', label: 'Communes', icon: Building, path: '/communes' },
  { id: 'operations', label: 'Ops', icon: Truck, path: '/operations' },
  { id: 'team-planner', label: 'Team', icon: Users, path: '/team-planner' },
  { id: 'settings', label: 'Plus', icon: Menu, path: '/settings' },
] as const;
```

- [ ] **Step 5: Create src/components/navigation/TopNavbar.tsx**

Extract the TopNavbar component from the current `App.tsx` (lines 72-191). Replace `activeTab`/`onTabChange` props with `useNavigate()`/`useLocation()` from React Router, and `isDark`/`onToggleTheme` with `useThemeStore()`.

```tsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Settings, ChevronDown, Moon, Sun, User } from 'lucide-react';
import { useThemeStore } from '@/stores/themeStore';
import { tabConfig, secondaryTabs } from './navConfig';

export const TopNavbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, toggle } = useThemeStore();
  const [showMore, setShowMore] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setShowMore(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isActivePath = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="hidden md:block fixed top-0 left-0 right-0 z-50">
      <div className="bg-[var(--bg-main)]/80 backdrop-blur-2xl border-b border-[var(--border-subtle)]">
        <div className="max-w-[1920px] mx-auto flex items-center h-16 px-6 gap-6">
          {/* Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center text-white font-black text-lg shadow-lg shadow-[var(--accent-primary)]/20">
              W
            </div>
            <span className="font-extrabold text-lg tracking-tight text-[var(--text-primary)] whitespace-nowrap">
              Wesser Plan
            </span>
          </div>

          {/* Main Tabs */}
          <nav className="flex items-center bg-[var(--bg-card)]/60 backdrop-blur-xl rounded-2xl p-1.5 border border-[var(--border-color)] shadow-sm mx-auto">
            {tabConfig.map((tab) => {
              const isActive = isActivePath(tab.path);
              return (
                <button
                  key={tab.id}
                  onClick={() => navigate(tab.path)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-250 ease-out
                    ${isActive
                      ? 'bg-[var(--accent-primary)] text-white shadow-md shadow-[var(--accent-primary)]/25'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-solid)]/60'
                    }`}
                >
                  <tab.icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative" ref={moreRef}>
              <button
                onClick={() => setShowMore(!showMore)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200
                  ${secondaryTabs.some(t => isActivePath(t.path))
                    ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-solid)]'
                  }`}
              >
                <Settings size={16} />
                <ChevronDown size={14} className={`transition-transform duration-200 ${showMore ? 'rotate-180' : ''}`} />
              </button>
              {showMore && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-[var(--bg-card-solid)] border border-[var(--border-subtle)] rounded-2xl shadow-xl overflow-hidden z-50">
                  {secondaryTabs.map((tab) => {
                    const isActive = isActivePath(tab.path);
                    return (
                      <button
                        key={tab.id}
                        onClick={() => { navigate(tab.path); setShowMore(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-colors
                          ${isActive
                            ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card)]/60 hover:text-[var(--text-primary)]'
                          }`}
                      >
                        <tab.icon size={16} />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              onClick={toggle}
              className="p-2.5 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-solid)] transition-all duration-200"
              title={isDark ? 'Mode clair' : 'Mode sombre'}
            >
              {isDark ? <Sun size={18} className="text-amber-500" /> : <Moon size={18} className="text-orange-400" />}
            </button>

            <div className="relative ml-1">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center text-white border-2 border-white/20 shadow-md cursor-pointer hover:scale-105 transition-transform">
                <User size={16} />
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-[var(--bg-main)] rounded-full"></span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
```

- [ ] **Step 6: Create remaining navigation components**

Create `MobileSidebar.tsx`, `MobileBottomNav.tsx`, `MobileHeader.tsx` following the same pattern — extract from `App.tsx`, replace props with React Router hooks and Zustand stores.

- [ ] **Step 7: Commit**

```bash
git add src/stores/ src/components/ui/ src/components/navigation/
git commit -m "feat: add Zustand stores and navigation components"
```

---

### Task 6: Create Router, Layout, and App shell

**Files:**
- Create: `src/app/routes.tsx`
- Create: `src/app/layouts/MainLayout.tsx`
- Create: `src/app/App.tsx`
- Create: `src/main.tsx`

- [ ] **Step 1: Create src/app/routes.tsx**

```tsx
import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';

const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const CommunesPage = lazy(() => import('@/pages/CommunesPage'));
const MairiePage = lazy(() => import('@/pages/MairiePage'));
const WplanPage = lazy(() => import('@/pages/WplanPage'));
const ZoneMakerPage = lazy(() => import('@/pages/ZoneMakerPage'));
const TeamPlannerPage = lazy(() => import('@/pages/TeamPlannerPage'));
const OperationsPage = lazy(() => import('@/pages/OperationsPage'));
const UploadPage = lazy(() => import('@/pages/UploadPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'communes', element: <CommunesPage /> },
      { path: 'mairie', element: <MairiePage /> },
      { path: 'wplan', element: <WplanPage /> },
      { path: 'zone-maker', element: <ZoneMakerPage /> },
      { path: 'operations', element: <OperationsPage /> },
      { path: 'upload', element: <UploadPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
  {
    path: '/team-planner',
    element: <TeamPlannerPage />,
  },
];
```

- [ ] **Step 2: Create src/app/layouts/MainLayout.tsx**

```tsx
import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { TopNavbar } from '@/components/navigation/TopNavbar';
import { MobileHeader } from '@/components/navigation/MobileHeader';
import { MobileSidebar } from '@/components/navigation/MobileSidebar';
import { MobileBottomNav } from '@/components/navigation/MobileBottomNav';
import { useUiStore } from '@/stores/uiStore';

export const MainLayout: React.FC = () => {
  const { isMobileMenuOpen, openMobileMenu, closeMobileMenu } = useUiStore();

  return (
    <div className="min-h-screen bg-[var(--bg-main)] overflow-hidden relative">
      <TopNavbar />
      <MobileHeader onMenuPress={openMobileMenu} />
      <MobileSidebar isOpen={isMobileMenuOpen} onClose={closeMobileMenu} />

      <main className="transition-all duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)] relative min-h-screen h-screen overflow-y-auto pl-0 pt-14 pb-20 md:pt-16 md:pb-0 md:pl-0">
        <div className="color-orb"></div>
        <div className="p-4 md:p-8 max-w-[1920px] mx-auto pb-24 md:pb-24">
          <Suspense fallback={
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-primary)]"></div>
            </div>
          }>
            <Outlet />
          </Suspense>
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
};
```

- [ ] **Step 3: Create src/app/App.tsx**

```tsx
import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { routes } from './routes';

const router = createBrowserRouter(routes);

const App: React.FC = () => {
  return <RouterProvider router={router} />;
};

export default App;
```

- [ ] **Step 4: Create src/main.tsx**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';
import App from './app/App';
import { ErrorBoundary } from './components/ui/ErrorBoundary';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
```

- [ ] **Step 5: Commit**

```bash
git add src/app/ src/main.tsx
git commit -m "feat: add React Router, MainLayout, and App shell"
```

---

## Phase 2: Page Migration (Parallel — one agent per domain)

Each task in this phase is independent and can be executed in parallel. Each agent:
1. Reads the original monolithic component
2. Creates a thin page wrapper in `src/pages/`
3. Moves/adapts the component to `src/components/<domain>/`
4. Updates all imports to use `@/` paths
5. Replaces `declare const L: any` with proper Leaflet imports where applicable
6. Replaces `window.Chart` / `new Chart(...)` with react-chartjs-2 components where applicable

### Task 7: Migrate Dashboard

**Files:**
- Create: `src/pages/DashboardPage.tsx`
- Move + split: `components/DashboardTab.tsx` → `src/components/dashboard/`

- [ ] **Step 1: Read `components/DashboardTab.tsx` (568 lines)**

Understand the component structure, identify sub-sections that can be extracted into smaller components.

- [ ] **Step 2: Create page wrapper `src/pages/DashboardPage.tsx`**

```tsx
import React from 'react';
import { DashboardTab } from '@/components/dashboard/DashboardTab';

export default function DashboardPage() {
  return <DashboardTab />;
}
```

- [ ] **Step 3: Move DashboardTab to `src/components/dashboard/DashboardTab.tsx`**

Copy the component, update all imports to use `@/` paths. Remove the `isActive` prop (it's always active when this route renders). Replace any `window.Chart` usage with react-chartjs-2 imports.

- [ ] **Step 4: Verify the file compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/pages/DashboardPage.tsx src/components/dashboard/
git commit -m "feat: migrate DashboardTab to src/components/dashboard"
```

---

### Task 8: Migrate Communes

**Files:**
- Create: `src/pages/CommunesPage.tsx`
- Move + split: `components/CommunesTab.tsx` (1,308 lines) → `src/components/communes/`

This is the largest component. Break it down:

- [ ] **Step 1: Read `components/CommunesTab.tsx` fully**

Identify logical sub-components: list view, card, filters, map, detail editor, stats section.

- [ ] **Step 2: Create sub-components in `src/components/communes/`**

Extract into separate files based on what the code reveals. Likely candidates:
- `CommunesTab.tsx` — main orchestrator (state + layout)
- `CommuneCard.tsx` — individual commune card
- `CommuneFilters.tsx` — search/filter bar
- `CommuneMap.tsx` — Leaflet map (replace `declare const L: any` with react-leaflet)
- `CommuneEditor.tsx` — edit/detail modal
- `CommuneStats.tsx` — stats summary section

- [ ] **Step 3: Create page wrapper**

```tsx
import React from 'react';
import { CommunesTab } from '@/components/communes/CommunesTab';

export default function CommunesPage() {
  return <CommunesTab />;
}
```

- [ ] **Step 4: Update all imports to `@/` paths**

Replace `import { Commune } from '../types'` → `import { Commune } from '@/types'`
Replace `import { communesData } from '../constants'` → `import { communesData } from '@/constants'`
Replace `declare const L: any` → `import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'`

- [ ] **Step 5: Verify build**

```bash
npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add src/pages/CommunesPage.tsx src/components/communes/
git commit -m "feat: migrate and split CommunesTab into src/components/communes"
```

---

### Task 9: Migrate Mairie

**Files:**
- Create: `src/pages/MairiePage.tsx`
- Move: `components/MairieTab.tsx` (539 lines) → `src/components/mairie/`

- [ ] **Step 1: Read `components/MairieTab.tsx`**
- [ ] **Step 2: Move to `src/components/mairie/MairieTab.tsx`, update imports**
- [ ] **Step 3: Create `src/pages/MairiePage.tsx` wrapper**
- [ ] **Step 4: Verify build, commit**

---

### Task 10: Migrate WPlan/DataWiz

**Files:**
- Create: `src/pages/WplanPage.tsx`
- Move + split: `components/WplanTab.tsx` (1,044 lines) → `src/components/wplan/`

- [ ] **Step 1: Read `components/WplanTab.tsx`**

Identify chart sections, data views, filters. Replace `window.Chart` usage with react-chartjs-2.

- [ ] **Step 2: Split into sub-components**
- [ ] **Step 3: Create page wrapper, update imports**
- [ ] **Step 4: Verify build, commit**

---

### Task 11: Migrate Operations

**Files:**
- Create: `src/pages/OperationsPage.tsx`
- Move: `components/OperationsTab.tsx` (703 lines) → `src/components/operations/`

- [ ] **Step 1: Read, move, split, update imports**
- [ ] **Step 2: Replace `declare const L: any` with react-leaflet imports (same pattern as Communes)**
- [ ] **Step 3: Create page wrapper**
- [ ] **Step 4: Verify build, commit**

---

### Task 12: Migrate Team Planner

**Files:**
- Create: `src/pages/TeamPlannerPage.tsx`
- Move: `components/team-planner/` → `src/components/team-planner/`

This module is already well-structured. Main work is moving and updating imports.

- [ ] **Step 1: Move entire `components/team-planner/` directory to `src/components/team-planner/`**
- [ ] **Step 2: Update all internal imports to `@/` paths**

In `TeamPlannerApp.tsx` and all sub-components, replace relative imports:
```
'../types' → '@/components/team-planner/types'
'./constants' → '@/components/team-planner/constants'
'./components/Navbar' → '@/components/team-planner/components/Navbar'
```

- [ ] **Step 3: Move mock data generators to `src/mocks/teamMocks.ts`**

Extract `generatePerson()`, `generateBoard()`, `generateAlumni()`, `generateIncomingPeople()` from `team-planner/constants.ts` into `src/mocks/teamMocks.ts`. Keep static constants (NGO_COLORS, CITIES, etc.) in `team-planner/constants.ts`.

- [ ] **Step 4: Create page wrapper**

```tsx
import React from 'react';
import TeamPlannerApp from '@/components/team-planner/TeamPlannerApp';

export default function TeamPlannerPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-main)] overflow-hidden relative">
      <main className="h-screen overflow-y-auto">
        <div className="h-full">
          <TeamPlannerApp />
        </div>
      </main>
    </div>
  );
}
```

Note: TeamPlannerPage renders outside MainLayout (no navbar) — this is handled by the route config.

- [ ] **Step 5: Verify build, commit**

---

### Task 13: Migrate Zone Maker

**Files:**
- Create: `src/pages/ZoneMakerPage.tsx`
- Move: `components/zone-maker/` → `src/components/zone-maker/`

- [ ] **Step 1: Move directory, update imports**
- [ ] **Step 2: Replace `declare const L: any` with react-leaflet imports in MapCanvas.tsx**
- [ ] **Step 3: Move services to `src/services/`**

Move both `geminiService.ts` and `clusteringService.ts` from `components/zone-maker/services/` to `src/services/`. Update imports in ZonePlanner and ZoneMakerApp.
- [ ] **Step 4: Create page wrapper**
- [ ] **Step 5: Verify build, commit**

---

### Task 14: Migrate Upload & Settings

**Files:**
- Create: `src/pages/UploadPage.tsx`, `src/pages/SettingsPage.tsx`
- Move: `components/UploadTab.tsx` → `src/components/settings/UploadTab.tsx`
- Move: `components/SettingsTab.tsx` → `src/components/settings/SettingsTab.tsx`

- [ ] **Step 1: Move both small components**

For SettingsTab, replace the `isDark`/`onSetTheme` props with `useThemeStore()`.

- [ ] **Step 2: Create page wrappers**
- [ ] **Step 3: Verify build, commit**

---

## Phase 3: Integration & Cleanup (Sequential)

### Task 15: Wire everything together and verify

**Files:**
- Verify: All `src/` files compile
- Verify: App loads and all routes work

- [ ] **Step 1: Run TypeScript check**

```bash
npx tsc --noEmit
```

Fix any remaining import errors.

- [ ] **Step 2: Run dev server**

```bash
npm run dev
```

- [ ] **Step 3: Test each route manually**

Navigate to: `/`, `/communes`, `/mairie`, `/wplan`, `/zone-maker`, `/team-planner`, `/operations`, `/upload`, `/settings`

Verify each page renders without errors.

- [ ] **Step 4: Test dark mode toggle**

Verify theme toggle works from navbar and persists on refresh.

- [ ] **Step 5: Test mobile navigation**

Resize browser or use devtools mobile view. Verify sidebar drawer, bottom nav, and mobile header work.

- [ ] **Step 6: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve integration issues from restructuring"
```

---

### Task 16: Delete old root files

**Files:**
- Delete: `App.tsx`, `index.tsx`, `types.ts`, `constants.ts`, `styles.css`
- Delete: `lib/` directory
- Delete: `components/` directory

- [ ] **Step 1: Verify no imports reference old paths**

```bash
grep -r "from '\.\./types'" src/ || echo "Clean"
grep -r "from '\.\./constants'" src/ || echo "Clean"
grep -r "from '\.\./App'" src/ || echo "Clean"
```

- [ ] **Step 2: Delete old files**

```bash
rm App.tsx index.tsx types.ts constants.ts styles.css vite-env.d.ts
rm -rf lib/ components/
```

- [ ] **Step 3: Update tsconfig.json include to src only**

Change `"include": ["src", "."]` to `"include": ["src"]`.

- [ ] **Step 4: Verify build still passes**

```bash
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove old root-level source files after migration to src/"
```

---

### Task 17: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Update CLAUDE.md to reflect the new architecture**

Update sections: Architecture, Component Structure, Path Alias, Navigation & Routing to reflect:
- `src/` based structure
- React Router routing
- Zustand stores
- Layer-based component organization
- npm-bundled Leaflet and Chart.js

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md to reflect new src/ architecture"
```

---

### Task 18: Final verification

- [ ] **Step 1: Production build**

```bash
npm run build
```
Expected: Build succeeds with no errors.

- [ ] **Step 2: Preview production build**

```bash
npm run preview
```

Test all routes work in the production build.

- [ ] **Step 3: Lint check**

```bash
npm run lint
```
Expected: No TypeScript errors.

- [ ] **Step 4: Commit any final fixes**
