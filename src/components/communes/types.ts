export interface ProspectHistoryItem {
    id: string;
    date: Date;
    communeCount: number;
    totalPop: number;
    zoneCount: string;
    communesList: { nom: string; lat: number; lng: number }[];
}

export interface MapCommuneFeature {
    type: "Feature";
    geometry: any;
    properties: {
        nom: string;
        code: string;
        population: number;
        revenue: number;
        lat?: number;
        lng?: number;
        history?: Record<string, string>;
    };
}
