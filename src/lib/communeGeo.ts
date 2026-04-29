import type { Feature, Geometry, Polygon, MultiPolygon, Point } from 'geojson';

export interface CommuneFeatureProps {
  nom: string;
  code: string;
  population: number;
  revenue: number;
  lat?: number;
  lng?: number;
  history?: Record<string, string>;
}

export type CommuneFeature = Feature<Polygon | MultiPolygon | Point, CommuneFeatureProps>;

// Best-effort centroid for a feature — picks the first vertex of the first ring
// of the first polygon. The original code assumed a Polygon-with-coordinates[0]
// shape and crashed on MultiPolygon (which legitimate French communes can be —
// any commune split across non-contiguous islands or enclaves).
export function firstVertex(geometry: Geometry): { lat: number; lng: number } | null {
  if (!geometry) return null;
  switch (geometry.type) {
    case 'Polygon': {
      const ring = geometry.coordinates?.[0];
      const v = ring?.[0];
      if (Array.isArray(v) && typeof v[0] === 'number' && typeof v[1] === 'number') {
        return { lng: v[0], lat: v[1] };
      }
      return null;
    }
    case 'MultiPolygon': {
      const ring = geometry.coordinates?.[0]?.[0];
      const v = ring?.[0];
      if (Array.isArray(v) && typeof v[0] === 'number' && typeof v[1] === 'number') {
        return { lng: v[0], lat: v[1] };
      }
      return null;
    }
    case 'Point': {
      const c = geometry.coordinates;
      if (Array.isArray(c) && typeof c[0] === 'number' && typeof c[1] === 'number') {
        return { lng: c[0], lat: c[1] };
      }
      return null;
    }
    default:
      return null;
  }
}

// Average min/max bounds for an array of points without spreading into Math.min
// (which call-stack-overflows for very large arrays).
export function bounds(points: { lat: number; lng: number }[]):
  | { minLat: number; maxLat: number; minLng: number; maxLng: number }
  | null {
  if (points.length === 0) return null;
  let minLat = points[0].lat;
  let maxLat = points[0].lat;
  let minLng = points[0].lng;
  let maxLng = points[0].lng;
  for (let i = 1; i < points.length; i++) {
    const { lat, lng } = points[i];
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
  }
  return { minLat, maxLat, minLng, maxLng };
}

// Population → estimated number of full-time-equivalent zones, using the
// 8 000 hab. heuristic the product team uses elsewhere.
export const ZONE_POPULATION_BUCKET = 8000;
export function zoneEstimateFromPopulation(pop: number): string {
  return (pop / ZONE_POPULATION_BUCKET).toFixed(1);
}
