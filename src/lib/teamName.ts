// Backend `teamName` is a concatenated string in the form
// `S{week} - {ORG} - {Department} - {Leader}`, e.g.
// "S18 - WWF - Seine-Maritime - Maeva C". Split on " - " (space-dash-space)
// so department names that contain plain hyphens (Seine-Maritime,
// Côtes-d'Armor) survive intact.

import { departmentCapitals, departmentMap } from '@/constants/departments';

export interface ParsedTeamName {
  weekLabel?: string;
  org?: string;
  department?: string;
  leader?: string;
}

export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    // Strip combining diacritical marks (U+0300..U+036F). Using \u escapes
    // (not literal combining chars) so the source is robust to encoding.
    .replace(new RegExp('[\\u0300-\\u036f]', 'g'), '')
    .trim();
}

export function parseTeamName(raw: string): ParsedTeamName {
  if (!raw) return {};
  const parts = raw.split(' - ').map((p) => p.trim()).filter(Boolean);
  if (parts.length < 4) {
    return { leader: raw };
  }
  const [weekLabel, orgRaw, ...rest] = parts;
  const leader = rest.pop();
  const department = rest.join(' - ');
  return {
    weekLabel,
    org: orgRaw.toLowerCase(),
    department,
    leader,
  };
}

const departmentNameToCode: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const [code, name] of Object.entries(departmentMap)) {
    map[normalizeName(name)] = code;
  }
  return map;
})();

export function deptCodeForName(name: string | undefined): string | undefined {
  if (!name) return undefined;
  return departmentNameToCode[normalizeName(name)];
}

export function deptCodeForCoords(lat: number, lng: number): string | undefined {
  let bestCode: string | undefined;
  let bestDist = Infinity;
  for (const [code, cap] of Object.entries(departmentCapitals)) {
    const dx = cap.lat - lat;
    const dy = cap.lng - lng;
    const d = dx * dx + dy * dy;
    if (d < bestDist) {
      bestDist = d;
      bestCode = code;
    }
  }
  return bestCode;
}
