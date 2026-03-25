import { Home, Building, Mail, Database, Truck, Settings, Upload, Users, Compass, Menu } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface TabConfig {
  id: string;
  label: string;
  icon: LucideIcon;
  path: string;
}

export const tabConfig: TabConfig[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/' },
  { id: 'communes', label: 'Nos Communes', icon: Building, path: '/communes' },
  { id: 'mairie', label: 'Relations Mairie', icon: Mail, path: '/mairie' },
  { id: 'wplan', label: 'DataWiz', icon: Database, path: '/wplan' },
  { id: 'zone-maker', label: 'Zone Maker', icon: Compass, path: '/zone-maker' },
  { id: 'team-planner', label: 'Team Planner', icon: Users, path: '/team-planner' },
  { id: 'operations', label: 'Op\u00e9rations', icon: Truck, path: '/operations' },
];

export const secondaryTabs: TabConfig[] = [
  { id: 'upload', label: 'Upload', icon: Upload, path: '/upload' },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
];

export const mobileBottomTabs: TabConfig[] = [
  { id: 'dashboard', label: 'Home', icon: Home, path: '/' },
  { id: 'communes', label: 'Communes', icon: Building, path: '/communes' },
  { id: 'operations', label: 'Ops', icon: Truck, path: '/operations' },
  { id: 'team-planner', label: 'Team', icon: Users, path: '/team-planner' },
  { id: 'settings', label: 'Plus', icon: Menu, path: '/settings' },
];
