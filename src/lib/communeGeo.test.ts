import { describe, expect, it } from 'vitest';
import type { MultiPolygon, Point, Polygon } from 'geojson';
import { bounds, firstVertex, zoneEstimateFromPopulation } from './communeGeo';

describe('firstVertex', () => {
  it('returns the first vertex of a Polygon', () => {
    const g: Polygon = {
      type: 'Polygon',
      coordinates: [[[2.35, 48.86], [2.36, 48.87], [2.34, 48.85], [2.35, 48.86]]],
    };
    expect(firstVertex(g)).toEqual({ lng: 2.35, lat: 48.86 });
  });

  it('returns the first vertex of the first ring of a MultiPolygon', () => {
    const g: MultiPolygon = {
      type: 'MultiPolygon',
      coordinates: [
        [[[1.0, 50.0], [1.1, 50.1]]],
        [[[2.0, 51.0], [2.1, 51.1]]],
      ],
    };
    expect(firstVertex(g)).toEqual({ lng: 1.0, lat: 50.0 });
  });

  it('handles a Point geometry', () => {
    const g: Point = { type: 'Point', coordinates: [4.84, 45.76] };
    expect(firstVertex(g)).toEqual({ lng: 4.84, lat: 45.76 });
  });

  it('returns null for malformed input', () => {
    expect(firstVertex({ type: 'Polygon', coordinates: [] } as unknown as Polygon)).toBeNull();
    expect(firstVertex({ type: 'Polygon', coordinates: [[]] } as unknown as Polygon)).toBeNull();
  });
});

describe('bounds', () => {
  it('computes min/max without spreading the array', () => {
    const b = bounds([
      { lat: 48.85, lng: 2.35 },
      { lat: 49.0, lng: 2.4 },
      { lat: 48.7, lng: 2.1 },
    ]);
    expect(b).toEqual({ minLat: 48.7, maxLat: 49.0, minLng: 2.1, maxLng: 2.4 });
  });

  it('returns null for an empty array', () => {
    expect(bounds([])).toBeNull();
  });

  it('handles single-point input', () => {
    expect(bounds([{ lat: 1, lng: 2 }])).toEqual({ minLat: 1, maxLat: 1, minLng: 2, maxLng: 2 });
  });
});

describe('zoneEstimateFromPopulation', () => {
  it('divides by the 8000 hab. heuristic and formats to 1 decimal', () => {
    expect(zoneEstimateFromPopulation(8000)).toBe('1.0');
    expect(zoneEstimateFromPopulation(20000)).toBe('2.5');
    expect(zoneEstimateFromPopulation(0)).toBe('0.0');
  });
});
