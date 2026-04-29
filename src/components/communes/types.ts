import type { Feature, MultiPolygon, Point, Polygon } from 'geojson';

export interface ProspectHistoryItem {
    id: string;
    date: Date;
    communeCount: number;
    totalPop: number;
    zoneCount: string;
    communesList: { nom: string; lat: number; lng: number }[];
}

export interface CommuneFeatureProperties {
    nom: string;
    code: string;
    population: number;
    revenue: number;
    lat?: number;
    lng?: number;
    history?: Record<string, string>;
}

export type MapCommuneFeature = Feature<
    Polygon | MultiPolygon | Point,
    CommuneFeatureProperties
>;
