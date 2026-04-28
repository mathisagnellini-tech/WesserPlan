import type { Organization } from '@/types/commune';

// Canonical org metadata — mirrors WesserDashboard's brand-colors.js,
// organization-utils.js (partNo) and organization-logos.js (logo asset).
// Logo files live under /public/orgs and are referenced by absolute path
// (Vite serves /public at root).
export interface OrgInfo {
  id: Organization;
  /** Human-friendly full name. */
  name: string;
  /** Short label used in chips / buttons. */
  shortName: string;
  /** WesserDashboard partNo identifier (matches OrganizationNo prefix in CRM). */
  partNo: number;
  /** Brand colour — used for zones, pins, dots. */
  color: string;
  /** Public asset path of the org logo. */
  logo: string;
}

export const ORGANIZATIONS: Record<Organization, OrgInfo> = {
  msf: {
    id: 'msf',
    name: 'Médecins Sans Frontières',
    shortName: 'MSF',
    partNo: 33,
    color: '#E74C3C',
    logo: '/orgs/MSF.png',
  },
  unicef: {
    id: 'unicef',
    name: 'UNICEF France',
    shortName: 'UNICEF',
    partNo: 39,
    color: '#00AEEF',
    logo: '/orgs/UNICEF.png',
  },
  mdm: {
    id: 'mdm',
    name: 'Médecins du Monde',
    shortName: 'MDM',
    partNo: 34,
    color: '#1565C0',
    logo: '/orgs/MDM.jpg',
  },
  wwf: {
    id: 'wwf',
    name: 'WWF France',
    shortName: 'WWF',
    partNo: 37,
    color: '#4CAF50',
    logo: '/orgs/WWF.jpg',
  },
  aides: {
    id: 'aides',
    name: 'AIDES',
    shortName: 'AIDES',
    partNo: 32,
    color: '#DA1D52',
    logo: '/orgs/AIDES.png',
  },
  armeedusalut: {
    id: 'armeedusalut',
    name: 'Armée du Salut',
    shortName: 'Armée du Salut',
    partNo: 35,
    color: '#D52B1E',
    logo: '/orgs/ARMEDUSALUT.png',
  },
};

export const ORG_LIST: Organization[] = ['msf', 'unicef', 'mdm', 'wwf', 'aides', 'armeedusalut'];

export const ORG_FALLBACK_COLOR = '#FF5B2B';

export function orgColor(org: Organization | string | null | undefined): string {
  if (!org) return ORG_FALLBACK_COLOR;
  return ORGANIZATIONS[org as Organization]?.color ?? ORG_FALLBACK_COLOR;
}

export function orgLogo(org: Organization | string | null | undefined): string | null {
  if (!org) return null;
  return ORGANIZATIONS[org as Organization]?.logo ?? null;
}

export function orgShortName(org: Organization | string | null | undefined): string {
  if (!org) return '—';
  return ORGANIZATIONS[org as Organization]?.shortName ?? String(org).toUpperCase();
}
