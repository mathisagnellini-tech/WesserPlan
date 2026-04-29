import { computeIsoWeek } from '@/lib/isoWeek';

export { MOCK_ZONES } from '@/mocks/operationsMocks';

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
    if (isNaN(date.getTime())) return "S--";
    const weekNo = computeIsoWeek(date);
    // Anchor the year at the Thursday of the same ISO week so that
    // late-December / early-January dates report the correct ISO year.
    const utc = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    utc.setUTCDate(utc.getUTCDate() + 4 - (utc.getUTCDay() || 7));
    return `S${weekNo}-${utc.getUTCFullYear()}`;
};
