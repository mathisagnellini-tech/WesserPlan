import { ORGANIZATIONS } from '@/constants/organizations';
import type { Organization } from '@/types/commune';

export interface TeamData {
    id: string;
    name: string;
    coords: [number, number];
    /** Brand colour — used for the pin tail, border, and fallback fill. */
    color: string;
    /** Public asset path of the org logo, or null when unknown. */
    logo: string | null;
    /** Short org label — used for alt text and fallback initials. */
    orgShort: string;
    leader: string;
    housing: string;
    car: string;
    weather: { t: number; c: string; icon: string };
}

export interface GlobalWeather {
    temp: number;
    condition: string;
    walking: 'Excellente' | 'Bonne' | 'Difficile' | 'Extreme';
}

export function generateTeamsData(): { teams: TeamData[]; weather: GlobalWeather } {
    const orgIds: Organization[] = ['wwf', 'msf', 'mdm', 'unicef'];

    const bounds = { latMin: 44.0, latMax: 49.0, lngMin: -0.5, lngMax: 6.5 };
    const leaders = ['Thomas', 'Sarah', 'Julie', 'Marc', 'Lucas', 'Emma', 'Hugo', 'Chloe'];
    const housingAddresses = [
        "12 Rue des Fleurs, Lyon", "5 Av. Jean Jaures, Strasbourg", "Gite du Lac, Annecy",
        "Appart'Hotel Centre, Nantes", "Camping des Pins, Bordeaux", "Maison Bleue, Lille",
        "Residence Etudiante, Toulouse", "Villa des Roses, Nice"
    ];
    const carPlates = [
        "GB-123-HZ", "AA-999-BB", "ET-404-OK", "XW-007-JB",
        "FY-555-RR", "KL-888-MP", "ZE-111-AZ", "PO-222-MN"
    ];
    const weathers = [
        { t: 18, c: "Ensoleille", icon: "sun" },
        { t: 14, c: "Nuageux", icon: "cloud" },
        { t: 9, c: "Pluvieux", icon: "rain" },
        { t: 22, c: "Grand Soleil", icon: "sunny" },
        { t: 11, c: "Vent", icon: "wind" }
    ];

    const teamsData: TeamData[] = [];

    orgIds.forEach((orgId, idx) => {
        const org = ORGANIZATIONS[orgId];
        for (let i = 0; i < 2; i++) {
            const w = weathers[Math.floor(Math.random() * weathers.length)];
            teamsData.push({
                id: `${orgId}-${i}`,
                name: `Equipe ${org.shortName} ${i + 1}`,
                coords: [
                    bounds.latMin + Math.random() * (bounds.latMax - bounds.latMin),
                    bounds.lngMin + Math.random() * (bounds.lngMax - bounds.lngMin)
                ],
                color: org.color,
                logo: org.logo,
                orgShort: org.shortName,
                leader: leaders[(idx * 2 + i) % leaders.length],
                housing: housingAddresses[(idx * 2 + i) % housingAddresses.length],
                car: carPlates[(idx * 2 + i) % carPlates.length],
                weather: w
            });
        }
    });

    const avgTemp = Math.round(teamsData.reduce((acc, t) => acc + t.weather.t, 0) / teamsData.length);
    let walkCond: GlobalWeather['walking'] = 'Bonne';
    if (avgTemp > 25) walkCond = 'Difficile';
    else if (avgTemp < 5) walkCond = 'Extreme';
    else if (avgTemp >= 15 && avgTemp <= 22) walkCond = 'Excellente';

    const conditions = teamsData.map(t => t.weather.c);
    const domCond = conditions.sort((a, b) =>
        conditions.filter(v => v === a).length - conditions.filter(v => v === b).length
    ).pop() || '-';

    return {
        teams: teamsData,
        weather: { temp: avgTemp, condition: domCond, walking: walkCond }
    };
}
