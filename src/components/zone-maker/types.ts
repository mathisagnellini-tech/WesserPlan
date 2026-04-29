
export interface GeoFeature {
  type: "Feature";
  id: string;
  properties: {
    code: string;
    nom: string;
    population: number;
  };
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: number[][][] | number[][][][];
  };
}

export type CommuneStatus = 'ASKED' | 'NON_ASKED' | 'DONE' | 'REFUSED' | 'TELESCOPED' | 'TO_ASK';

export interface Commune {
  id: string;
  name: string;
  population: number;
  feature: GeoFeature;
  neighbors: string[];
  centroid?: [number, number];
  status: CommuneStatus;
}

export interface Cluster {
  id: string;
  code: string;
  customSuffix?: string;
  communes: Commune[];
  totalPopulation: number;
  color: string;
  durationWeeks: number;
  startWeek: number;
  assignedTeam: number;
  sortLat: number;
  isPinned?: boolean;
  isBonus?: boolean; // Identifie les zones sous les 7000 hab.
}

export interface TeamConfig {
    teamId: number;
    startWeek: number;
}

export interface ClusteringResult {
  clusters: Cluster[];
  unclustered: Commune[];
}

export interface MoveConfirmation {
  communeId: string;
  communeName: string;
  communePop: number;
  sourceClusterId: string;
  sourceClusterCode: string;
  targetClusterId: string;
  targetClusterCode: string;
  impact: any;
}

export interface ManualMoveConfirmation {
  targetClusterId: string;
  targetClusterCode: string;
  oldWeek: number;
  newWeek: number;
  oldTeam: number;
  newTeam: number;
  impactedClusters: any[];
  newSchedule: Cluster[];
}

export interface ScheduleImpact {
  clusterId: string;
  code: string;
  oldStartWeek: number;
  newStartWeek: number;
  oldTeam: number;
  newTeam: number;
}

export interface ScheduleChangeConfirmation {
  targetClusterId: string;
  targetClusterCode: string;
  oldDuration: number;
  newDuration: number;
  impactedClusters: ScheduleImpact[];
  newSchedule: Cluster[];
}
