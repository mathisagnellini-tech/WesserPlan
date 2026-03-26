import type { TargetZone } from './types';

export const getDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lng2 - lng1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

// Estimation: (Distance Logement <-> Zone * 2 (A/R) * 6 jours) / Autonomie (~800km)
export const estimateFuelStops = (housingLat: number, housingLng: number, zoneLat: number, zoneLng: number) => {
    const distOneWay = getDistance(housingLat, housingLng, zoneLat, zoneLng);
    const weeklyKm = (distOneWay * 2 * 6) * 1.2;
    const tankRange = 800;
    return {
        stops: Math.ceil((weeklyKm / tankRange) * 10) / 10,
        km: Math.round(weeklyKm),
        distOneWay: Math.round(distOneWay)
    };
};

export const getWeekNumberLabel = (dateString: string) => {
    const date = new Date(dateString);
    if(isNaN(date.getTime())) return "S--";
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `S${weekNo}-${d.getUTCFullYear()}`;
};

export const MOCK_ZONES: TargetZone[] = [
    { id: 'z1', name: 'Zone S42 - Strasbourg Nord', lat: 48.62, lng: 7.77, radius: 15 },
    { id: 'z2', name: 'Zone S42 - Colmar Vignoble', lat: 48.08, lng: 7.35, radius: 20 },
    { id: 'z3', name: 'Zone S43 - Mulhouse Agglo', lat: 47.75, lng: 7.33, radius: 10 },
    { id: 'z4', name: 'Zone S43 - Rennes Centre', lat: 48.11, lng: -1.67, radius: 12 },
];
