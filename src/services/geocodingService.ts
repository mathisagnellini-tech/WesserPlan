// Geocoding via the free French government Base Adresse Nationale (BAN) API.
// https://api-adresse.data.gouv.fr/
//
// Used by the operations module to resolve a postal address into latitude /
// longitude before persisting a housing record. This avoids the previous
// hardcoded Bordeaux fallback that placed every new housing in the Atlantic.

export interface GeocodeResult {
  lat: number;
  lng: number;
  formattedLabel: string;
  postalCode?: string;
  city?: string;
}

interface BanFeature {
  geometry: { coordinates: [number, number] };
  properties: {
    label: string;
    postcode?: string;
    city?: string;
  };
}

interface BanResponse {
  features?: BanFeature[];
}

export async function geocodeAddress(query: string): Promise<GeocodeResult | null> {
  if (!query || query.trim().length < 3) return null;
  try {
    const url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=1`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as BanResponse;
    const f = data.features?.[0];
    if (!f) return null;
    const [lng, lat] = f.geometry.coordinates;
    return {
      lat,
      lng,
      formattedLabel: f.properties.label,
      postalCode: f.properties.postcode,
      city: f.properties.city,
    };
  } catch {
    return null;
  }
}
