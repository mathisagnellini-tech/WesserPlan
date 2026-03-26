
import { BoardData, Column, Person, Relationship, WeekStatus } from '@/components/team-planner/types';

// --- MOCK DATA ARRAYS ---

const NGOS = ['UNICEF', 'MSF', 'Croix-Rouge', 'WWF', 'Greenpeace', 'Amnesty', 'AIDES', 'MdM', 'SPA', 'Action Contre la Faim'];
const CITIES = [
    'Paris', 'Lyon', 'Marseille', 'Bordeaux', 'Lille', 'Toulouse', 'Nantes', 'Strasbourg', 'Montpellier', 'Rennes',
    'Grenoble', 'Nice', 'Dijon', 'Angers', 'Nîmes', 'Clermont-Ferrand', 'Le Mans', 'Aix-en-Provence', 'Brest', 'Tours',
    'Amiens', 'Annecy', 'Limoges', 'Metz', 'Besançon'
];

const FIRST_NAMES = [
    'Lucas', 'Léa', 'Enzo', 'Manon', 'Hugo', 'Chloé', 'Thomas', 'Camille', 'Nathan', 'Océane',
    'Théo', 'Emma', 'Tom', 'Inès', 'Gabriel', 'Sarah', 'Léo', 'Jade', 'Mathis', 'Lola',
    'Maxime', 'Alice', 'Arthur', 'Eva', 'Louis', 'Juliette', 'Raphaël', 'Louise', 'Paul', 'Zoé',
    'Mohamed', 'Yasmina', 'Amine', 'Sofia', 'Youssef', 'Nour', 'Ibrahim', 'Fatima', 'Karim', 'Aïcha'
];

const LAST_NAMES = [
    'Martin', 'Bernard', 'Thomas', 'Petit', 'Robert', 'Richard', 'Durand', 'Dubois', 'Moreau', 'Laurent',
    'Simon', 'Michel', 'Lefebvre', 'Leroy', 'Roux', 'David', 'Bertrand', 'Morel', 'Fournier', 'Girard',
    'Bonnet', 'Dupont', 'Lambert', 'Fontaine', 'Rousseau', 'Vincent', 'Muller', 'Lefevre', 'Faure', 'Andre',
    'Benali', 'Diallo', 'Traoré', 'Kone', 'Sow', 'Ndiaye', 'Diop', 'Camara', 'Barry', 'Keita'
];

const PHOTOS = [
    '1507003211169-0a1dd7228f2d', '1500648767791-00dcc994a43e', '1494790108377-be9c29b29330', '1517841905240-472988babdf9',
    '1539571696357-5a69c17a67c6', '1463453091185-61582044d556', '1534528741775-53994a69daeb', '1524504388940-b1c1722653e1',
    '1506794778202-cad84cf45f1d', '1519345182560-3f2917c472ef', '1531123897727-8f129e1688ce', '1488426862026-3ee34a7d66df',
    '1544005313-94ddf0286df2', '1542206391-7f94928295ca', '1544717297-fa95b6ee9643', '1552058544-a298c6c60d5c',
    '1554151228-14d9def656ec', '1542596594-649edbc13630', '1547425260-76bcadfb4f2c', '1438761681033-6461ffad8d80'
];

const CAR_MODELS = [
    { model: 'Renault Trafic', plate: 'GB-123-CD' },
    { model: 'Peugeot Expert', plate: 'FF-999-ZZ' },
    { model: 'Citroën Jumpy', plate: 'AA-000-BB' },
    { model: 'Ford Transit', plate: 'WW-123-XX' },
    { model: 'Mercedes Vito', plate: 'AZ-456-ER' }
];

// --- BRAND IDENTITY COLORS ---
const NGO_COLORS: Record<string, string> = {
    'UNICEF': 'bg-cyan-500',
    'MSF': 'bg-red-600',
    'Croix-Rouge': 'bg-red-500',
    'WWF': 'bg-emerald-600',
    'Greenpeace': 'bg-green-600',
    'Amnesty': 'bg-yellow-500',
    'AIDES': 'bg-purple-600',
    'MdM': 'bg-cyan-500',
    'SPA': 'bg-orange-500',
    'Action Contre la Faim': 'bg-teal-700'
};

// --- UTILS ---

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomBool = (prob = 0.5) => Math.random() < prob;

// --- DATA GENERATORS ---

const generateMockNotes = (name: string, isLeader: boolean): any[] => {
    if (!randomBool(0.6)) return []; // 40% have no notes

    const notes = [];
    const count = randomInt(1, 4);

    const feedback = [
        "Très bonne énergie sur le terrain cette semaine.",
        "Doit travailler son pitch sur les 30 premières secondes.",
        "Excellent leadership lors du briefing matinal.",
        "A eu un différend avec un donateur, géré avec calme.",
        "Propose souvent de bonnes idées pour la logistique.",
        "Retard injustifié ce lundi, recadrage effectué."
    ];

    for (let i = 0; i < count; i++) {
        notes.push({
            id: `note-${Math.random()}`,
            date: `${randomInt(1, 28)}/${randomInt(1, 12)}/2024`,
            author: "Manager Régional",
            content: randomItem(feedback),
            type: randomItem(['feedback', 'note', 'conversation'])
        });
    }
    return notes;
};

const generatePlanning = (currentCity: string): { history: WeekStatus[], nextAvailability: string } => {
    const history: WeekStatus[] = [];

    // Past Weeks
    history.push({
        weekNumber: 1,
        label: "Semaine 1",
        dateRange: "01 - 07 Jan",
        status: 'worked',
        location: randomItem(CITIES)
    });
    history.push({
        weekNumber: 2,
        label: "Semaine 2",
        dateRange: "08 - 14 Jan",
        status: 'rest'
    });

    // Current Week
    history.push({
        weekNumber: 3,
        label: "Semaine 3 (Actuelle)",
        dateRange: "15 - 21 Jan",
        status: 'worked',
        location: currentCity
    });

    // Future Weeks
    let nextAvail = "Immédiate";
    let foundAvail = false;

    for (let i = 4; i <= 8; i++) {
        const isWorked = randomBool(0.6);
        const status = isWorked ? 'planned' : 'available';

        if (status === 'available' && !foundAvail) {
            nextAvail = `Semaine ${i}`;
            foundAvail = true;
        }

        history.push({
            weekNumber: i,
            label: `Semaine ${i}`,
            dateRange: `${(i-1)*7 + 1} - ${(i)*7} Jan`, // Rough approx
            status: status as any,
            location: isWorked ? randomItem(CITIES) : undefined
        });
    }

    return { history, nextAvailability: nextAvail };
};

const generatePerson = (id: string, role: string, teamCity: string): Person => {
    const firstName = randomItem(FIRST_NAMES);
    const lastName = randomItem(LAST_NAMES);
    const isLeader = role === 'Teamleader';
    const age = isLeader ? randomInt(24, 35) : randomInt(18, 28);
    const photoId = randomItem(PHOTOS);

    // Stats generation based on role
    const baseDr = isLeader ? 20 : 12;
    const objective = isLeader ? 20 : 15; // New Objective
    const drRate = +(baseDr + (Math.random() * 10) - 3).toFixed(1);
    const previousDrRate = +(drRate + (Math.random() * 4) - 2).toFixed(1); // Random previous week
    const qualityScore = isLeader ? randomInt(90, 100) : randomInt(70, 98);

    // Alert Logic
    let alertType: Person['alertType'] = undefined;
    if (randomBool(0.1)) { // 10% chance of alert
        const types: Person['alertType'][] = ['absent', 'performance', 'admin', 'medical'];
        alertType = randomItem(types);
    }

    // Seniority Logic (Weeks of Experience)
    // Weighted towards 1-4 for Fundraisers to show colors
    let weeksOfExperience = 1;
    if (isLeader) {
        weeksOfExperience = randomInt(20, 100);
    } else {
        const rand = Math.random();
        if (rand < 0.2) weeksOfExperience = 1; // 20% chance of 1st week
        else if (rand < 0.4) weeksOfExperience = 2; // 20% chance of 2nd week
        else if (rand < 0.6) weeksOfExperience = 3; // 20% chance of 3rd week
        else if (rand < 0.8) weeksOfExperience = 4; // 20% chance of 4th week
        else weeksOfExperience = randomInt(5, 20); // 20% chance of 5+ weeks
    }

    const planningData = generatePlanning(teamCity);

    return {
        id,
        name: `${firstName} ${lastName}`,
        role,
        age,
        origin: randomItem(CITIES),
        bio: `${firstName} est ${isLeader ? 'un manager expérimenté' : 'un fundraiser motivé'} qui aime le challenge.`,
        email: `${firstName.toLowerCase()[0]}.${lastName.toLowerCase()}@wesser.fr`,
        phone: `06 ${randomInt(10, 99)} ${randomInt(10, 99)} ${randomInt(10, 99)} ${randomInt(10, 99)}`,
        photoUrl: `https://images.unsplash.com/photo-${photoId}?q=80&w=300&auto=format&fit=crop`,
        tags: [
            isLeader ? 'Teamleader' : (weeksOfExperience > 4 ? 'Senior' : 'Junior'),
            randomBool(0.6) ? 'Permis' : '',
            randomBool(0.5) ? 'Homme' : 'Femme'
        ].filter(Boolean),
        teamtailor: {
            motivation: "Motivation générée automatiquement.",
            availability: "Immédiate"
        },
        cv: {
            skills: ['Vente', 'Communication'],
            experience: isLeader ? '3 ans d\'expérience' : (weeksOfExperience < 5 ? 'Débutant' : 'Confirmé')
        },
        hasLicense: randomBool(0.7),
        startDate: `${randomInt(1, 28)} janv.`,
        contractStatus: randomBool(0.9) ? 'Signed' : 'Pending',
        medicalVisit: randomBool(0.8),
        workDates: ['19/01', '20/01', '21/01', '22/01'],
        documents: {
            cni: 'https://images.unsplash.com/photo-1563205764-9050d24cb349?q=80&w=600&auto=format&fit=crop',
            license: '',
            badge: ''
        },
        drRate,
        previousDrRate,
        objective,
        weeksOfExperience,
        qualityScore,
        regularDonors: Math.floor(drRate * 12),
        attritionRate: +(Math.random() * 10).toFixed(1),
        trackingHistory: [],
        isWarning: !!alertType, // Keep backward compatibility for now
        alertType,
        isNewArrival: false,
        hasWorkedWithNgo: randomBool(0.4), // 40% chance they have worked with this NGO before
        privateNotes: generateMockNotes(firstName, isLeader),
        planningHistory: planningData.history,
        nextAvailability: planningData.nextAvailability
    };
};

export const generateIncomingPeople = (count: number): Person[] => {
    const incoming: Person[] = [];
    for (let i = 0; i < count; i++) {
        const id = `incoming-${i}`;
        // Mix of Newcomers (Junior) and Returning (Senior/Alumni)
        const isReturning = randomBool(0.3);
        const role = 'Fundraiser';

        const person = generatePerson(id, role, 'Paris');

        if (isReturning) {
            person.weeksOfExperience = randomInt(20, 100);
            person.tags.push('Ancien');
            person.drRate = 18.5; // Good score for returning
        } else {
            person.weeksOfExperience = 1; // Brand new
            person.drRate = 0; // No score yet
            person.tags = ['Nouveau'];
        }

        incoming.push(person);
    }
    return incoming;
};

// --- ALUMNI GENERATOR ---

const generateAlumni = (count: number): Person[] => {
    const alumniList: Person[] = [];
    for (let i = 0; i < count; i++) {
        const id = `alumni-${i}`;
        const isStudent = randomBool(0.7); // 70% students
        const category = isStudent ? 'Student' : 'Other';
        const role = isStudent ? 'Fundraiser' : (randomBool(0.3) ? 'Teamleader' : 'Fundraiser');

        const basePerson = generatePerson(id, role, 'Paris');

        // Generate dates
        const monthsAgo = randomInt(1, 24);
        const lastContactDate = new Date();
        lastContactDate.setMonth(lastContactDate.getMonth() - monthsAgo);

        let returnDateString = "Indéterminé";
        if (isStudent) {
            returnDateString = randomItem(['Juin 2025', 'Juillet 2025', 'Été 2025', 'Toussaint 2025']);
        } else {
            returnDateString = randomItem(['Septembre 2025', 'Janvier 2026', 'À confirmer', 'Ne reviendra pas']);
        }

        alumniList.push({
            ...basePerson,
            isAlumni: true,
            alumniCategory: category,
            lastContact: lastContactDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
            returnDate: returnDateString,
            tags: [...basePerson.tags, isStudent ? 'Étudiant' : 'Pro', 'Ancien']
        });
    }
    return alumniList;
};

// --- MAIN GENERATION ---

const generateBoard = (): BoardData => {
    const columns: Record<string, Column> = {};
    const cards: Record<string, Person> = {};
    const columnOrder: string[] = [];
    const relationships: Relationship[] = [];

    let personGlobalIndex = 1;

    // Generate 15 Teams
    for (let i = 0; i < 15; i++) {
        const colId = `col-${i + 1}`;
        const city = CITIES[i % CITIES.length];
        const ngo = NGOS[i % NGOS.length];

        // Use fixed color for the NGO
        const color = NGO_COLORS[ngo] || 'bg-slate-700';

        const teamSize = randomInt(3, 5); // 3 to 5 people per team

        const teamCardIds: string[] = [];

        // Generate Team Members
        for (let j = 0; j < teamSize; j++) {
            const personId = `p-${personGlobalIndex}`;
            const role = j === 0 ? 'Teamleader' : 'Fundraiser'; // First is always TL

            const person = generatePerson(personId, role, city);

            // Add some specific logic for demo purposes
            if (j === 2 && randomBool(0.2)) person.isWarning = true; // Random warnings

            cards[personId] = person;
            teamCardIds.push(personId);
            personGlobalIndex++;
        }

        // Mission Data
        const car = CAR_MODELS[i % CAR_MODELS.length];
        const temp = randomInt(0, 15);
        const condition = temp > 10 ? 'Sunny' : (temp > 5 ? 'Cloudy' : 'Rainy');

        columns[colId] = {
            id: colId,
            title: `${ngo} ${randomInt(1, 3)} ${city.toUpperCase()}`,
            capacity: `0/5`,
            color: color,
            cardIds: teamCardIds,
            isExpanded: false,
            missionData: {
                zone: {
                    name: `${city} ${['Nord', 'Sud', 'Est', 'Ouest', 'Centre'][randomInt(0, 4)]}`,
                    mapImage: `https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=600&auto=format&fit=crop`,
                    weather: { temp, condition: condition as any, wind: randomInt(5, 40) }
                },
                car: {
                    model: car.model,
                    plate: `${car.plate.substring(0, 7)}${randomInt(10, 99)}`,
                    image: 'https://images.unsplash.com/photo-1632823471465-4f7d45722421?q=80&w=600&auto=format&fit=crop',
                    fuelLevel: randomInt(20, 100),
                    mileage: randomInt(50000, 150000),
                    status: randomBool(0.9) ? 'ok' : 'service_needed'
                },
                housing: {
                    type: randomItem(['Gîte', 'Airbnb', 'Hôtel', 'Appartement']),
                    address: `${randomInt(1, 100)} Rue de la République, ${city}`,
                    accessCode: `Code: ${randomInt(1000, 9999)}`,
                    wifiDetails: 'Wifi: Guest / 123456',
                    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=600&auto=format&fit=crop',
                    checkIn: '19 Janv',
                    checkOut: '26 Janv',
                    rating: 4.5
                }
            }
        };

        columnOrder.push(colId);
    }

    // --- SORTING LOGIC ---
    // Sort teams by NGO then by Zone/City
    columnOrder.sort((a, b) => {
        const colA = columns[a];
        const colB = columns[b];

        // 1. Sort by NGO (First word of title)
        const ngoA = colA.title.split(' ')[0];
        const ngoB = colB.title.split(' ')[0];

        if (ngoA !== ngoB) {
            return ngoA.localeCompare(ngoB);
        }

        // 2. Sort by Zone Name (City + Sector)
        const zoneA = colA.missionData?.zone.name || '';
        const zoneB = colB.missionData?.zone.name || '';

        return zoneA.localeCompare(zoneB);
    });

    // Generate some random relationships
    for (let k = 0; k < 8; k++) {
        const source = `p-${randomInt(1, personGlobalIndex - 1)}`;
        let target = `p-${randomInt(1, personGlobalIndex - 1)}`;
        while (target === source) target = `p-${randomInt(1, personGlobalIndex - 1)}`;

        relationships.push({
            id: `rel-${k}`,
            sourceId: source,
            targetId: target,
            type: randomBool(0.3) ? 'conflict' : 'affinity'
        });
    }

    // --- POPULATE PAST TEAMMATES (MOCK HISTORY) ---
    const allPersonIds = Object.keys(cards);
    allPersonIds.forEach(personId => {
        // 30% chance to have past teammates
        if (randomBool(0.3)) {
            const numTeammates = randomInt(1, 3);
            for (let i = 0; i < numTeammates; i++) {
                const teammateId = randomItem(allPersonIds);
                if (teammateId !== personId) {
                    // Add to current person
                    if (!cards[personId].pastTeammates) cards[personId].pastTeammates = [];
                    if (!cards[personId].pastTeammates!.includes(teammateId)) {
                        cards[personId].pastTeammates!.push(teammateId);
                    }

                    // Add to teammate (symmetric)
                    if (!cards[teammateId].pastTeammates) cards[teammateId].pastTeammates = [];
                    if (!cards[teammateId].pastTeammates!.includes(personId)) {
                        cards[teammateId].pastTeammates!.push(personId);
                    }
                }
            }
        }
    });

    return { columns, cards, columnOrder, relationships };
};

export const initialData: BoardData = generateBoard();
export const alumniData: Person[] = generateAlumni(40); // Generate 40 Alumni
