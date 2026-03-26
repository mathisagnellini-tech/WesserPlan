export interface Housing {
  id: string;
  name: string;
  date: string;
  lead: string;
  region: string;
  dept: string;
  org: string;
  people: number;
  nights: number;
  cost: number;
  channel: string;
  address: string;
  owner: string;
  ownerName: string;
  rating: number;
  comment: string;
  lat: number;
  lng: number;
  amenities: string[];
  // Smart Match properties (dynamic)
  _matchScore?: number;
  _matchDistance?: number;
  _matchLabel?: string;
  _matchColor?: string;
}

export interface CarType {
  id: string;
  plate: string;
  brand: string;
  where: string;
  km: number;
  service: string;
  owner: string;
  lat: number;
  lng: number;
  fuelStats: {
    declared: number;
    tankSize: number;
  };
  damages?: { date: string; description: string; author: string }[];
}

export interface TargetZone {
    id: string;
    name: string;
    lat: number;
    lng: number;
    radius: number; // km
}

export interface GeoApiCommune {
    nom: string;
    code: string;
    departement: {
        code: string;
        nom: string;
    };
    centre: {
        coordinates: [number, number];
    };
}
