export type Organization = 'msf' | 'unicef' | 'wwf' | 'mdm' | 'aides' | 'armeedusalut';

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
  medianIncome?: number;
  povertyRate?: number;
  postalCode?: string;
  address?: string;
  horaires?: string;
  inseeCode?: string;
}

export interface DepartmentMap {
  [key: string]: string;
}

export interface StatusMap {
  [key: string]: { text: string; color: string; bg: string };
}
