// Communes table does not exist in the WESSER DASHBOARD Supabase project.
// Town hall data lives in `town_hall_entries` and is accessed via mairieService.
// This service returns empty arrays so useCommunesData falls back to mock data cleanly.

import type { Commune } from '@/types';
import type { Organization, CommuneStatus } from '@/types/commune';

export const communesService = {
  async getByOrganization(_org: Organization): Promise<Commune[]> {
    return [];
  },

  async getAll(): Promise<Commune[]> {
    return [];
  },

  async getById(_id: number): Promise<Commune | null> {
    return null;
  },

  async update(_id: number, _updates: Partial<{
    statut: CommuneStatus;
    email: string;
    phone: string;
    maire: string;
    passage: string;
  }>): Promise<Commune | null> {
    return null;
  },

  async create(_commune: {
    nom: string;
    departement: string;
    population: number;
    lat: number;
    lng: number;
    organisation: Organization;
  }): Promise<Commune> {
    throw new Error('Communes table not available');
  },

  async batchCreate(_communes: Array<{
    nom: string;
    departement: string;
    population: number;
    lat: number;
    lng: number;
    organisation: Organization;
  }>): Promise<Commune[]> {
    throw new Error('Communes table not available');
  },
};
