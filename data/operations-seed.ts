// Local seed data for OperationsTab (housings + cars)
// Replaces the Supabase backend with static in-memory data.

export interface HousingSeed {
  id: string;
  name: string;
  date: string;
  lead: string;
  region: string;
  dept: string;
  org: string;
  people: number;
  nights: number;
  cost: number;
  channel: string;
  address: string;
  owner: string;
  ownerName: string;
  rating: number;
  comment: string;
  lat: number;
  lng: number;
  amenities: string[];
}

export interface CarSeed {
  id: string;
  plate: string;
  brand: string;
  where: string;
  km: number;
  service: string;
  owner: string;
  lat: number;
  lng: number;
  fuelStats: { declared: number; tankSize: number };
  damages: { date: string; description: string; author: string }[];
}

const blank = { owner: '', ownerName: '', rating: 0, comment: '', amenities: [] as string[] };

export const HOUSINGS_SEED: HousingSeed[] = [
  { id: 'h1',  name: '"Au Diable Bleu" Appartement 3 Chambres Centre ville', date: '2025-12-29', lead: 'Marwan Zeghoudi', region: 'Franche Comté', dept: '38', org: 'Unicef', people: 5,  nights: 7,  cost: 660,     channel: 'Booking',           address: '5 Boulevard des Diables Bleus, Grenoble, 38000', lat: 45.1885, lng: 5.7245, ...blank },
  { id: 'h2',  name: 'Le Clos de la tour',                                  date: '2025-12-29', lead: 'Samy Zeghoudi',   region: 'Franche Comté', dept: '38', org: 'Unicef', people: 10, nights: 6,  cost: 1400,    channel: 'Appart City',       address: '21 boulevard Gambetta, La Tour-du-Pin, 38110',   lat: 45.5650, lng: 5.4477, ...blank },
  { id: 'h3',  name: 'Logement Stanislas',                                  date: '2025-12-29', lead: 'Stanislas Rouillon', region: 'Franche Comté', dept: '25', org: 'Unicef', people: 5,  nights: 9,  cost: 750,    channel: 'Répertoire interne', address: '',                                              lat: 47.2378, lng: 6.0241, ...blank },
  { id: 'h4',  name: 'Logement Dimitri',                                    date: '',           lead: 'Dimitri Da Silva', region: 'Franche Comté', dept: '25', org: 'Unicef', people: 5,  nights: 0,  cost: 70,     channel: 'Booking',           address: '',                                              lat: 47.2378, lng: 6.0241, ...blank },
  { id: 'h5',  name: 'Logement François',                                   date: '',           lead: 'François Jobert',  region: 'PACA',          dept: '06', org: 'MDM',    people: 5,  nights: 0,  cost: 650,    channel: 'Booking',           address: '',                                              lat: 43.7102, lng: 7.2620, ...blank },
  { id: 'h6',  name: "Logement Enora",                                      date: '',           lead: "Enora d'Herbais",  region: 'PACA',          dept: '06', org: 'MDM',    people: 5,  nights: 0,  cost: 690,    channel: 'Répertoire interne', address: '',                                              lat: 43.7102, lng: 7.2620, ...blank },
  { id: 'h7',  name: 'Logement Ismaïl',                                     date: '',           lead: 'Ismaïl Mabrouki',  region: 'PACA',          dept: '06', org: 'MDM',    people: 5,  nights: 0,  cost: 820,    channel: 'Répertoire interne', address: '',                                              lat: 43.7102, lng: 7.2620, ...blank },
  { id: 'h8',  name: 'Logement Mickaël',                                    date: '',           lead: 'Mickaël Picard',   region: 'PACA',          dept: '06', org: 'MDM',    people: 5,  nights: 0,  cost: 700,    channel: 'Répertoire interne', address: '',                                              lat: 43.7102, lng: 7.2620, ...blank },
  { id: 'h9',  name: 'Logement Yanis',                                      date: '',           lead: 'Yanis Zantoute',   region: 'Aquitaine',     dept: '33', org: 'MSF',    people: 5,  nights: 0,  cost: 750,    channel: 'Booking',           address: '',                                              lat: 44.8378, lng: -0.5792, ...blank },
  { id: 'h10', name: 'Logement Wassim',                                     date: '',           lead: 'Wassim Boumalouk', region: 'Aquitaine',     dept: '33', org: 'MSF',    people: 5,  nights: 0,  cost: 660,    channel: 'Répertoire interne', address: '',                                              lat: 44.8378, lng: -0.5792, ...blank },
  { id: 'h11', name: 'Logement Georges',                                    date: '',           lead: 'Georges',          region: 'Aquitaine',     dept: '33', org: 'MSF',    people: 5,  nights: 0,  cost: 720,    channel: 'Booking',           address: '',                                              lat: 44.8378, lng: -0.5792, ...blank },
  { id: 'h12', name: 'Gite au calme',                                       date: '2026-01-04', lead: 'Antoine Loust',    region: 'Franche Comté', dept: '25', org: 'Unicef', people: 5,  nights: 14, cost: 1263.36, channel: 'Booking',           address: '',                                              lat: 47.2378, lng: 6.0241, ...blank },
  { id: 'h13', name: 'Le belvédère des deux lacs',                          date: '2026-01-04', lead: 'Thomas Jesupret',  region: 'Franche Comté', dept: '25', org: 'Unicef', people: 5,  nights: 7,  cost: 838.07,  channel: 'Booking',           address: '21 Rue Principale, Brey-et-Maison-du-Bois, 25240', lat: 46.7867, lng: 6.2400, ...blank },
  { id: 'h14', name: "Gîte le Cham'Oye",                                    date: '2026-01-04', lead: 'Melissa Henry',    region: 'Franche Comté', dept: '25', org: 'Unicef', people: 5,  nights: 7,  cost: 697.59,  channel: 'Booking',           address: '20 Rue des Écoles, Oye-et-Pallet, 25160',         lat: 46.8331, lng: 6.3050, ...blank },
  { id: 'h15', name: 'La petite maison',                                    date: '2026-01-04', lead: 'Aboubacar Niakate', region: 'PACA',         dept: '06', org: 'MDM',    people: 5,  nights: 14, cost: 1618.60, channel: 'Booking',           address: '1201 Vieux Chemin de Cagnes à La Gaude, La Gaude, 06610', lat: 43.7184, lng: 7.1620, ...blank },
  { id: 'h16', name: 'Magnifique T3, spacieux, lumineux et traversant',     date: '2026-01-04', lead: 'Dimitri Da Silva', region: 'PACA',          dept: '06', org: 'MDM',    people: 5,  nights: 7,  cost: 590.68,  channel: 'Booking',           address: '154 Boulevard de Cessole, Nice, 06100',           lat: 43.7163, lng: 7.2469, ...blank },
  { id: 'h17', name: "Appart'City Classic Bordeaux Aéroport St Jean D'Illac", date: '2026-01-04', lead: 'Jérémie Ethève',  region: 'Aquitaine',    dept: '33', org: 'MSF',    people: 5,  nights: 7,  cost: 745.20,  channel: 'Booking',           address: "1140 Avenue De Bordeaux, Saint-Jean-d'Illac, 33127", lat: 44.7758, lng: -0.7747, ...blank },
  { id: 'h18', name: 'Bright apartment for 6 in Pessac',                    date: '2026-01-04', lead: 'Valentin Grobey',  region: 'Aquitaine',     dept: '33', org: 'MSF',    people: 5,  nights: 14, cost: 1403.46, channel: 'Booking',           address: '8 Rue Léo Ferré, Pessac, 33600',                  lat: 44.8067, lng: -0.6311, ...blank },
];

export const CARS_SEED: CarSeed[] = [
  { id: 'c1',  plate: 'HF-420-SH', brand: 'Non renseigné', where: 'Aquitaine',     km: 7856,  service: '', owner: 'Valentin Grobey',     lat: 44.8378, lng: -0.5792, fuelStats: { declared: 0, tankSize: 50 }, damages: [] },
  { id: 'c2',  plate: 'HF-421-DN', brand: 'Non renseigné', where: 'Aquitaine',     km: 13547, service: '', owner: 'Jérémie Etheve',      lat: 44.8378, lng: -0.5792, fuelStats: { declared: 0, tankSize: 50 }, damages: [] },
  { id: 'c3',  plate: 'HD-099-HQ', brand: 'Non renseigné', where: 'Aquitaine',     km: 17804, service: '', owner: 'Melvin Streicher',    lat: 44.8378, lng: -0.5792, fuelStats: { declared: 0, tankSize: 50 }, damages: [] },
  { id: 'c4',  plate: 'HF-998-VX', brand: 'Non renseigné', where: 'Aquitaine',     km: 5988,  service: '', owner: 'Théo Bastard',        lat: 44.8378, lng: -0.5792, fuelStats: { declared: 0, tankSize: 50 }, damages: [] },
  { id: 'c5',  plate: 'HG-357-JD', brand: 'Non renseigné', where: 'Aquitaine',     km: 3198,  service: '', owner: 'Théo Bastard',        lat: 44.8378, lng: -0.5792, fuelStats: { declared: 0, tankSize: 50 }, damages: [] },
  { id: 'c6',  plate: 'HF-310-SH', brand: 'Non renseigné', where: 'Aquitaine',     km: 14833, service: '', owner: 'Antoine Loust',       lat: 44.8378, lng: -0.5792, fuelStats: { declared: 0, tankSize: 50 }, damages: [] },
  { id: 'c7',  plate: 'HG-016-PP', brand: 'Non renseigné', where: 'Aquitaine',     km: 11908, service: '', owner: 'Thomas Jesupret',     lat: 44.8378, lng: -0.5792, fuelStats: { declared: 0, tankSize: 50 }, damages: [] },
  { id: 'c8',  plate: 'HG-066-QR', brand: 'Non renseigné', where: 'Aquitaine',     km: 10278, service: '', owner: 'Melvin Streicher',    lat: 44.8378, lng: -0.5792, fuelStats: { declared: 0, tankSize: 50 }, damages: [] },
  { id: 'c9',  plate: 'HF-919-TT', brand: 'Non renseigné', where: 'Aquitaine',     km: 8132,  service: '', owner: 'Thayan Israël',       lat: 44.8378, lng: -0.5792, fuelStats: { declared: 0, tankSize: 50 }, damages: [] },
  { id: 'c10', plate: 'HD-514-JX', brand: 'Non renseigné', where: 'Aquitaine',     km: 14127, service: '', owner: 'Raphaël Larzillière', lat: 44.8378, lng: -0.5792, fuelStats: { declared: 0, tankSize: 50 }, damages: [] },
  { id: 'c11', plate: 'HF-880-FZ', brand: 'Non renseigné', where: 'Franche Comté', km: 11710, service: '', owner: 'Laura Le Bon',        lat: 47.2378, lng: 6.0241,  fuelStats: { declared: 0, tankSize: 50 }, damages: [] },
  { id: 'c12', plate: 'HG-073-CL', brand: 'Non renseigné', where: 'Franche Comté', km: 12420, service: '', owner: 'Louanne Fontaine',    lat: 47.2378, lng: 6.0241,  fuelStats: { declared: 0, tankSize: 50 }, damages: [] },
  { id: 'c13', plate: 'HF-206-FY', brand: 'Non renseigné', where: 'Franche Comté', km: 12597, service: '', owner: 'Marouane El Massoudi', lat: 47.2378, lng: 6.0241, fuelStats: { declared: 0, tankSize: 50 }, damages: [] },
  { id: 'c14', plate: 'HE-328-WP', brand: 'Non renseigné', where: 'Franche Comté', km: 18536, service: '', owner: 'Marwan Zeghoudi',     lat: 47.2378, lng: 6.0241,  fuelStats: { declared: 0, tankSize: 50 }, damages: [] },
  { id: 'c15', plate: 'HF-746-FL', brand: 'Non renseigné', where: 'Franche Comté', km: 17697, service: '', owner: 'Mélissa Henry',       lat: 47.2378, lng: 6.0241,  fuelStats: { declared: 0, tankSize: 50 }, damages: [] },
  { id: 'c16', plate: 'HF-328-SH', brand: 'Non renseigné', where: 'PACA',          km: 11551, service: '', owner: 'Sarah Fuentes',       lat: 43.7102, lng: 7.2620,  fuelStats: { declared: 0, tankSize: 50 }, damages: [] },
  { id: 'c17', plate: 'HE-500-SY', brand: 'Non renseigné', where: 'PACA',          km: 10910, service: '', owner: 'Alexandre Robert',    lat: 43.7102, lng: 7.2620,  fuelStats: { declared: 0, tankSize: 50 }, damages: [] },
  { id: 'c18', plate: 'HG-104-NT', brand: 'Non renseigné', where: 'PACA',          km: 8264,  service: '', owner: 'Melvin Streicher',    lat: 43.7102, lng: 7.2620,  fuelStats: { declared: 0, tankSize: 50 }, damages: [] },
  { id: 'c19', plate: 'HG-445-WS', brand: 'Non renseigné', where: 'PACA',          km: 6814,  service: '', owner: 'Andy Hadri',          lat: 43.7102, lng: 7.2620,  fuelStats: { declared: 0, tankSize: 50 }, damages: [] },
  { id: 'c20', plate: 'HF-389-DN', brand: 'Non renseigné', where: 'PACA',          km: 2026,  service: '', owner: 'Sarah Fuentes',       lat: 43.7102, lng: 7.2620,  fuelStats: { declared: 0, tankSize: 50 }, damages: [] },
  { id: 'c21', plate: 'HJ-286-AZ', brand: 'Non renseigné', where: 'PACA',          km: 89,    service: '', owner: 'Mickaël Picard',      lat: 43.7102, lng: 7.2620,  fuelStats: { declared: 0, tankSize: 50 }, damages: [] },
  { id: 'c22', plate: 'HF-882-TT', brand: 'Non renseigné', where: 'Alsace',        km: 10801, service: '', owner: 'Marouane El Masoudi', lat: 48.5734, lng: 7.7521,  fuelStats: { declared: 0, tankSize: 50 }, damages: [] },
  { id: 'c23', plate: 'HF-649-SK', brand: 'Non renseigné', where: 'Alsace',        km: 15664, service: '', owner: 'Yamila Dembar',       lat: 48.5734, lng: 7.7521,  fuelStats: { declared: 0, tankSize: 50 }, damages: [] },
  { id: 'c24', plate: 'HD-729-VA', brand: 'Non renseigné', where: 'Alsace',        km: 2443,  service: '', owner: 'Chloé Tanchoux',      lat: 48.5734, lng: 7.7521,  fuelStats: { declared: 0, tankSize: 50 }, damages: [] },
  { id: 'c25', plate: 'HH-131-QY', brand: 'Non renseigné', where: 'Alsace',        km: 3531,  service: '', owner: 'Chloé Tanchoux',      lat: 48.5734, lng: 7.7521,  fuelStats: { declared: 0, tankSize: 50 }, damages: [] },
  { id: 'c26', plate: 'HF-310-DN', brand: 'Non renseigné', where: 'Alsace',        km: 12439, service: '', owner: 'Grégoire Faure',      lat: 48.5734, lng: 7.7521,  fuelStats: { declared: 0, tankSize: 50 }, damages: [] },
  { id: 'c27', plate: 'HG-216-RK', brand: 'Non renseigné', where: 'Aquitaine',     km: 0,     service: '', owner: 'Antoine Loust',       lat: 44.8378, lng: -0.5792, fuelStats: { declared: 0, tankSize: 50 }, damages: [] },
];
