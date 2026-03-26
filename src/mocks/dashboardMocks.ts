
export interface TeamData {
    id: string;
    name: string;
    coords: [number, number];
    color: string;
    icon: string;
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

// SVG Icons for map markers
const svgs = {
    wwf: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7h6V5a3 3 0 0 0-3-3Z"/><path d="M19 8a3 3 0 0 0-3 3v4h6v-4a3 3 0 0 0-3-3Z"/><path d="M5 8a3 3 0 0 0-3 3v4h6v-4a3 3 0 0 0-3-3Z"/><path d="M12 14a5 5 0 0 0-5 5v2a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-2a5 5 0 0 0-5-5Z"/></svg>`,
    msf: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>`,
    mdm: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`,
    unicef: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15.5 20.5a3.5 3.5 0 1 0-7 0 3.5 3.5 0 0 0 7 0Z"/><path d="M12 17v-3"/><path d="M8 10a4 4 0 0 1 8 0"/></svg>`
};

export function generateTeamsData(): { teams: TeamData[]; weather: GlobalWeather } {
    const orgConfigs = [
        { id: 'wwf', color: '#16a34a', icon: svgs.wwf, name: 'WWF' },
        { id: 'msf', color: '#dc2626', icon: svgs.msf, name: 'MSF' },
        { id: 'mdm', color: '#1e3a8a', icon: svgs.mdm, name: 'MDM' },
        { id: 'unicef', color: '#38bdf8', icon: svgs.unicef, name: 'UNICEF' }
    ];

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

    orgConfigs.forEach((org, idx) => {
        for (let i = 0; i < 2; i++) {
            const w = weathers[Math.floor(Math.random() * weathers.length)];
            teamsData.push({
                id: `${org.id}-${i}`,
                name: `Equipe ${org.name} ${i + 1}`,
                coords: [
                    bounds.latMin + Math.random() * (bounds.latMax - bounds.latMin),
                    bounds.lngMin + Math.random() * (bounds.lngMax - bounds.lngMin)
                ],
                color: org.color,
                icon: org.icon,
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
