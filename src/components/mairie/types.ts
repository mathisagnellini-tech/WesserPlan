import { Organization } from '@/types/commune';

export interface Horaires {
    [key: string]: string[];
}

export interface Commentaire {
    id: string;
    date: string; // ISO string
    texte: string;
    isFavorite?: boolean;
}

export interface AutreContact {
    id: string;
    nom: string;
    numero: string;
    email?: string;
    type: 'tel' | 'mail';
}

export interface Mairie {
  id: number;
  nom: string;
  region: string;
  departement: string;
  organization: Organization;
  contact: {
      email: string;
      tel: string;
      nomContact?: string;
      fonctionContact?: string;
      autresContacts?: AutreContact[];
  };
  infos: {
      adresse: string;
      maire: string;
      digicode?: string;
      parking?: string;
      etage?: string;
  };
  horaires: Horaires;
  population: number;
  semaineDemandee: string;
  dateDemande: string;

  // Status & Progress
  etapeProgression: number; // 0 to 4 (index of ETAPES_PROGRESSION)
  statutGeneral: 'À traiter' | 'En cours' | 'Action requise' | 'Validé' | 'Refusé';

  commentaires: Commentaire[];
  zoneId?: string;

  // Multi-week series tracking
  serieId?: string;
}

export interface Zone {
    id: string;
    name: string;
    leader: string;
    organization: Organization | 'all';
    defaultDuration: number;
    startWeek: number;
}

export type ViewMode = 'list' | 'grid';
